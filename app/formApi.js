var winston = require("../infra/logging/winston");
var utils = require("../interfaces/http/utils/utils");

var formMysql = require("../infra/database/form");
var formPriorityMysql = require("../infra/database/form_priority");
var formSelectorMysql = require("../infra/database/form_selector");

var gameApi = require("./gameApi")
var safeStringify = require("fast-safe-stringify");
var _ = require("lodash");
var notificationService = require("../infra/service/notification");

var formRedis = require("../infra/cache/form");
var gameRedis = require("../infra/cache/game");
var formPriorityRedis = require("../infra/cache/form_priority");
var formSelectorRedis = require("../infra/cache/form_selector");
var Form = require("../domain/model/form/form");
var FormPriority = require("../domain/model/form/form_priority");
var FormSelector = require("../domain/model/form/form_selector");

async function getForms(req) {
	var queryString = req.query;
	var response = utils.initObject();

	try {
		var filter = {};
		var options = {offset: 0, limit: 10};
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

		response["data"] = await getFormsInternal(cacheKey, options, filter, whereParams);
		return response;
	} catch (err) {
		winston.error("getForms err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormsInternal(cacheKey, options, filter, whereParams) {
	let results = await formRedis.getFormsByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await formMysql.getForms(filter, options, whereParams);

	if (results) {
		await formRedis.setFormsByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function createForm(req) {
	var response = utils.initObject();
	var body = req.body;

	try {
		var form = new Form(body.name, body.form, body.type, body.game_id, body.created_user_id, body.crm_info);
		form.id = await formMysql.createForm(form);

		await formRedis.delForms();
		await gameRedis.deleteCacheGame(form.game_id + ":state");

		response["data"] = form;
		return response;
	} catch (err) {
		var textErr = " createForm body = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updateForm(req) {
	var response = utils.initObject();
	var formId = req.params.formId;
	var body = req.body;
	
	try {
		var form = await formMysql.getById(formId);
		var gameId = form.game_id;
		var cacheKey = gameId + "gameDataById";
		var filter = {
			id: {
				field: "id",
				operator: "==",
				value: gameId,
				type: "string",
			}
		};
		filter['id'] = gameId;

		var gameData = await gameApi.getListGamesInternal(cacheKey, filter)
		var gameUuid = gameData[0].uuid;	
		
		if (!form) {
			throw new Error("form not exists " + formId);
		}

		if (body.name) {
			form.name = body.name;
		}

		if (body.form) {
			form.form = body.form;
		}

		if (body.type) {
			form.type = body.type;
		}

		if (body.crm_info) {
			form.crm_info = body.crm_info;
		}

		if (body.game_id) {
			form.game_id = body.game_id;
		}

		if (body.updated_user_id) {
			form.updated_user_id = body.updated_user_id;
		}

		await formMysql.updateForm(form);
		await formRedis.delForms();
		await gameRedis.deleteCacheGame(form.game_id + ":forms");
		await gameRedis.deleteCacheGame(gameId + ":forms");
		await gameRedis.deleteCacheGame(gameId + ":state");
		await gameRedis.deleteCacheGame(gameUuid + ":state");
		
		response["data"] = form;

		return response;
	} catch (err) {
		winston.error("updateForm formId = " + formId + "  err = " + err);
		notificationService.sendByTelegram(" updateForm = " + formId + " err: " + err.message);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deleteForm(req) {
	var response = utils.initObject();
	var formId = req.params.formId;
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

		var results = await formMysql.getById(formId);
		await formMysql.deleteForm(formId, whereParams);
		await formRedis.delForms();
		await gameRedis.deleteCacheGame(results.game_id + ":forms");

		response["data"] = formId;
		response["message"] = "Delete Form successfull !!";
		return response;
	} catch (err) {
		winston.error("deleteForm err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormsName(req) {
	var queryString = req.query;
	var response = utils.initObject();

	try {
		var filter = {};
		var options = {offset: 0, limit: 10, select: "form_id, name"};
		var whereParams = [];

		var cacheKey = "listName";

		for (var key in queryString) {
			var value = queryString[key];
			cacheKey = cacheKey + ":" + value;

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

		response["data"] = await getFormsInternal(cacheKey, options, filter, whereParams);
		return response;
	} catch (err) {
		winston.error("getForms err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormSelectorByFormId(req) {
	var response = utils.initObject();
	var formId = req.params.formId;

	try {
		var cacheKey = formId + ":formSelector";

		response["data"] = await getFormSelectorByFormIdInternal(cacheKey, formId);
		return response;
	} catch (err) {
		winston.error("getFormSelectorByFormId err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormSelectorByFormIdInternal(cacheKey, formId) {
	let results = await formRedis.getFormsByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await formMysql.getFormSelectorByFormId(formId);

	if (results) {
		await formRedis.setFormsByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function getFormsPriority(req) {
	var queryString = req.query;
	var response = utils.initObject();

	try {
		var filter = {};
		var options = {offset: 0, limit: 10};
		var whereParams = [];

		var cacheKey = "all";

		for (var key in queryString) {
			var value = queryString[key];
			cacheKey = cacheKey + ":" + value;

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
				filter[key] = {field: "DATE(created_date)", operator: ">=", value: value, type: "string"};
				continue;
			}

			if (key === "to_date") {
				filter[key] = {field: "DATE(created_date)", operator: "<=", value: value, type: "string"};
				continue;
			}

			filter[key] = value;
		}

		response["data"] = await getFormsPriorityInternal(cacheKey, options, filter, whereParams);
		return response;
	} catch (err) {
		winston.error("getFormsPriority err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormsPriorityInternal(cacheKey, options, filter, whereParams) {
	let results = await formPriorityRedis.getFormsPriorityByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await formPriorityMysql.getFormsPriority(filter, options, whereParams);

	if (results) {
		await formPriorityRedis.setFormsPriorityByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function createFormPriority(req) {
	var response = utils.initObject();
	var body = req.body;

	try {
		var form_priority = new FormPriority(body.game_id, body.form_id, body.priority, body.created_user_id);
		form_priority.id = await formPriorityMysql.createFormPriority(form_priority);

		await formPriorityRedis.delFormsPriority();

		response["data"] = form_priority;
		return response;
	} catch (err) {
		var textErr = " createFormPriority body = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updateFormPriority(req) {
	var response = utils.initObject();
	var formPriorityId = req.params.formPriorityId;
	var body = req.body;

	try {
		var form_priority = await formPriorityMysql.getById(formPriorityId);
		if (!form_priority) {
			throw new Error("form_priority not exists " + formPriorityId);
		}

		if (body.game_id) {
			form_priority.game_id = body.game_id;
		}

		if (body.form_id) {
			form_priority.form_id = body.form_id;
		}

		if (body.priority) {
			form_priority.priority = body.priority;
		}

		if (body.updated_user_id) {
			form_priority.updated_user_id = body.updated_user_id;
		}

		await formPriorityMysql.updateFormPriority(form_priority);
		await formPriorityRedis.delFormsPriority();

		response["data"] = form_priority;

		return response;
	} catch (err) {
		winston.error("updateFormPriority formPriorityId = " + formPriorityId + "  err = " + err);
		notificationService.sendByTelegram(" updateFormPriority = " + formPriorityId + " err: " + err.message);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deleteFormPriority(req) {
	var response = utils.initObject();
	var formPriorityId = req.params.formPriorityId;
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

		await formPriorityMysql.deleteFormPriority(formPriorityId, whereParams);
		await formPriorityRedis.delFormsPriority();

		response["data"] = formPriorityId;
		response["message"] = "Delete FormPriority successfull !!";
		return response;
	} catch (err) {
		winston.error("deleteFormPriority err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormsSelector(req) {
	var queryString = req.query;
	var response = utils.initObject();

	try {
		var filter = {};
		var options = {offset: 0, limit: 10};
		var whereParams = [];

		var cacheKey = "all";

		for (var key in queryString) {
			var value = queryString[key];
			cacheKey = cacheKey + ":" + value;

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
				filter[key] = {field: "DATE(created_date)", operator: ">=", value: value, type: "string"};
				continue;
			}

			if (key === "to_date") {
				filter[key] = {field: "DATE(created_date)", operator: "<=", value: value, type: "string"};
				continue;
			}

			filter[key] = value;
		}

		response["data"] = await getFormsSelectorInternal(cacheKey, options, filter, whereParams);
		return response;
	} catch (err) {
		winston.error("getFormsSelector err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormsSelectorInternal(cacheKey, options, filter, whereParams) {
	let results = await formSelectorRedis.getFormsSelectorByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await formSelectorMysql.getFormsSelector(filter, options, whereParams);

	if (results) {
		await formSelectorRedis.setFormsSelectorByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function createFormSelector(req) {
	var response = utils.initObject();
	var body = req.body;

	try {
		var form_selector = new FormSelector(body.form_id, body.game_id, body.input_selector, body.created_user_id);
		form_selector.id = await formSelectorMysql.createFormSelector(form_selector);

		await formSelectorRedis.delFormsSelector();
		await formRedis.deleteCacheForm(form_selector.form_id + ":formSelector");

		response["data"] = form_selector;
		return response;
	} catch (err) {
		var textErr = " createFormSelector body = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updateFormSelector(req) {
	var response = utils.initObject();
	var formSelectorId = req.params.formSelectorId;
	var body = req.body;

	try {
		var form_selector = await formSelectorMysql.getById(formSelectorId);
		var formId = form_selector.form_id;

		if (!form_selector) {
			throw new Error("form not exists " + formSelectorId);
		}

		if (body.form_id) {
			form_selector.form_id = body.form_id;
		}

		if (body.game_id) {
			form_selector.game_id = body.game_id;
		}

		if (body.input_selector) {
			form_selector.input_selector = body.input_selector;
		}

		if (body.updated_user_id) {
			form_selector.updated_user_id = body.updated_user_id;
		}

		await formSelectorMysql.updateFormSelector(form_selector);
		await formSelectorRedis.delFormsSelector();
		await formRedis.deleteCacheForm(form_selector.form_id + ":formSelector");
		await formRedis.deleteCacheForm(formId + ":formSelector");

		response["data"] = form_selector;

		return response;
	} catch (err) {
		winston.error("updateFormSelector formSelectorId = " + formSelectorId + "  err = " + err);
		notificationService.sendByTelegram(" updateFormSelector = " + formSelectorId + " err: " + err.message);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deleteFormSelector(req) {
	var response = utils.initObject();
	var formSelectorId = req.params.formSelectorId;
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

		var results = await formSelectorMysql.getById(formSelectorId);
		await formSelectorMysql.deleteFormSelector(formSelectorId, whereParams);
		await formSelectorRedis.delFormsSelector();
		await formRedis.deleteCacheForm(results.form_id + ":formSelector");

		response["data"] = formSelectorId;
		response["message"] = "Delete FormSelector successfull !!";
		return response;
	} catch (err) {
		winston.error("deleteFormSelector err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

module.exports = {
	getForms: getForms,
	createForm: createForm,
	updateForm: updateForm,
	deleteForm: deleteForm,
	getFormsName: getFormsName,
	getFormSelectorByFormId: getFormSelectorByFormId,
	getFormsPriority: getFormsPriority,
	createFormPriority: createFormPriority,
	updateFormPriority: updateFormPriority,
	deleteFormPriority: deleteFormPriority,
	getFormsSelector: getFormsSelector,
	createFormSelector: createFormSelector,
	updateFormSelector: updateFormSelector,
	deleteFormSelector: deleteFormSelector,
};
