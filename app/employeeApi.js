var winston = require('../infra/logging/winston');
var utils = require('../interfaces/http/utils/utils');

var employeeMysql = require('../infra/database/employee');

var safeStringify = require('fast-safe-stringify');
var _ = require('lodash');

var employeeRedis = require('../infra/cache/employee');
var employeeService = require('../infra/service/employeeService');

async function getEmployees(req) {
    var queryString = req.query;
    var response = utils.initObject();

    try {

        var filter = {};
        var options = { offset: 0, limit: 10 };
        var whereParams = [];
        var cacheKey = "all";

        for (var key in queryString) {
            var value = queryString[key];
            cacheKey = cacheKey + ":" + value;

            if (key === "limit" || key === "offset") {
                options[key] = parseInt(value);
                continue;
            } else {
                whereParams.push({
                    "field": key,
                    "condition": "= ?",
                    "value": queryString[key]
                });
            }

            if (key === "from_date") {
                filter[key] = { field: "DATE(created_date)", operator: ">=", value: value, type: "string" };
                continue;
            }

            if (key === "to_date") {
                filter[key] = { field: "DATE(created_date)", operator: "<=", value: value, type: "string" };
                continue;
            }

            filter[key] = value;
        }

        response['data'] = await getEmployeesInternal(cacheKey, options, filter, whereParams);
        return response;

    } catch (err) {
        winston.error('getEmployees err = ' + err);
        response['status'] = 0;
        response['message'] = err.message;
        return response;
    }
}

async function getEmployeesInternal(cacheKey, options, filter, whereParams) {
    let results = await employeeRedis.getEmployeeByFilter(cacheKey);

    if (results) {
        return JSON.parse(results);
    }

    results = await employeeMysql.getEmployees(filter, options, whereParams);

    if (results.total == 0) {
        results = await employeeService.getEmployees();
    }

    if (results) {
        await employeeRedis.setEmployeeByFilter(cacheKey, safeStringify(results));
    }

    return results;
}



module.exports = {
    getEmployees: getEmployees,
}