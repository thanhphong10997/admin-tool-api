var express = require("express");
var router = express.Router();

var permissionCmd = require("../../../app/cmd/permissionCmd");
var permissionApi = require("../../../app/permissionApi");

var utils = require("../utils/utils");

router.get("/permissions", function (req, res) {
	permissionApi
		.getPermissions(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/permissions/:permissionId", function (req, res) {
	permissionApi
		.getPermissionById(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/permissions",
	permissionCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		permissionApi
			.createPermission(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.put("/permissions/:permissionId", function (req, res) {
	permissionApi
		.updatePermission(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/permissions/:permissionId", function (req, res) {
	permissionApi
		.deletePermission(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

module.exports = router;
