import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';

/**
 * Represents a number argument type.
 * @extends {ArgumentType}
 */
export class NumberArgumentType extends ArgumentType {
    constructor(client: DiscomClient) {
        super(client, 'NUMBER');

        this.client = client;
    }

    public validate(argument, message, language) {
        if (!parseInt(message.content)) { return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'number'); }
        if (argument.choices && !argument.choices.some(ch => ch.name === message.content)) { return this.client.languageFile.ARGS_CHOICES[language].replace('{choices}', argument.choices.map(opt => `\`${opt.name}\``).join(', ')); }
        if (argument.min_value > parseInt(message.content) || argument.max_value < parseInt(message.content)) { return this.client.languageFile.ARGS_MIN_MAX[language].replace('{argument}', argument.name).replace('{min}', argument.min_value).replace('{max}', argument.max_value); }
    }

    public get(argument, message) {
        return Number(message);
    }
}
