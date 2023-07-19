var winston = require("../logging/winston");
var redisClient = require("./redis").getRedis();

const ROLE_PERMISSION_KEY = "rolePermissions:";
const ROLE_PERMISSION_DELETE = "rolePermissions:delete";
const ROLE_PERMISSION_TTL = 864000; // second to day: 10 days

function rolePermissionsKeyByFilter(filter) {
	return ROLE_PERMISSION_KEY + filter;
}

async function getRolePermissionsByFilter(filter) {
	try {
		return await redisClient.getAsync(rolePermissionsKeyByFilter(filter));
	} catch (err) {
		winston.error("rolePermissionsKeyByFilter " + filter + " err = " + err);
		return null;
	}
}

async function setRolePermissionsByFilter(filter, roles) {
	try {
		await redisClient.set(
			rolePermissionsKeyByFilter(filter),
			roles,
			"EX",
			ROLE_PERMISSION_TTL
		);
		await redisClient.rpushAsync(
			ROLE_PERMISSION_DELETE,
			rolePermissionsKeyByFilter(filter)
		);
	} catch (err) {
		winston.error(
			"setRolesByFilter " + rolePermissionsKeyByFilter(filter) + " err = " + err
		);
	}
}

async function deleteCacheRolePermission(filter) {
	try {
		return await redisClient.del(rolePermissionsKeyByFilter(filter));
	} catch (err) {
		winston.error("deleteCacheRolePermission " + filter + " err = " + err);
	}
}

async function delRolePermissions() {
	try {
		let rolePermissionDeleteKeys = await redisClient.lrangeAsync(
			ROLE_PERMISSION_DELETE,
			0,
			-1
		);
		if (rolePermissionDeleteKeys.length > 0) {
			await redisClient.delAsync(rolePermissionDeleteKeys);
			await redisClient.delAsync(ROLE_PERMISSION_DELETE);
		}
	} catch (err) {
		winston.error("delRolePermissions err = " + err.message);
	}
}

module.exports = {
	getRolePermissionsByFilter: getRolePermissionsByFilter,
	setRolePermissionsByFilter: setRolePermissionsByFilter,
	deleteCacheRolePermission: deleteCacheRolePermission,
	delRolePermissions: delRolePermissions,
};
