var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const GOOGLE_SHEET_KEY = 'googleSheets:';
const GOOGLE_SHEET_DELETE = 'googleSheets:delete';
const GOOGLE_SHEET_TTL = 864000; // second to day: 10 days

function googleSheetKeyByFilter(filter) {
    return GOOGLE_SHEET_KEY + filter;
}

async function getGoogleSheetsByFilter(filter) {
    try {
        return await redisClient.getAsync(googleSheetKeyByFilter(filter));
    } catch (err) {
        winston.error('getGoogleSheetsByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setGoogleSheetByFilter(filter, google_sheet) {
    try {
        await redisClient.set(googleSheetKeyByFilter(filter), google_sheet, 'EX', GOOGLE_SHEET_TTL);
        await redisClient.rpushAsync(GOOGLE_SHEET_DELETE, googleSheetKeyByFilter(filter));
    } catch (err) {
        winston.error('setGoogleSheetByFilter ' + googleSheetKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheGoogleSheet(filter) {
    try {
        return await redisClient.del(googleSheetKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheGoogleSheet ' + filter + ' err = ' + err);
    }
}

async function delGoogleSheets() {
    try {
        let googleSheetDeleteKeys = await redisClient.lrangeAsync(GOOGLE_SHEET_DELETE, 0, -1);
        if (googleSheetDeleteKeys.length > 0) {
            await redisClient.delAsync(googleSheetDeleteKeys);
            await redisClient.delAsync(GOOGLE_SHEET_DELETE);
        }
    } catch (err) {
        winston.error('delGoogleSheets err = ' + err.message);
    }
}

module.exports = {
    getGoogleSheetsByFilter: getGoogleSheetsByFilter,
    setGoogleSheetByFilter: setGoogleSheetByFilter,
    deleteCacheGoogleSheet: deleteCacheGoogleSheet,
    delGoogleSheets: delGoogleSheets,
};