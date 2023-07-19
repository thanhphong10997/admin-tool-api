var safeStringify = require("fast-safe-stringify");
var winston = require("../infra/logging/winston");
var utils = require("../interfaces/http/utils/utils");

var notificationService = require("../infra/service/notification");

var permissionRedis = require("../infra/cache/permission");

var permissionMysql = require("../infra/database/permission");

var Permission = require("../domain/model/permission/permission");

var rolePermissionApi = require("./rolePermissionsApi");

async function getPermissions(req) {
	var queryString = req.query;
	var response = utils.initObject();
	let xView = req.headers["x-view"];
	try {
		var filter = {};
		var options = { offset: 0, limit: 10 };
		var whereParams = [];

		var cacheKey = "all";

		for (var key in queryString) {
			var value = queryString[key];
			cacheKey = cacheKey + ":" + value;

			if (key === "orderBy") {
				options[key] = value;
				continue;
			}

			if (key === "limit" || key === "offset") {
				options[key] = parseInt(value);
				continue;
			} else {
				whereParams.push({
					field: key,
					condition: "= ?",
					value: queryString[key],
				});
			}

			if (key === "from_date") {
				filter[key] = {
					field: "DATE(created_date)",
					operator: ">=",
					value: value,
					type: "string",
				};
				continue;
			}

			if (key === "to_date") {
				filter[key] = {
					field: "DATE(created_date)",
					operator: "<=",
					value: value,
					type: "string",
				};
				continue;
			}

			filter[key] = value;
		}

		let permissionsInternalResult = await getPermissionsInternal(
			cacheKey,
			options,
			filter,
			whereParams
		);
		// console.log(permissionsInternalResult.list);
		if (xView == "role") {
			let rolePermissionList = await rolePermissionApi.combinePermissions(
				permissionsInternalResult.list
			);

			response.data.list = rolePermissionList;
		} else {
			response["data"] = permissionsInternalResult;
		}
		return response;
	} catch (err) {
		winston.error("getPermissions err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		console.log("error permission:", err);
		return response;
	}
}

async function getPermissionById(req) {
	var permissionId = req.params.permissionId;
	var response = utils.initObject();
	try {
		var cacheKey = permissionId;
		response["data"] = await getPermissionByIdInternal(cacheKey, permissionId);
		return response;
	} catch (err) {
		winston.error("getPermissionById = " + permissionId + "  err = " + err);
		notificationService.sendByTelegram(
			" getPermissionById = " + permissionId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		console.log("error get permission by id", err);
		return response;
	}
}

async function createPermission(req) {
	var response = utils.initObject();
	var body = req.body;
	try {
		var permission = new Permission(body.subject_name, body.action);
		permission.id = await permissionMysql.createPermission(permission);
		await permissionRedis.delPermissions();
		// await permissionRedis.deleteCachePermission("all");
		response["data"] = permission;
		return response;
	} catch (err) {
		var textErr =
			" createPermission = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updatePermission(req) {
	var response = utils.initObject();
	var permissionId = req.params.permissionId;
	var body = req.body;

	try {
		var permission = await permissionMysql.getById(permissionId);
		if (!permission) {
			throw new Error("permission not exists " + permissionId);
		}

		if (body.subject_name) {
			permission.subject_name = body.subject_name;
		}

		if (body.action) {
			permission.action = body.action;
		}

		await permissionMysql.updatePermission(permission);
		await permissionRedis.delPermissions();

		response["data"] = permission;
		return response;
	} catch (err) {
		winston.error(
			"updatePermission permissionId = " + permissionId + "  err = " + err
		);
		notificationService.sendByTelegram(
			" updatePermission = " + permissionId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deletePermission(req) {
	var response = utils.initObject();
	var permissionId = req.params.permissionId;
	var queryString = req.query;

	try {
		var whereParams = [];

		for (var key in queryString) {
			whereParams.push({
				field: key,
				condition: "= ?",
				value: queryString[key],
			});
		}
		await permissionMysql.deletePermission(permissionId, whereParams);
		await permissionRedis.delPermissions();

		response["data"] = permissionId;
		response["message"] = "Delete Permission successfull !!";
		return response;
	} catch (err) {
		winston.error("deletePermission err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getPermissionByIdInternal(cacheKey, permissionId) {
	let results = await permissionRedis.getPermissionsByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await permissionMysql.getById(permissionId);

	if (results) {
		await permissionRedis.setPermissionsByFilter(
			cacheKey,
			safeStringify(results)
		);
	}

	return results;
}

async function getPermissionsInternal(cacheKey, options, filter, whereParams) {
	let results = await permissionRedis.getPermissionsByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await permissionMysql.getPermissions(filter, options, whereParams);

	if (results) {
		await permissionRedis.setPermissionsByFilter(
			cacheKey,
			safeStringify(results)
		);
	}

	return results;
}

module.exports = {
	getPermissions: getPermissions,
	getPermissionById: getPermissionById,
	createPermission: createPermission,
	updatePermission: updatePermission,
	deletePermission: deletePermission,
};
