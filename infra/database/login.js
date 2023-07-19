var mysqlConnection = require('./mysql').getConnection();

async function getUser(login) {
    const promisePool = mysqlConnection.promise();

    try {
        var mysql = mysqlConnection.format("" +
            "SELECT id, username, password " +
            "FROM users WHERE 1 = 1 AND username = ? ",
            [login.username]);
        var [results,] = await promisePool.query(mysql);
        return results;
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = {
    getUser: getUser,
}