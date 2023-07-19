var safeStringify = require("fast-safe-stringify");
var _ = require("lodash");
var winston = require("../infra/logging/winston");
var utils = require("../interfaces/http/utils/utils");

var notificationService = require("../infra/service/notification");

var rolePermissionMysql = require("../infra/database/role_permission");

var RolePermission = require("../domain/model/role_permission/role_permission");

async function addRolePermission(req) {
	var response = utils.initObject();
	var body = req.body;
	var roleId = req.params.roleId;

	try {
		var rolePermissions = new RolePermission(body.permission_id);
		var permissionIds = await rolePermissionMysql.getPermissionIds(roleId);
		if (permissionIds.length > 0) {
			await rolePermissionMysql.deleteRecord(roleId);
			await rolePermissionMysql.addRecord(rolePermissions, roleId);
			response["message"] = "Add permissions to role successfully!";
			return response;
		}
		await rolePermissionMysql.addRecord(rolePermissions, roleId);
		response["message"] = "Add permissions to role successfully!";
		return response;
	} catch (err) {
		var textErr =
			" addRolePermission = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function combinePermissions(result) {
	let totalArr = [];
	let actions = [];
	let rolePermissionObj = {
		subject_name: "",
		actions: [],
	};
	let subjectNames = _.filter(
		_.uniq(
			_.map(result, function (item) {
				if (_.filter(result, { subject_name: item.subject_name }).length > 0) {
					return item.subject_name;
				}
				return false;
			})
		),
		function (value) {
			return value;
		}
	);

	for (let i = 0; i < result.length; i++) {
		if (subjectNames[i]) {
			let groupArrFromSubName = result.filter((item) => {
				return item.subject_name == subjectNames[i];
			});
			if (groupArrFromSubName.length > 0) {
				actions = groupArrFromSubName.map((item) => {
					let obj = {
						action_id: item.id,
						action_name: item.action,
					};
					return obj;
				});
			}
			rolePermissionObj = { ...rolePermissionObj };
			rolePermissionObj.actions = actions;
			rolePermissionObj.subject_name = subjectNames[i];
			totalArr.push(rolePermissionObj);
		}
	}
	return totalArr;
}

async function getRolePermissionById(req) {
	var roleId = req.params.roleId;
	var response = utils.initArray();
	try {
		var result = await rolePermissionMysql.getPermissionInfoByRoleId(roleId);
		let totalArr = await combinePermissions(result);
		response["data"] = totalArr;
		return response;
	} catch (err) {
		winston.error("getRolePermissionById = " + roleId + "  err = " + err);
		notificationService.sendByTelegram(
			" getRolePermissionById = " + roleId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		console.log("error get role permission by id", err);
		return response;
	}
}

module.exports = {
	getRolePermissionById: getRolePermissionById,
	addRolePermission: addRolePermission,
	combinePermissions: combinePermissions,
};
