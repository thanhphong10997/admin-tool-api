const { body, } = require('express-validator');

function validate() {
    return [
        body('title').notEmpty(),
        body('columns').notEmpty(),
    ];
}

function validateValuesUpdate() {
    return [
        body('data').notEmpty(),
    ];
}

module.exports = {
    validate: validate,
    validateValuesUpdate: validateValuesUpdate,
};