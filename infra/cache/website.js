var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const WEB_KEY = 'website:';
const WEB_DELETE = 'website:delete';
const WEB_TLL = 864000; // second to day: 10 days

function websiteKeyByFilter(filter) {
    return WEB_KEY + filter;
}

async function getWebsiteByFilter(filter) {
    try {
        return await redisClient.getAsync(websiteKeyByFilter(filter));
    } catch (err) {
        winston.error('getWebsiteByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setWebsiteByFilter(filter, website) {
    try {
        await redisClient.set(websiteKeyByFilter(filter), website, 'EX', WEB_TLL);
        await redisClient.rpushAsync(WEB_DELETE, websiteKeyByFilter(filter));
    } catch (err) {
        winston.error('setWebsiteByFilter ' + websiteKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheWebsite(filter) {
    try {
        return await redisClient.del(websiteKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheWebsite ' + filter + ' err = ' + err);
    }
}

async function delWeb() {
    try {
        let webDeleteKeys = await redisClient.lrangeAsync(WEB_DELETE, 0, -1);
        if (webDeleteKeys.length > 0) {
            await redisClient.delAsync(webDeleteKeys);
            await redisClient.delAsync(WEB_DELETE);
        }
    } catch (err) {
        winston.error('delWeb err = ' + err.message);
    }
}

module.exports = {
    getWebsiteByFilter: getWebsiteByFilter,
    setWebsiteByFilter: setWebsiteByFilter,
    deleteCacheWebsite: deleteCacheWebsite,
    delWeb: delWeb,
};