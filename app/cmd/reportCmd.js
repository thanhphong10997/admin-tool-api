const { body, } = require('express-validator');

var reportStatus = require('../../domain/model/report/report_status');

function validate() {
    return [
        body('game_name').notEmpty(),
        body('started_date').notEmpty(),
        body('url').notEmpty(),
        body('type').notEmpty(),
        body('status').custom(function (value) {
            if (reportStatus[value] === undefined) {
                throw new Error('status invalid');
            }
            return true;
        }),
        body('employee_name').notEmpty(),
        body('emCode').notEmpty(),
        body('utm_medium').notEmpty(),
        body('utm_source').notEmpty(),
        body('utm_campaign').notEmpty(),
        body('utm_content').notEmpty(),
        body('utm_channel').notEmpty(),
        body('gift').notEmpty(),
    ];
}

module.exports = {
    validate: validate
};