var winston = require('../logging/winston');
var axios = require("axios");
var safeStringify = require('fast-safe-stringify');

function sendByTelegram(content) {

    var tmpRecipients = {
        "token": global.gConfig.notification.telegram.token,
        "chatId": global.gConfig.notification.telegram.chatId
    };

    var jsonBody = safeStringify({
        content: process.env.NODE_ENV + ':shop-service:' + content,
        recipients: tmpRecipients,
        platform: "API",
        type: "telegram"
    });

    var url = global.gConfig.notification.url + '/notifications' +
        '?product=' + global.gConfig.notification.product +
        '&token=' + global.gConfig.notification.token;

    /*return axios
        .post(url, jsonBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        })
        .then(function (response) {

        })
        .catch(function (error) {
            winston.error('sendByTelegram url = ' + url + ' err = ' + error);
            return error.message;
        });*/
}

module.exports = {
    sendByTelegram: sendByTelegram
};