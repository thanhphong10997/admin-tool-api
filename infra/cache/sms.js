var winston = require("../logging/winston");
var redisClient = require("./redis").getRedis();

const SMS_KEY = "sms:";
const SMS_DELETE = "sms:delete";
const SMS_TLL = 864000; // second to day: 10 days

function smsKeyByFilter(filter) {
	return SMS_KEY + filter;
}

async function getSMSByFilter(filter) {
	try {
		return await redisClient.getAsync(smsKeyByFilter(filter));
	} catch (err) {
		winston.error("getSMSByFilter " + filter + " err = " + err);
		return null;
	}
}

async function setSMSByFilter(filter, sms) {
	try {
		await redisClient.set(smsKeyByFilter(filter), sms, "EX", SMS_TLL);
		await redisClient.rpushAsync(SMS_DELETE, smsKeyByFilter(filter));
	} catch (err) {
		winston.error("setSMSByFilter " + smsKeyByFilter(filter) + " err = " + err);
	}
}

async function deleteCacheSMS(filter) {
	try {
		return await redisClient.del(smsKeyByFilter(filter));
	} catch (err) {
		winston.error("deleteCacheSMS " + filter + " err = " + err);
	}
}

async function delSMS() {
	try {
		let smsDeleteKeys = await redisClient.lrangeAsync(SMS_DELETE, 0, -1);
		if (smsDeleteKeys.length > 0) {
			await redisClient.delAsync(smsDeleteKeys);
			await redisClient.delAsync(SMS_DELETE);
		}
	} catch (err) {
		winston.error("delForms err = " + err.message);
	}
}

module.exports = {
	getSMSByFilter: getSMSByFilter,
	setSMSByFilter: setSMSByFilter,
	deleteCacheSMS: deleteCacheSMS,
	delSMS: delSMS,
};
