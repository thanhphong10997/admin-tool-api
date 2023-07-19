const { body } = require("express-validator");

function validate() {
	return [body("permission_id").notEmpty()];
}

module.exports = {
	validate: validate,
};
