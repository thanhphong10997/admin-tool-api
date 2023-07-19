const { body, } = require('express-validator');

function validate() {
    return [
        body('name').notEmpty(),
        body('crm_id').notEmpty(),
        body('created_user_id').notEmpty(),
        body('SOURCE').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};