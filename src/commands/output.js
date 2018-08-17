'use strict';

const Distributor = require('../helpers/distributor');
const TerraformCommand = require('../terraform-command');
const { yesNoQuestion } = require('../helpers/util');

class OutputCommand extends TerraformCommand {
  /**
   * Command configuration
   */
  configure() {
    this
      .setName('output')
      .setDescription('run `terraform output` across multiple terrahub components')
      .addOption('format', 'o', 'Specify the output format (text or json)', String, 'text')
    ;
  }

  /**
   * @returns {Promise}
   */
  run() {
    this._format = this.getOption('format');

    if (!['text', 'json'].includes(this._format)) {
      return Promise.reject(new Error(`The '${this._format}' output format is not supported for this command.`));
    }

    return this._format === 'text' ? this.askQuestion() : this.performAction();
  }

  /**
   * @return {Promise}
   */
  askQuestion() {
    this.logger.warn('This command makes sense only after apply command, and configured outputs');

    return yesNoQuestion('Do you want to run it (Y/N)? ').then(confirmed => {
      if (!confirmed) {
        return Promise.resolve('Canceled');
      }

      return this.performAction();
    });
  }

  /**
   * @return {Promise}
   */
  performAction() {
    const order = this.getTarjanOrder();
    const distributor = new Distributor(order, ['prepare', 'output'], { env: { format: this._format } });

    return distributor.run();
  }
}

module.exports = OutputCommand;
