var username;
var password;
var fullname;
var department;
var email;

function User(username, password, full_name, department, email) {
    this.username = username;
    this.password = password;
    this.full_name = full_name;
    // this.department = department;
    // this.email = email;
}

module.exports = User;