var winston = require('winston');
require('winston-daily-rotate-file');
var path = require('path');

var options = {
    info: {
        level: 'info',
        filename: path.join(__dirname, '/../../logs/info.log'),
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    error: {
        level: 'error',
        filename: path.join(__dirname, '/../../logs/error.log'),
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    console: {
        level: 'error',
        handleExceptions: true,
        json: false,
        colorize: true
    },
    rotateFile : {
        filename: path.join(__dirname, '/../../logs/%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '14d'
    }
};

var logger = new winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.DailyRotateFile(options.rotateFile),
        new winston.transports.File(options.error),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false // do not exit on handled exceptions
});

module.exports = logger;