var mysqlConnection = require("./mysql").getConnection();

function populateCondition(filter) {
	var conditions = " ";
	for (var key in filter) {
		var value = filter[key];
		if (typeof value === "object") {
			if (value.type === "string") {
				conditions =
					conditions +
					" AND " +
					value.field +
					" " +
					value.operator +
					" " +
					"'" +
					value.value +
					"'";
			} else {
				conditions =
					conditions +
					" AND " +
					value.field +
					" " +
					value.operator +
					" " +
					value.value;
			}
		} else if (typeof value === "string") {
			conditions = conditions + " AND " + key + " = " + "'" + value + "'";
		} else {
			conditions = conditions + " AND " + key + " = " + value;
		}
	}

	return conditions;
}

async function getById(gameId) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query(
		"" + "SELECT * FROM games WHERE id = ?",
		[gameId]
	);
	return results[0];
}

async function getGames(filter, options, whereParams) {
	var limit = options.limit ? options.limit : 10;
	var skip = 0,
		offset = 0,
		page = 1;

	if (options.offset) {
		offset = options.offset;
		skip = offset;
	} else if (options.page) {
		page = options.page;
		skip = (page - 1) * limit;
	}

	var conditions = populateCondition(filter);

	const promisePool = mysqlConnection.promise();

	var [results] = await promisePool.query(
		"SELECT count(id) as numRows FROM games WHERE 1 = 1 AND deleted_date IS NULL " +
			conditions
	);
	var numRows = results[0].numRows;
	var offsetLimit = skip + "," + limit;

	if (options.select == "" || !options.select) {
		var select =
			"" +
			"SELECT id, name, google_sheet, created_date, started_date, ended_date, url, type, department, status, updated_date, created_user_id, updated_user_id, check_staff_code, id_template, images " +
			"FROM games ";
	} else {
		var select = "" + "SELECT " + options.select + " " + "FROM games ";
	}

	var params = [];

	if (whereParams.length > 0) {
		select += " WHERE ";
		for (let key in whereParams) {
			if (key !== "0") {
				select += " AND ";
			}
			select += whereParams[key].field + " " + whereParams[key].condition;
			params.push(whereParams[key].value);
		}
	} else {
		select += "WHERE 1 = 1 ";
	}

	select += " AND deleted_date IS NULL " + conditions;

	if (options.orderBy) {
		select += " ORDER BY " + options.orderBy;
	}

	select += " LIMIT " + offsetLimit;

	[results] = await promisePool.query(select, params);
	
	return {
		list: results,
		total: numRows,
		limit: limit,
		offset: offset,
	};
}

async function createGame(game) {
	const promisePool = mysqlConnection.promise();
	var [results] = await promisePool.query("INSERT INTO games SET ?", game);
	return results.insertId;
}

async function updateGame(game) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysql = mysqlConnection.format(
			"" +
				"UPDATE " +
				"games SET name = ?, started_date = ?, ended_date = ?, " +
				"google_sheet = ?, url = ?, type = ?, department = ?, status = ?, updated_user_id = ?, id_template = ?, check_staff_code = ?,images = ?, " +
				"updated_date = NOW() " +
				"WHERE id = ?; ",
			[
				game.name,
				game.started_date,
				game.ended_date,
				game.google_sheet,
				game.url,
				game.type,
				game.department,
				game.status,
				game.updated_user_id,
				game.id_template,
				game.check_staff_code,
				game.images,
				game.id,
			]
		);
		var [results] = await promisePool.query(mysql);
		return results.changedRows;
	} catch (err) {
		throw new Error(err);
	}
}

