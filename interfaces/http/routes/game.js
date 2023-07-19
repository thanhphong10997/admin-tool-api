var express = require("express");
var router = express.Router();

var gameApi = require("../../../app/gameApi");
var gameCmd = require("../../../app/cmd/gameCmd");
var websiteCmd = require("../../../app/cmd/websiteCmd");

var utils = require("../utils/utils");

router.post(
	"/games",
	gameCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		gameApi
			.createGame(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.get("/games", function (req, res) {
	gameApi
		.getGames(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/games-name", function (req, res) {
	gameApi
		.getNameGames(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.put("/games/:gameId", function (req, res) {
	gameApi
		.updateGame(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/games/:gameId", function (req, res) {
	gameApi
		.deleteGame(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/games/:gameId/state", function (req, res) {
	gameApi
		.getFormsByGameId(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/games/:gameId/create-page-wp", function (req, res) {
	gameApi
		.getPageInfoByGameId(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/games-list", function (req, res) {
	gameApi
		.getListGames(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.get("/websites", function (req, res) {
	gameApi
		.getWebsites(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.post(
	"/websites",
	websiteCmd.validate(),
	utils.handleValidation,
	function (req, res) {
		gameApi
			.createWebsite(req)
			.then(function (rs) {
				res.json(rs);
			})
			.catch(function (reason) {
				res.status(500).json(reason);
			});
	}
);

router.put("/websites/:websiteId", function (req, res) {
	gameApi
		.updateWebsite(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.delete("/websites/:websiteId", function (req, res) {
	gameApi
		.deleteWebsite(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

module.exports = router;
