var express = require("express");
var router = express.Router();

var rolePermissionCmd = require("../../../app/cmd/rolePermissionCmd");
var rolePermissionApi = require("../../../app/rolePermissionsApi");

var utils = require("../utils/utils");

router.get("/role/:roleId/permission", function (req, res) {
	rolePermissionApi
		.getRolePermissionById(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/role/:roleId/permission",
	rolePermissionCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		rolePermissionApi
			.addRolePermission(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

module.exports = router;
