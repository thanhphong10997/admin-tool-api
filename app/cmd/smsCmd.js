const { body } = require("express-validator");

function validate() {
	return [
		body("title").notEmpty(),
		body("content").notEmpty(),
		body("created_user_id").notEmpty(),
	];
}

module.exports = {
	validate: validate,
};
