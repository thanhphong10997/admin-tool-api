const { body } = require("express-validator");

function validate() {
	return [body("role_name").notEmpty()];
}

module.exports = {
	validate: validate,
};
