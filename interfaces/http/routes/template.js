var express = require("express");
var router = express.Router();

var templateApi = require("../../../app/templateApi");

router.get("/template", function (req, res) {
  templateApi
    .getTemplate(req)
    .then(function (rs) {
      res.json(rs);
    })
    .catch(function (reason) {
      res.status(500).json(reason);
    });
});

router.post("/template", function (req, res) {
  templateApi
    .createTemplate(req)
    .then(function (rs) {
      res.json(rs);
    })
    .catch(function (reason) {
      res.status(500).json(reason);
    });
});

router.get("/template/:id", function (req, res) {
	templateApi
		.getTemplateById(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});

router.put("/template/:id", function (req, res) {
  templateApi
    .updateTemplate(req)
    .then(function (rs) {
      res.json(rs);
    })
    .catch(function (reason) {
      res.status(500).json(reason);
    });
});

router.delete("/template/:id", function (req, res) {
	templateApi
		.deleteTemplate(req)
		.then(function (rs) {
			res.json(rs);
		})
		.catch(function (reason) {
			res.status(500).json(reason);
		});
});
module.exports = router;