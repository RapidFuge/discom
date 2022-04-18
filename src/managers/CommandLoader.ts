/* eslint-disable prefer-promise-reject-errors */
import type { DiscomClient } from '../base/Client';
import type { ApplicationCommand, Collection } from 'discord.js';
import { Color } from '../structures/Color';
import { DiscomError } from '../structures/DiscomError';
import { Events, ApplicationCommandTypesRaw, ArgumentType } from '../util/Constants';
import path from 'path';
import fs from 'fs';
import ms from 'ms';
import { Util } from '../util/util';
import { Command } from '../structures/Command';
import fetch from 'node-fetch';

/**
 * The command loader class.
 */
export class CommandLoader {
    public client: DiscomClient;
    public cmdDir: string;
    public _allGlobalCommands: Promise<Collection<string, ApplicationCommand>>;

    constructor(client: DiscomClient) {
        this.client = client;
        this.cmdDir = this.client.cmdDir;
        this._allGlobalCommands = Util.__getAllCommands(this.client);

        this.__loadCommandFiles();
    }

    private async __loadCommandFiles() {
        for await (const fsDirent of fs.readdirSync(this.cmdDir, { withFileTypes: true })) {
            let file: any = fsDirent.name;
            const fileType = path.extname(file);
            const fileName = path.basename(file, fileType);
            if (fsDirent.isDirectory()) {
                await this.__loadCommandCategoryFiles(file);
                continue;
            } else if (!['.js', '.ts'].includes(fileType)) { continue; }

            file = require(`${this.cmdDir}/${file}`);
            if (!(file instanceof Command)) throw new DiscomError('[COMMAND]', `Command ${fileName} doesnt belong in Commands.`);
            file.init(this.client);

            file._path = `${this.cmdDir}/${fileName}${fileType}`;

            this.client.commands.set(file.name, file);
            if (file && file.aliases && Array.isArray(file.aliases)) file.aliases.forEach(alias => this.client.aliases.set(alias, file.name));
            this.client.emit(Events.LOG, new Color(`&3[Discom] &aLoaded (File): &e➜ &3${fileName}`, { json: false }).getText());
        }

        await this.__loadSlashCommands();
        await this.__loadContextMenuCommands();
        await this.__loadCommandPermissions();

        this.client.emit(Events.COMMANDS_LOADED, this.client.commands);
    }

    private async __loadCommandCategoryFiles(categoryFolder) {
        for await (const fsDirent of fs.readdirSync(`${this.cmdDir}/${categoryFolder}`, { withFileTypes: true })) {
            let file: any = fsDirent.name;
            const fileType = path.extname(file);
            const fileName = path.basename(file, fileType);

            if (fsDirent.isDirectory()) {
                // Recursive scan
                await this.__loadCommandCategoryFiles(`${categoryFolder}/${file}`);
                continue;
            } else if (!['.js', '.ts'].includes(fileType)) { continue; }

            file = require(`${this.cmdDir}/${categoryFolder}/${file}`);
            if (!(file instanceof Command)) throw new DiscomError('[COMMAND]', `Command ${fileName} doesnt belong in Commands.`);
            file.init(this.client);

            file._path = `${this.cmdDir}/${categoryFolder}/${fileName}${fileType}`;

            this.client.commands.set(file.name, file);
            if (file && file.aliases && Array.isArray(file.aliases)) file.aliases.forEach(alias => this.client.aliases.set(alias, file.name));
            this.client.emit(Events.LOG, new Color(`&3[Discom] &aLoaded (File): &e➜ &3${fileName}`, { json: false }).getText());
        }
    }

