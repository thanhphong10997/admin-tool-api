var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const ACCOUNT_TEST_KEY = 'accountTest:';
const ACCOUNT_TEST_DELETE = 'accountTest:delete';
const ACCOUNT_TEST_TLL = 864000; // second to day: 10 days

function accountTestKeyByFilter(filter) {
    return ACCOUNT_TEST_KEY + filter;
}

async function getAccountTestByFilter(filter) {
    try {
        return await redisClient.getAsync(accountTestKeyByFilter(filter));
    } catch (err) {
        winston.error('getAccountTestByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setAccountTestByFilter(filter, accountTest) {
    try {
        await redisClient.set(accountTestKeyByFilter(filter), accountTest, 'EX', ACCOUNT_TEST_TLL);
        await redisClient.rpushAsync(ACCOUNT_TEST_DELETE, accountTestKeyByFilter(filter));
    } catch (err) {
        winston.error('setAccountTestByFilter ' + accountTestKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheAccountTest(filter) {
    try {
        return await redisClient.del(accountTestKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheAccountTest ' + filter + ' err = ' + err);
    }
}

async function delAccountTest() {
    try {
        let accountTestDeleteKeys = await redisClient.lrangeAsync(ACCOUNT_TEST_DELETE, 0, -1);
        if (accountTestDeleteKeys.length > 0) {
            await redisClient.delAsync(accountTestDeleteKeys);
            await redisClient.delAsync(ACCOUNT_TEST_DELETE);
        }
    } catch (err) {
        winston.error('delForms err = ' + err.message);
    }
}

module.exports = {
    getAccountTestByFilter: getAccountTestByFilter,
    setAccountTestByFilter: setAccountTestByFilter,
    deleteCacheAccountTest: deleteCacheAccountTest,
    delAccountTest: delAccountTest,
};