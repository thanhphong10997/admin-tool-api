var schedule = require("node-schedule");
var sha256 = require("js-sha256").sha256;
var _ = require("lodash");

var utils = require("../interfaces/http/utils/utils");
var mysql = require("../infra/database/mysql");
var winston = require("../infra/logging/winston");

var gameApi = require("./gameApi")

var safeStringify = require("fast-safe-stringify");
var notificationService = require("../infra/service/notification");
var saltSHA256 = require("salt-sha256");
var { uid } = require("uid");
var fs = require("fs");

var employeeMysql = require("../infra/database/employee");
var reportMysql = require("../infra/database/report");
var addressMysql = require("../infra/database/address");
var googleSheetMysql = require("../infra/database/google_sheet");
var googleFormMysql = require("../infra/database/google_form");

var addressRedis = require("../infra/cache/address");
var gameRedis = require("../infra/cache/game");
var reportRedis = require("../infra/cache/report");
var googleSheetRedis = require("../infra/cache/google_sheet");

var Address = require("../domain/model/address/address");
var SMS = require("../domain/model/sms/sms");
var Report = require("../domain/model/report/report");
var GoogleSheet = require("../domain/model/google_sheet/google_sheet");
var GoogleForm = require("../domain/model/google_form/google_form");

var googleSheetService = require("../infra/service/googleSheetService/googleSheetService");

const readXlsxFile = require("read-excel-file/node");
const excelJS = require("exceljs");

const { ro } = require("date-fns/locale");
const { response } = require("express");

function createCronJob() {
  schedule.scheduleJob("*/1 * * * *", async function () {
    // every 1 minute
    mysql.testQuery();
  });
}

async function getSignature(req) {
  var response = utils.initObject();
  var product = req.headers["x-product"];
  var infoProduct = global.gConfig.authen[product];
  var signatureServer = infoProduct.privateKey;

  var params = req.body;
  Object.keys(params).forEach(function (key) {
    signatureServer += params[key];
  });

  console.log(signatureServer);

  response["data"]["signature"] = sha256(signatureServer);

  return response;
}

