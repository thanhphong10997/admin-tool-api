var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const ADDRESS_KEY = 'otp:';
const ADDRESS_DELETE = 'otp:delete';
const ADDRESS_TLL = 864000; // second to day: 10 days

function otpKeyByFilter(filter) {
    return ADDRESS_KEY + filter;
}

async function getOtpByFilter(filter) {
    try {
        return await redisClient.getAsync(otpKeyByFilter(filter));
    } catch (err) {
        winston.error('getOtpByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setOtpByFilter(filter, address) {
    try {
        await redisClient.set(otpKeyByFilter(filter), address, 'EX', ADDRESS_TLL);
        await redisClient.rpushAsync(ADDRESS_DELETE, otpKeyByFilter(filter));
    } catch (err) {
        winston.error('setAddressByFilter ' + otpKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheOtp(filter) {
    try {
        return await redisClient.del(otpKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheAddress ' + filter + ' err = ' + err);
    }
}

async function delOtp() {
    try {
        let otpDeleteKeys = await redisClient.lrangeAsync(ADDRESS_DELETE, 0, -1);
        if (otpDeleteKeys.length > 0) {
            await redisClient.delAsync(otpDeleteKeys);
            await redisClient.delAsync(ADDRESS_DELETE);
        }
    } catch (err) {
        winston.error('delForms err = ' + err.message);
    }
}

async function getOtpByPhone(phone) {
    try {
        return await redisClient.getAsync("otpCode:" + phone);
    } catch (err) {
        winston.error('getOtpByPhone otpCode:' + phone + ' err = ' + err);
        return null;
    }
}

async function setPhoneOtp(phone, code) {
    try {
        await redisClient.set("otpCode:" + phone, code, 'EX', 60);
    } catch (err) {
        winston.error('setPhoneOtp otpCode:' + phone + ' err = ' + err);
    }
}

module.exports = {
    getOtpByFilter: getOtpByFilter,
    setOtpByFilter: setOtpByFilter,
    deleteCacheOtp: deleteCacheOtp,
    delOtp: delOtp,
    getOtpByPhone,
    setPhoneOtp
};