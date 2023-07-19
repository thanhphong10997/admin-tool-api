var express = require('express');
var router = express.Router();

var formApi = require('../../../app/formApi');
var formCmd = require('../../../app/cmd/formCmd');
var formPriorityCmd = require('../../../app/cmd/formPriorityCmd');
var formSelectorCmd = require('../../../app/cmd/formSelectorCmd');
var utils = require('../utils/utils');

router.get('/forms', function (req, res) {
    formApi.getForms(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.get('/forms-name', function (req, res) {
    formApi.getFormsName(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.post('/forms', formCmd.validate(), utils.handleValidation, function (req, res) {
    formApi.createForm(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.put('/forms/:formId', function (req, res) {
    formApi.updateForm(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.delete('/forms/:formId', function (req, res) {
    formApi.deleteForm(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.get('/forms/:formId/forms-selector', function (req, res) {
    formApi.getFormSelectorByFormId(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.get('/forms-priority', function (req, res) {
    formApi.getFormsPriority(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.post('/forms-priority', formPriorityCmd.validate(), utils.handleValidation, function (req, res) {
    formApi.createFormPriority(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.put('/forms-priority/:formPriorityId', function (req, res) {
    formApi.updateFormPriority(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.delete('/forms-priority/:formPriorityId', function (req, res) {
    formApi.deleteFormPriority(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.get('/forms-selector', function (req, res) {
    formApi.getFormsSelector(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.post('/forms-selector', formSelectorCmd.validate(), utils.handleValidation, function (req, res) {
    formApi.createFormSelector(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.put('/forms-selector/:formSelectorId', function (req, res) {
    formApi.updateFormSelector(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

router.delete('/forms-selector/:formSelectorId', function (req, res) {
    formApi.deleteFormSelector(req)
        .then(function (rs) {
            res.json(rs);
        })
        .catch(function (reason) {
            res.status(500).json(reason);
        });
});

module.exports = router;