var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const LOG_KEY = 'log:';
const LOG_DELETE = 'log:delete';
const LOG_TLL = 864000; // second to day: 10 days

function logKeyByFilter(filter) {
    return LOG_KEY + filter;
}

async function getLogByFilter(filter) {
    try {
        return await redisClient.getAsync(logKeyByFilter(filter));
    } catch (err) {
        winston.error('getLogByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setLogByFilter(filter, log) {
    try {
        await redisClient.set(logKeyByFilter(filter), log, 'EX', LOG_TLL);
        await redisClient.rpushAsync(LOG_DELETE, logKeyByFilter(filter));
    } catch (err) {
        winston.error('setLogByFilter ' + logKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheLog(filter) {
    try {
        return await redisClient.del(logKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheLog ' + filter + ' err = ' + err);
    }
}

async function delLogs() {
    try {
        let logDeleteKeys = await redisClient.lrangeAsync(LOG_DELETE, 0, -1);
        if (logDeleteKeys.length > 0) {
            await redisClient.delAsync(logDeleteKeys);
            await redisClient.delAsync(LOG_DELETE);
        }
    } catch (err) {
        winston.error('delForms err = ' + err.message);
    }
}

module.exports = {
    getLogByFilter: getLogByFilter,
    setLogByFilter: setLogByFilter,
    deleteCacheLog: deleteCacheLog,
    delLogs: delLogs,
};