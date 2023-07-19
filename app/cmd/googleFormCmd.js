const { body, } = require('express-validator');

function validate() {
    return [
        body('spread_sheet_id').notEmpty(),
        body('google_form_url').notEmpty(),
        body('columns').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};