async function deleteGame(gameId, whereParams) {
	const promisePool = mysqlConnection.promise();

	try {
		var params;
		if (whereParams.length > 0) {
			for (let key in whereParams) {
				if ((whereParams[key].field = "user_id")) {
					params = whereParams[key].value;
				}
			}
		}

		var mysql = mysqlConnection.format(
			"" +
				"UPDATE games SET updated_user_id = ?, deleted_user_id = ?, updated_date = NOW(), deleted_date = NOW() WHERE id = ? ",
			[params, params, gameId]
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

async function getFormsByGameId(gameId) {
	const promisePool = mysqlConnection.promise();

	try {
		var mysqlGetGame = mysqlConnection.format(
			" " +
				"SELECT games.id, games.uuid, games.name, games.started_date, games.ended_date, games.url, games.type, games.status, games.check_staff_code, forms.id as forms_id, forms.form, forms.crm_info, forms.type as form_type, form_selector.id as form_selector_id, form_selector.input_selector, google_sheet.title, google_sheet.spread_sheet_id, google_sheet.url as google_sheet_url, google_sheet.google_form_url, google_sheet.columns, google_sheet.created_date, google_sheet.updated_date " +
				"FROM games " +
				"LEFT JOIN forms ON games.id = forms.game_id " +
				"LEFT JOIN form_selector ON forms.id = form_selector.form_id " +
				"LEFT JOIN google_sheet ON games.id = google_sheet.game_id " +
				"WHERE uuid = ? OR games.id = ? ",
			[gameId, gameId]
		);

		var [gameResult] = await promisePool.query(mysqlGetGame);

		// var formResults = gameResult.map((form) => {
		// 	return {
		// 				forms_id: form.forms_id,
		// 				form: form.form,
		// 				crm_info: form.crm_info,
		// 				form_type: form.form_type,
		// 				form_selector_id: form.form_selector_id,
		// 				input_selector: form.input_selector
		// 	}
		// })

		var gameStateResult = [],
			index = {};
		gameResult.forEach((item) => {
			index[item.id] = {
				id: item.id,
				uuid: item.uuid,
				name: item.name,
				started_date: item.started_date,
				ended_date: item.ended_date,
				url: item.url,
				type: item.type,
				status: item.status,
				check_staff_code: item.check_staff_code,
				google_sheet: {
					title: item.title,
					spread_sheet_id: item.spread_sheet_id,
					google_sheet_url: item.google_sheet_url,
					google_form_url: item.google_form_url,
					columns: item.columns,
					created_date: item.created_date,
					updated_date: item.updated_date,
				},
				forms: gameResult.map((form) => {
					return {
						forms_id: form.forms_id,
						form: form.form,
						crm_info: form.crm_info,
						form_type: form.form_type,
						form_selector_id: form.form_selector_id,
						input_selector: form.input_selector,
					};
				}),
			};
			gameStateResult.push(index[item.id]);
		});

		// formsResult.forEach((item) => {
		// 	gameStateResult[0].forms.push(item);
		// });

		return gameStateResult[0];
	} catch (err) {
		throw new Error(err);
	}
}

async function getTemplateByGameId(gameId) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysqlGetTemplate = mysqlConnection.format(
			"" +
				"SELECT games.id, games.name as game_name, games.url, template.id, template.body " +
				"FROM games " +
				"LEFT JOIN template ON games.id_template = template.id " +
				"WHERE games.id = ? ",
			[gameId]
		);
		// console.log(mysqlGetTemplate);
		var [templateResult] = await promisePool.query(mysqlGetTemplate);
		// console.log(otpResult);
		return templateResult;
	} catch (err) {
		throw new Error(err);
	}
}

async function getOtpById(otpId) {
	const promisePool = mysqlConnection.promise();
	try {
		var mysqlGetOtp = mysqlConnection.format(
			"" +
				"SELECT otp.id, otp.name, otp.content, otp.created_at, otp.updated_at, otp.deleted_at, otp.created_user_id " +
				"FROM otp " +
				"WHERE otp.id = ? ",
			[otpId]
		);

		var [otpResult] = await promisePool.query(mysqlGetOtp);
		// console.log(otpResult);
		return otpResult;
	} catch (err) {
		throw new Error(err);
	}
}

async function getListGames(filter) {
	var conditions = populateCondition(filter);
	const promisePool = mysqlConnection.promise();

	try {
		var mysql = mysqlConnection.format(
			"" +
				"SELECT id, uuid, name, created_date, started_date, ended_date, url, type, department, status, updated_date " +
				"FROM games WHERE 1 = 1 AND deleted_date IS NULL " +
				conditions
		);
		var [results] = await promisePool.query(mysql);
		return results;
	} catch (err) {
		throw new Error(err);
	}
}

module.exports = {
	getById: getById,
	getGames: getGames,
	createGame: createGame,
	updateGame: updateGame,
	deleteGame: deleteGame,
	getFormsByGameId: getFormsByGameId,
	getTemplateByGameId: getTemplateByGameId,
	getOtpById: getOtpById,
	getListGames: getListGames,
};
