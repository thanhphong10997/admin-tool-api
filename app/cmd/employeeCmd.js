const { body, } = require('express-validator');

function validate() {
    return [
        body('teamOf').notEmpty(),
        body('full_name').notEmpty(),
        body('emCode').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};