var user_id;
var action;
var body;

function Log(user_id, action, body) {
    this.user_id = user_id;
    this.action = action;
    this.body = body;
}

module.exports = Log;