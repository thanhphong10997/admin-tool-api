var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const REPORT_KEY = 'reports:';
const REPORT_DELETE = 'reports:delete';
const REPORT_TTL = 864000; // second to day: 10 days

function reportsKeyByFilter(filter) {
    return REPORT_KEY + filter;
}

async function getReportsByFilter(filter) {
    try {
        return await redisClient.getAsync(reportsKeyByFilter(filter));
    } catch (err) {
        winston.error('getReportsByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setReportsByFilter(filter, reports) {
    try {
        await redisClient.set(reportsKeyByFilter(filter), reports, 'EX', REPORT_TTL);
        await redisClient.rpushAsync(REPORT_DELETE, reportsKeyByFilter(filter));
    } catch (err) {
        winston.error('setReportsByFilter ' + reportsKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheReport(filter) {
    try {
        return await redisClient.del(reportsKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheReports ' + filter + ' err = ' + err);
    }
}

async function delReports() {
    try {
        let reportDeleteKeys = await redisClient.lrangeAsync(REPORT_DELETE, 0, -1);
        if (reportDeleteKeys.length > 0) {
            await redisClient.delAsync(reportDeleteKeys);
            await redisClient.delAsync(REPORT_DELETE);
        }
    } catch (err) {
        winston.error('delReports err = ' + err.message);
    }
}

module.exports = {
    getReportsByFilter: getReportsByFilter,
    setReportsByFilter: setReportsByFilter,
    deleteCacheReport: deleteCacheReport,
    delReports: delReports,
};
