var winston = require("../logging/winston");
var redisClient = require("./redis").getRedis();

const PERMISSION_KEY = "permissions:";
const PERMISSION_DELETE = "permissions:delete";
const PERMISSION_TTL = 864000; // second to day: 10 days

function permissionsKeyByFilter(filter) {
	return PERMISSION_KEY + filter;
}

async function getPermissionsByFilter(filter) {
	try {
		return await redisClient.getAsync(permissionsKeyByFilter(filter));
	} catch (err) {
		winston.error("getPermissionsByFilter " + filter + " err = " + err);
		return null;
	}
}

async function setPermissionsByFilter(filter, permissions) {
	try {
		await redisClient.set(
			permissionsKeyByFilter(filter),
			permissions,
			"EX",
			PERMISSION_TTL
		);
		await redisClient.rpushAsync(
			PERMISSION_DELETE,
			permissionsKeyByFilter(filter)
		);
	} catch (err) {
		winston.error(
			"setPermissionsByFilter " +
				permissionsKeyByFilter(filter) +
				" err = " +
				err
		);
	}
}

async function deleteCachePermission(filter) {
	try {
		return await redisClient.del(permissionsKeyByFilter(filter));
	} catch (err) {
		winston.error("deleteCachePermission " + filter + " err = " + err);
	}
}

async function delPermissions() {
	try {
		let permissionDeleteKeys = await redisClient.lrangeAsync(
			PERMISSION_DELETE,
			0,
			-1
		);
		if (permissionDeleteKeys.length > 0) {
			await redisClient.delAsync(permissionDeleteKeys);
			await redisClient.delAsync(PERMISSION_DELETE);
		}
	} catch (err) {
		winston.error("delPermissions err = " + err.message);
	}
}

module.exports = {
	getPermissionsByFilter: getPermissionsByFilter,
	setPermissionsByFilter: setPermissionsByFilter,
	deleteCachePermission: deleteCachePermission,
	delPermissions: delPermissions,
};
