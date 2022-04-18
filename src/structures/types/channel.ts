import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';
import { ArgumentChannelTypes } from '../../util/Constants';

/**
 * Represents a channel attachment type.
 * @extends {ArgumentType}
 */
export class ChannelArgumentType extends ArgumentType {
    public value: any;

    constructor(client: DiscomClient) {
        super(client, 'CHANNEL');

        this.client = client;
        this.value = {};
    }

    public validate(argument, message, language) {
        const matches = message.content.match(/([0-9]+)/);

        if (!matches?.[0]) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'channel');
        this.value.value = matches[0];

        const channel = this.client.channels.cache.get(matches[0]);
        if (!channel) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'channel');
        else this.value.channel = channel;
        if (argument.channel_types && argument.channel_types.some(type => type !== ArgumentChannelTypes[channel.type])) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'channel');
    }

    public get(argument, message) {
        return message.match(/([0-9]+)/)[0];
    }

    public resolve(option) {
        if (this.value.channel) option.channel = this.value.channel;

        return option;
    }
}
