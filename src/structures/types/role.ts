import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';

/**
 * Represents a role argument type.
 * @extends {ArgumentType}
 */
export class RoleArgumentType extends ArgumentType {
    public value: any;

    constructor(client: DiscomClient) {
        super(client, 'ROLE');

        this.client = client;

        this.value = {};
    }

    public validate(argument, message, language) {
        const matches = message.content.match(/([0-9]+)/);

        if (!matches?.[0]) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'role');
        this.value.value = matches[0];

        const role = message.guild.roles.cache.get(matches[1]);
        if (!role) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'role');
        else this.value.role = role;
    }

    public get(argument, message) {
        return message.match(/([0-9]+)/)[0];
    }

    public resolve(option) {
        if (this.value.role) option.role = this.value.role;

        return option;
    }
}
