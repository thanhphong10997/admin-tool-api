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

async function getPermissions(filter, options, whereParams) {
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
		"SELECT count(id) as numRows FROM permissions WHERE 1 = 1 AND deleted_at IS NULL " +
			conditions
	);
	var numRows = results[0].numRows;
	var offsetLimit = skip + "," + limit;

	if (options.select == "" || !options.select) {
		var select =
			"" +
			"SELECT id, subject_name, action, created_at, updated_at " +
			"FROM permissions ";
	} else {
		var select = "" + "SELECT " + options.select + " " + "FROM permissions ";
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

async function getById(permissionId) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" + "SELECT * FROM permissions WHERE id = ? AND deleted_at IS NULL;",
		[permissionId]
	);
	if (results.length > 0) {
		return results[0];
	}
	return results;
}

async function createPermission(permissions) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"INSERT INTO permissions SET ?",
		permissions
	);
	return results.insertId;
}

async function updatePermission(permission) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysql = mysqlConnection.format(
			"" +
				"UPDATE permissions SET subject_name = ?, action = ?, " +
				"updated_at = NOW() " +
				"WHERE id = ? ; ",
			[permission.subject_name, permission.action, permission.id]
		);
		var [results] = await promisePool.query(mysql);
		return results.changedRows;
	} catch (err) {
		throw new Error(err);
	}
}

async function deletePermission(permissionId, whereParams) {
	const promisePool = mysqlConnection.promise();
	try {
		var params;
		if (whereParams.length > 0) {
			for (let key in whereParams) {
				if ((whereParams[key].field = "permission_id")) {
					params = whereParams[key].value;
				}
			}
		}
		var mysql = mysqlConnection.format(
			"" + "UPDATE permissions SET deleted_at = NOW() WHERE id = ? ",
			[permissionId]
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

module.exports = {
	getPermissions: getPermissions,
	getById: getById,
	createPermission: createPermission,
	updatePermission: updatePermission,
	deletePermission: deletePermission,
};
