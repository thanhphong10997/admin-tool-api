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

async function getTemplate(filter, options, whereParams) {
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
		"SELECT count(id) as numRows FROM template WHERE 1 = 1 AND deletedAt IS NULL " +
			conditions
	);
	var numRows = results[0].numRows;
	var offsetLimit = skip + "," + limit;

	if (options.select == "" || !options.select) {
		var select =
			"" + "SELECT id, name, body, createdAt, updatedAt " + "FROM template ";
	} else {
		var select = "" + "SELECT " + options.select + " " + "FROM template ";
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

	select += " AND deletedAt IS NULL " + conditions;

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

async function createTemplate(template) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"INSERT INTO template SET ?",
		template
	);
	return results.insertId;
}

async function getById(id) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" + "SELECT * FROM template WHERE id = ?",
		[id]
	);
	return results[0];
}

async function updateTemplate(template) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysql = mysqlConnection.format(
			"" +
				"UPDATE " +
				"template SET name = ?, body = ?, " +
				"updatedAt = NOW() " +
				"WHERE id = ? ; ",
			[template.name, template.body, template.id]
		);
		var [results] = await promisePool.query(mysql);
		return results.changedRows;
	} catch (err) {
		throw new Error(err);
	}
}

async function deleteTemplate(templateId) {
	const promisePool = mysqlConnection.promise();

	try {
		var mysql = mysqlConnection.format(
			"" + "UPDATE template SET deletedAt = NOW() WHERE id = ? ",
			[templateId]
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

module.exports = {
	getTemplate: getTemplate,
	createTemplate: createTemplate,
	getById: getById,
	updateTemplate: updateTemplate,
	deleteTemplate: deleteTemplate,
};
