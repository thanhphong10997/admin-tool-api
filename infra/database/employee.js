const { id } = require('date-fns/locale');
const employee = require('../cache/employee');

var mysqlConnection = require('./mysql').getConnection();

function populateCondition(filter) {

    var conditions = " ";
    for (var key in filter) {
        var value = filter[key];
        if (typeof (value) === "object") {
            if (value.type === "string") {
                conditions = conditions + " AND " + value.field + " " + value.operator + " " + "'" + value.value + "'";
            } else {
                conditions = conditions + " AND " + value.field + " " + value.operator + " " + value.value;
            }
        } else if (typeof (value) === "string") {
            conditions = conditions + " AND " + key + " = " + "'" + value + "'";
        } else {
            conditions = conditions + " AND " + key + " = " + value;
        }
    }

    return conditions;
}

async function getEmployees(filter, options, whereParams) {

    var limit = options.limit ? options.limit : 10;
    var skip = 0, offset = 0, page = 1;

    if (options.offset) {
        offset = options.offset;
        skip = offset;
    } else if (options.page) {
        page = options.page;
        skip = (page - 1) * limit;
    }

    var conditions = populateCondition(filter);

    const promisePool = mysqlConnection.promise();

    var [results,] = await promisePool.query("SELECT count(id) as numRows FROM employees WHERE 1 = 1 AND deletedAt IS NULL " + conditions);
    var numRows = results[0].numRows;
    var offsetLimit = skip + ',' + limit;

    var select = "" +
        "SELECT id, teamOf, full_name, emCode " +
        "FROM employees ";

    var params = [];

    if (whereParams.length > 0) {
        select += " WHERE ";
        for (let key in whereParams) {
            if (key !== '0') {
                select += " AND ";
            }
            select += whereParams[key].field + " " + whereParams[key].condition;
            params.push(whereParams[key].value);
        }
    } else {
        select += "WHERE 1 = 1 ";
    }

    select += "AND deletedAt IS NULL " + conditions;

    if (options.orderBy) {
        select += " ORDER BY " + options.orderBy;
    }

    select += " LIMIT " + offsetLimit;


    [results,] = await promisePool.query(select, params);

    return {
        "list": results,
        "total": numRows,
        "limit": limit,
        "offset": offset
    };
}

async function importEmployees(employees) {
    const promisePool = mysqlConnection.promise();

    var sql = "INSERT INTO employees (id, teamOf, full_name, emCode) VALUES ";
    employees.forEach((item, index) => {
        sql += "(" + item.id + ", '" + item.teamOf + "', '" + item.full_name + "', " + item.emCode + ")";
        if (index == employees.length - 1) {
            sql += "";
        } else {
            sql += ", "
        }
    });
    sql += ";"

    var [results,] = await promisePool.query(sql);
    return results;
}

async function exportEmployees() {
    const promisePool = mysqlConnection.promise();

    var sql = "SELECT id, teamOf, full_name, emCode FROM employees WHERE 1 = 1 AND deletedAt IS NULL;";
    var [results,] = await promisePool.query(sql);
    return results;
}

module.exports = {
    getEmployees: getEmployees,
    importEmployees: importEmployees,
    exportEmployees: exportEmployees,
}