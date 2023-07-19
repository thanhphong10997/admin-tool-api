var notificationService = require("../service/notification");
var winston = require("../logging/winston");
var mysql = require("mysql2");

console.log(global.gConfig.mysql);
var connectionPool = mysql.createPool(global.gConfig.mysql);

connectionPool.on("connection", function (connection) {
	winston.info("DB Connection established url = " + global.gConfig.mysql.host);

	connection.on("error", function (err) {
		winston.error(
			"Mysql error url = " + global.gConfig.mysql.host + " error: " + err
		);
		notificationService.sendByTelegram(
			"Mysql error url = " + global.gConfig.mysql.host + " error: " + err
		);

		/*
		 * Connection to the MySQL server is usually lost due to either server restart,
		 * or a connection idle timeout (the wait_timeout server variable configures this)
		 */
		if (err.code === "PROTOCOL_CONNECTION_LOST") {
			handleDisconnect();
		}
	});
	connection.on("close", function (err) {
		winston.error(
			"Mysql close url = " + global.gConfig.mysql.host + " error: " + err
		);
	});
});

function handleDisconnect() {
	connectionPool = mysql.createPool(global.gConfig.mysql);
	connectionPool.on("connection", function (connection) {
		winston.info(
			"DB handleDisconnect established url = " + global.gConfig.mysql.host
		);

		connection.on("error", function (err) {
			winston.error(
				"Mysql handleDisconnect error url = " +
					global.gConfig.mysql.host +
					" error: " +
					err
			);
		});
		connection.on("close", function (err) {
			winston.error(
				"Mysql handleDisconnect close url = " +
					global.gConfig.mysql.host +
					" error: " +
					err
			);
		});
	});
}

function getConnection() {
	return connectionPool;
}

function testQuery() {
	connectionPool.getConnection(function (err, connection) {
		if (err) {
			var textErr =
				"Mysql " +
				JSON.stringify(global.gConfig.mysql) +
				" error: " +
				err.message;
			winston.error(textErr);
			notificationService.sendByTelegram(textErr);
			return;
		}

		connection.query("SELECT 1", function (error) {
			// When done with the connection, release it.
			connection.release();

			if (error) {
				winston.error(" testQuery error: " + error.message);
			}
		});
	});
}

module.exports = {
	testQuery: testQuery,
	getConnection: getConnection,
};
