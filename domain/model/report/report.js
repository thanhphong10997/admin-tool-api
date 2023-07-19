var game_name
var started_date;
var url;
var type;
var status;
var employee_name;
var emCode;
var phone;
var age;
var branch;
var utm_medium;
var utm_source;
var utm_campaign;
var utm_content;
var utm_channel;
var gift;

function Report(game_name, started_date, url, type, status, employee_name, emCode, phone, age, branch, utm_medium, utm_source, utm_campaign, utm_content, utm_channel, gift) {
    this.game_name = game_name;
    this.started_date = started_date;
    this.url = url;
    this.type = type;
    this.status = status;
    this.employee_name = employee_name;
    this.emCode = emCode;
    this.phone = phone;
    this.age = age;
    this.branch = branch;
    this.utm_medium = utm_medium;
    this.utm_source = utm_source;
    this.utm_campaign = utm_campaign;
    this.utm_content = utm_content;
    this.utm_channel = utm_channel;
    this.gift = gift;
}

module.exports = Report;