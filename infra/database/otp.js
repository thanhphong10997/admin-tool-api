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

async function getOtp(filter, options) {

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

    var [results,] = await promisePool.query("SELECT count(id) as numRows FROM otp WHERE 1 = 1 AND deleted_at IS NULL " + conditions);
    var numRows = results[0].numRows;
    var offsetLimit = skip + ',' + limit;

    var select = "" +
        "SELECT id, name, content, created_at, updated_at, deleted_at, created_user_id, updated_user_id, delete_user_id " +
        "FROM otp WHERE 1 = 1 AND deleted_at IS NULL " + conditions;

    if (options.orderBy) {
        select += " ORDER BY " + options.orderBy;
    }

    select += " LIMIT " + offsetLimit;

    [results,] = await promisePool.query(select);

    return {
        "list": results,
        "total": numRows,
        "limit": limit,
        "offset": offset
    };
}

async function getById(otpId) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("" +
        "SELECT * FROM otp WHERE id = ?", [otpId]);
    return results[0];
}

async function createOtp(otp) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("INSERT INTO otp SET ?", otp);
    return results.insertId;
}

async function updateOtp(otp) {
    const promisePool = mysqlConnection.promise();
    try {
        var mysql = mysqlConnection.format("" +
            "UPDATE " +
            "otp SET name = ?, content = ?, updated_user_id = ?, " +
            "updated_at = NOW() " +
            "WHERE id = ? ; ",
            [
                otp.name, otp.content, otp.updated_user_id,
                otp.id
            ]
        );
        var [results,] = await promisePool.query(mysql);
        return results.changedRows;
    } catch (err) {
        throw new Error(err);
    }
}

async function deleteOtp(otpId, whereParams) {
    const promisePool = mysqlConnection.promise();
    try {
        var params;
        if (whereParams.length > 0) {
            for (let key in whereParams) {
                if (whereParams[key].field = "user_id") {
                    params = whereParams[key].value;
                }
            }
        }
        var mysql = mysqlConnection.format("" +
            "DELETE from  otp WHERE id = ? ",otpId);
        var [results,] = await promisePool.query(mysql);
        return results;
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    getOtp: getOtp,
    getById:getById,
    createOtp:createOtp,
    updateOtp:updateOtp,
    deleteOtp: deleteOtp,
}