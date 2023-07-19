var mysqlConnection = require("./mysql").getConnection();

async function getById(rolePermissionId) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" + "SELECT * FROM role_permissions WHERE id = ? AND deleted_at IS NULL;",
		[rolePermissionId]
	);
	if (results.length > 0) {
		return results[0];
	}
	return results;
}

async function addRecord(rolePermissions, roleId) {
	const promisePool = mysqlConnection.promise();
	let insertStr = "";
	for (let i = 0; i < JSON.parse(rolePermissions.permission_id).length; i++) {
		insertStr += `INSERT INTO role_permissions (role_id, permission_id) VALUES (${roleId},${
			JSON.parse(rolePermissions.permission_id)[i]
		}); `;
	}
	var [results] = await promisePool.query(insertStr, [rolePermissions]);
	// console.log(results);
	return results.insertId;
}

async function deleteRecord(roleId) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" +
			"DELETE FROM role_permissions WHERE role_id = ? AND deleted_at IS NULL; ",
		[roleId]
	);
	return results;
}

async function getPermissionIds(roleId) {
	const promisePool = mysqlConnection.promise();
	var getDataByIdMySql = mysqlConnection.format(
		"" + "SELECT permission_id FROM role_permissions WHERE role_id = ? ;",
		[roleId]
	);
	var [permissionIds] = await promisePool.query(getDataByIdMySql);
	return [permissionIds][0];
}

async function getPermissionInfoByRoleId(roleId) {
	const promisePool = mysqlConnection.promise();
	var getDataByIdMySql = mysqlConnection.format(
		"" +
			"SELECT permission_id, permissions.subject_name, permissions.action FROM role_permissions " +
			"LEFT JOIN permissions ON role_permissions.permission_id = permissions.id " +
			"WHERE role_id = ? ;",
		[roleId]
	);
	var [permissionIds] = await promisePool.query(getDataByIdMySql);
	return [permissionIds][0];
}

module.exports = {
	getById: getById,
	getPermissionIds: getPermissionIds,
	getPermissionInfoByRoleId: getPermissionInfoByRoleId,
	addRecord: addRecord,
	deleteRecord: deleteRecord,
};
