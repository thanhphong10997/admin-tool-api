var safeStringify = require("fast-safe-stringify");
var smsMysql = require("../infra/database/sms");
var smsRedis = require("../infra/cache/sms");

async function getSMSByIdInternal(cacheKey, smsId) {
  let results = await smsRedis.getSMSByFilter(cacheKey);

  if (results) {
    return JSON.parse(results);
  }

  results = await smsMysql.getById(smsId);

  if (results) {
    await smsRedis.setSMSByFilter(cacheKey, safeStringify(results));
  }

  return results;
}

async function getSMSInternal(cacheKey, options, filter) {
  let results = await smsRedis.getSMSByFilter(cacheKey);

  if (results) {
    return JSON.parse(results);
  }

  results = await smsMysql.getSMS(filter, options);

  if (results) {
    await smsRedis.setSMSByFilter(cacheKey, safeStringify(results));
  }

  return results;
}

module.exports = {
  getSMSByIdInternal: getSMSByIdInternal,
  getSMSInternal: getSMSInternal,
}