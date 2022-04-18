import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';

/**
 * Represents a mentionable argument type.
 * @extends {ArgumentType}
 */
export class MentionableArgumentType extends ArgumentType {
    constructor(client: DiscomClient) {
        super(client, 'MENTIONABLE');

        this.client = client;
    }

    public validate(argument, message, language) {
        const matches = message.content.match(/([0-9]+)/);
        if (!matches) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'mention');

        const role = message.guild.roles.cache.get(matches[1]);
        const user = this.client.users.cache.get(matches[1]);
        if ((!user) && (!role)) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'mention');
    }

    public get(argument, message) {
        return message.match(/([0-9]+)/)[0];
    }
}
