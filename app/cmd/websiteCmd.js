const { body, } = require('express-validator');

function validate() {
    return [
        body('web_name').notEmpty(),
        body('position_save_form').notEmpty(),
        body('form_id').notEmpty(),
        body('game_id').notEmpty(),
        body('created_user_id').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};