var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const USER_KEY = 'users:';
const USER_DELETE = 'users:delete';
const USER_TTL = 864000; // second to day: 10 days

function usersKeyByFilter(filter) {
    return USER_KEY + filter;
}

async function getUsersByFilter(filter) {
    try {
        return await redisClient.getAsync(usersKeyByFilter(filter));
    } catch (err) {
        winston.error('getUsersByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setUsersByFilter(filter, users) {
    try {
        await redisClient.set(usersKeyByFilter(filter), users, 'EX', USER_TTL);
        await redisClient.rpushAsync(USER_DELETE, usersKeyByFilter(filter));
    } catch (err) {
        winston.error('setUsersByFilter ' + usersKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheUser(filter) {
    try {
        return await redisClient.del(usersKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheUser ' + filter + ' err = ' + err);
    }
}

async function delUsers() {
    try {
        let userDeleteKeys = await redisClient.lrangeAsync(USER_DELETE, 0, -1);
        if (userDeleteKeys.length > 0) {
            await redisClient.delAsync(userDeleteKeys);
            await redisClient.delAsync(USER_DELETE);
        }
    } catch (err) {
        winston.error('delUsers err = ' + err.message);
    }
}

module.exports = {
    getUsersByFilter: getUsersByFilter,
    setUsersByFilter: setUsersByFilter,
    deleteCacheUser: deleteCacheUser,
    delUsers: delUsers,
};
