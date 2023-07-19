var game_id;
var form_id;
var priority;
var created_user_id;

function FormPriority(game_id, form_id, priority, created_user_id) {
    this.game_id = game_id;
    this.form_id = form_id;
    this.priority = priority;
    this.created_user_id = created_user_id;
}

module.exports = FormPriority;