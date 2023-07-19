var mysqlConnection = require('./mysql').getConnection();

async function saveGoogleForm(google_form) {
    const promisePool = mysqlConnection.promise();
    var [results,] = await promisePool.query("INSERT INTO google_sheet SET ?", google_form);
    return results.insertId;
}

module.exports = {
    saveGoogleForm: saveGoogleForm,
}