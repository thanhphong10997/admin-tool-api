var title;
var content;
var created_user_id;

function SMS(title, content, created_user_id) {
	this.title = title;
	this.content = content;
	this.created_user_id = created_user_id;
}

module.exports = SMS;
