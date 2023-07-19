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

async function getAddress(filter, options) {

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

    var [results,] = await promisePool.query("SELECT count(id) as numRows FROM address WHERE 1 = 1 AND deleted_date IS NULL " + conditions);
    var numRows = results[0].numRows;
    var offsetLimit = skip + ',' + limit;

    var select = "" +
        "SELECT * " +
        "FROM address WHERE 1 = 1 AND deleted_date IS NULL " + conditions;

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

async function getById(addressId) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("" +
        "SELECT * FROM address WHERE id = ?", [addressId]);
    return results[0];
}

async function createAddress(address) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("INSERT INTO address SET ?", address);
    return results.insertId;
}

async function updateAddress(address) {
    const promisePool = mysqlConnection.promise();
    try {

        var mysql = mysqlConnection.format("" +
            "UPDATE " +
            "address SET name = ?, crm_id = ?, updated_user_id = ?, source = ?, " +
            "updated_date = NOW() " +
            "WHERE id = ? ; ",
            [
                address.name, address.crm_id, address.updated_user_id, address.source ,
                address.id
            ]
        );
        var [results,] = await promisePool.query(mysql);
        return results.changedRows;
    } catch (err) {
        throw new Error(err);
    }
}

async function deleteAddress(addressId, whereParams) {
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
            "UPDATE address SET updated_user_id = ?, deleted_user_id = ?, updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
            [params, params, addressId]);
        var [results,] = await promisePool.query(mysql);
        return results;
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    getAddress: getAddress,
    createAddress: createAddress,
    updateAddress: updateAddress,
    deleteAddress: deleteAddress,
    getById: getById,
}