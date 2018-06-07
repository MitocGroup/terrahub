'use strict';

const os = require('os');
const fse = require('fs-extra');
const path = require('path');
const merge = require('lodash.merge');

/**
 * Get terrahub home paths
 * @param {String} suffix
 * @returns {*}
 * @private
 */
function _terrahubPath(...suffix) {
  return path.join(os.homedir(), '.terrahub', ...suffix);
}

const cfgPath = _terrahubPath('.terrahub.json');
const templates = path.join(__dirname, './templates');

/**
 * Ensure if global config exists
 * @note it's always .json
 */
if (!fse.existsSync(cfgPath)) {
  fse.copySync(`${templates}/configs/.terrahub.json`, cfgPath);
}

const def = { format: 'yml', token: 'false' };
const env = { format: process.env.THUB_CONFIG_FORMAT, token: process.env.THUB_ACCESS_TOKEN };
const cfg = merge(def, fse.readJsonSync(cfgPath, { throws: false }), env);

module.exports = {
  thbPath: _terrahubPath,
  config: {
    home: _terrahubPath(),
    token: cfg.token,
    format: cfg.format,
    fileName: `.terrahub.${cfg.format}`
  },
  templates: {
    aws: `${templates}/aws`,
    hooks: `${templates}/hooks`,
    configs: `${templates}/configs`,
    mapping: `${templates}/mapping.json`
  }
};