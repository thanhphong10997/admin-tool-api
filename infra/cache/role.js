var winston = require("../logging/winston");
var redisClient = require("./redis").getRedis();

const ROLE_KEY = "roles:";
const ROLE_DELETE = "roles:delete";
const ROLE_TTL = 864000; // second to day: 10 days

function rolesKeyByFilter(filter) {
	return ROLE_KEY + filter;
}

async function getRolesByFilter(filter) {
	try {
		return await redisClient.getAsync(rolesKeyByFilter(filter));
	} catch (err) {
		winston.error("getRolesByFilter " + filter + " err = " + err);
		return null;
	}
}

async function setRolesByFilter(filter, roles) {
	try {
		await redisClient.set(rolesKeyByFilter(filter), roles, "EX", ROLE_TTL);
		await redisClient.rpushAsync(ROLE_DELETE, rolesKeyByFilter(filter));
	} catch (err) {
		winston.error(
			"setRolesByFilter " + rolesKeyByFilter(filter) + " err = " + err
		);
	}
}

async function deleteCacheRole(filter) {
	try {
		return await redisClient.del(rolesKeyByFilter(filter));
	} catch (err) {
		winston.error("deleteCacheRole " + filter + " err = " + err);
	}
}

async function delRoles() {
	try {
		let roleDeleteKeys = await redisClient.lrangeAsync(ROLE_DELETE, 0, -1);
		if (roleDeleteKeys.length > 0) {
			await redisClient.delAsync(roleDeleteKeys);
			await redisClient.delAsync(ROLE_DELETE);
		}
	} catch (err) {
		winston.error("delRoles err = " + err.message);
	}
}

module.exports = {
	getRolesByFilter: getRolesByFilter,
	setRolesByFilter: setRolesByFilter,
	deleteCacheRole: deleteCacheRole,
	delRoles: delRoles,
};
