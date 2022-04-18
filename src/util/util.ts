import { DMChannel, TextChannel, NewsChannel } from 'discord.js';
import { Color } from '../structures/Color';
import { Events } from './Constants';

/**
 * The Util class
 */
export class Util {
    /**
     * Internal method to resolveString
     * @param {string | Array} data
     * @returns {string}
    */
    static resolveString(data) {
        if (typeof data === 'string') return data;
        if (Array.isArray(data)) return data.join('\n');
        return String(data);
    }

    /**
     * Internal method to channelTypeRefactor
     * @param {DMChannel | TextChannel | NewsChannel} channel
     * @returns {Object}
    */
    static channelTypeRefactor(channel) {
        let finalResult;

        if (!channel) return null;
        if (channel instanceof TextChannel) finalResult = 'text';
        if (channel instanceof NewsChannel) finalResult = 'news';
        if (channel instanceof DMChannel) finalResult = 'dm';
        if (channel.type === 'GUILD_NEWS_THREAD') finalResult = 'thread';
        if (channel.type === 'GUILD_PUBLIC_THREAD') finalResult = 'thread';
        if (channel.type === 'GUILD_PRIVATE_THREAD') finalResult = 'thread';

        return finalResult;
    }

    /**
     * Internal method to inhibit
     * @param {DiscomClient} client
     * @param {Function} data
     * @returns {object}
    */
    static inhibit(client, data) {
        for (const inhibitor of client.inhibitors) {
            const inhibit = inhibitor[1](data);
            if (!inhibit) return inhibit;
        }
        return null;
    }

    /**
     * Internal method to isClass
     * @param {File} input
     * @returns {boolean}
    */
    static isClass(input) {
        return typeof input === 'function' &&
            typeof input.prototype === 'object' &&
            input.toString().substring(0, 5) === 'class';
    }

    /**
     * Internal method to deleteCmd
     * @param {DiscomClient} client
     * @param {number} commandId
     * @private
    */
    static async __deleteCmd(client, commandId, guildId = undefined) {
        try {
            const app = guildId ? await client.guilds.fetch(guildId) : client.application;
            const command = await app.commands.fetch(commandId);
            if (!command) return true;

            return command.delete();
        } catch (e) {
            return null;
        }
    }

    /**
     * Internal method to getAllCommands
     * @param {DiscomClient} client
     * @param {number} guildId
     * @private
    */
    static async __getAllCommands(client, guildId = undefined) {
        try {
            const app = guildId ? await client.guilds.fetch(guildId) : client.application;

            const commands = await app.commands.fetch();
            return commands;
        } catch { return []; }
    }

    /**
     * Determine equality for two JavaScript objects
     * @param {Object | Array} o
     * @returns {Object | Array}
    */
    static comparable(o) {
        return (typeof o !== 'object' || !o) ? o : (Object.keys(o).sort().reduce((c, key) => (c[key] = Util.comparable(o[key]), c), {})); // eslint-disable-line no-return-assign, no-sequences
    }

    /**
     * Unescape
     * @param {String} a
     * @param {String} b
     * @param {String} c
     * @returns {Object | Array}
    */
    static unescape(a, b, c) {
        a = a.split(b || '-')
            .map(x => x[0].toUpperCase() + x.slice(1).toLowerCase())
            .join(c || ' ');

        return a;
    }

    /**
     * GetAllObjects from object
     * @param {DiscomClient} client
     * @param {Object} ob
     * @returns {String}
    */
    static getAllObjects(client, ob) {
        if (typeof ob !== 'object') return;

        for (const key in ob) {
            const value = ob[key];
            if (typeof value === 'object') {
                this.getAllObjects(client, value);
            } else {
                client.emit(Events.DEBUG, new Color([
                    `&3${value}`,
                ]).getText());
            }
        }
    }
}
