var safeStringify = require("fast-safe-stringify");

var winston = require("../infra/logging/winston");
var utils = require("../interfaces/http/utils/utils");

var notificationService = require("../infra/service/notification");

var roleRedis = require("../infra/cache/role");

var roleMysql = require("../infra/database/role");

var Role = require("../domain/model/role/role");

async function getRoles(req) {
	var queryString = req.query;
	var response = utils.initObject();
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

		response["data"] = await getRolesInternal(
			cacheKey,
			options,
			filter,
			whereParams
		);
		return response;
	} catch (err) {
		winston.error("getRoles err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		console.log("error roles:", err);
		return response;
	}
}

async function getRoleById(req) {
	var roleId = req.params.roleId;
	var response = utils.initObject();
	try {
		var cacheKey = roleId;
		response["data"] = await getRoleByIdInternal(cacheKey, roleId);
		return response;
	} catch (err) {
		winston.error("getRoleById = " + roleId + "  err = " + err);
		notificationService.sendByTelegram(
			" getRoleById = " + roleId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		console.log("error get role by id", err);
		return response;
	}
}

async function getRoleByIdInternal(cacheKey, roleId) {
	let results = await roleRedis.getRolesByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await roleMysql.getById(roleId);

	if (results) {
		await roleRedis.setRolesByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function getRolesInternal(cacheKey, options, filter, whereParams) {
	let results = await roleRedis.getRolesByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await roleMysql.getRoles(filter, options, whereParams);

	if (results) {
		await roleRedis.setRolesByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function createRole(req) {
	var response = utils.initObject();
	var body = req.body;
	try {
		var role = new Role(body.role_name);
		role.id = await roleMysql.createRole(role);
		await roleRedis.delRoles();
		response["data"] = role;
		return response;
	} catch (err) {
		var textErr =
			" createRole = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updateRole(req) {
	var response = utils.initObject();
	var roleId = req.params.roleId;
	var body = req.body;

	try {
		var role = await roleMysql.getById(roleId);
		if (!role) {
			throw new Error("role not exists " + roleId);
		}

		if (body.role_name) {
			role.role_name = body.role_name;
		}

		await roleMysql.updateRole(role);
		await roleRedis.delRoles();

		response["data"] = role;
		return response;
	} catch (err) {
		winston.error("updateRole roleId = " + roleId + "  err = " + err);
		notificationService.sendByTelegram(
			" updateRole = " + roleId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deleteRole(req) {
	var response = utils.initObject();
	var roleId = req.params.roleId;
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
		await roleMysql.deleteRole(roleId, whereParams);
		await roleRedis.delRoles();

		response["data"] = roleId;
		response["message"] = "Delete Role successfull!!";
		return response;
	} catch (err) {
		winston.error("deleteRole err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

module.exports = {
	getRoles: getRoles,
	getRoleById: getRoleById,
	createRole: createRole,
	updateRole: updateRole,
	deleteRole: deleteRole,
};
