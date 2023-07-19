var winston = require('../logging/winston');
var redisClient = require('./redis').getRedis();

const TEMPLATE_KEY = 'template:';
const TEMPLATE_TTL = 864000; // second to day: 10 days
const TEMPLATE_DELETE = 'template:delete';

function templateKeyByFilter(filter) {
  return TEMPLATE_KEY + filter;
}

async function getTemplateByFilter(filter) {
  try {
      return await redisClient.getAsync(templateKeyByFilter(filter));
  } catch (err) {
      winston.error('getTemplateByFilter ' + filter + ' err = ' + err);
      return null;
  }
}

async function setTemplateByFilter(filter, template) {
  try {
      await redisClient.set(templateKeyByFilter(filter), template, 'EX', TEMPLATE_TTL);
      await redisClient.rpushAsync(TEMPLATE_DELETE, templateKeyByFilter(filter));
  } catch (err) {
      winston.error('setTemplateByFilter ' + templateKeyByFilter(filter) + ' err = ' + err);
  }
}

async function delTemplate() {
  try {
      let templateDeleteKeys = await redisClient.lrangeAsync(TEMPLATE_DELETE, 0, -1);
      if (templateDeleteKeys.length > 0) {
          await redisClient.delAsync(templateDeleteKeys);
          await redisClient.delAsync(TEMPLATE_DELETE);
      }
  } catch (err) {
      winston.error('del template err = ' + err.message);
  }
}

module.exports = {
  getTemplateByFilter: getTemplateByFilter,
  setTemplateByFilter:setTemplateByFilter,
  delTemplate:delTemplate
};