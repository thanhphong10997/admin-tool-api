var winston = require("../infra/logging/winston");
var utils = require("../interfaces/http/utils/utils");
var { v4: uuidv4 } = require("uuid");
var gameMysql = require("../infra/database/game");
var smsMysql = require("../infra/database/sms");
var websiteMysql = require("../infra/database/website");

var safeStringify = require("fast-safe-stringify");
var _ = require("lodash");
var notificationService = require("../infra/service/notification");

var gameRedis = require("../infra/cache/game");
var websiteRedis = require("../infra/cache/website");
var Game = require("../domain/model/game/game");
var Website = require("../domain/model/website/website");
var utilsApi = require("./utilsApi");
var smsServices = require("../domain/SmsServices");
var otpServices = require("../domain/OtpServices");
var createPageWPService = require("../infra/service/createPageWPService");

async function getGames(req) {
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
		// console.log(queryString);
		response["data"] = await getGamesInternal(
			cacheKey,
			options,
			filter,
			whereParams
		);
		return response;
	} catch (err) {
		winston.error("getGames err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function createGame(req) {
	var response = utils.initObject();
	var body = req.body;
	var uuid = uuidv4();
	try {
		var game = new Game(
			body.name,
			body.google_sheet,
			body.check_staff_code,
			body.started_date,
			body.ended_date,
			body.url,
			body.type,
			body.department,
			body.status,
			body.created_user_id,
			uuid,
			body.template,
			body.images
		);
		game.id = await gameMysql.createGame(game);

		await gameRedis.delGames();

		response["data"] = game;
		return response;
	} catch (err) {
		var textErr =
			" createGame body = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updateGame(req) {
	var response = utils.initObject();
	var gameId = req.params.gameId;
	var body = req.body;

	try {
		var game = await gameMysql.getById(gameId);
		if (!game) {
			throw new Error("game not exists " + gameId);
		}

		if (body.name) {
			game.name = body.name;
		}

		if (body.google_sheet) {
			game.google_sheet = body.google_sheet;
		}

		if (body.check_staff_code) {
			game.check_staff_code = body.check_staff_code;
		}

		if (body.started_date) {
			game.started_date = body.started_date;
		}

		if (body.ended_date) {
			game.ended_date = body.ended_date;
		}

		if (body.url) {
			game.url = body.url;
		}

		if (body.type) {
			game.type = body.type;
		}

		if (body.department) {
			game.department = body.department;
		}

		if (body.status) {
			game.status = body.status;
		}

		if (body.updated_user_id) {
			game.updated_user_id = body.updated_user_id;
		}

		if (body.id_template) {
			game.id_template = body.id_template;
		}

		if (body.check_staff_code) {
			game.check_staff_code = body.check_staff_code;
		}

		if (body.images){
			game.images = body.images;
		}

		await gameMysql.updateGame(game);
		await gameRedis.delGames();

		response["data"] = game;

		return response;
	} catch (err) {
		winston.error("updateGame gameId = " + gameId + "  err = " + err);
		notificationService.sendByTelegram(
			" updateGame = " + gameId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deleteGame(req) {
	var response = utils.initObject();
	var gameId = req.params.gameId;
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

		await gameMysql.deleteGame(gameId, whereParams);
		await gameRedis.delGames();

		response["data"] = gameId;
		response["message"] = "Delete game successfull !!";
		return response;
	} catch (err) {
		winston.error("deleteGames err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getGamesInternal(cacheKey, options, filter, whereParams) {
	let results = await gameRedis.getGamesByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await gameMysql.getGames(filter, options, whereParams);

	if (results) {
		await gameRedis.setGamesByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function getNameGames(req) {
	var queryString = req.query;
	var response = utils.initObject();

	try {
		var filter = {};
		var options = { offset: 0, limit: 10, select: "id, name" };
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

		response["data"] = await getGamesInternal(
			cacheKey,
			options,
			filter,
			whereParams
		);
		return response;
	} catch (err) {
		winston.error("getGames err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormsByGameId(req) {
	var response = utils.initObject();
	var gameId = req.params.gameId;

	try {
		// var cacheKey = gameId + ":state";

		// response["data"] = await getFormsByGameIdInternal(cacheKey, gameId);
		// return response;
		let data = await gameMysql.getFormsByGameId(gameId);
		if (data.forms.length > 0) {
			for (i = 0; i < data.forms.length; i++) {
				// OTP
				let formItem = data.forms[i];
				formItem.form = JSON.parse(formItem.form);
				// console.log("formItem", formItem.form);
				const otpField = formItem.form.filter(function (field) {
					return field.field == "otp";
				});
				if (otpField && otpField.require == true) {
					var otpId = otpField[0].value.id;
					let cacheKey = otpId + ":gameState";
					otpResultFromDB = await otpServices.getOtpByIdInternal(
						cacheKey,
						otpId
					);
					otpField[0].value.name = otpResultFromDB.name;
					otpField[0].value.content = otpResultFromDB.content;
					otpField[0].value.name = otpResultFromDB.name;
					otpField[0].value.content = otpResultFromDB.content;
				}
				// SMS
				const smsField = formItem.form.filter(function (field) {
					return field.field == "sms";
				});

				if (smsField && smsField.require == true) {
					let smsId = smsField[0].value.id;
					// console.log(smsId);
					let cacheKey = smsId + ":gameState";
					smsResultFromDB = await smsServices.getSMSByIdInternal(
						cacheKey,
						smsId
					);
					smsField[0].value.title = smsResultFromDB.title;
					smsField[0].value.content = smsResultFromDB.content;
					smsField[0].value.title = smsResultFromDB.title;
					smsField[0].value.content = smsResultFromDB.content;
				}
			}
		}
		response["data"] = data;
		return response;
	} catch (err) {
		winston.error("getFormsByGameId err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getPageInfoByGameId(req) {
	var response = utils.initObject();
	var gameId = req.params.gameId;
	try {
		let data = await gameMysql.getTemplateByGameId(gameId);
		response["data"] = data;
		// console.log(data);
		let result = createPageWPService.createPageWP(data[0]);
		return result;
	} catch (err) {
		winston.error("getTemplateByGameId err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getFormsByGameIdInternal(cacheKey, gameId) {
	let results = await gameRedis.getGamesByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await gameMysql.getFormsByGameId(gameId);

	if (results) {
		await gameRedis.setGamesByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function getListGames(req) {
	var queryString = req.query;
	var response = utils.initObject();

	try {
		var filter = {};
		var cacheKey = "listGames";

		for (var key in queryString) {
			var value = queryString[key];
			cacheKey = cacheKey + ":" + value;

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
		response["data"] = await getListGamesInternal(cacheKey, filter);
		return response;
	} catch (err) {
		winston.error("getListGames err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getListGamesInternal(cacheKey, filter) {
	let results = await gameRedis.getGamesByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await gameMysql.getListGames(filter);

	if (results) {
		await gameRedis.setGamesByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function getWebsites(req) {
	var queryString = req.query;
	var response = utils.initObject();

	try {
		var filter = {};
		var options = { offset: 0, limit: 10 };

		var cacheKey = "all";

		for (var key in queryString) {
			var value = queryString[key];
			cacheKey = cacheKey + ":" + value;

			if (key === "limit" || key === "offset") {
				options[key] = parseInt(value);
				continue;
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

		response["data"] = await getWebsitesInternal(cacheKey, options, filter);
		return response;
	} catch (err) {
		winston.error("getWebsites err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getWebsitesInternal(cacheKey, options, filter) {
	let results = await websiteRedis.getWebsiteByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await websiteMysql.getWebsites(filter, options);

	if (results) {
		await websiteRedis.setWebsiteByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function createWebsite(req) {
	var response = utils.initObject();
	var body = req.body;

	try {
		var website = new Website(
			body.web_name,
			body.position_save_form,
			body.form_id,
			body.game_id,
			body.created_user_id
		);
		website.id = await websiteMysql.createWebsite(website);

		await websiteRedis.delWeb();

		response["data"] = website;
		return response;
	} catch (err) {
		var textErr =
			" createWebsite body = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updateWebsite(req) {
	var response = utils.initObject();
	var websiteId = req.params.websiteId;
	var body = req.body;

	try {
		var website = await websiteMysql.getById(websiteId);
		if (!website) {
			throw new Error("website not exists " + websiteId);
		}

		if (body.web_name) {
			website.web_name = body.web_name;
		}

		if (body.position_save_form) {
			website.position_save_form = body.position_save_form;
		}

		if (body.form_id) {
			website.form_id = body.form_id;
		}

		if (body.game_id) {
			website.game_id = body.game_id;
		}

		if (body.updated_user_id) {
			website.updated_user_id = body.updated_user_id;
		}

		await websiteMysql.updateWebsite(website);
		await websiteRedis.delWeb();

		response["data"] = website;

		return response;
	} catch (err) {
		winston.error("updateWebsite websiteId = " + websiteId + "  err = " + err);
		notificationService.sendByTelegram(
			" updateWebsite = " + websiteId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deleteWebsite(req) {
	var response = utils.initObject();
	var websiteId = req.params.websiteId;
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

		await websiteMysql.deleteWebsite(websiteId, whereParams);
		await websiteRedis.delWeb();

		response["data"] = websiteId;
		response["message"] = "Delete Website successfull !!";
		return response;
	} catch (err) {
		winston.error("deleteWebsite err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

module.exports = {
	getGames: getGames,
	createGame: createGame,
	updateGame: updateGame,
	deleteGame: deleteGame,
	getNameGames: getNameGames,
	getFormsByGameId: getFormsByGameId,
	getPageInfoByGameId: getPageInfoByGameId,
	getListGames: getListGames,
	getWebsites: getWebsites,
	createWebsite: createWebsite,
	updateWebsite: updateWebsite,
	deleteWebsite: deleteWebsite,
	getListGamesInternal: getListGamesInternal,
};
