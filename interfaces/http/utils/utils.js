const { body, validationResult } = require("express-validator/src/index");

function handleValidation(req, res, next) {
	const errors = validationResult(req);
	if (errors.isEmpty()) {
		return next();
	}

	const extractedErrors = [];
	errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

	var response = initObject();

	response["status"] = 0;
	response["message"] = extractedErrors;

	return res.status(200).json(response);
}

function formatPhone(phone) {
	if (!phone) {
		return null;
	}
	phone = phone.replace(/\s/g, ""); // remove all whitespace
	if (phone.substr(0, 2) !== "84") {
		phone = "84" + phone.substr(1, phone.length);
	}
	return phone;
}

function initObject() {
	return {
		status: 1,
		message: "OK",
		data: {},
	};
}

function initArray() {
	return {
		status: 1,
		message: "OK",
		data: [],
	};
}

module.exports = {
	handleValidation: handleValidation,
	initObject: initObject,
	initArray: initArray,
	formatPhone: formatPhone,
};
