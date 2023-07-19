const { google } = require('googleapis');

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

async function getById(googleSheetId) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("" +
        "SELECT * FROM google_sheet WHERE id = ?", [googleSheetId]);
    return results[0];
}

async function getGoogleSheets(filter, options, whereParams) {

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

    var [results,] = await promisePool.query("SELECT count(id) as numRows FROM google_sheet WHERE 1 = 1 AND google_sheet.deleted_date IS NULL " + conditions);
    var numRows = results[0].numRows;
    var offsetLimit = skip + ',' + limit;

    if (options.select == "" || !options.select) {
        var select = "" +
            "SELECT google_sheet.id, google_sheet.game_id, games.name as game_name, google_sheet.title, google_sheet.spread_sheet_id, google_sheet.url, google_form_url, google_sheet.columns, google_sheet.created_date, google_sheet.updated_date " +
            "FROM google_sheet " +
            "LEFT JOIN games ON games.id = google_sheet.game_id "
            ;
    } else {
        var select = "" +
            "SELECT " + options.select + " " +
            "FROM google_sheet ";
    }

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

    select += " AND google_sheet.deleted_date IS NULL " + conditions;

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

async function createGoogleSheets(google_sheet) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("INSERT INTO google_sheet SET ?", google_sheet);
    return results.insertId;
}

async function updateGoogleSheets(google_sheet) {
    const promisePool = mysqlConnection.promise();
    try {

        var mysql = mysqlConnection.format("" +
            "UPDATE " +
            "google_sheet SET title = ?, game_id = ?, spread_sheet_id = ?, " +
            "url = ?, google_form_url = ?, columns = ?, " +
            "updated_date = NOW() " +
            "WHERE id = ? ; ",
            [
                google_sheet.title,
                google_sheet.game_id,
                google_sheet.spread_sheet_id,
                google_sheet.url,
                google_sheet.google_form_url,
                google_sheet.columns,
                google_sheet.id
            ]
        );
        var [results,] = await promisePool.query(mysql);
        return results.changedRows;
    } catch (err) {
        throw new Error(err);
    }
}

async function deleteGoogleSheets(googleSheetId) {
    const promisePool = mysqlConnection.promise();

    try {
        var mysql = mysqlConnection.format("" +
            "UPDATE google_sheet SET updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
            [googleSheetId]);
        var [results,] = await promisePool.query(mysql);
        return results;
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    getGoogleSheets: getGoogleSheets,
    createGoogleSheets: createGoogleSheets,
    updateGoogleSheets: updateGoogleSheets,
    deleteGoogleSheets: deleteGoogleSheets,
    getById: getById,
}