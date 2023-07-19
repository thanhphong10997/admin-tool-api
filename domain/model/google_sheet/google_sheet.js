const safeStringify = require('fast-safe-stringify');

var title;
var game_id;
var spread_sheet_id;
var url;
var google_form_url;
var columns;

function GoogleSheet(title, spread_sheet_id, url, columns) {
    this.title = title;
    this.spread_sheet_id = spread_sheet_id;
    this.url = url;
    this.google_form_url = google_form_url;
    this.columns = safeStringify(columns);
}

module.exports = GoogleSheet;