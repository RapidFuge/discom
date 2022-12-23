/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { DiscomClient } from '../base/Client';
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { readdirSync } from 'fs';
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

        this.slashEvent();
        this.handleAutocomplete();
        this.loadMoreEvents();
    }

    private slashEvent() {
        this.client.on('slashCommand', async (interaction: CommandInteraction) => {
            let commandos;
            try {
                commandos = this.client.commands.find(cmd => interaction.commandName === cmd.name || interaction.commandName === cmd.contextMenuName);
                if (!commandos) return this.client.emit(Events.COMMAND_NOT_FOUND, new Color(`&b[&3Discom&b] &2Slash Command not found: &b➜ &9${interaction.commandName ? String(interaction.commandName) : null}`, { json: false }).getText());

                const isDmEnabled = ['false'].includes(String(commandos.allowDm));
                const isClientDmEnabled = !commandos.allowDm && ['false'].includes(String(this.client.allowDm));
                const isCommandDisabled = commandos.disabled;
                const isContextEnabled = String(commandos.context) === 'false';
                const isClientContextEnabled = String(this.client.context) === 'false';

                const channelType = Util.channelTypeRefactor(interaction.channel);
                const isNotDm = channelType !== 'dm';

                if (!isNotDm && isDmEnabled) return;
                if (!isNotDm && isClientDmEnabled) return;
                if (interaction.isCommand() && isCommandDisabled) return;
                if (interaction.isContextMenuCommand() && isContextEnabled) return;
                if (interaction.isContextMenuCommand() && !commandos.context && isClientContextEnabled) return;

                const language = interaction.guild ? interaction.guildLocale : this.client.language;

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

                // @ts-ignore
                const NSFW = interaction.guild ? commandos.nsfw && !interaction.channel.nsfw : null;
                const getNsfwMessage = () => this.client.languageFile.NSFW[language];

                if (isNotDm && NSFW) { return interaction.reply({ content: getNsfwMessage(), ephemeral: true }); }

                const getMissingClientPermissionsMessage = () => this.client.languageFile.MISSING_CLIENT_PERMISSIONS[language].replace('{PERMISSION}', commandos.clientRequiredPermissions.map(v => Util.unescape(v, '_', ' ')).join(', '));

                if (isNotDm && commandos.clientRequiredPermissions.length) {
                    if (interaction.guild.channels.cache.get(interaction.channel.id).permissionsFor(interaction.guild.members.me).missing(commandos.clientRequiredPermissions).length > 0) {
                        return interaction.reply({
                            content: getMissingClientPermissionsMessage(),
                            ephemeral: true,
                        });
                    }
                }

                const getMissingPermissionsMessage = () => this.client.languageFile.MISSING_PERMISSIONS[language].replace('{PERMISSION}', commandos.userRequiredPermissions.map(v => Util.unescape(v, '_', ' ')).join(', '));

                if (isNotDm && commandos.userRequiredPermissions.length) {
                    // @ts-ignore
                    if (!interaction.member.permissions.has(commandos.userRequiredPermissions)) {
                        return interaction.reply({
                            content: getMissingPermissionsMessage(),
                            ephemeral: true,
                        });
                    }
                }

                const getMissingRolesMessage = () => this.client.languageFile.MISSING_ROLES[language].replace('{ROLES}', `\`${commandos.userRequiredRoles.map(r => interaction.guild.roles.cache.get(r).name).join(', ')}\``);

                if (isNotDm && commandos.userRequiredRoles.length) {
                    // @ts-ignore
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
                    args: interaction.options,
                    author: interaction.user,
                    language: language,
                    command: commandos,

                    showModal: (modal = undefined) => interaction.showModal(modal),
                    deleteReply: (options = undefined) => interaction.deleteReply(options),
                    edit: (options = undefined) => interaction.editReply(options),
                    followUp: async (options = undefined) => {
                        sentMsg = true;
                        return interaction.followUp(options);
                    },
                    reply: async (options = undefined) => {
                        if (sentMsg) return interaction.followUp(options);
                        sentMsg = true;

                        return interaction.reply(options);
                    },
                    deferReply: async options => {
                        sentMsg = true;
                        return interaction.deferReply(options);
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
                if (!commandos) return this.client.emit(Events.COMMAND_NOT_FOUND, new Color(`&b[&3Discom&b] &2Autocomplete Interaction not found: &b➜ &9${interaction.commandName ? String(interaction.commandName) : null}`, { json: false }).getText());

                const focused = interaction.options.getFocused(true);
                const argument = commandos.args.find(arg => arg.name === focused.name);
                if (!argument) return this.client.emit(Events.AUTOCOMPLETE_NOT_FOUND, new Color(`&b[&3Discom&b] &2Autocomplete Interaction not found: &b➜ &9${focused.name}`, { json: false }).getText());

                const runOptions = {
                    interaction,
                    client: interaction.client,
                    command: commandos,
                    guild: interaction.guild,
                    channel: interaction.channel,
                    member: interaction.member,
                    user: interaction.user,
                    locale: interaction.guildLocale,
                    value: focused.value,
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
}
