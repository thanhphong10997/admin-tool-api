var notificationService = require("../infra/service/notification");
var utils = require("../interfaces/http/utils/utils");
var winston = require("../infra/logging/winston");
var safeStringify = require("fast-safe-stringify");
const otpLib = require('otplib');
const otpRedis = require('../infra/cache/otp');

async function getCode(req) {
  var response = utils.initObject();
	var params = req.query;
  var phone = utils.formatPhone(params.phone);
  try {    
    if (!phone) {
      throw new Error("phone is required");
    }
    const authenticator = otpLib.totp;
    authenticator.options = { step: 30 };
    const secret = 'NAUVPZZLWVOVZRGSPKIVXPGMAQBHENOB:' + phone;
    const token = authenticator.generate(secret);
    otpRedis.setPhoneOtp(phone, token);
    
    response["data"] = token;
		return response;
  } catch (error) {    
    var textErr =
			" getOtpCode = " + safeStringify(params) + " error: " + error.message;
		winston.error(textErr);
		notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = error.message;
		return response;
  }
}

async function verifyCode(req) {
  var response = utils.initObject();
	var params = req.query;
  var phone = utils.formatPhone(params.phone);
  var code = params.code;  
  try {
    if (!phone) {
      throw new Error("phone is required");
    }
    if (!code) {
      throw new Error("code is required");
    }

    const otpCodeRedis = await otpRedis.getOtpByPhone(phone);    
    if (!otpCodeRedis) {
      throw new Error("invalid code");
    }
    
    response["data"] = code == otpCodeRedis ? true : false;
		return response;
  } catch (error) {    
    var textErr = " getOtpCode = " + safeStringify(params) + " error: " + error.message;
		winston.error(textErr);
    notificationService.sendByTelegram(textErr);
		response["status"] = 0;
		response["message"] = error.message;   
		return response;
  }
}

module.exports = {
  getCode,
  verifyCode
};