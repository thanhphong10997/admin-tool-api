var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var helmet = require("helmet");

require("./config/config.js");
require("./infra/cache/redis");
require("./infra/database/mysql");
var utilsApi = require("./app/utilsApi");

var winston = require("./infra/logging/winston");

var gameRouter = require("./interfaces/http/routes/game");
var formRouter = require("./interfaces/http/routes/form");
var employeeRouter = require("./interfaces/http/routes/employee");
var utilsRouter = require("./interfaces/http/routes/utils");
var authRouter = require("./interfaces/http/routes/auth");
var permissionRouter = require("./interfaces/http/routes/permission");
var otpRouter = require("./interfaces/http/routes/otp");
var templateRouter = require("./interfaces/http/routes/template");
var role = require("./interfaces/http/routes/role");
var rolePermission = require("./interfaces/http/routes/role_permissions");

var app = express();
var router = express.Router();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

router.use(gameRouter);
router.use(formRouter);
router.use(employeeRouter);
router.use(utilsRouter);
router.use(authRouter);
router.use(permissionRouter);
router.use(otpRouter);
router.use(templateRouter);
router.use(role);
router.use(rolePermission);
app.use(router);

// 404
app.use(function (req, res, next) {
	return res.status(404).send({ message: req.url + " Not found." });
});

// 500 - Any server error
app.use(function (err, req, res, next) {
	return res.status(500).send({ error: err });
});

utilsApi.createCronJob();

var nodePort = global.gConfig.node_port;
var server = app.listen(nodePort, function () {
	winston.info(
		"Express server listening on port " +
			nodePort +
			" env=" +
			process.env.NODE_ENV
	);
});
module.exports = server;
