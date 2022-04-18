import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';

/**
 * Represents a string argument type.
 * @extends {ArgumentType}
 */
export class StringArgumentType extends ArgumentType {
    constructor(client: DiscomClient) {
        super(client, 'STRING');

        this.client = client;
    }

    public validate(argument, message, language) {
        if (argument.choices && !argument.choices.some(ch => ch.name.toLowerCase() === message.content || ch.value.toLowerCase() === message.content)) { return this.client.languageFile.ARGS_CHOICES[language].replace('{choices}', argument.choices.map(opt => `\`${opt.name}\``).join(', ')); }
    }

    public get(argument, message) {
        if (argument.choices) {
            return argument.choices.find(ch => ch.name.toLowerCase() === message.toLowerCase() || ch.value.toLowerCase() === message.toLowerCase()).value;
        } else {
            return message;
        }
    }
}
