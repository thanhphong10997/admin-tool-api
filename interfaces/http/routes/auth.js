var express = require('express');
var router = express.Router();

var authApi = require('../../../app/authApi');
var userCmd = require('../../../app/cmd/userCmd');
var logCmd = require('../../../app/cmd/logCmd');
var loginCmd = require('../../../app/cmd/loginCmd');
var accountTestCmd = require('../../../app/cmd/accountTestCmd');

var utils = require('../utils/utils');

router.post('/users', userCmd.validate(), utils.handleValidation, function (req, res) {
    authApi.createUser(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.delete('/users/:userId', function(req, res){
    authApi.deleteUser(req)
    .then(function (rs) {
        res.json(rs);
    })
    .catch(function (reason) {
        res.status(500).json(reason);
    });
})

router.put('/users/:userId', function (req, res) {
    authApi.updateUser(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});
router.get('/users', function (req, res) {
    authApi.getUsers(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});
router.get('/users/:userId', function (req, res) {
    authApi.getUsersById(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.get('/logs', function (req, res) {
    authApi.getLogs(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.post('/logs', logCmd.validate(), utils.handleValidation, function (req, res) {
    authApi.createLog(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.get('/logs-api', function (req, res) {
    authApi.getLogsApi(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.post('/check-login', loginCmd.validate(), utils.handleValidation, function (req, res) {
    authApi.checkLogin(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.get('/accounts-test', function (req, res) {
    authApi.getAccountsTest(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.post('/accounts-test', accountTestCmd.validate(), utils.handleValidation, function (req, res) {
    authApi.createAccountTest(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.put('/accounts-test/:accountTestId', function (req, res) {
    authApi.updateAccountTest(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.delete('/accounts-test/:accountTestId', function (req, res) {
    authApi.deleteAccountTest(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

module.exports = router;