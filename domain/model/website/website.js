var web_name;
var position_save_form;
var form_id;
var game_id;
var created_user_id;

function Website(web_name, position_save_form, form_id, game_id, created_user_id) {
    this.web_name = web_name;
    this.position_save_form = position_save_form;
    this.form_id = form_id;
    this.game_id = game_id;
    this.created_user_id = created_user_id;
}

module.exports = Website;