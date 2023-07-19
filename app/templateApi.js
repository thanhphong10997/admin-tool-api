var winston = require("../infra/logging/winston");
var utils = require("../interfaces/http/utils/utils");

var safeStringify = require("fast-safe-stringify");

var templateRedis = require("../infra/cache/template");
var templateMysql = require("../infra/database/template");

var Template = require("../domain/model/template/template");
var notificationService = require("../infra/service/notification");

async function getTemplate(req) {
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

    response["data"] = await getTemplateInternal(
      cacheKey,
      options,
      filter,
      whereParams
    );
    return response;
  } catch (err) {
    winston.error("getTemplate err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    console.log("error template:", err);
    return response;
  }
}

async function getTemplateInternal(cacheKey, options, filter, whereParams) {
  let results = await templateRedis.getTemplateByFilter(cacheKey);
  if (results) {
    return JSON.parse(results);
  }

  results = await templateMysql.getTemplate(filter, options, whereParams);

  if (results) {
    await templateRedis.setTemplateByFilter(cacheKey, safeStringify(results));
  }

  return results;
}

async function createTemplate(req) {
  var response = utils.initObject();
  var body = req.body;
  try {
    var template = new Template(body.user_id, body.name, body.body);
    console.log("template", template);
    template.id = await templateMysql.createTemplate(template);

    await templateRedis.delTemplate();

    response["data"] = log;
    return response;
  } catch (err) {
    var textErr =
      " createTemplate body = " +
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

async function getTemplateById(req) {
  var response = utils.initObject();
  var templateId = req.params.id;
  try {
    var cacheKey = templateId;

    response["data"] = await getTemplateByIdInternal(cacheKey, templateId);

    return response;
  } catch (err) {
    winston.error("getTemplateById = " + templateId + "  err = " + err);
    notificationService.sendByTelegram(
      " getTemplateById = " + templateId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function getTemplateByIdInternal(cacheKey, addressId) {
  let results = await templateRedis.getTemplateByFilter(cacheKey);

  if (results) {
    return JSON.parse(results);
  }

  results = await templateMysql.getById(addressId);

  if (results) {
    await templateRedis.setTemplateByFilter(cacheKey, safeStringify(results));
  }

  return results;
}

async function updateTemplate(req) {
  var response = utils.initObject();
  var templateId = req.params.id;
  var body = req.body;
  try {
    var template = await templateMysql.getById(templateId);
    if (!template) {
      throw new Error("address not exists " + templateId);
    }

    if (body.name) {
      template.name = body.name;
    }

    if (body.body) {
      template.body = body.body;
    }

    await templateMysql.updateTemplate(template);
    await templateRedis.delTemplate();

    response["data"] = template;

    return response;
  } catch (err) {
    winston.error(
      "updateTemplate templateId = " + templateId + "  err = " + err
    );
    notificationService.sendByTelegram(
      " updateTemplate = " + templateId + " err: " + err.message
    );
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}

async function deleteTemplate(req) {
  var response = utils.initObject();
  var templateId = req.params.id;
  var queryString = req.query;

  try {
    await templateMysql.deleteTemplate(templateId);
    await templateRedis.delTemplate();

    response["data"] = templateId;
    response["message"] = "Delete template successfull !!";
    return response;
  } catch (err) {
    winston.error("deleteTemplate err = " + err);
    response["status"] = 0;
    response["message"] = err.message;
    return response;
  }
}
module.exports = {
  getTemplate: getTemplate,
  createTemplate: createTemplate,
  updateTemplate: updateTemplate,
  getTemplateById: getTemplateById,
  deleteTemplate: deleteTemplate,
};
