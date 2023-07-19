const safeStringify = require('fast-safe-stringify');

var title;
var spread_sheet_id;
var url;
var google_form_url;
var columns;

function GoogleForm(game_id, title, spread_sheet_id, google_form_url, url, columns) {
    this.game_id = game_id;
    this.title = title;
    this.spread_sheet_id = spread_sheet_id;
    this.url = url;
    this.google_form_url = google_form_url;
    this.columns = safeStringify(columns);
}

module.exports = GoogleForm;