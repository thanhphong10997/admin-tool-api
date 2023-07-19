var notificationService = require('../service/notification');
var winston = require('../logging/winston');
var bluebird = require('bluebird');
var redis = require('redis');
bluebird.promisifyAll(redis);


var redisUrl = global.gConfig.cache['redis']['url'];
var client = redis.createClient({
    url: redisUrl,
    prefix: global.gConfig.cache['redis']['prefix'],
    /*retry_strategy: function(options) {
        if (options.error && options.error.code === "ECONNREFUSED") {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            notificationService.sendByTelegram('Redis Something went wrong ' + redisUrl + ' err = The server refused the connection');
            return new Error("The server refused the connection");
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            notificationService.sendByTelegram('Redis Something went wrong ' + redisUrl + ' err = Retry time exhausted');
            return new Error("Retry time exhausted");
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    },*/
    db: global.gConfig.cache['redis']['database']
});

client.on('connect', function () {
    winston.info('Redis client connected to ' + redisUrl);
});

client.on('error', function (err) {
    notificationService.sendByTelegram('Redis Something went wrong ' + redisUrl + ' err = ' + err.message);
    winston.error('Redis Something went wrong ' + redisUrl + ' err = ' + err);
});

function getRedis() {
    return client;
}

async function rateLimitByKey(key, numberLimit, timeExpiredInSecond) {
    const lua = `
    if redis.call('EXISTS', KEYS[1]) == 0 
    then 
      redis.call('SETEX', KEYS[1], ARGV[2], 0) 
    end
    redis.call('INCR', KEYS[1])
    if tonumber(redis.call('GET', KEYS[1])) <= tonumber(ARGV[1])
    then return true
    else return false
    end`;

    return client.evalAsync(lua, 1, key, numberLimit, timeExpiredInSecond, function (err, replies) {
        if (err) {
            winston.error('rateLimitByKey err = ' + err);
            return;
        }

        return replies;
    });
}

module.exports = {
    rateLimitByKey: rateLimitByKey,
    getRedis: getRedis
};
