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

    async getCooldown(guildId, userId, command) {
        if (this.application && this.application.owners.some(user => user.id === userId)) return { cooldown: false };
        const now = Date.now();
        const cooldown = command.cooldown ? ms(command.cooldown) : ms(this.client.defaultCooldown);

        if (cooldown < 1800000) {
            if (!this.client.cooldowns.has(command.name)) this.client.cooldowns.set(command.name, new Collection());

            const timestamps = this.client.cooldowns.get(command.name);

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

            timestamps.set(userId, now);
            setTimeout(() => timestamps.delete(userId), cooldown);
            return { cooldown: false };
        } else if (!command.cooldown) { return { cooldown: false }; }
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
        if (typeof inhibitor !== 'function') return console.log(new Color('&b[&3Discom&b] &hThe inhibitor must be a function.').getText());
        this.client.inhibitors.set(i++, inhibitor);
        return true;
    }

    removeInhibitor(id) {
        if (typeof id !== 'number') return console.log(new Color('&b[&3Discom&b] &hThe id must be a number.').getText());
        if (!this.client.inhibitors.has(id)) return false;
        this.client.inhibitors.delete(id);
        return true;
    }
}
