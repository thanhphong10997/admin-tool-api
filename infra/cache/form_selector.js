var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const FORM_SELECTOR_KEY = 'formSelector:';
const FORM_SELECTOR_DELETE = 'formSelector:delete';
const FORM_SELECTOR_TTL = 864000; // second to day: 10 days

function formsSelectorKeyByFilter(filter) {
    return FORM_SELECTOR_KEY + filter;
}

async function getFormsSelectorByFilter(filter) {
    try {
        return await redisClient.getAsync(formsSelectorKeyByFilter(filter));
    } catch (err) {
        winston.error('getFormsSelectorByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setFormsSelectorByFilter(filter, forms) {
    try {
        await redisClient.set(formsSelectorKeyByFilter(filter), forms, 'EX', FORM_SELECTOR_TTL);
        await redisClient.rpushAsync(FORM_SELECTOR_DELETE, formsSelectorKeyByFilter(filter));
    } catch (err) {
        winston.error('setFormsSelectorByFilter ' + formsSelectorKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheFormSelector(filter) {
    try {
        return await redisClient.del(formsSelectorKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheFormSelector ' + filter + ' err = ' + err);
    }
}

async function delFormsSelector() {
    try {
        let formDeleteKeys = await redisClient.lrangeAsync(FORM_SELECTOR_DELETE, 0, -1);
        if (formDeleteKeys.length > 0) {
            await redisClient.delAsync(formDeleteKeys);
            await redisClient.delAsync(FORM_SELECTOR_DELETE);
        }
    } catch (err) {
        winston.error('delFormsSelector err = ' + err.message);
    }
}

module.exports = {
    getFormsSelectorByFilter: getFormsSelectorByFilter,
    setFormsSelectorByFilter: setFormsSelectorByFilter,
    deleteCacheFormSelector: deleteCacheFormSelector,
    delFormsSelector: delFormsSelector,
};