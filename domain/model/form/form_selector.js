const safeStringify = require('fast-safe-stringify');

var form_id;
var game_id;
var input_selector;
var created_user_id;

function FormSelector(form_id, game_id, input_selector, created_user_id) {
    this.form_id = form_id;
    this.game_id = game_id;
    this.input_selector = safeStringify(input_selector);
    this.created_user_id = created_user_id;
}

module.exports = FormSelector;