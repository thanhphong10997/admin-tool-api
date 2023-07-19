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

async function getAccountsTest(filter, options) {
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
		"SELECT count(id) as numRows FROM account_test WHERE 1 = 1 AND deleted_date IS NULL " +
			conditions
	);
	var numRows = results[0].numRows;
	var offsetLimit = skip + "," + limit;

	var select =
		"" +
		"SELECT id, phone, created_date, updated_date, updated_user_id " +
		"FROM account_test WHERE 1 = 1 AND deleted_date IS NULL " +
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

async function getById(accountTestId) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" + "SELECT * FROM account_test WHERE id = ?",
		[accountTestId]
	);
	return results[0];
}

async function createAccountTest(account_test) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"INSERT INTO account_test SET ?",
		account_test
	);
	return results.insertId;
}

async function updateAccountTest(account_test) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysql = mysqlConnection.format(
			"" +
				"UPDATE " +
				"account_test SET phone = ?, updated_user_id = ?, " +
				"updated_date = NOW() " +
				"WHERE id = ? ; ",
			[account_test.phone, account_test.updated_user_id, account_test.id]
		);
		var [results] = await promisePool.query(mysql);
		return results.changedRows;
	} catch (err) {
		throw new Error(err);
	}
}

async function deleteAccountTest(accountTestId, whereParams) {
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
				"UPDATE account_test SET updated_user_id = ?, deleted_user_id = ?, updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
			[params, params, accountTestId]
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

module.exports = {
	getById: getById,
	getAccountsTest: getAccountsTest,
	createAccountTest: createAccountTest,
	updateAccountTest: updateAccountTest,
	deleteAccountTest: deleteAccountTest,
};
