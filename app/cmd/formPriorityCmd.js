const { body, } = require('express-validator');

function validate() {
    return [
        body('game_id').notEmpty(),
        body('form_id').notEmpty(),
        body('priority').notEmpty(),
        body('created_user_id').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};