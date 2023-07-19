var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const GAME_KEY = 'games:';
const GAME_DELETE = 'games:delete';
const GAME_TTL = 864000; // second to day: 10 days

function gamesKeyByFilter(filter) {
    return GAME_KEY + filter;
}

async function getGamesByFilter(filter) {
    try {
        return await redisClient.getAsync(gamesKeyByFilter(filter));
    } catch (err) {
        winston.error('getGamesByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setGamesByFilter(filter, games) {
    try {
        await redisClient.set(gamesKeyByFilter(filter), games, 'EX', GAME_TTL);
        await redisClient.rpushAsync(GAME_DELETE, gamesKeyByFilter(filter));
    } catch (err) {
        winston.error('setGamesByFilter ' + gamesKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheGame(filter) {
    try {
        return await redisClient.del(gamesKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheGames ' + filter + ' err = ' + err);
    }
}

async function delGames() {
    try {
        let gameDeleteKeys = await redisClient.lrangeAsync(GAME_DELETE, 0, -1);
        if (gameDeleteKeys.length > 0) {
            await redisClient.delAsync(gameDeleteKeys);
            await redisClient.delAsync(GAME_DELETE);
        }
    } catch (err) {
        winston.error('delGames err = ' + err.message);
    }
}

module.exports = {
    getGamesByFilter: getGamesByFilter,
    setGamesByFilter: setGamesByFilter,
    deleteCacheGame: deleteCacheGame,
    delGames: delGames,
};
