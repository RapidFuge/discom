import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';

/**
 * Represents a mentionable argument type.
 * @extends {ArgumentType}
 */
export class UserArgumentType extends ArgumentType {
    public value: any;

    constructor(client: DiscomClient) {
        super(client, 'USER');

        this.client = client;
        this.value = {};
    }

    validate(argument, message, language) {
        const matches = message.content.match(/([0-9]+)/);

        if (!matches?.[0]) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'user');
        this.value.value = matches[0];

        const user = this.client.users.cache.get(matches[0]);
        if (!user) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'user');
        else this.value.user = user;

        const member = message.guild.members.cache.get(matches[0]);
        if (member) this.value.member = member;
    }
    get(argument, message) {
        return message.match(/([0-9]+)/)[0];
    }
    resolve(option) {
        if (this.value.user) option.user = this.value.user;
        if (this.value.member) option.member = this.value.member;

        return option;
    }
}
