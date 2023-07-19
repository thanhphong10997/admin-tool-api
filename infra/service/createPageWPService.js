var winston = require("../logging/winston");
var axios = require("axios");
var notificationService = require("./notification");
var htmlDecode = require("html-entities");

async function createPageWP(pageData) {
	var url = `https://dev.thammyvienngocdung.com/wp-json/create/template`;
	var errText = "";

	try {
		var response = await axios.post(url, {
			title: pageData.game_name,
			url: pageData.url,
			content: htmlDecode.decode(
				pageData.body.replace(/^<p>(.*)<\/p>/m, "$1"),
				{
					level: "html5",
				}
			),
		});
		return response.data;
	} catch (err) {
		errText = "createPageWP error url = " + url + " err = " + err.message;
		notificationService.sendByTelegram(encodeURIComponent(errText));
		winston.error(errText);
		return [];
	}
}

function htmlDecode(input) {
	var doc = new DOMParser().parseFromString(input, "text/html");
	return doc.documentElement.textContent;
}

module.exports = {
	createPageWP: createPageWP,
};
