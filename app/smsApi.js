var utils = require("../interfaces/http/utils/utils");
var winston = require("../infra/logging/winston");

var safeStringify = require("fast-safe-stringify");
var notificationService = require("../infra/service/notification");

var smsMysql = require("../infra/database/sms");

var gameRedis = require("../infra/cache/game");
var smsRedis = require("../infra/cache/sms");

var SMS = require("../domain/model/sms/sms");
var smsServices = require("../domain/SmsServices");

async function getSMS(req) {
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

    response["data"] = await smsServices.getSMSInternal(cacheKey, options, filter);
    return response;
  } catch (err) {
    winston.error("getAddress err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function createSMS(req) {
  var response = utils.initObject();
  var body = req.body;

  try {
    var sms = new SMS(body.title, body.content, body.created_user_id);
    sms.id = await smsMysql.createSMS(sms);

    await smsRedis.delSMS();

    response["data"] = sms;
    return response;
  } catch (err) {
    var textErr =
      " createSMS body = " + safeStringify(body) + " error: " + err.message;
    winston.error(textErr);
    notificationService.sendByTelegram(textErr);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function updateSMS(req) {
  var response = utils.initObject();
  var smsId = req.params.smsId;
  var body = req.body;

  try {
    var sms = await smsMysql.getById(smsId);
    if (!sms) {
      throw new Error("sms not exists " + smsId);
    }

    if (body.title) {
      sms.title = body.title;
    }

    if (body.content) {
      sms.content = body.content;
    }

    if (body.updated_user_id) {
      sms.updated_user_id = body.updated_user_id;
    }

    await smsMysql.updateSMS(sms);
    await smsRedis.delSMS();
    await gameRedis.deleteCacheGame(smsId + ':gameState');

    response["data"] = sms;

    return response;
  } catch (err) {
    winston.error("updateSMS smsId = " + smsId + "  err = " + err);
    notificationService.sendByTelegram(
      " updateSMS = " + smsId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function deleteSMS(req) {
  var response = utils.initObject();
  var smsId = req.params.smsId;
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

    await smsMysql.deleteSMS(smsId, whereParams);
    await smsRedis.delSMS();
    await gameRedis.deleteCacheGame(smsId + ':gameState');

    response["data"] = smsId;
    response["message"] = "Delete SMS successfull !!";
    return response;
  } catch (err) {
    winston.error("deleteSMS err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getSMSById(req) {
  var response = utils.initObject();
  var smsId = req.params.smsId;

  try {
    var cacheKey = smsId;

    response["data"] = await smsServices.getSMSByIdInternal(cacheKey, smsId);

    return response;
  } catch (err) {
    winston.error("getSMSById = " + smsId + "  err = " + err);
    notificationService.sendByTelegram(
      " getSMSById = " + smsId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

module.exports = {
  getSMS: getSMS,
  createSMS: createSMS,
  updateSMS: updateSMS,
  deleteSMS: deleteSMS,
  getSMSById: getSMSById,
}