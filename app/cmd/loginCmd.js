const { body, } = require('express-validator');

function validate() {
    return [
        body('username').notEmpty(),
        body('password').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};