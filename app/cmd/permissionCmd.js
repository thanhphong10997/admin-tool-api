const { body } = require("express-validator");

function validate() {
	return [body("subject_name").notEmpty(), body("action").notEmpty()];
}

module.exports = {
	validate: validate,
};
