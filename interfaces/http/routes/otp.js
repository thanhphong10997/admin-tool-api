var express = require("express");
var router = express.Router();
const otpCodeApi = require("../../../app/otpCodeApi");

router.get('/opt/code', function (req, res) {
  otpCodeApi.getCode(req).then(function (rs) {
    res.json(rs);
  }).catch(function (err) {
    res.status(500).json(err);
  });
});

router.get('/opt/verify', function (req, res) {
  otpCodeApi.verifyCode(req).then(function (rs) {
    res.json(rs);
  }).catch(function (err) {
    res.status(500).json(err);
  });
});

module.exports = router;