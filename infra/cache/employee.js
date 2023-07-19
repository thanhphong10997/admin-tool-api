var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const EMPLOYEE_KEY = 'employee:';
const EMPLOYEE_DELETE = 'employee:delete';
const EMPLOYEE_TLL = 864000; // second to day: 10 days

function employeeKeyByFilter(filter) {
    return EMPLOYEE_KEY + filter;
}

async function getEmployeeByFilter(filter) {
    try {
        return await redisClient.getAsync(employeeKeyByFilter(filter));
    } catch (err) {
        winston.error('getEmployeeByFilter ' + filter + ' err = ' + err);
        return null;
    }
}

async function setEmployeeByFilter(filter, employee) {
    try {
        await redisClient.set(employeeKeyByFilter(filter), employee, 'EX', EMPLOYEE_TLL);
        await redisClient.rpushAsync(EMPLOYEE_DELETE, employeeKeyByFilter(filter));
    } catch (err) {
        winston.error('setEmployeeByFilter ' + employeeKeyByFilter(filter) + ' err = ' + err);
    }
}

async function deleteCacheEmployee(filter) {
    try {
        return await redisClient.del(employeeKeyByFilter(filter));
    } catch (err) {
        winston.error('deleteCacheEmployee ' + filter + ' err = ' + err);
    }
}

async function delEmployee() {
    try {
        let employeeDeleteKeys = await redisClient.lrangeAsync(EMPLOYEE_DELETE, 0, -1);
        if (employeeDeleteKeys.length > 0) {
            await redisClient.delAsync(employeeDeleteKeys);
            await redisClient.delAsync(EMPLOYEE_DELETE);
        }
    } catch (err) {
        winston.error('delForms err = ' + err.message);
    }
}

module.exports = {
    getEmployeeByFilter: getEmployeeByFilter,
    setEmployeeByFilter: setEmployeeByFilter,
    deleteCacheEmployee: deleteCacheEmployee,
    delEmployee: delEmployee,
};