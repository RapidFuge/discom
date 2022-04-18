import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';

/**
 * Represents a sub command argument type.
 * @extends {ArgumentType}
 */
export class SubCommandArgumentType extends ArgumentType {
    public value: any;

    constructor(client: DiscomClient) {
        super(client, 'SUB_COMMAND');


        this.client = client;
        this.value = {};
    }

    validate(argument, message, language) {
        const subcommand = argument.subcommands?.find(sc => sc.name === message.content);
        if (argument.subcommands && !subcommand) return this.client.languageFile.ARGS_COMMAND[language].replace('{choices}', argument.subcommands.map(sc => `\`${sc.name}\``).join(', '));
        else this.value.value = subcommand;
    }
    get(argument, message) {
        return argument.subcommands.find(sc => sc.name === message);
    }
}
