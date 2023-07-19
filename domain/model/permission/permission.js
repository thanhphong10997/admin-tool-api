var subject_name;
var action;

function Permission(subject_name, action) {
	this.subject_name = subject_name;
	this.action = action;
}

module.exports = Permission;
