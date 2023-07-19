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

async function getById(reportId) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("" +
        "SELECT * FROM reports WHERE id = ?", [reportId]);
    return results[0];
}

async function getReports(filter, options, whereParams) {

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

    var [results,] = await promisePool.query("SELECT count(id) as numRows FROM reports WHERE 1 = 1 AND deleted_date IS NULL " + conditions);
    var numRows = results[0].numRows;
    var offsetLimit = skip + ',' + limit;

    var select = "" +
        "SELECT id, game_name, started_date, url, type, status, employee_name, emCode, phone, age, branch, " +
        "utm_medium, utm_source, utm_campaign, utm_content, utm_channel, gift, created_date, updated_date " +
        "FROM reports ";

    var params = []

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

    select += " AND deleted_date IS NULL " + conditions;

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

async function createReport(report) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("INSERT INTO reports SET ?", report);
    return results.insertId;
}

async function updateReport(report) {
    const promisePool = mysqlConnection.promise();
    try {

        var mysql = mysqlConnection.format("" +
            "UPDATE " +
            "reports SET game_name = ?, started_date = ?, url = ?, " +
            "type = ?, status = ?, employee_name = ?, emCode = ?, phone = ?, age = ?, branch = ?, " +
            "utm_medium = ?, utm_source = ?, utm_campaign = ?, utm_content = ?, utm_channel = ?, gift = ?, " +
            "updated_date = NOW() " +
            "WHERE id = ?; ",
            [
                report.game_name, report.started_date, report.url,
                report.type, report.status, report.employee_name,
                report.emCode, report.phone, report.age, report.branch,
                report.utm_medium, report.utm_source, report.utm_campaign, report.utm_content,
                report.utm_channel, report.gift,
                report.id
            ]
        );
        var [results,] = await promisePool.query(mysql);
        return results.changedRows;
    } catch (err) {
        throw new Error(err);
    }
}

async function deleteReport(reportId) {
    const promisePool = mysqlConnection.promise();

    try {
        var mysql = mysqlConnection.format("" +
            "UPDATE reports SET updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
            [reportId]);
        var [results,] = await promisePool.query(mysql);
        return results;
    } catch (err) {
        throw new Error(err);
    }
}

async function exportReports() {
    const promisePool = mysqlConnection.promise();

    var sql = "SELECT id, game_name, started_date, url, type, status, employee_name, emCode, phone, " +
        "age, branch, utm_medium, utm_source, utm_campaign, utm_content, utm_channel, gift " +
        "FROM reports WHERE 1 = 1 AND deleted_date IS NULL;";
    var [results,] = await promisePool.query(sql);
    return results;
}

module.exports = {
    getById: getById,
    getReports: getReports,
    createReport: createReport,
    updateReport: updateReport,
    deleteReport: deleteReport,
    exportReports: exportReports,
}