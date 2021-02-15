'use strict';

/* eslint-disable quotes */

const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child-process-promise');
const logger = require('./logger');
const parameters = require('../parameters');


class HelpParser {
  /**
   * Return list of available commands
   * @return {String[]}
   */
  static getCommandsNameList() {
    return glob.sync('*.js', { cwd: parameters.commandsPath }).map(fileName => path.basename(fileName, '.js'));
  }

  /**
   * Return array of instances of all commands in the project
   * @param {Array} list
   * @return {Array}
   * @private
   */
  static getCommandsInstances(list = this.getCommandsNameList()) {
    return list.map(commandName => {
      const Command = require(path.join(parameters.commandsPath, commandName));
      return new Command(parameters, logger);
    });
  }

  /**
   * Return array of objects with command's name, description, available options and category
   * @param {AbstractCommand[]} commands
   * @return {Object[]}
   * @private
   */
  static getCommandsDescription(commands) {
    return commands.map(command => {
      const options = Object.keys(command._options).map(key => {
        let option = command._options[key];

        if (option.defaultValue === process.cwd()) {
          option.defaultValue = 'Current working directory';
        }

        return option;
      });

      return {
        name: command.getName(),
        description: command.getDescription(),
        options: options
      };
    });
  }

  /**
   * Updates metadata with new helper info
   * @param {Boolean} updateBuildDate
   */
  static updateMetadata(updateBuildDate = true) {
    const packageContent = require(parameters.packageJson);
    const commands = HelpParser.getCommandsInstances();
    const commandsDescription = HelpParser.getCommandsDescription(commands);
    const { buildDate } = require('../templates/help/metadata');

    const json = {
      name: packageContent.name,
      version: packageContent.version,
      description: packageContent.description,
      buildDate: updateBuildDate ? (new Date).toISOString() : buildDate,
      commands: commandsDescription
    };

    fs.writeJsonSync(parameters.templates.helpMetadata, json, { spaces: 2 });
  }

  /**
   * Determines whether all the options are valid for the command
   * @param {String} command
   * @param {Object} args
   * @return {Boolean}
   */
  static hasInvalidOptions(command, args) {
    const metadata = require(parameters.templates.helpMetadata);
    const { options } = metadata.commands.find(it => it.name === command);

    return !Object.keys(args).every(arg => options.find(it => it.name === arg || it.shortcut === arg));
  }

  /**
   * Updates aws regions list
   * @return {Promise}
   */
  static updateAWSRegions() {
    const command = `sh "${path.join(parameters.templates.help, 'scripts', 'aws_update.sh')}"`;

    return exec(command)
      .then(result => {
        const { stdout, stderr } = result;

        if (!stderr) {
          const parsedResult = JSON.parse(stdout);
          const allRegions = [].concat(parsedResult, HelpParser.getPrivateAWSRegions());

          fs.writeJsonSync(path.join(parameters.templates.help, 'regions.aws.json'), allRegions, { spaces: 2 });
        }
      })
      .catch(err => {
        throw new Error(`Failed to update AWS regions: ${err.message || err}`);
      });
  }

  /**
   * Returns private aws regions
   * @return {Object[]}
   */
  static getPrivateAWSRegions() {
    return [
      {
        "code": "cn-north-1",
        "public": false,
        "zones": [
          "cn-north-1a",
          "cn-north-1b"
        ]
      },
      {
        "code": "cn-northwest-1",
        "public": false,
        "zones": [
          "cn-northwest-1a",
          "cn-northwest-1b"
        ]
      },
      {
        "code": "us-gov-west-1",
        "public": false,
        "zones": [
          "us-gov-west-1a",
          "us-gov-west-1b",
          "us-gov-west-1c"
        ]
      }];
  }
}

module.exports = HelpParser;
