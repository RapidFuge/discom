import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';

/**
 * Represents a Integer argument type.
 * @extends {ArgumentType}
 */
export class IntegerArgumentType extends ArgumentType {
    constructor(client: DiscomClient) {
        super(client, 'INTEGER');

        this.client = client;
    }

    public validate(argument, message, language) {
        if (!parseInt(message.content) || (parseInt(message.content) % 1 !== 0)) { return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'integer'); }
        if (argument.choices && !argument.choices.some(ch => ch.name === message.content)) { return this.client.languageFile.ARGS_CHOICES[language].replace('{choices}', argument.choices.map(opt => `\`${opt.name}\``).join(', ')); }
        if (argument.min_value > parseInt(message.content)) { return this.client.languageFile.ARGS_MIN_VALUE[language].replace('{argument}', argument.name).replace('{min_value}', argument.min_value); }
        if (argument.max_value < parseInt(message.content)) { return this.client.languageFile.ARGS_MAX_VALUE[language].replace('{argument}', argument.name).replace('{max_value}', argument.max_value); }
    }

    public get(argument, message) {
        return parseInt(message);
    }
}