    private async __loadSlashCommands() {
        const keys = Array.from(this.client.commands.keys());
        this.__deleteNonExistCommands(keys);

        for (const commandName of keys) {
            const cmd = this.client.commands.get(commandName);
            if (['false', 'message'].includes(String(cmd.slash))) continue;
            if (!cmd.slash && ['false', 'message'].includes(String(this.client.slash))) continue;

            let url = `https://discord.com/api/v9/applications/${this.client.user.id}/commands`;

            const loadSlashCommand = async (guildOnly?: string) => {
                if (this.client.loadFromCache) {
                    let ifAlready;
                    let cache = true;
                    if (guildOnly) ifAlready = (await Util.__getAllCommands(this.client, guildOnly)).find(c => c.name === cmd.name && c.type === 'CHAT_INPUT');
                    else ifAlready = (await this._allGlobalCommands).find(c => c.name === cmd.name && c.type === 'CHAT_INPUT');

                    if (ifAlready) {
                        if (ifAlready.defaultPermission) {
                            if ((cmd.userId || cmd.channelTextOnly) === undefined) {
                                if (ifAlready.description !== cmd.description) { cache = false; }
                                cmd.args.forEach(a => {
                                    ifAlready.options.forEach(a2 => {
                                        if (a.name !== a2.name) cache = false;
                                        if (a.description !== a2.description) cache = false;
                                        if (a.required !== a2.required) cache = false;
                                        if (a.type !== ArgumentType[a2.type]) cache = false;
                                        if (JSON.stringify(a.options || []) !== JSON.stringify(a2.options || [])) cache = false;
                                        if (a.max_value !== a2.max_value) cache = false;
                                        if (a.min_value !== a2.min_value) cache = false;
                                        if (a.autocomplete !== a2.autocomplete) cache = false;
                                    });
                                });
                            }
                        } else if ((cmd.userId || cmd.channelTextOnly) !== undefined) { cache = false; }
                    } else { cache = false; }

                    if (cache) {
                        this.client.emit(Events.LOG, new Color(`&3[Discom] &aLoaded from cache (Slash): &e➜ &3${cmd.name}`, { json: false }).getText());
                        return;
                    }
                }

                const finalArgs = [];
                if (cmd.args && cmd.args.length > 0) {
                    for (let arg of cmd.args) {
                        if (typeof arg.run === 'function') {
                            arg = {
                                ...arg,
                                run: undefined,
                                autocomplete: true,
                            };
                        }

                        finalArgs.push(arg);
                    }
                }

                const config = {
                    method: 'POST',
                    headers: {
                        Authorization: `Bot ${this.client.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: cmd.name,
                        description: cmd.description,
                        options: finalArgs,
                        type: 1,
                        default_permission: guildOnly ? (cmd.userId || cmd.channelTextOnly) === undefined : true,
                        channel_types: finalArgs.some(a => a.channel_types) || null,
                    }),
                    url,
                };

                fetch(config.url, config)
                    .then(async x => x.ok ? this.client.emit(Events.LOG, new Color(`&3[Discom] &aLoaded (Slash): &e➜ &3${cmd.name}`, { json: false }).getText()) : Promise.reject({ status: x.status, statusText: x.statusText, data: await x.json() }))
                    .catch(error => {
                        this.client.emit(Events.LOG, new Color(`&3[Discom] ${error ? error.status === 429 ? `&aWait &e${ms(error.data.retry_after * 1000)}` : `&e${error.status}` : ''} &c${error.statusText} &e(${cmd.name})`, { json: false }).getText());

                        if (error) {
                            if (error.status === 429) {
                                setTimeout(() => {
                                    this.__tryAgain(cmd, config, 'Slash');
                                }, (error.data.retry_after) * 1000);
                            } else {
                                this.client.emit(Events.DEBUG, new Color([
                                    '&a----------------------',
                                    '  &3[Discom Debug] &3',
                                    `&aCode: &3${error.data.code}`,
                                    `&aMessage: &3${error.data.message}`,
                                    '',
                                    `${error.data.errors ? '&aErrors:' : '&a----------------------'}`,
                                ]).getText());

                                if (error.data.errors) {
                                    Util.getAllObjects(this.client, error.data.errors);

                                    this.client.emit(Events.DEBUG, new Color([
                                        `&a----------------------`,
                                    ]).getText());
                                }
                            }
                        }
                    });
            };

            if (cmd.guildId.length) {
                for (const guildId of cmd.guildId) {
                    if (!guildId) {
                        await loadSlashCommand();
                        continue;
                    }

                    url = `https://discord.com/api/v9/applications/${this.client.user.id}/guilds/${guildId}/commands`;
                    await loadSlashCommand(guildId);
                }
            } else { await loadSlashCommand(); }
        }
    }

    private async __loadContextMenuCommands() {
        const keys = Array.from(this.client.commands.keys());

        for (const commandName of keys) {
            const cmd = this.client.commands.get(commandName);
            if (String(cmd.context) === 'false') continue;
            if (!cmd.context && String(this.client.context) === 'false') continue;

            let url = `https://discord.com/api/v9/applications/${this.client.user.id}/commands`;
            const loadContextMenu = async (guildOnly?: string) => {
                if (this.client.loadFromCache) {
                    let ifAlready;
                    let cache = true;
                    if (guildOnly) ifAlready = (await Util.__getAllCommands(this.client, guildOnly)).find(c => c.name === cmd.name && ['USER', 'MESSAGE'].includes(c.type));
                    else ifAlready = (await this._allGlobalCommands).find(c => c.name === cmd.name && ['USER', 'MESSAGE'].includes(c.type));

                    if (ifAlready) {
                        if (cmd.contextMenuName && ifAlready.name === cmd.contextMenuName) cache = false;
                        if (ifAlready.name === cmd.name) cache = false;
                    } else { cache = false; }

                    if (cache) {
                        this.client.emit(Events.LOG, new Color(`&3[Discom] &aLoaded from cache (Context Menu): &e➜ &3${cmd.name}`, { json: false }).getText());
                        return;
                    }
                }

                const type = cmd.context ? ApplicationCommandTypesRaw[cmd.context] : ApplicationCommandTypesRaw[this.client.context];
                const config: any = {
                    method: 'POST',
                    headers: {
                        Authorization: `Bot ${this.client.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: cmd.contextMenuName || cmd.name,
                        type: type === 4 ? 2 : type,
                    }),
                    url,
                };

                fetch(config.url, config)
                    .then(async x => {
                        if (!x.ok) return Promise.reject({ status: x.status, statusText: x.statusText, data: await x.json() });

                        this.client.emit(Events.LOG, new Color(`&3[Discom] &aLoaded (Context Menu (user)): &e➜ &3${cmd.name}`, { json: false }).getText());
                        if (type === 4) {
                            config.body = JSON.stringify({
                                name: cmd.contextMenuName || cmd.name,
                                type: 3,
                            });
                            this.__tryAgain(cmd, config, 'Context Menu (message)');
                        }
                    })
                    .catch(error => {
                        this.client.emit(Events.LOG, new Color(`&3[Discom] ${error ? error.status === 429 ? `&aWait &e${ms(error.data.retry_after * 1000)}` : `&e${error.status}` : ''} &c${error.statusText} &e(${cmd.name})`, { json: false }).getText());

                        if (error.response) {
                            if (error.response.status === 429) {
                                setTimeout(() => {
                                    this.__tryAgain(cmd, config, 'Context Menu');
                                }, (error.response.data.retry_after) * 1000);
                            } else {
                                this.client.emit(Events.DEBUG, new Color([
                                    '&a----------------------',
                                    '  &3[Discom Debug] &3',
                                    `&aCode: &3${error.response.data.code}`,
                                    `&aMessage: &3${error.response.data.message}`,
                                    '',
                                    `${error.response.data.errors ? '&aErrors:' : '&a----------------------'}`,
                                ]).getText());

                                if (error.response.data.errors) {
                                    Util.getAllObjects(this.client, error.response.data.errors);

                                    this.client.emit(Events.DEBUG, new Color([
                                        `&a----------------------`,
                                    ]).getText());
                                }
                            }
                        }
                    });
            };

            if (cmd.guildId.length) {
                for (const guildId of cmd.guildId) {
                    if (!guildId) {
                        await loadContextMenu();
                        continue;
                    }

                    url = `https://discord.com/api/v9/applications/${this.client.user.id}/guilds/${guildId}/commands`;
                    await loadContextMenu();
                }
            } else {
                await loadContextMenu();
            }
        }
    }

    private async __loadCommandPermissions() {
        const keys = Array.from(this.client.commands.keys());

        for (const commandName in keys) {
            const cmd = this.client.commands.get(keys[commandName]);

            if ((cmd.userId || cmd.channelTextOnly) === undefined) continue;

            const loadCommandPermission = async (apiCommands: Collection<string, ApplicationCommand>) => {
                for (const apiCommand of apiCommands) {
                    let url;
                    const loadApiCmd = async () => {
                        const finalData = [];

                        if (cmd.userRequiredRoles) {
                            if (!Array.isArray(cmd.userRequiredRoles)) cmd.userRequiredRoles = [cmd.userRequiredRoles];

                            for await (const roleId of cmd.userRequiredRoles) {
                                finalData.push({
                                    id: roleId,
                                    type: 1,
                                    permission: true,
                                });
                            }
                        }

                        if (cmd.userId) {
                            for await (const userId of cmd.userId) {
                                finalData.push({
                                    id: userId,
                                    type: 2,
                                    permission: true,
                                });
                            }
                        }

                        const config = {
                            method: 'PUT',
                            headers: {
                                Authorization: `Bot ${this.client.token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                permissions: finalData,
                            }),
                            url,
                        };

                        fetch(config.url, config)
                            .then(async x => x.ok ? this.client.emit(Events.LOG, new Color(`&3[Discom] &aLoaded (Permission): &e➜ &3${cmd.name}`, { json: false }).getText()) : Promise.reject({ status: x.status, statusText: x.statusText, data: await x.json() }))
                            .catch(error => {
                                this.client.emit(Events.LOG, new Color(`&3[Discom] ${error ? error.status === 429 ? `&aWait &e${ms(error.data.retry_after * 1000)}` : `&e${error.status}` : ''} &c${error.statusText} &e(${cmd.name})`, { json: false }).getText());

                                if (error) {
                                    if (error.status === 429) {
                                        setTimeout(() => {
                                            this.__tryAgain(cmd, config, 'Permission');
                                        }, (error.data.retry_after) * 1000);
                                    } else {
                                        this.client.emit(Events.DEBUG, new Color([
                                            '&a----------------------',
                                            '  &3[Discom Debug] &3',
                                            `&aCode: &3${error.data.code}`,
                                            `&aMessage: &3${error.data.message}`,
                                            '',
                                            `${error.data.errors ? '&aErrors:' : '&a----------------------'}`,
                                        ]).getText());

                                        if (error.data.errors) {
                                            Util.getAllObjects(this.client, error.data.errors);

                                            this.client.emit(Events.DEBUG, new Color([
                                                `&a----------------------`,
                                            ]).getText());
                                        }
                                    }
                                }
                            });
                    };

                    if (cmd.guildId.length) {
                        for (const gId of cmd.guildId) {
                            if (gId) url = `https://discord.com/api/v9/applications/${this.client.user.id}/guilds/${gId}/commands/${apiCommand[1].id}/permissions`;
                            await loadApiCmd();
                        }
                    }
                }
            };
            if (cmd.guildId.length) {
                for (const guildId of cmd.guildId) {
                    const apiCommands = (await Util.__getAllCommands(this.client, guildId)).filter(c => c.name === cmd.name && c.type === 'CHAT_INPUT');
                    await loadCommandPermission(apiCommands);
                }
            } else {
                const apiCommands = (await this._allGlobalCommands).filter(c => c.name === cmd.name && c.type === 'CHAT_INPUT');
                await loadCommandPermission(apiCommands);
            }
        }
    }

    private __tryAgain(cmd, config, type) {
        fetch(config.url, config)
            .then(async x => x.ok ? this.client.emit(Events.LOG, new Color(`&3[Discom] &aLoaded (${type}): &e➜ &3${cmd.name}`, { json: false }).getText()) : Promise.reject({ status: x.status, statusText: x.statusText, data: await x.json() }))
            .catch(error => {
                this.client.emit(Events.LOG, new Color(`&3[Discom] ${error ? error.status === 429 ? `&aWait &e${ms(error.data.retry_after * 1000)}` : `&e${error.status}` : ''} &c${error.statusText} &e(${cmd.name})`, { json: false }).getText());

                if (error) {
                    if (error.status === 429) {
                        setTimeout(() => {
                            this.__tryAgain(cmd, config, type);
                        }, (error.data.retry_after) * 1000);
                    }
                }
            });
    }

    private async __deleteNonExistCommands(commandFiles) {
        if (!this.client.deleteNonExistent) return;

        const appCommands = await Util.__getAllCommands(this.client);
        if (!appCommands || appCommands.size < 0) return;
        for (const appCommand of appCommands) {
            const cmd = appCommand[1];
            if (!commandFiles.some(c => cmd.name === c) && cmd.type === 'CHAT_INPUT') Util.__deleteCmd(this.client, cmd.id);
            const command = this.client.commands.find(c => c.name === cmd.name || c.contextMenuName === cmd.name);

            if (!command) Util.__deleteCmd(this.client, cmd.id);
            else if (cmd.type === 'CHAT_INPUT' && command.slash && ['false', 'message'].includes(String(command.slash))) Util.__deleteCmd(this.client, cmd.id);
            else if (cmd.type === 'CHAT_INPUT' && !command.slash && ['false', 'message'].includes(String(this.client.slash))) Util.__deleteCmd(this.client, cmd.id);
            else if (cmd.type === 'USER' && command.context && ['false', 'message'].includes(String(command.context))) Util.__deleteCmd(this.client, cmd.id);
            else if (cmd.type === 'USER' && !command.context && ['false', 'message'].includes(String(this.client.context))) Util.__deleteCmd(this.client, cmd.id);
            else if (cmd.type === 'MESSAGE' && command.context && ['false', 'user'].includes(String(command.context))) Util.__deleteCmd(this.client, cmd.id);
            else if (cmd.type === 'MESSAGE' && !command.context && ['false', 'user'].includes(String(this.client.context))) Util.__deleteCmd(this.client, cmd.id);
            else if (command.guildId.length) Util.__deleteCmd(this.client, cmd.id);
            else continue;

            this.client.emit(Events.LOG, new Color(`&3[Discom] &aDeleted ${cmd.type === 'CHAT_INPUT' ? 'Slash' : 'Context'}: &e➜ &3${cmd.name}`, { json: false }).getText());
        }

        const guilds = this.client.guilds.cache.map(guild => guild.id);
        for (const guild of guilds) {
            const guildCommands = await Util.__getAllCommands(this.client, guild);
            if (!guildCommands || guildCommands.size < 0) return;

            for (const guildCommand of guildCommands) {
                const cmd = guildCommand[1];
                if (!commandFiles.some(c => cmd.name === c) && cmd.type === 'CHAT_INPUT') Util.__deleteCmd(this.client, cmd.id, guild);
                const command = this.client.commands.find(c => c.name === cmd.name || c.contextMenuName === cmd.name);

                if (!command) Util.__deleteCmd(this.client, cmd.id, guild);
                else if (cmd.type === 'CHAT_INPUT' && command.slash && ['false', 'message'].includes(String(command.slash))) Util.__deleteCmd(this.client, cmd.id, guild);
                else if (cmd.type === 'CHAT_INPUT' && !command.slash && ['false', 'message'].includes(String(this.client.slash))) Util.__deleteCmd(this.client, cmd.id, guild);
                else if (cmd.type === 'USER' && command.context && ['false', 'message'].includes(String(command.context))) Util.__deleteCmd(this.client, cmd.id, guild);
                else if (cmd.type === 'USER' && !command.context && ['false', 'message'].includes(String(this.client.context))) Util.__deleteCmd(this.client, cmd.id, guild);
                else if (cmd.type === 'MESSAGE' && command.context && ['false', 'user'].includes(String(command.context))) Util.__deleteCmd(this.client, cmd.id, guild);
                else if (cmd.type === 'MESSAGE' && !command.context && ['false', 'user'].includes(String(this.client.context))) Util.__deleteCmd(this.client, cmd.id, guild);
                else if (!(command.guildId.length && command.guildId.includes(guild))) Util.__deleteCmd(this.client, cmd.id, guild);
                else continue;

                this.client.emit(Events.LOG, new Color(`&3[Discom] &aDeleted ${cmd.type === 'CHAT_INPUT' ? 'Slash' : 'Context'} (guild: ${guild}): &e➜ &3${cmd.name}`, { json: false }).getText());
            }
        }
    }
}
