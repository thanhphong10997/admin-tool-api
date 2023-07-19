var express = require('express');
var router = express.Router();

var employeeApi = require('../../../app/employeeApi');

router.get('/employees', function (req, res) {
    employeeApi.getEmployees(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

module.exports = router;