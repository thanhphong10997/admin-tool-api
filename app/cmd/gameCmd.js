const { body, } = require('express-validator');

var gameStatus = require('../../domain/model/game/game_status');

function validate() {
    return [
        body('name').notEmpty(),
        body('url').notEmpty(),
        body('type').notEmpty(),
        body('department').notEmpty(),
        body('status').custom(function (value) {
            if (gameStatus[value] === undefined) {
                throw new Error('status invalid');
            }
            return true;
        }),
        body('created_user_id').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};