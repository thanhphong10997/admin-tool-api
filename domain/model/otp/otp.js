var name;
var content;
var created_user_id;

function Otp(name, content, created_user_id) {
    this.name = name;
    this.content = content;
    this.created_user_id = created_user_id;
}

module.exports = Otp;