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

async function getForms(filter, options, whereParams) {
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
		"SELECT count(id) as numRows FROM forms WHERE 1 = 1 AND deleted_date IS NULL " +
			conditions
	);
	var numRows = results[0].numRows;
	var offsetLimit = skip + "," + limit;

	if (options.select == "" || !options.select) {
		var select =
			"" +
			"SELECT id, name, form, crm_info, type, created_date, updated_date, game_id, " +
			"(SELECT games.name FROM games WHERE game_id = games.id) as game_name, created_user_id, updated_user_id " +
			"FROM forms ";
	} else {
		var select = "" + "SELECT " + options.select + " " + "FROM forms ";
	}

	var params = [];

	if (whereParams.length > 0) {
		select += " WHERE ";
		for (let key in whereParams) {
			if (key !== "0") {
				select += " AND ";
			}
			select += whereParams[key].field + " " + whereParams[key].condition;
			params.push(whereParams[key].value);
		}
	} else {
		select += "WHERE 1 = 1 ";
	}

	select += " AND deleted_date IS NULL " + conditions;

	if (options.orderBy) {
		select += " ORDER BY " + options.orderBy;
	}

	select += " LIMIT " + offsetLimit;

	[results] = await promisePool.query(select, params);

	return {
		list: results,
		total: numRows,
		limit: limit,
		offset: offset,
	};
}

async function getById(formId) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" + "SELECT * FROM forms WHERE id = ?",
		[formId]
	);
	return results[0];
}

async function createForm(form) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query("INSERT INTO forms SET ?", form);
	return results.insertId;
}

async function updateForm(form) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysql = mysqlConnection.format(
			"" +
				"UPDATE " +
				"forms SET name = ?, form = ?, " +
				"type =?, game_id = ?, updated_user_id = ?, crm_info = ?, " +
				"updated_date = NOW() " +
				"WHERE id = ? ; ",
			[
				form.name,
				form.form,
				form.type,
				form.game_id,
				form.updated_user_id,
				form.crm_info,
				form.id,
			]
		);
		var [results] = await promisePool.query(mysql);
		return results.changedRows;
	} catch (err) {
		throw new Error(err);
	}
}

async function deleteForm(formId, whereParams) {
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
				"UPDATE forms SET updated_user_id = ?, deleted_user_id = ?, updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
			[params, params, formId]
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

async function getFormSelectorByFormId(formId) {
	const promisePool = mysqlConnection.promise();

	try {
		var mysql = mysqlConnection.format(
			"" +
				"SELECT id, form_id, game_id, input_selector, updated_date " +
				"FROM form_selector WHERE form_id = ? AND deleted_date IS NULL ",
			[formId]
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

module.exports = {
	getForms: getForms,
	createForm: createForm,
	updateForm: updateForm,
	deleteForm: deleteForm,
	getById: getById,
	getFormSelectorByFormId: getFormSelectorByFormId,
};
