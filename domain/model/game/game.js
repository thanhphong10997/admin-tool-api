var name;
var check_staff_code;
var started_date;
var ended_date;
var url;
var google_sheet;
var type;
var department;
var status;
var created_user_id;
var id_template;
var images;

function Game(
  name,
  google_sheet,
  check_staff_code,
  started_date,
  ended_date,
  url,
  type,
  department,
  status,
  created_user_id,
  uuid,
  id_template,
  images
) {
  this.name = name;
  this.google_sheet = google_sheet;
  this.check_staff_code = check_staff_code;
  this.started_date = started_date;
  this.ended_date = ended_date;
  this.url = url;
  this.type = type;
  this.department = department;
  this.status = status;
  this.created_user_id = created_user_id;
  this.uuid = uuid;
  this.id_template = id_template;
  this.images = images;
}

module.exports = Game;
