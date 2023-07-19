const { body, } = require('express-validator');

function validate() {
    return [
        body('form_id').notEmpty(),
        body('game_id').notEmpty(),
        body('input_selector').notEmpty(),
        body('created_user_id').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};