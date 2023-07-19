var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();
var Redlock = require('redlock');

var redlock = new Redlock([redisClient]);

redlock.on('clientError', function(err) {
    winston.error('A redis error has occurred: ' + err);
});

redlock.on('connect', function () {
    winston.info('Redis client connected');
});

function getRedLock() {
    return redlock;
}

module.exports = {
    getRedLock: getRedLock
};
