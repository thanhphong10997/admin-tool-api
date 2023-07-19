var safeStringify = require("fast-safe-stringify");
var otpMysql = require("../infra/database/otp");
var otpRedis = require("../infra/cache/otp");

async function getOtpInternal(cacheKey, options, filter) {
  let results = await otpRedis.getOtpByFilter(cacheKey);

  if (results) {
    return JSON.parse(results);
  }

  results = await otpMysql.getOtp(filter, options);

  if (results) {
    await otpRedis.setOtpByFilter(cacheKey, safeStringify(results));
  }

  return results;
}

async function getOtpByIdInternal(cacheKey, addressId) {
  let results = await otpRedis.getOtpByFilter(cacheKey);

  if (results) {
    return JSON.parse(results);
  }

  results = await otpMysql.getById(addressId);

  if (results) {
    await otpRedis.setOtpByFilter(cacheKey, safeStringify(results));
  }

  return results;
}

module.exports = {
  getOtpByIdInternal: getOtpByIdInternal,
  getOtpInternal: getOtpInternal,
}