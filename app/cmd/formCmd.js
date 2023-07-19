const { body } = require("express-validator");

function validate() {
	return [
		body("form").notEmpty(),
		body("game_id").notEmpty(),
		body("created_user_id").notEmpty(),
	];
}

module.exports = {
	validate: validate,
};
