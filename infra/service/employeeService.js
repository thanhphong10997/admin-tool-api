var winston = require('../logging/winston');
var axios = require("axios");
var notificationService = require('./notification');

async function getEmployees() {

    var url = 'https://apicrm.ngocdunggroup.com/api/v1/MKT/GetUserOfTeam/328679fcc6e2e9a2cd9ce3ff40f5fefdd25d331313ae2ff29a8530da2cb940bd?teamOf=OFFLINE&unixtime=00';
    var errText = '';
    try {

        var response = await axios
            .get(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });

        return response.data.Items;

    } catch (err) {
        errText = 'getEmployees error url = ' + url + ' err = ' + err.message;
        notificationService.sendByTelegram(encodeURIComponent(errText));
        winston.error(errText);
        return [];
    }
}

module.exports = {
    getEmployees: getEmployees,
}