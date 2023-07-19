var utils = require("../interfaces/http/utils/utils");
var winston = require("../infra/logging/winston");

var safeStringify = require("fast-safe-stringify");
var notificationService = require("../infra/service/notification");

var addressMysql = require("../infra/database/address");
var otpMysql = require("../infra/database/otp");

var gameRedis = require("../infra/cache/game");
var otpRedis = require("../infra/cache/otp");

var Otp = require("../domain/model/otp/otp");

var otpServices = require("../domain/OtpServices");

async function getOtp(req) {
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

    response["data"] = await otpServices.getOtpInternal(cacheKey, options, filter);
    return response;
  } catch (err) {
    winston.error("getAddress err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getOtpById(req) {
  var response = utils.initObject();
  var otpId = req.params.otpId;
  try {
    var cacheKey = otpId;

    response["data"] = await otpServices.getOtpByIdInternal(cacheKey, otpId);

    return response;
  } catch (err) {
    winston.error("getOtpById = " + otpId + "  err = " + err);
    notificationService.sendByTelegram(
      " getAddressById = " + otpId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function createOtp(req) {
  var response = utils.initObject();
  var body = req.body;

  try {
    var otp = new Otp(body.name, body.content, body.created_user_id);
    otp.id = await otpMysql.createOtp(otp);

    await otpRedis.delOtp();

    response["data"] = otp;
    return response;
  } catch (err) {
    var textErr =
      " createOtp body = " + safeStringify(body) + " error: " + err.message;
    winston.error(textErr);
    notificationService.sendByTelegram(textErr);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function updateOtp(req) {
  var response = utils.initObject();
  var otpId = req.params.otpId;
  var body = req.body;
  try {
    var otp = await addressMysql.getById(otpId);
    if (!otp) {
      throw new Error("address not exists " + otpId);
    }

    if (body.name) {
      otp.name = body.name;
    }

    if (body.content) {
      otp.content = body.content;
    }

    if (body.updated_user_id) {
      otp.updated_user_id = body.updated_user_id;
    }

    await otpMysql.updateOtp(otp);
    await otpRedis.delOtp();
    await gameRedis.deleteCacheGame(otpId + ':gameState');

    response["data"] = otp;

    return response;
  } catch (err) {
    winston.error("updateOtp otpId = " + otpId + "  err = " + err);
    notificationService.sendByTelegram(
      " updateAddress = " + otpId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function deleteOtp(req) {
  var response = utils.initObject();
  var otpId = req.params.otpId;
  var queryString = req.query;
  console.log("otp", otpId);
  try {
    var whereParams = [];

    for (var key in queryString) {
      whereParams.push({
        field: key,
        condition: "= ?",
        value: queryString[key],
      });
    }
    await otpMysql.deleteOtp(otpId, whereParams);
    await otpRedis.delOtp();
    await gameRedis.deleteCacheGame(otpId + ':gameState');

    response["data"] = otpId;
    response["message"] = "Delete otp successfull !!";
    return response;
  } catch (err) {
    winston.error("deleteAddress err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

module.exports = {
  getOtp: getOtp,
  getOtpById: getOtpById,
  createOtp: createOtp,
  updateOtp: updateOtp,
  deleteOtp: deleteOtp,
}