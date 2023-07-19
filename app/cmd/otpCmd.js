const { body, } = require('express-validator');

function validate() {
    return [
        body('name').notEmpty(),
        body('content').notEmpty(),
        body('created_user_id').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};