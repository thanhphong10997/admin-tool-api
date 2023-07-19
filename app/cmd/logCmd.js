const { body, } = require('express-validator');

function validate() {
    return [
        body('user_id').notEmpty(),
        body('action').notEmpty(),
        body('body').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};