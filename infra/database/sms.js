var mysqlConnection = require("./mysql").getConnection();

function populateCondition(filter) {
	var conditions = " ";
	for (var key in filter) {
		var value = filter[key];
		if (typeof value === "object") {
			if (value.type === "string") {
				conditions =
					conditions +
					" AND " +
					value.field +
					" " +
					value.operator +
					" " +
					"'" +
					value.value +
					"'";
			} else {
				conditions =
					conditions +
					" AND " +
					value.field +
					" " +
					value.operator +
					" " +
					value.value;
			}
		} else if (typeof value === "string") {
			conditions = conditions + " AND " + key + " = " + "'" + value + "'";
		} else {
			conditions = conditions + " AND " + key + " = " + value;
		}
	}

	return conditions;
}

async function getSMS(filter, options) {
	var limit = options.limit ? options.limit : 10;
	var skip = 0,
		offset = 0,
		page = 1;

	if (options.offset) {
		offset = options.offset;
		skip = offset;
	} else if (options.page) {
		page = options.page;
		skip = (page - 1) * limit;
	}

	var conditions = populateCondition(filter);

	const promisePool = mysqlConnection.promise();

	var [results] = await promisePool.query(
		"SELECT count(id) as numRows FROM sms WHERE 1 = 1 AND deleted_date IS NULL " +
			conditions
	);
	var numRows = results[0].numRows;
	var offsetLimit = skip + "," + limit;

	var select =
		"" +
		"SELECT id, title, content, created_date, updated_date, created_user_id, updated_user_id " +
		"FROM sms WHERE 1 = 1 AND deleted_date IS NULL " +
		conditions;

	if (options.orderBy) {
		select += " ORDER BY " + options.orderBy;
	}

	select += " LIMIT " + offsetLimit;

	[results] = await promisePool.query(select);

	return {
		list: results,
		total: numRows,
		limit: limit,
		offset: offset,
	};
}

async function getById(smsId) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" + "SELECT * FROM sms WHERE id = ?",
		[smsId]
	);
	return results[0];
}

async function createSMS(sms) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query("INSERT INTO sms SET ?", sms);
	return results.insertId;
}

async function updateSMS(sms) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysql = mysqlConnection.format(
			"" +
				"UPDATE " +
				"sms SET title = ?, content = ?, updated_user_id = ?, " +
				"updated_date = NOW() " +
				"WHERE id = ? ; ",
			[sms.title, sms.content, sms.updated_user_id, sms.id]
		);
		var [results] = await promisePool.query(mysql);
		return results.changedRows;
	} catch (err) {
		throw new Error(err);
	}
}

async function deleteSMS(smsId, whereParams) {
	const promisePool = mysqlConnection.promise();
	try {
		var params;
		if (whereParams.length > 0) {
			for (let key in whereParams) {
				if ((whereParams[key].field = "user_id")) {
					params = whereParams[key].value;
				}
			}
		}

		var mysql = mysqlConnection.format(
			"" +
				"UPDATE sms SET updated_user_id = ?, deleted_user_id = ?, updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
			[params, params, smsId]
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

module.exports = {
	getSMS: getSMS,
	createSMS: createSMS,
	updateSMS: updateSMS,
	deleteSMS: deleteSMS,
	getById: getById,
};
