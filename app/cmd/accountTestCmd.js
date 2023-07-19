const { body } = require("express-validator");

function validate() {
	return [body("phone").notEmpty()];
}

module.exports = {
	validate: validate,
};
