import type { DiscomClient, GuildLanguageTypes } from '../base/Client';
import type { AutocompleteRunOptions } from '../structures/Argument';
import type { Command, CommandRunOptions } from '../structures/Command';
import type { AutocompleteInteraction, GuildMember, Guild, Message, User } from 'discord.js';
import { readdirSync } from 'fs';
import { ArgumentManager } from '../structures/ArgumentManager';
import { DiscomError } from '../structures/DiscomError';
import { Events } from '../util/Constants';
import { Color } from '../structures/Color';
import { Util } from '../util/util';
import ms from 'ms';

/**
 * The Event EventHandler class.
 */
export class EventHandler {
    public client: DiscomClient;

    constructor(client: DiscomClient) {
        this.client = client;

        this.messageEvent();
        this.slashEvent();
        this.handleAutocomplete();
        this.loadMoreEvents();
    }

    private messageEvent() {
        this.client.on('messageCreate', (message: Message) => {
            messageEventUse(message);
        });

        this.client.on('messageUpdate', (oldMessage: Message, newMessage: Message) => {
            if (oldMessage.content === newMessage.content || oldMessage.embeds === newMessage.embeds) return;
            messageEventUse(newMessage);
        });

        const messageEventUse = async (message: Message) => {
            if (!message || !message.author || message.author.bot) return;

            const mention = message.content.match(new RegExp(`^<@!?(${this.client.user.id})> `));
            const prefix = mention ? mention[0] : (await message.guild?.getCommandPrefix() || this.client.prefix);

            const messageContainsPrefix = this.client.caseSensitivePrefixes ? message.content.startsWith(prefix) : message.content.toLowerCase().startsWith(prefix.toLowerCase());
            if (!messageContainsPrefix) return;

            const [cmd, ...args] = message.content.slice(prefix.length).trim().split(/ +/g);
            if (cmd.length === 0) return;

            let commandos;
            try {
                commandos = this.client.commands.get(!this.client.caseSensitiveCommands ? String(cmd).toLowerCase() : String(cmd)) || this.client.commands.get(this.client.aliases.get(!this.client.caseSensitiveCommands ? String(cmd).toLowerCase() : String(cmd)));
                if (!commandos) return this.client.emit(Events.COMMAND_NOT_FOUND, new Color(`&3[Discom] &cCommand not found (message): &e➜ &3${cmd ? String(cmd) : null}`, { json: false }).getText());

                const isDmEnabled = ['false'].includes(String(commandos.allowDm));
                const isClientDmEnabled = !commandos.allowDm && ['false'].includes(String(this.client.allowDm));
                const isMessageNotEnabled = ['false', 'slash'].includes(String(commandos.slash));
                const isClientMessageEnabled = !commandos.slash && ['false', 'slash'].includes(String(this.client.slash));

                const channelType = Util.channelTypeRefactor(message.channel);
                const isNotDm = channelType !== 'dm';

                if (!isNotDm && isDmEnabled) return;
                if (!isNotDm && isClientDmEnabled) return;
                if (isMessageNotEnabled || isClientMessageEnabled) return;

                const language = isNotDm ? await this.client.dispatcher.getGuildLanguage(message.guild.id) : this.client.language;

                const cooldown = message.guild ? await this.client.dispatcher.getCooldown(message.guild.id, message.author.id, commandos) : null;
                const getCooldownMessage = () => this.client.languageFile.COOLDOWN[language].replace(/{COOLDOWN}/g, `\`${ms(cooldown.wait, { long: true })}\``).replace(/{CMDNAME}/g, commandos.name);

                if (cooldown?.cooldown) return message.reply(getCooldownMessage());

                const isNotGuild = guild => !commandos.guildId.includes(guild);

                if (isNotDm && commandos.guildId.length && isNotGuild(message.guild.id)) return;

                const getUserSpecificMessage = () => this.client.languageFile.USER_SPECIFIC[language].replace(/{COMMAND}/g, commandos.name);

                if (commandos.userId.length) {
                    const users = commandos.userId.some(v => message.author.id === v);
                    if (!users) message.reply(getUserSpecificMessage());
                }

                if (isNotDm && commandos.channelOnly) {
                    if (typeof commandos.channelOnly === 'object') {
                        const channels = commandos.channelOnly.some(v => message.channel.id === v);
                        if (!channels) return;
                    } else if (message.channel.id !== commandos.channelOnly) { return; }
                }

                const NSFW = message.guild ? commandos.nsfw && !(message.channel as any).nsfw : null;
                const getNsfwMessage = () => this.client.languageFile.NSFW[language];

                if (NSFW) return message.reply(getNsfwMessage());

                const getMissingClientPermissionsMessage = () => this.client.languageFile.MISSING_CLIENT_PERMISSIONS[language].replace('{PERMISSION}', commandos.clientRequiredPermissions.map(v => Util.unescape(v, '_', ' ')).join(', '));

                if (isNotDm && commandos.clientRequiredPermissions.length) {
                    if ((message.channel as any).permissionsFor(message.guild.me).missing(commandos.clientRequiredPermissions).length > 0) return message.reply(getMissingClientPermissionsMessage());
                }

                const getMissingPermissionsMessage = () => this.client.languageFile.MISSING_PERMISSIONS[language].replace('{PERMISSION}', commandos.userRequiredPermissions.map(v => Util.unescape(v, '_', ' ')).join(', '));

                if (isNotDm && commandos.userRequiredPermissions.length) {
                    if (!message.member.permissions.has(commandos.userRequiredPermissions)) return message.reply(getMissingPermissionsMessage());
                }

                const getMissingRolesMessage = () => this.client.languageFile.MISSING_ROLES[language].replace('{ROLES}', `\`${commandos.userRequiredRoles.map(r => message.guild.roles.cache.get(r).name).join(', ')}\``);

                if (isNotDm && commandos.userRequiredRoles.length) {
                    const roles = commandos.userRequiredRoles.some(v => message.member.roles.cache.get(v));
                    if (!roles) return message.reply(getMissingRolesMessage());
                }

                const collector = new ArgumentManager(this.client, { message, args, language, isNotDm, commandos });
                if (await collector.get() === false) return;

                const finalArgs = collector.resolve();
                let botMessage;

                const runOptions: CommandRunOptions = {
                    member: message.member,
                    author: message.author,
                    guild: message.guild,
                    channel: (message.channel as any),
                    message: message,
                    client: this.client,
                    language: language,
                    command: commandos,
                    args: this.argsToArray(finalArgs.data),
                    objectArgs: this.argsToObject(finalArgs.data),

                    reply: async (options = undefined) => {
                        if (this.client.autoTyping || commandos.autoDefer) await message.channel.sendTyping();

                        const msg = await message.reply(options);
                        botMessage = msg;
                        return msg;
                    },
                    deferReply: async () => {
                        await runOptions.channel.sendTyping();
                    },
                    edit: async (options = undefined) => {
                        if (!botMessage) throw new DiscomError('[NEED REPLY]', `First you need to send a reply.`);
                        const editedMsg = await botMessage.edit(options);
                        return editedMsg;
                    },
                    deleteReply: async () => {
                        if (!botMessage) throw new DiscomError('[NEED REPLY]', `First you need to send a reply.`);
                        await botMessage.delete();
                    },
                    followUp: async (options = undefined) => {
                        if (!botMessage) throw new DiscomError('[NEED REPLY]', `First you need to send a reply.`);
                        if (this.client.autoTyping || commandos.autoDefer) await message.channel.sendTyping();

                        return botMessage.reply(options);
                    },
                };

                const inhibitReturn = await Util.inhibit(this.client, runOptions);
                if (inhibitReturn === false) return;

                await Promise.resolve(commandos.run(runOptions)).catch(async error => {
                    this.client.emit(Events.COMMAND_ERROR, { command: commandos, member: message.member, channel: message.channel, guild: message.guild, error });
                    if (typeof commandos.onError === 'function') await Promise.resolve(commandos.onError(runOptions, error));
                });

                this.client.emit(Events.COMMAND_EXECUTE, { command: commandos, member: message.member, channel: message.channel, guild: message.guild });
            } catch (e) {
                this.client.emit(Events.COMMAND_ERROR, { command: commandos, member: message.member, channel: message.channel, guild: message.guild, error: e });
                this.client.emit(Events.DEBUG, e);
            }
        };
    }

