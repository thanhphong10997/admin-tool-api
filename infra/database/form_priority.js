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

async function getById(formPriorityId) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("" +
        "SELECT * FROM form_priority WHERE id = ?", [formPriorityId]);
    return results[0];
}

async function getFormsPriority(filter, options, whereParams) {

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

    var [results,] = await promisePool.query("SELECT count(id) as numRows FROM form_priority WHERE 1 = 1 AND deleted_date IS NULL " + conditions);
    var numRows = results[0].numRows;
    var offsetLimit = skip + ',' + limit;

    if (options.select == "" || !options.select) {
        var select = "" +
            "SELECT id, game_id, form_id, priority, updated_date, created_user_id, updated_user_id " +
            "FROM form_priority ";
    } else {
        var select = "" +
            "SELECT " + options.select + " " +
            "FROM form_priority ";
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

async function createFormPriority(form_priority) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("INSERT INTO form_priority SET ?", form_priority);
    return results.insertId;
}

async function updateFormPriority(form_priority) {
    const promisePool = mysqlConnection.promise();
    try {

        var mysql = mysqlConnection.format("" +
            "UPDATE " +
            "form_priority SET game_id = ?, form_id = ?, priority = ?, updated_user_id = ?, " +
            "updated_date = NOW() " +
            "WHERE id = ?; ",
            [
                form_priority.game_id, form_priority.form_id, form_priority.priority, form_priority.updated_user_id,
                form_priority.id
            ]
        );
        var [results,] = await promisePool.query(mysql);
        return results.changedRows;
    } catch (err) {
        throw new Error(err);
    }
}

async function deleteFormPriority(formPriorityId, whereParams) {
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
            "UPDATE form_priority SET updated_user_id = ?, deleted_user_id = ?, updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
            [params, params, formPriorityId]);
        var [results,] = await promisePool.query(mysql);
        return results;
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    getById: getById,
    getFormsPriority: getFormsPriority,
    createFormPriority: createFormPriority,
    updateFormPriority: updateFormPriority,
    deleteFormPriority: deleteFormPriority,
}