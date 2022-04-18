import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';

/**
 * Represents a boolean argument type.
 * @extends {ArgumentType}
 */
export class BooleanArgumentType extends ArgumentType {
    public trueAnswerSet: Set<string>;
    public falseAnswerSet: Set<string>;

    constructor(client: DiscomClient) {
        super(client, 'BOOLEAN');

        this.client = client;
        this.trueAnswerSet = new Set(['true', 't', 'yes', 'y', 'on', 'enable', 'enabled']);
        this.falseAnswerSet = new Set(['false', 'f', 'no', 'n', 'off', 'disable', 'disabled']);
    }

    public validate(argument, message, language) {
        if (this.trueAnswerSet.has(message.content) === false && this.falseAnswerSet.has(message.content) === false) {
            return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'boolean');
        }
    }

    public get(argument, message) {
        if (this.falseAnswerSet.has(message)) return false;
        else if (this.trueAnswerSet.has(message)) return true;
    }
}