    private slashEvent() {
        this.client.on('interactionCreate', async (interaction: any) => {
            if (!(interaction.isCommand() || interaction.isContextMenu())) return;
            let commandos;
            try {
                commandos = this.client.commands.find(cmd =>
                    !this.client.caseSensitiveCommands ?
                        (String(interaction.commandName).toLowerCase() === String(cmd.name).toLowerCase() || String(interaction.commandName).toLowerCase() === String(cmd.contextMenuName).toLowerCase()) :
                        (String(interaction.commandName) === String(cmd.name) || String(interaction.commandName) === String(cmd.contextMenuName)),
                );
                if (!commandos) return this.client.emit(Events.COMMAND_NOT_FOUND, new Color(`&3[Discom] &cCommand not found (slash): &e➜ &3${interaction.commandName ? String(interaction.commandName) : null}`, { json: false }).getText());

                const isDmEnabled = ['false'].includes(String(commandos.allowDm));
                const isClientDmEnabled = !commandos.allowDm && ['false'].includes(String(this.client.allowDm));
                const isSlashEnabled = ['false', 'message'].includes(String(commandos.slash));
                const isClientSlashEnabled = !commandos.slash && ['false', 'message'].includes(String(this.client.slash));
                const isContextEnabled = String(commandos.context) === 'false';
                const isClientContextEnabled = String(this.client.context) === 'false';

                const channelType = Util.channelTypeRefactor(interaction.channel);
                const isNotDm = channelType !== 'dm';

                if (!isNotDm && isDmEnabled) return;
                if (!isNotDm && isClientDmEnabled) return;
                if (interaction.isCommand() && isSlashEnabled) return;
                if (interaction.isCommand() && !commandos.slash && isClientSlashEnabled) return;
                if (interaction.isContextMenu() && isContextEnabled) return;
                if (interaction.isContextMenu() && !commandos.context && isClientContextEnabled) return;

                const language = interaction.guild ? await this.client.dispatcher.getGuildLanguage(interaction.guild.id) : this.client.language;

                const cooldown = interaction.guild ? await this.client.dispatcher.getCooldown(interaction.guild.id, interaction.user.id, commandos) : null;
                const getCooldownMessage = () => this.client.languageFile.COOLDOWN[language].replace(/{COOLDOWN}/g, ms(cooldown.wait, { long: true })).replace(/{CMDNAME}/g, commandos.name);

                if (cooldown?.cooldown) return interaction.reply(getCooldownMessage());

                const getUserSpecificMessage = () => this.client.languageFile.USER_SPECIFIC[language].replace(/{COMMAND}/g, commandos.name);

                if (commandos.userId.length) {
                    const users = commandos.userId.some(v => interaction.user.id === v);
                    if (!users) return interaction.reply({ content: getUserSpecificMessage(), ephemeral: true });
                }

                if (isNotDm && commandos.channelOnly) {
                    if (typeof commandos.channelOnly === 'object') {
                        const channels = commandos.channelOnly.some(v => interaction.channel.id === v);
                        if (!channels) return;
                    } else if (interaction.channel.id !== commandos.channelOnly) { return; }
                }

                const NSFW = interaction.guild ? commandos.nsfw && !interaction.channel.nsfw : null;
                const getNsfwMessage = () => this.client.languageFile.NSFW[language];

                if (isNotDm && NSFW) { return interaction.reply({ content: getNsfwMessage(), ephemeral: true }); }

                const getMissingClientPermissionsMessage = () => this.client.languageFile.MISSING_CLIENT_PERMISSIONS[language].replace('{PERMISSION}', commandos.clientRequiredPermissions.map(v => Util.unescape(v, '_', ' ')).join(', '));

                if (isNotDm && commandos.clientRequiredPermissions.length) {
                    if (interaction.guild.channels.cache.get(interaction.channel.id).permissionsFor(interaction.guild.me).missing(commandos.clientRequiredPermissions).length > 0) {
                        return interaction.reply({
                            content: getMissingClientPermissionsMessage(),
                            ephemeral: true,
                        });
                    }
                }

                const getMissingPermissionsMessage = () => this.client.languageFile.MISSING_PERMISSIONS[language].replace('{PERMISSION}', commandos.userRequiredPermissions.map(v => Util.unescape(v, '_', ' ')).join(', '));

                if (isNotDm && commandos.userRequiredPermissions.length) {
                    if (!interaction.member.permissions.has(commandos.userRequiredPermissions)) {
                        return interaction.reply({
                            content: getMissingPermissionsMessage(),
                            ephemeral: true,
                        });
                    }
                }

                const getMissingRolesMessage = () => this.client.languageFile.MISSING_ROLES[language].replace('{ROLES}', `\`${commandos.userRequiredRoles.map(r => interaction.guild.roles.cache.get(r).name).join(', ')}\``);

                if (isNotDm && commandos.userRequiredRoles.length) {
                    const roles = commandos.userRequiredRoles.some(v => interaction.member.roles.cache.get(v));
                    if (!roles) return interaction.reply({ content: getMissingRolesMessage(), ephemeral: true });
                }

                let sentMsg = false;
                const runOptions = {
                    client: this.client,
                    interaction: interaction,
                    member: interaction.member,
                    guild: interaction.guild,
                    channel: interaction.channel,
                    args: this.argsToArray(interaction.options.data),
                    objectArgs: this.argsToObject(interaction.options.data),
                    author: interaction.user,
                    language: language,
                    command: commandos,

                    edit: (options = undefined) => interaction.editReply(options),
                    followUp: async (options = undefined) => {
                        sentMsg = true;
                        await interaction.followUp(options);
                    },
                    deleteReply: () => interaction.deleteReply(),
                    reply: async (options = undefined) => {
                        if (sentMsg) return interaction.followUp(options);
                        sentMsg = true;

                        await interaction.reply(options);
                    },
                    deferReply: async options => {
                        sentMsg = true;
                        await interaction.deferReply(options);
                    },
                };

                const inhibitReturn = await Util.inhibit(this.client, runOptions);
                if (inhibitReturn === false) return;

                await Promise.resolve(commandos.run(runOptions)).catch(async error => {
                    this.client.emit(Events.COMMAND_ERROR, { command: commandos, member: interaction.member, channel: interaction.channel, guild: interaction.guild, error });
                    if (typeof commandos.onError === 'function') await Promise.resolve(commandos.onError(runOptions, error));
                });

                this.client.emit(Events.COMMAND_EXECUTE, { command: commandos, member: interaction.member, channel: interaction.channel, guild: interaction.guild });
            } catch (e) {
                this.client.emit(Events.COMMAND_ERROR, { command: commandos, member: interaction.member, channel: interaction.channel, guild: interaction.guild, error: e });
                this.client.emit(Events.DEBUG, e);
            }
        });
    }

