var winston = require("../infra/logging/winston");
var utils = require("../interfaces/http/utils/utils");

var userMysql = require("../infra/database/user");
var logMysql = require("../infra/database/log");
var loginMysql = require("../infra/database/login");
var accountTestMysql = require("../infra/database/account_test");

var sha256 = require("salt-sha256");
var safeStringify = require("fast-safe-stringify");
var _ = require("lodash");
var notificationService = require("../infra/service/notification");

var userRedis = require("../infra/cache/user");
var logRedis = require("../infra/cache/log");
var accountTestRedis = require("../infra/cache/account_test");
var User = require("../domain/model/user/user");
var Log = require("../domain/model/log/log");
var Login = require("../domain/model/login/login");
var AccountTest = require("../domain/model/account/account_test");

var logService = require("../infra/service/logService");

async function createUser(req) {
	var response = utils.initObject();
	var body = req.body;
	try {
		password = body.password;
		passwordSha256 = sha256(password, global.gConfig.secretKey);
		var user = new User(body.username, passwordSha256, body.full_name);
		user.id = await userMysql.createUser(user);
		await userRedis.delUsers();

		response["data"] = user;
		return response;
	} catch (err) {
		var textErr =
			" createUser = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updateUser(req) {
	var response = utils.initObject();
	var userId = req.params.userId;
	var body = req.body;

	try {
		var user = await userMysql.getById(userId);
		if (!user) {
			throw new Error("user not exists " + userId);
		}

		if (body.username) {
			user.username = body.username;
		}

		if (user.password != body.password) {
			password = body.password;
			passwordSha256 = sha256(password, global.gConfig.secretKey);
			user.password = passwordSha256;
		}

		if (user.password == body.password) {
			user.password = body.password;
		}

		if (body.full_name) {
			user.full_name = body.full_name;
		}

		if (body.department) {
			user.department = body.department;
		}

		if (body.email) {
			user.email = body.email;
		}

		await userMysql.updateUser(user);
		await userRedis.delUsers();

		response["data"] = user;
		return response;
	} catch (err) {
		winston.error("updateUser userId = " + userId + "  err = " + err);
		notificationService.sendByTelegram(
			" updateUser = " + userId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getUsers(req) {
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

		response["data"] = await getUsersInternal(
			cacheKey,
			options,
			filter,
			whereParams
		);
		return response;
	} catch (err) {
		winston.error("getUsers err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		console.log("error user:", err);
		return response;
	}
}

async function getUsersInternal(cacheKey, options, filter, whereParams) {
	let results = await userRedis.getUsersByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await userMysql.getUsers(filter, options, whereParams);

	if (results) {
		await userRedis.setUsersByFilter(cacheKey, safeStringify(results));
	}

	return results;
}
async function getUsersById(req) {
	var usserId = req.params.userId;
	var response = utils.initObject();
	try {
		var cacheKey = usserId;
		response["data"] = await getUserByIdInternal(cacheKey, usserId);
		return response;
	} catch (err) {
		winston.error("getAddressById = " + usserId + "  err = " + err);
		notificationService.sendByTelegram(
			" getAddressById = " + usserId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		console.log("error get user by id", err);
		return response;
	}
}

async function getUserByIdInternal(cacheKey, addressId) {
	let results = await userRedis.setUsersByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await userMysql.getById(addressId);

	if (results) {
		await userRedis.setUsersByFilter(cacheKey, safeStringify(results));
	}

	return results;
}
async function getUsersById(req) {
	var usserId = req.params.userId;
	var response = utils.initObject();
	try {
		var cacheKey = usserId;
		response["data"] = await getUserByIdInternal(cacheKey, usserId);
		return response;
	} catch (err) {
		winston.error("getAddressById = " + usserId + "  err = " + err);
		notificationService.sendByTelegram(
			" getAddressById = " + usserId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		console.log("error get user by id", err);
		return response;
	}
}

async function getUserByIdInternal(cacheKey, addressId) {
	let results = await userRedis.setUsersByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await userMysql.getById(addressId);

	if (results) {
		await userRedis.setUsersByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function deleteUser(req) {
	var response = utils.initObject();
	var userId = req.params.userId;
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
		await userMysql.deleteUser(userId, whereParams);
		await userRedis.delUsers();

		response["data"] = userId;
		response["message"] = "Delete Address successfull !!";
		return response;
	} catch (err) {
		winston.error("deleteAddress err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deleteUser(req) {
	var response = utils.initObject();
	var userId = req.params.userId;
	var queryString = req.query;

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
		await userMysql.deleteUser(userId, whereParams);
		await userRedis.delUsers();

		response["data"] = userId;
		response["message"] = "Delete Address successfull !!";
		return response;
	} catch (err) {
		winston.error("deleteAddress err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getLogs(req) {
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

		response["data"] = await getLogsInternal(cacheKey, options, filter);
		return response;
	} catch (err) {
		winston.error("getLogs err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getLogsInternal(cacheKey, options, filter) {
	let results = await logRedis.getLogByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await logMysql.getLogs(filter, options);

	if (results) {
		await logRedis.setLogByFilter(cacheKey, safeStringify(results));
	}

	return results;
}

async function createLog(req) {
	var response = utils.initObject();
	var body = req.body;

	try {
		var log = new Log(body.user_id, body.action, body.body);
		log.id = await logMysql.createLog(log);

		await logRedis.delLogs();

		response["data"] = log;
		return response;
	} catch (err) {
		var textErr =
			" createLog body = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getLogsApi(req) {
	var queryString = req.query;
	var response = utils.initObject();
	try {
		var filter = {};
		var options = { offset: 0, limit: 10 };

		var cacheKey = "logsApi";

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

			if (key === "key") {
				filter[key] = { value: value, type: "string" };
				continue;
			}

			filter[key] = value;
		}

		response["data"] = await getLogsApiInternal(cacheKey, options, filter);
		return response;
	} catch (err) {
		winston.error("getLogs err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getLogsApiInternal(cacheKey, options, filter) {
	let results = await logRedis.getLogByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}
 results = await logService.getLogsApi(options, filter);
	if (results) {
		await logRedis.setLogByFilter(cacheKey, safeStringify(results));
	}
	return results;
}

async function checkLogin(req) {
	var response = utils.initObject();
	var body = req.body;

	try {
		var login = new Login(body.username, body.password);
		var user = await loginMysql.getUser(login);

		if (!user[0]) {
			message = "Tài khoản hoặc mật khẩu không hợp lệ";
			response["message"] = message;
			response["status"] = 0;
			return response;
		}

		var message = "";
		var data = {};

		if (login.username == user[0].username) {
			var pw = sha256(login.password, global.gConfig.secretKey);
			if (pw == user[0].password) {
				message = "Đăng nhập thành công";
				data = {
					user_id: user[0].id,
				};
			}
		}

		if (message == "") {
			message = "Tài khoản hoặc mật khẩu không hợp lệ";
			response["status"] = 0;
		}

		response["message"] = message;
		response["data"] = data;
		return response;
	} catch (err) {
		var textErr =
			" checkLogin = " + safeStringify(body) + " error: " + err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getAccountsTest(req) {
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

		response["data"] = await getAccountsTestInternal(cacheKey, options, filter);
		return response;
	} catch (err) {
		winston.error("getAccountsTest err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function getAccountsTestInternal(cacheKey, options, filter) {
	let results = await accountTestRedis.getAccountTestByFilter(cacheKey);

	if (results) {
		return JSON.parse(results);
	}

	results = await accountTestMysql.getAccountsTest(filter, options);

	if (results) {
		await accountTestRedis.setAccountTestByFilter(
			cacheKey,
			safeStringify(results)
		);
	}

	return results;
}

async function createAccountTest(req) {
	var response = utils.initObject();
	var body = req.body;

	try {
		var account_test = new AccountTest(body.phone);
		account_test.id = await accountTestMysql.createAccountTest(account_test);

		await accountTestRedis.delAccountTest();

		response["data"] = account_test;
		return response;
	} catch (err) {
		var textErr =
			" createAccountTest body = " +
			safeStringify(body) +
			" error: " +
			err.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function updateAccountTest(req) {
	var response = utils.initObject();
	var accountTestId = req.params.accountTestId;
	var body = req.body;

	try {
		var account_test = await accountTestMysql.getById(accountTestId);
		if (!account_test) {
			throw new Error("account_test not exists " + accountTestId);
		}

		if (body.phone) {
			account_test.phone = body.phone;
		}

		await accountTestMysql.updateAccountTest(account_test);
		await accountTestRedis.delAccountTest();

		response["data"] = account_test;

		return response;
	} catch (err) {
		winston.error(
			"updateAccountTest accountTestId = " + accountTestId + "  err = " + err
		);
		notificationService.sendByTelegram(
			" updateAccountTest = " + accountTestId + " err: " + err.message
		);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

async function deleteAccountTest(req) {
	var response = utils.initObject();
	var accountTestId = req.params.accountTestId;
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

		await accountTestMysql.deleteAccountTest(accountTestId, whereParams);
		await accountTestRedis.delAccountTest();

		response["data"] = accountTestId;
		response["message"] = "Delete AccountTest successfull !!";
		return response;
	} catch (err) {
		winston.error("deleteAccountTest err = " + err);
		response["status"] = 0;
		response["message"] = err.message;
		return response;
	}
}

module.exports = {
	getUsers: getUsers,
	createUser: createUser,
	updateUser: updateUser,
	getLogs: getLogs,
	createLog: createLog,
	getLogsApi: getLogsApi,
	checkLogin: checkLogin,
	getAccountsTest: getAccountsTest,
	createAccountTest: createAccountTest,
	updateAccountTest: updateAccountTest,
	deleteAccountTest: deleteAccountTest,
	getUsersById: getUsersById,
	deleteUser: deleteUser,
};
