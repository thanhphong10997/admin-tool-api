var winston = require("../logging/winston");
var axios = require("axios");
var notificationService = require("./notification");

async function getLogsApi(options, filter) {
  var url = "https://thammyvienngocdung.com/wp-json/log/search";
  var errText = "";
  var fromDate, toDate, phone,name_api, campaign_id;
  try {
    for (var key in filter) {
      var value = filter[key];
      if (key === "from_date") {
        fromDate = value.value;
      }

      if (key === "to_date") {
        toDate = value.value;
      }

      if (key === "phone") {
        phone = value;
      }

      if (key === "name_api") {
        name_api = value;
      }

      if (key === "campaign_id") {
        campaign_id = value;
      }
    }
    var response = await axios
        .get(url, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000,
            params: {
                offset: options.offset,
                limit: options.limit,
                from_date: fromDate,
                to_date: toDate,
                phone: phone,
                name_api: name_api,
                campaign_id: campaign_id,
            }
        });
    return {
      "list": response.data.result,
      "total": response.data.rowcount,
    };
  } catch (err) {
    errText = "getLogsApi error url = " + url + " err = " + err.message;
    notificationService.sendByTelegram(encodeURIComponent(errText));
    winston.error(errText);
    return [];
  }
}

module.exports = {
  getLogsApi: getLogsApi,
}