    private handleAutocomplete() {
        this.client.on('autoComplete', async (interaction: AutocompleteInteraction) => {
            let commandos;
            try {
                commandos = this.client.commands.get(interaction.commandName);
                if (!commandos) return this.client.emit(Events.COMMAND_NOT_FOUND, new Color(`&3[Discom] &cCommand not found (autocomplete): &e➜ &3${interaction.commandName ? String(interaction.commandName) : null}`, { json: false }).getText());

                const focused = interaction.options.getFocused(true);
                const argument = commandos.args.find(arg => arg.name === focused.name);
                if (!argument) return this.client.emit(Events.AUTOCOMPLETE_NOT_FOUND, new Color(`&3[Discom] &cAutocomplete Interaction not found: &e➜ &3${focused.name}`, { json: false }).getText());

                const runOptions: AutocompleteRunOptions = {
                    interaction,
                    client: (interaction.client as DiscomClient),
                    command: (commandos as Command),
                    guild: (interaction.guild as Guild),
                    channel: (interaction.channel as any),
                    member: (interaction.member as GuildMember),
                    user: (interaction.user as User),
                    language: (await interaction.guild.getLanguage() as GuildLanguageTypes),
                    value: (focused.value as string),
                    respond: (choices = []) => interaction.respond(choices),
                };

                if (typeof argument.run === 'function') await argument.run(runOptions);
                else throw new Error('Argument does not have a run function');

                this.client.emit(Events.AUTOCOMPLETE_EXECUTE, { command: commandos, member: interaction.member, channel: interaction.channel, guild: interaction.guild });
            } catch (e) {
                this.client.emit(Events.AUTOCOMPLETE_ERROR, { command: commandos, member: interaction.member, channel: interaction.channel, guild: interaction.guild, error: e });
                this.client.emit(Events.DEBUG, e);
            }
        });
    }

    private async loadMoreEvents() {
        readdirSync(`${__dirname}/../base/actions/`).filter(f => f.endsWith('.js')).forEach(file => {
            require(`../base/actions/${file}`).default(this.client);
        });
    }

    private argsToObject(options) {
        if (!Array.isArray(options)) return {};
        const args = {};

        for (const o of options) {
            if (['SUB_COMMAND', 'SUB_COMMAND_GROUP'].includes(o.type)) {
                args[o.name] = this.argsToObject(o.options);
            } else {
                args[o.name] = o.value;
            }
        }

        return args;
    }

    private argsToArray(options) {
        const args = [];

        const check = option => {
            if (!option) return;
            if (option.value) args.push(option.value);
            else args.push(option.name);

            if (option.options) {
                for (let o = 0; o < option.options.length; o++) {
                    check(option.options[o]);
                }
            }
        };

        if (Array.isArray(options)) {
            for (let o = 0; o < options.length; o++) {
                check(options[o]);
            }
        } else {
            check(options);
        }

        return args;
    }
}
