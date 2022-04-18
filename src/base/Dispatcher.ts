import type { DiscomClient } from './Client';
import { Collection, Team } from 'discord.js';
import { Color } from '../structures/Color';
import { default as ms } from 'humanize-ms';
let i = 0;

/**
 * The Dispatcher class
 */
export class Dispatcher {
    public client: DiscomClient;
    public inhibitors: Map<number, any>;
    public cooldowns: Collection<string, Collection<string, number | object>>;
    public application: any;

    constructor(client: DiscomClient, readyWait = true) {
        this.client = client;
        this.inhibitors = new Map();
        this.cooldowns = new Collection();
        this.application = null;

        this.client.inhibitors = this.inhibitors;
        this.client.cooldowns = this.cooldowns;

        if (readyWait) {
            setImmediate(() => {
                this.client.on('ready', () => {
                    this.fetchClientApplication();
                });
            });
        }
    }

    async getGuildData(guild, options = { force: false }) {
        if (!this.client.database) return false;
        if (guild.data && !options.force) return guild.data;

        try {
            const data = await this.client.database.get(`guild_${guild.id}`) || {};

            return data;
        } catch { return false; }
    }

    async setGuildData(guild, data) {
        if (!this.client.database) return false;
        if (!data) return false;

        try {
            await this.client.database.set(`guild_${guild.id}`, data);

            return true;
        } catch { return false; }
    }

    async setGuildPrefix(guild, prefix) {
        if (!this.client.database) return false;
        if (!prefix) return false;

        try {
            const data = await guild.getData();

            data.prefix = prefix;

            const isSet = await guild.setData(data);

            return isSet;
        } catch { return false; }
    }

    async getGuildPrefix(guild, options = { force: false }) {
        if (!this.client.database) return this.client.prefix;
        if (guild.data?.prefix && !options.force) return guild.data.prefix;

        try {
            const data = await guild.getData({ force: true });

            if (data?.prefix) return data.prefix;
            else return false;
        } catch { return false; }
    }

    async setGuildLanguage(guild, language) {
        if (!this.client.database) return false;
        if (!language) return false;

        try {
            const data = await guild.getData();

            data.language = language;

            const isSet = await guild.setData(data);

            return isSet;
        } catch { return false; }
    }

    async getGuildLanguage(guild, options = { force: false }) {
        if (!this.client.database) return this.client.language;
        if (guild.data?.language && !options.force) return guild.data.language;

        try {
            const data = await guild.getData({ force: true });

            if (data?.language) return data.language;
            else return false;
        } catch { return false; }
    }

    async getCooldown(guildId, userId, command) {
        if (this.application && this.application.owners.some(user => user.id === userId)) return { cooldown: false };
        const now = Date.now();

        let cooldown;
        if (typeof command.cooldown === 'object') cooldown = command.cooldown ? ms(command.cooldown.cooldown) : ms(this.client.defaultCooldown);
        else cooldown = command.cooldown ? ms(command.cooldown) : ms(this.client.defaultCooldown);

        if (cooldown < 1800000 || !this.client.database) {
            if (!this.client.cooldowns.has(command.name)) this.client.cooldowns.set(command.name, new Collection());

            const timestamps = this.client.cooldowns.get(command.name);

            if (timestamps.has(userId)) {
                if (timestamps.has(userId)) {
                    const expirationTime = timestamps.get(userId) + cooldown;

                    if (now < expirationTime) {
                        if (typeof command.cooldown === 'object' && command.cooldown.agressive) {
                            this.client.cooldowns.set(command.name, new Collection());
                            return { cooldown: true, wait: ms(cooldown) };
                        }

                        const timeLeft = ms(expirationTime - now);

                        return { cooldown: true, wait: timeLeft };
                    }
                }
            }

            timestamps.set(userId, now);
            setTimeout(() => timestamps.delete(userId), cooldown);
            return { cooldown: false };
        }

        if (!this.client.database || !command.cooldown) return { cooldown: false };

        const guildData = await this.client.database.get(`guild_${guildId}`) || {};
        if (!guildData.users) guildData.users = {};
        if (!guildData.users[userId]) guildData.users[userId] = guildData.users[userId] || {};

        let userInfo = guildData.users[userId][command.name];

        if (!userInfo) {
            guildData.users[userId][command.name] = ms(command.cooldown) + now;

            userInfo = guildData.users[userId][command.name];
            this.client.database.set(`guild_${guildId}`, guildData);
        }

        if (now < userInfo) {
            if (typeof command.cooldown === 'object' && command.cooldown.agressive) {
                guildData.users[userId][command.name] = ms(command.cooldown) + now;

                userInfo = guildData.users[userId][command.name];
                this.client.database.set(`guild_${guildId}`, guildData);

                return { cooldown: true, wait: ms(cooldown) };
            }

            return { cooldown: true, wait: ms(userInfo - now) };
        } else {
            guildData.users[userId] = guildData.users[userId] || {};
            guildData.users[userId][command.name] = undefined;

            this.client.database.set(`guild_${guildId}`, guildData);
        }

        return { cooldown: false };
    }

    async fetchClientApplication() {
        this.application = await this.client.application.fetch();

        if (this.application.owner === null) this.application.owners = [];

        if (this.application.owner instanceof Team) {
            this.application.owners = [...this.application.owner.members.values()].map(teamMember => teamMember.user);
        } else { this.application.owners = [this.application.owner]; }

        return this.application.owners;
    }

    addInhibitor(inhibitor) {
        if (typeof inhibitor !== 'function') return console.log(new Color('&3[Discom] &cThe inhibitor must be a function.').getText());
        this.client.inhibitors.set(i++, inhibitor);
        return true;
    }

    removeInhibitor(id) {
        if (typeof id !== 'number') return console.log(new Color('&3[Discom] &cThe id must be a number.').getText());
        if (!this.client.inhibitors.has(id)) return false;
        this.client.inhibitors.delete(id);
        return true;
    }
}
