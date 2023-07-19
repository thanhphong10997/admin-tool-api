var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const FORM_KEY = 'forms:';
const FORM_DELETE = 'forms:delete';
const FORM_TTL = 864000; // second to day: 10 days

function formsKeyByFilter(filter) {
    return FORM_KEY + filter;
}

async function getFormsByFilter(filter) {
    try {
        return await redisClient.getAsync(formsKeyByFilter(filter));
    } catch (err) {
        winston.error('getFormsByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setFormsByFilter(filter, forms) {
    try {
        await redisClient.set(formsKeyByFilter(filter), forms, 'EX', FORM_TTL);
        await redisClient.rpushAsync(FORM_DELETE, formsKeyByFilter(filter));
    } catch (err) {
        winston.error('setFormsByFilter ' + formsKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheForm(filter) {
    try {
        return await redisClient.del(formsKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheForm ' + filter + ' err = ' + err);
    }
}

async function delForms() {
    try {
        let formDeleteKeys = await redisClient.lrangeAsync(FORM_DELETE, 0, -1);
        if (formDeleteKeys.length > 0) {
            await redisClient.delAsync(formDeleteKeys);
            await redisClient.delAsync(FORM_DELETE);
        }
    } catch (err) {
        winston.error('delForms err = ' + err.message);
    }
}

module.exports = {
    getFormsByFilter: getFormsByFilter,
    setFormsByFilter: setFormsByFilter,
    deleteCacheForm: deleteCacheForm,
    delForms: delForms,
};