'use strict';

const fse = require('fs-extra');
const Fetch = require('../fetch');
const S3Helper = require('../s3-helper');
const ApiHelper = require('../api-helper');
const HclHelper = require('../hcl-helper');
const { promiseSeries } = require('../util');
const Terrahub = require('../wrappers/terrahub');

class AwsDeployer {

  constructor({ parameters }) {
    this.s3 = new S3Helper();
    this.fetch = new Fetch(parameters.fetch.baseUrl, parameters.fetch.authorization);
  }

  /**
   * Preparation
   */
  prepare() {}

  /**
   * @param {Object} requestData
   * @return {Promise}
   */
  async deploy(requestData) {
    const { config, thubRunId, actions, parameters, env } = requestData;

    Object.assign(process.env, { TERRAFORM_ACTIONS: actions.join(',')}, env);

    ApiHelper.on('loggerWork', () => {
      const promises = ApiHelper.retrieveDataToSend();

      return Promise.all(ApiHelper.asyncFetch(promises));
    });

    try {
      await this._updateCredentialsForS3();
      config.project.root = AwsDeployer._projectDirectory;
      const api = parameters.config.api.split('-')[1];
      const accountId = await this._fetchAccountId();
      const s3Prefix = [`projects-${api}`, accountId, thubRunId].join('/');

      await this.s3.syncPaths(config.project.root, s3Prefix, config.mapping);

      const cfg = await HclHelper.middleware(config, parameters);
      await this._runActions(actions, cfg, thubRunId, parameters);

      if (cfg.isJit) {
        await fse.remove(HclHelper.buildTmpPath(cfg, parameters));
      }

      const promises = ApiHelper.retrieveDataToSend(true);
      await Promise.all(ApiHelper.asyncFetch(promises));

    } catch (error) {
      return {
        message: error.message || error,
        hash: config.hash,
        isError: true
      };
    }

    return {
      message: `Component '${config.name}' has been successfully deployed.`,
      hash: config.hash,
      isError: false
    };
  }

  /**
   * @param {String[]} actions
   * @param {Object} config
   * @param {String} thubRunId
   * @param {Object} parameters
   * @return {Promise}
   * @private
   */
  async _runActions(actions, config, thubRunId, parameters) {
    const terrahub = new Terrahub(config, thubRunId, parameters);
    const tasks = terrahub.getTasks({ config, thubRunId, actions });

    return promiseSeries(tasks, (prev, fn) => prev.then(data => fn(data ? { skip: !!data.skip } : {})));
  }

  /**
   * @return {String}
   * @private
   */
  static get _projectDirectory() {
    return '/tmp/project';
  }

  /**
   * @return {Promise<String>}
   * @private
   */
  async _fetchAccountId() {
    const json = await this.fetch.get('thub/account/retrieve');
    const data = await json.data;

    return data.id;
  }

  /**
   * @return {void}
   * @throws {error}
   * @private
   */
  async _updateCredentialsForS3() {
    ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
      'AWS_PROFILE', 'AWS_CONFIG_FILE', 'AWS_LOAD_CONFIG'].forEach(it => delete process.env[it]);

    const tempCreds = await this._fetchTemporaryCredentials();
    if (!tempCreds) {
      throw new Error('[AWS Distributor] Can not retrieve temporary credentials.');
    }

    Object.assign(process.env, {
      AWS_ACCESS_KEY_ID: tempCreds.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: tempCreds.SecretAccessKey,
      AWS_SESSION_TOKEN: tempCreds.SessionToken
    });
  }

  /**
   * @return {Promise<Object>}
   * @private
   */
  _fetchTemporaryCredentials() {
    return this.fetch.get('thub/credentials/retrieve').then(json => Promise.resolve(json.data));
  }
}

module.exports = AwsDeployer;