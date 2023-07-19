const safeStringify = require("fast-safe-stringify");

var name;
var form;
var type;
var game_id;
var created_user_id;
var crm_info;

function Form(name, form, type, game_id, created_user_id, crm_info) {
	this.name = name;
	this.form = safeStringify(form);
	this.type = type;
	this.game_id = game_id;
	this.created_user_id = created_user_id;
	this.crm_info = safeStringify(crm_info);
}

module.exports = Form;
