var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const ADDRESS_KEY = 'address:';
const ADDRESS_DELETE = 'address:delete';
const ADDRESS_TLL = 864000; // second to day: 10 days

function addressKeyByFilter(filter) {
    return ADDRESS_KEY + filter;
}

async function getAddressByFilter(filter) {
    try {
        return await redisClient.getAsync(addressKeyByFilter(filter));
    } catch (err) {
        winston.error('getAddressByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setAddressByFilter(filter, address) {
    try {
        await redisClient.set(addressKeyByFilter(filter), address, 'EX', ADDRESS_TLL);
        await redisClient.rpushAsync(ADDRESS_DELETE, addressKeyByFilter(filter));
    } catch (err) {
        winston.error('setAddressByFilter ' + addressKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheAddress(filter) {
    try {
        return await redisClient.del(addressKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheAddress ' + filter + ' err = ' + err);
    }
}

async function delAddress() {
    try {
        let addressDeleteKeys = await redisClient.lrangeAsync(ADDRESS_DELETE, 0, -1);
        if (addressDeleteKeys.length > 0) {
            await redisClient.delAsync(addressDeleteKeys);
            await redisClient.delAsync(ADDRESS_DELETE);
        }
    } catch (err) {
        winston.error('delForms err = ' + err.message);
    }
}

module.exports = {
    getAddressByFilter: getAddressByFilter,
    setAddressByFilter: setAddressByFilter,
    deleteCacheAddress: deleteCacheAddress,
    delAddress: delAddress,
};