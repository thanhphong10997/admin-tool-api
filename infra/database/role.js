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

async function getRoles(filter, options, whereParams) {
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
		"SELECT count(id) as numRows FROM roles WHERE 1 = 1 AND deleted_at IS NULL " +
			conditions
	);
	var numRows = results[0].numRows;
	var offsetLimit = skip + "," + limit;

	if (options.select == "" || !options.select) {
		var select =
			"" + "SELECT id, role_name, created_at, updated_at " + "FROM roles ";
	} else {
		var select = "" + "SELECT " + options.select + " " + "FROM roles ";
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

	select += " AND deleted_at IS NULL " + conditions;

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

async function getById(roleId) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" + "SELECT * FROM roles WHERE id = ? AND deleted_at IS NULL;",
		[roleId]
	);
	if (results.length > 0) {
		return results[0];
	}
	return results;
}

async function createRole(roles) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query("INSERT INTO roles SET ?", roles);
	return results.insertId;
}

async function updateRole(role) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysql = mysqlConnection.format(
			"" +
				"UPDATE roles SET role_name = ?, " +
				"updated_at = NOW() " +
				"WHERE id = ? ; ",
			[role.role_name, role.id]
		);
		var [results] = await promisePool.query(mysql);
		return results.changedRows;
	} catch (err) {
		throw new Error(err);
	}
}

async function deleteRole(roleId, whereParams) {
	const promisePool = mysqlConnection.promise();
	try {
		var params;
		if (whereParams.length > 0) {
			for (let key in whereParams) {
				if ((whereParams[key].field = "role_id")) {
					params = whereParams[key].value;
				}
			}
		}
		var mysql = mysqlConnection.format(
			"" + "UPDATE roles SET deleted_at = NOW() WHERE id = ? ",
			[roleId]
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

module.exports = {
	getRoles: getRoles,
	getById: getById,
	createRole: createRole,
	updateRole: updateRole,
	deleteRole: deleteRole,
};
