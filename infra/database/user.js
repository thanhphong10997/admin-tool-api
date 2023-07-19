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

async function getById(userId) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("" +
        "SELECT * FROM users WHERE id = ?", [userId]);
    return results[0];
}

async function createUser(users) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("INSERT INTO users SET ?", users);
    return results.insertId;
}

async function updateUser(user) {
    const promisePool = mysqlConnection.promise();
    try {
        var mysql = mysqlConnection.format("" +
            "UPDATE users SET username = ?, password = ?, full_name = ? WHERE id = ? ; ",
            [
                user.username, user.password,
                user.full_name, user.id
            ]
        );
        var [results,] = await promisePool.query(mysql);
        return results.changedRows;
    } catch (err) {
        throw new Error(err);
    }
}

async function getUsers(filter, options, whereParams) {

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

    var [results,] = await promisePool.query("SELECT count(id) as numRows FROM users WHERE 1 = 1 AND deletedAt IS NULL " + conditions);
    var numRows = results[0].numRows;
    var offsetLimit = skip + ',' + limit;

    if (options.select == "" || !options.select) {
        var select = "" +
            "SELECT id, username, password, full_name, createdAt, updatedAt " +
            "FROM users ";
    } else {
        var select = "" +
            "SELECT " + options.select + " " +
            "FROM users ";
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

    select += " AND deletedAt IS NULL " + conditions;

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

async function deleteUser(userId, whereParams){
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
            "DELETE from  users WHERE id = ? ",userId);
        var [results,] = await promisePool.query(mysql);
        return results;
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    getById: getById,
    createUser: createUser,
    updateUser: updateUser,
    getUsers: getUsers,
    deleteUser: deleteUser,
}