async function uploadEmployees(req) {
  var response = utils.initObject();
  try {
    if (req.file == undefined) {
      return (response["message"] = "Please upload an excel file!");
    }
    var employees = [];
    let path = "./test/uploads/" + req.file.filename;
    await readXlsxFile(path).then((rows) => {
      // skip header
      rows.shift();

      rows.forEach((row) => {
        var employee = {
          id: row[0],
          teamOf: row[1],
          full_name: row[2],
          emCode: row[3],
        };
        employees.push(employee);
      });
    });
    await employeeMysql.importEmployees(employees);
    response["message"] = "Import file successfull";
    return response;
  } catch (err) {
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function downloadEmployees(req) {
  var response = utils.initObject();
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("Employees"); // New Worksheet
  const path = "./test/downloads"; // Path to download excel
  // Column for data in excel. key must match data key
  worksheet.columns = [
    { header: "id", key: "id", width: 11 },
    { header: "teamOf", key: "teamOf", width: 20 },
    { header: "full_name", key: "full_name", width: 50 },
    { header: "emCode", key: "emCode", width: 11 },
  ];
  // Looping through User data
  let counter = 1;
  var employees = await employeeMysql.exportEmployees();
  employees.forEach((employee) => {
    employee.id = counter;
    worksheet.addRow(employee); // Add data in worksheet
    counter++;
  });
  // Making first line in excel bold
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  try {
    const data = await workbook.xlsx.writeFile(`${path}/employees.xlsx`);
    response["message"] = "Export file successfull";
    return response;
  } catch (err) {
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function downloadReports(req) {
  var response = utils.initObject();
  const workbook = new excelJS.Workbook(); // Create a new workbook
  const worksheet = workbook.addWorksheet("Reports"); // New Worksheet
  const path = "./test/downloads"; // Path to download excel
  // Column for data in excel. key must match data key
  worksheet.columns = [
    { header: "id", key: "id", width: 11 },
    { header: "game_name", key: "game_name", width: 50 },
    { header: "started_date", key: "started_date", width: 50 },
    { header: "url", key: "url", width: 100 },
    { header: "type", key: "type", width: 20 },
    { header: "status", key: "status", width: 20 },
    { header: "employee_name", key: "employee_name", width: 50 },
    { header: "emCode", key: "emCode", width: 11 },
    { header: "phone", key: "phone", width: 15 },
    { header: "age", key: "age", width: 10 },
    { header: "branch", key: "branch", width: 50 },
    { header: "utm_medium", key: "utm_medium", width: 11 },
    { header: "utm_source", key: "utm_source", width: 11 },
    { header: "utm_campaign", key: "utm_campaign", width: 11 },
    { header: "utm_content", key: "utm_content", width: 11 },
    { header: "utm_channel", key: "utm_channel", width: 11 },
    { header: "gift", key: "gift", width: 100 },
  ];
  // Looping through User data
  let counter = 1;
  var reports = await reportMysql.exportReports();
  reports.forEach((report) => {
    report.id = counter;
    worksheet.addRow(report); // Add data in worksheet
    counter++;
  });
  // Making first line in excel bold
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });
  try {
    const data = await workbook.xlsx.writeFile(`${path}/reports.xlsx`);
    response["message"] = "Export file successfull";
    return response;
  } catch (err) {
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function downloadGames(req) {
  var response = utils.initObject();
  var gameId = req.params.gameId;

  try {
    var gameIdSha256 = saltSHA256(gameId, global.gConfig.secretKey);
    fs.writeFile(
      `${global.gConfig.path_upload}/${gameIdSha256}.txt`,
      `<script src="<?= get_stylesheet_directory_uri(); ?>/assets/js/lib.js?v=<?= rand() ?>&id=${gameIdSha256}"></script>`,
      function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("Download file successfull");
      }
    );

    var fileData = fs.readFileSync(
      `${global.gConfig.path_upload}/${gameIdSha256}.txt`,
      "utf-8"
    );

    console.log(fileData);

    response["message"] = "Download file successfull";
    response["data"] = fileData;
    return response;
  } catch (err) {
    winston.error("Download File err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getAddress(req) {
  var queryString = req.query;
  var response = utils.initObject();
  try {
    var filter = {};
    var options = { offset: 0, limit: 10 };

    var cacheKey = "all";

    for (var key in queryString) {
      var value = queryString[key];
      cacheKey = cacheKey + ":" + value;

      if (key === "limit" || key === "offset") {
        options[key] = parseInt(value);
        continue;
      }

      if (key === "from_date") {
        filter[key] = {
          field: "DATE(created_date)",
          operator: ">=",
          value: value,
          type: "string",
        };
        continue;
      }

      if (key === "to_date") {
        filter[key] = {
          field: "DATE(created_date)",
          operator: "<=",
          value: value,
          type: "string",
        };
        continue;
      }

      filter[key] = value;
    }

    response["data"] = await getAddressInternal(cacheKey, options, filter);
    return response;
  } catch (err) {
    winston.error("getAddress err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getAddressInternal(cacheKey, options, filter) {
  let results = await addressRedis.getAddressByFilter(cacheKey);
  if (results) {
    return JSON.parse(results);
  }
  results = await addressMysql.getAddress(filter, options);

  if (results) {
    await addressRedis.setAddressByFilter(cacheKey, safeStringify(results));
  }
  return results;
}

async function createAddress(req) {
  var response = utils.initObject();
  var body = req.body;
  try {
    var address = new Address(
      body.name,
      body.crm_id,
      body.created_user_id,
      body.source
    );
    address.id = await addressMysql.createAddress(address);
    await addressRedis.delAddress();

    response["data"] = address;
    return response;
  } catch (err) {
    var textErr =
      " createAddress body = " + safeStringify(body) + " error: " + err.message;
    winston.error(textErr);
    notificationService.sendByTelegram(textErr);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function updateAddress(req) {
  var response = utils.initObject();
  var addressId = req.params.addressId;
  var body = req.body;
  try {
    var address = await addressMysql.getById(addressId);
    if (!address) {
      throw new Error("address not exists " + addressId);
    }

    if (body.name) {
      address.name = body.name;
    }

    if (body.crm_id) {
      address.crm_id = body.crm_id;
    }

    if (body.updated_user_id) {
      address.updated_user_id = body.updated_user_id;
    }

		if(body.source){
			address.source = body.source;
		}

    await addressMysql.updateAddress(address);
    await addressRedis.delAddress();

    response["data"] = address;

    return response;
  } catch (err) {
    winston.error("updateAddress addressId = " + addressId + "  err = " + err);
    notificationService.sendByTelegram(
      " updateAddress = " + addressId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function deleteAddress(req) {
  var response = utils.initObject();
  var addressId = req.params.addressId;
  var queryString = req.query;

  try {
    var whereParams = [];

    for (var key in queryString) {
      whereParams.push({
        field: key,
        condition: "= ?",
        value: queryString[key],
      });
    }

    await addressMysql.deleteAddress(addressId, whereParams);
    await addressRedis.delAddress();

    response["data"] = addressId;
    response["message"] = "Delete Address successfull !!";
    return response;
  } catch (err) {
    winston.error("deleteAddress err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getAddressById(req) {
  var response = utils.initObject();
  var addressId = req.params.addressId;
  try {
    var cacheKey = addressId;

    response["data"] = await getAddressByIdInternal(cacheKey, addressId);

    return response;
  } catch (err) {
    winston.error("getAddressById = " + addressId + "  err = " + err);
    notificationService.sendByTelegram(
      " getAddressById = " + addressId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getAddressByIdInternal(cacheKey, addressId) {
  let results = await addressRedis.getAddressByFilter(cacheKey);

  if (results) {
    return JSON.parse(results);
  }

  results = await addressMysql.getById(addressId);

  if (results) {
    await addressRedis.setAddressByFilter(cacheKey, safeStringify(results));
  }

  return results;
}


async function getReports(req) {
  var queryString = req.query;
  var response = utils.initObject();

  try {
    var filter = {};
    var options = { offset: 0, limit: 10 };
    var whereParams = [];

    var cacheKey = "all";

    for (var key in queryString) {
      var value = queryString[key];
      cacheKey = cacheKey + ":" + value;

      if (key === "limit" || key === "offset") {
        options[key] = parseInt(value);
        continue;
      } else {
        whereParams.push({
          field: key,
          condition: "= ?",
          value: queryString[key],
        });
      }

      if (key === "from_date") {
        filter[key] = {
          field: "DATE(created_date)",
          operator: ">=",
          value: value,
          type: "string",
        };
        continue;
      }

      if (key === "to_date") {
        filter[key] = {
          field: "DATE(created_date)",
          operator: "<=",
          value: value,
          type: "string",
        };
        continue;
      }

      filter[key] = value;
    }

    response["data"] = await getReportsInternal(
      cacheKey,
      options,
      filter,
      whereParams
    );
    return response;
  } catch (err) {
    winston.error("getReports err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function createReport(req) {
  var response = utils.initObject();
  var body = req.body;

  try {
    var report = new Report(
      body.game_name,
      body.started_date,
      body.url,
      body.type,
      body.status,
      body.employee_name,
      body.emCode,
      body.phone,
      body.age,
      body.branch,
      body.utm_medium,
      body.utm_source,
      body.utm_campaign,
      body.utm_content,
      body.utm_channel,
      body.gift
    );
    report.id = await reportMysql.createReport(report);

    await reportRedis.delReports();

    response["data"] = report;
    return response;
  } catch (err) {
    var textErr =
      " createReport body = " + safeStringify(body) + " error: " + err.message;
    winston.error(textErr);
    notificationService.sendByTelegram(textErr);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function updateReport(req) {
  var response = utils.initObject();
  var reportId = req.params.reportId;
  var body = req.body;

  try {
    var report = await reportMysql.getById(reportId);
    if (!report) {
      throw new Error("report not exists " + reportId);
    }

    if (body.game_name) {
      report.game_name = body.game_name;
    }

    if (body.started_date) {
      report.started_date = body.started_date;
    }

    if (body.url) {
      report.url = body.url;
    }

    if (body.type) {
      report.type = body.type;
    }

    if (body.status) {
      report.status = body.status;
    }

    if (body.employee_name) {
      report.employee_name = body.employee_name;
    }

    if (body.emCode) {
      report.emCode = body.emCode;
    }

    if (body.phone) {
      report.phone = body.phone;
    }

    if (body.age) {
      report.age = body.age;
    }

    if (body.branch) {
      report.branch = body.branch;
    }

    if (body.utm_medium) {
      report.utm_medium = body.utm_medium;
    }

    if (body.utm_source) {
      report.utm_source = body.utm_source;
    }

    if (body.utm_campaign) {
      report.utm_campaign = body.utm_campaign;
    }

    if (body.utm_content) {
      report.utm_content = body.utm_content;
    }

    if (body.utm_channel) {
      report.utm_channel = body.utm_channel;
    }

    if (body.gift) {
      report.gift = body.gift;
    }

    await reportMysql.updateReport(report);
    await reportRedis.delReports();

    response["message"] = "Update reports successfull !!";

    return response;
  } catch (err) {
    winston.error("updateReport reportId = " + reportId + "  err = " + err);
    notificationService.sendByTelegram(
      " updateReport = " + reportId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function deleteReport(req) {
  var response = utils.initObject();
  var reportId = req.params.reportId;

  try {
    await reportMysql.deleteReport(reportId);
    await reportRedis.delReports();

    response["data"] = reportId;
    response["message"] = "Delete report successfull !!";
    return response;
  } catch (err) {
    winston.error("deleteReports err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getReportsInternal(cacheKey, options, filter, whereParams) {
  let results = await reportRedis.getReportsByFilter(cacheKey);

  if (results) {
    return JSON.parse(results);
  }

  results = await reportMysql.getReports(filter, options, whereParams);

  if (results) {
    await reportRedis.setReportsByFilter(cacheKey, safeStringify(results));
  }

  return results;
}

async function getGoogleSheets(req) {
  var queryString = req.query;
  var response = utils.initObject();

  try {
    var filter = {};
    var options = { offset: 0, limit: 10 };
    var whereParams = [];

    var cacheKey = "all";

    for (var key in queryString) {
      var value = queryString[key];
      cacheKey = cacheKey + ":" + value;

      if (key === "orderBy") {
        options[key] = value;
        continue;
      }

      if (key === "limit" || key === "offset") {
        options[key] = parseInt(value);
        continue;
      } else {
        whereParams.push({
          field: key,
          condition: "= ?",
          value: queryString[key],
        });
      }

      if (key === "from_date") {
        filter[key] = {
          field: "DATE(created_date)",
          operator: ">=",
          value: value,
          type: "string",
        };
        continue;
      }

      if (key === "to_date") {
        filter[key] = {
          field: "DATE(created_date)",
          operator: "<=",
          value: value,
          type: "string",
        };
        continue;
      }

      filter[key] = value;
    }

    response["data"] = await getGoogleSheetsInternal(
      cacheKey,
      options,
      filter,
      whereParams
    );
    return response;
  } catch (err) {
    winston.error("getGoogleSheets  err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getGoogleSheetsInternal(cacheKey, options, filter, whereParams) {
  let results = await googleSheetRedis.getGoogleSheetsByFilter(cacheKey);

  if (results) {
    return JSON.parse(results);
  }

  results = await googleSheetMysql.getGoogleSheets(
    filter,
    options,
    whereParams
  );

  if (results) {
    await googleSheetRedis.setGoogleSheetByFilter(
      cacheKey,
      safeStringify(results)
    );
  }

  return results;
}

async function createGoogleSheets(req) {
  var response = utils.initObject();
  var body = req.body;

  try {
    var sheetId = await googleSheetService.createGoogleSheet(body.title);

    var sheetUrl = await googleSheetService.GoogleSheet(sheetId, body.columns);

    var arrColumns = body.columns;
    var sheetColumns = [];
    var index = {};

    arrColumns.forEach((item) => {
      index = {
        text: item,
        uid: "entry_" + uid(),
      };
      sheetColumns.push(index);
    });

    var google_sheet = new GoogleSheet(
      body.title,
      sheetId,
      sheetUrl,
      body.google_form_url,
      sheetColumns
    );
    google_sheet.id = await googleSheetMysql.createGoogleSheets(google_sheet);

    await googleSheetRedis.delGoogleSheets();

    response["data"] = sheetUrl;
    return response;
  } catch (err) {
    var textErr =
      " createGoogleSheets body = " +
      safeStringify(body) +
      " error: " +
      err.message;
    winston.error(textErr);
    notificationService.sendByTelegram(textErr);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function updateGoogleSheets(req) {
  var response = utils.initObject();
  var googleSheetId = req.params.googleSheetId;
  var body = req.body;

  try {
    var google_sheet = await googleSheetMysql.getById(googleSheetId);
    console.log(google_sheet);
    var gameId = google_sheet.game_id;
    var cacheKey = gameId + "gameDataById";
		var filter = {
			id: {
				field: "id",
				operator: "==",
				value: gameId,
				type: "string",
			}
		};
		filter['id'] = gameId;

		var gameData = await gameApi.getListGamesInternal(cacheKey, filter)
		var gameUuid = gameData[0].uuid;

    if (!google_sheet) {
      throw new Error("sheet not exists " + googleSheetId);
    }

    if (body.title) {
      google_sheet.title = body.title;
    }

    if (body.spread_sheet_id) {
      google_sheet.spread_sheet_id = body.spread_sheet_id;
    }

    if (body.url) {
      google_sheet.url = body.url;
    }

    if (body.columns) {
      google_sheet.columns = body.columns;
    }

    await googleSheetMysql.updateGoogleSheets(google_sheet);
    await googleSheetRedis.delGoogleSheets();
    await gameRedis.deleteCacheGame(gameId + ":state");
		await gameRedis.deleteCacheGame(gameUuid + ":state");

    response["data"] = google_sheet;

    return response;
  } catch (err) {
    winston.error(
      "updateGoogleSheets googleSheetId = " + googleSheetId + "  err = " + err
    );
    notificationService.sendByTelegram(
      " updateGoogleSheets = " + googleSheetId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function deleteGoogleSheets(req) {
  var response = utils.initObject();
  var googleSheetId = req.params.googleSheetId;

  try {
    await googleSheetMysql.deleteGoogleSheets(googleSheetId);
    await googleSheetRedis.delGoogleSheets();

    response["data"] = googleSheetId;
    response["message"] = "Delete google sheet successfull !!";
    return response;
  } catch (err) {
    winston.error("deleteGoogleSheets err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function addDataSheet(req) {
  var response = utils.initObject();
  var body = req.body;
  var googleSheetId = req.params.googleSheetId;

  try {
    var sheet = await googleSheetMysql.getById(googleSheetId);
    var arrPost = body.data;
    var arrColumns = JSON.parse(sheet.columns);
    var arrNew = [];
    var keys = Object.keys(arrPost);
    var values = Object.values(arrPost);

    arrColumns.forEach((columnsInfo, i) => {
      codeColumn = columnsInfo.uid;
      if (keys[i] === codeColumn) {
        arrNew.push(values[i]);
      }
    });

    await googleSheetService.updateValues(sheet.spread_sheet_id, arrNew);

    response["data"] = "Add data into sheet successfull !";
    return response;
  } catch (err) {
    var textErr =
      " addDataSheet body = " + safeStringify(body) + " error: " + err.message;
    winston.error(textErr);
    notificationService.sendByTelegram(textErr);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}


async function saveGoogleForm(req) {
  var response = utils.initObject();
  var body = req.body;

  try {
    var sheetUrl = `https://docs.google.com/spreadsheets/d/${body.spread_sheet_id}/edit#gid=0`;
    var google_form = new GoogleForm(
      body.game_id,
      body.title,
      body.spread_sheet_id,
      body.google_form_url,
      sheetUrl,
      body.columns
    );
    google_form.id = await googleFormMysql.saveGoogleForm(google_form);
    // console.log(google_form);
    var gameId = google_form.game_id;
    var cacheKey = gameId + "gameDataById";
		var filter = {
			id: {
				field: "id",
				operator: "==",
				value: gameId,
				type: "string",
			}
		};
		filter['id'] = gameId;

		var gameData = await gameApi.getListGamesInternal(cacheKey, filter)
		var gameUuid = gameData[0].uuid;

    await googleSheetRedis.delGoogleSheets();
    await gameRedis.deleteCacheGame(gameId + ":state");
		await gameRedis.deleteCacheGame(gameUuid + ":state");

    response["data"] = google_form;
    return response;
  } catch (err) {
    var textErr =
      " saveGoogleForm body = " +
      safeStringify(body) +
      " error: " +
      err.message;
    winston.error(textErr);
    notificationService.sendByTelegram(textErr);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}
module.exports = {
  createCronJob: createCronJob,
  getSignature: getSignature,
  uploadEmployees: uploadEmployees,
  downloadEmployees: downloadEmployees,
  downloadReports: downloadReports,
  downloadGames: downloadGames,
  getAddress: getAddress,
  createAddress: createAddress,
  updateAddress: updateAddress,
  deleteAddress: deleteAddress,
  getAddressById: getAddressById,
  getReports: getReports,
  createReport: createReport,
  updateReport: updateReport,
  deleteReport: deleteReport,
  getGoogleSheets: getGoogleSheets,
  createGoogleSheets: createGoogleSheets,
  updateGoogleSheets: updateGoogleSheets,
  deleteGoogleSheets: deleteGoogleSheets,
  addDataSheet: addDataSheet,
  saveGoogleForm: saveGoogleForm,
};
