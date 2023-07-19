var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const FORM_PRIORITY_KEY = 'formPriority:';
const FORM_PRIORITY_DELETE = 'formPriority:delete';
const FORM_PRIORITY_TTL = 864000; // second to day: 10 days

function formsPriorityKeyByFilter(filter) {
    return FORM_PRIORITY_KEY + filter;
}

async function getFormsPriorityByFilter(filter) {
    try {
        return await redisClient.getAsync(formsPriorityKeyByFilter(filter));
    } catch (err) {
        winston.error('getFormsPriorityByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setFormsPriorityByFilter(filter, forms) {
    try {
        await redisClient.set(formsPriorityKeyByFilter(filter), forms, 'EX', FORM_PRIORITY_TTL);
        await redisClient.rpushAsync(FORM_PRIORITY_DELETE, formsPriorityKeyByFilter(filter));
    } catch (err) {
        winston.error('setFormsPriorityByFilter ' + formsPriorityKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheFormPriority(filter) {
    try {
        return await redisClient.del(formsPriorityKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheFormPriority ' + filter + ' err = ' + err);
    }
}

async function delFormsPriority() {
    try {
        let formPriorityDeleteKeys = await redisClient.lrangeAsync(FORM_PRIORITY_DELETE, 0, -1);
        if (formPriorityDeleteKeys.length > 0) {
            await redisClient.delAsync(formPriorityDeleteKeys);
            await redisClient.delAsync(FORM_PRIORITY_DELETE);
        }
    } catch (err) {
        winston.error('delFormsPriority err = ' + err.message);
    }
}

module.exports = {
    getFormsPriorityByFilter: getFormsPriorityByFilter,
    setFormsPriorityByFilter: setFormsPriorityByFilter,
    deleteCacheFormPriority: deleteCacheFormPriority,
    delFormsPriority: delFormsPriority,
};