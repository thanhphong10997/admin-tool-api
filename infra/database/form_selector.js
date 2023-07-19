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

async function getById(formSelectorId) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("" +
        "SELECT * FROM form_selector WHERE id = ?", [formSelectorId]);
    return results[0];
}

async function getFormsSelector(filter, options, whereParams) {

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

    var [results,] = await promisePool.query("SELECT count(id) as numRows FROM form_selector WHERE 1 = 1 AND deleted_date IS NULL " + conditions);
    var numRows = results[0].numRows;
    var offsetLimit = skip + ',' + limit;

    if (options.select == "" || !options.select) {
        var select = "" +
            "SELECT id, form_id, game_id, input_selector, updated_date, created_user_id, updated_user_id " +
            "FROM form_selector ";
    } else {
        var select = "" +
            "SELECT " + options.select + " " +
            "FROM form_selector ";
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

async function createFormSelector(form_selector) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("INSERT INTO form_selector SET ?", form_selector);
    return results.insertId;
}

async function updateFormSelector(form_selector) {
    const promisePool = mysqlConnection.promise();
    try {

        var mysql = mysqlConnection.format("" +
            "UPDATE " +
            "form_selector SET form_id = ?, game_id = ?, input_selector = ?, updated_user_id = ?, " +
            "updated_date = NOW() " +
            "WHERE id = ?; ",
            [
                form_selector.form_id, form_selector.game_id, form_selector.input_selector, form_selector.updated_user_id,
                form_selector.id
            ]
        );
        var [results,] = await promisePool.query(mysql);
        return results.changedRows;
    } catch (err) {
        throw new Error(err);
    }
}

async function deleteFormSelector(formSelectorId, whereParams) {
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
            "UPDATE form_selector SET updated_user_id = ?, deleted_user_id = ?, updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
            [params, params, formSelectorId]);
        var [results,] = await promisePool.query(mysql);
        return results;
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    getById: getById,
    getFormsSelector: getFormsSelector,
    createFormSelector: createFormSelector,
    updateFormSelector: updateFormSelector,
    deleteFormSelector: deleteFormSelector,
}