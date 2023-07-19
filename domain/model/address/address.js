var name;
var crm_id;
var created_user_id;
var source;

function Address(name, crm_id, created_user_id,SOURCE) {
    this.name = name;
    this.crm_id = crm_id;
    this.created_user_id = created_user_id;
    this.source = source;
}

module.exports = Address;