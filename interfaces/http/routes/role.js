var express = require("express");
var router = express.Router();

var roleCmd = require("../../../app/cmd/roleCmd");
var roleApi = require("../../../app/roleApi");

var utils = require("../utils/utils");

router.get("/roles", function (req, res) {
	roleApi
		.getRoles(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/roles/:roleId", function (req, res) {
	roleApi
		.getRoleById(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/roles",
	roleCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		roleApi
			.createRole(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.put("/roles/:roleId", function (req, res) {
	roleApi
		.updateRole(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/roles/:roleId", function (req, res) {
	roleApi
		.deleteRole(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

module.exports = router;
