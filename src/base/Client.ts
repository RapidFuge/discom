import type { Command } from '../structures/Command';
import type { Event } from '../structures/Event';
import { CommandLoader } from '../managers/CommandLoader';
import { Dispatcher } from './Dispatcher';
import { EventLoader } from '../managers/EventLoader';
import { EventHandler } from '../managers/EventHandler';
import { Updater } from '../util/updater';
import { Collection, Client as DiscordClient, ClientOptions, ClientEvents, AutocompleteInteraction, ButtonInteraction, StringSelectMenuComponent, Guild, GuildMember, VoiceChannel, VoiceState, ContextMenuCommandInteraction, Message, ThreadChannel, Role, CommandInteraction } from 'discord.js';
import { readdirSync } from 'fs';
import { DiscomError } from '../structures/DiscomError';

export type GuildLocaleTypes = 'en-US' | 'en-GB' | 'bg' | 'zh-CN' | 'zh-TW' | 'hr' | 'cs' | 'da' | 'nl' | 'fi' | 'fr' | 'de' | 'el' | 'hi' | 'hu' | 'it' | 'ja' | 'ko' | 'lt' | 'no' | 'pl' | 'pt-BR' | 'ro' | 'ru' | 'es-ES' | 'sv-SE' | 'th' | 'tr' | 'uk' | 'vi';
export type OptionsCommandsContext = 'both' | 'user' | 'message' | 'false';

export interface DiscomClientCommandsOptions {
    context?: OptionsCommandsContext;
    autoTyping?: boolean;
    allowDm?: boolean;
    loadFromCache?: boolean;
    defaultCooldown?: string | number;
    deleteNonExistent?: boolean;
}

export interface DiscomEvents extends ClientEvents {
    selectMenu: [StringSelectMenuComponent];
    clickButton: [ButtonInteraction];
    autoComplete: [AutocompleteInteraction];
    slashCommand: [CommandInteraction];
    contextMenu: [ContextMenuCommandInteraction];
    commandExecute: [Command, GuildMember];
    commandError: [Command, GuildMember, string];
    commandsLoaded: [Collection<string, Command>];
    commandNotFound: [string];
    autocompleteNotFound: [string];
    autocompleteError: [Command, GuildMember];
    autocompleteExecute: [Command, GuildMember];
    log: [string];
    debug: [string];

    guildBoostLevelUp: [Guild, number, number];
    guildBoostLevelDown: [Guild, number, number];
    guildBannerUpdate: [Guild, string, string];
    guildAfkChannelUpdate: [Guild, VoiceChannel, VoiceChannel];
    guildVanityURLUpdate: [Guild, string, string];
    guildFeaturesUpdate: [Guild, object, object];
    guildAcronymUpdate: [Guild, string, string];
    guildOwnerUpdate: [Guild, GuildMember, GuildMember];
    guildMaximumMembersUpdate: [Guild, number, number];
    guildPartnerUpdate: [Guild, boolean, boolean];
    guildVerifyUpdate: [Guild, boolean, boolean];

    voiceChannelJoin: [VoiceChannel, VoiceState];
    voiceChannelLeave: [VoiceChannel, VoiceState];
    voiceChannelSwitch: [VoiceChannel, VoiceChannel, VoiceState];
    voiceChannelMute: [VoiceChannel, string];
    voiceChannelUnmute: [VoiceChannel, string];
    voiceChannelDeaf: [VoiceChannel, string];
    voiceChannelUndeaf: [VoiceChannel, string];
    voiceStreamingStart: [VoiceChannel, VoiceChannel];
    voiceStreamingStop: [VoiceChannel, VoiceChannel];

    threadStateUpdate: [ThreadChannel, boolean, boolean];
    threadNameUpdate: [ThreadChannel, string, string];
    threadLockStateUpdate: [ThreadChannel, boolean, boolean];
    threadRateLimitPerUserUpdate: [ThreadChannel, number, number];
    threadAutoArchiveDurationUpdate: [ThreadChannel, number, number];

    guildMemberNicknameUpdate: [GuildMember, string, string];
    guildMemberAcceptShipScreening: [GuildMember];
    guildMemberBoost: [GuildMember, number, number];
    guildMemberUnboost: [GuildMember, number, number];
    guildMemberRoleAdd: [GuildMember, Role];
    guildMemberRoleRemove: [GuildMember, Role];

    userAvatarUpdate: [GuildMember, string, string];
    userUsernameUpdate: [GuildMember, string, string];
    userDiscriminatorUpdate: [GuildMember, string, string];
    userFlagsUpdate: [GuildMember, string, string];

    rolePositionUpdate: [GuildMember, number, number];
    rolePermissionsUpdate: [GuildMember, number, number];

    messageContentEdited: [GuildMember, string, string];
    messagePinned: [Message];
}

export interface DiscomClientOptions extends ClientOptions {
    language: GuildLocaleTypes;
    ownLanguageFile?: any;
    cmdDir: string;
    eventDir?: string;
    autoCategory?: boolean;
    commands?: DiscomClientCommandsOptions;
}

/**
 * The main DiscomClient class
 * @extends {Client}
 */
export class DiscomClient extends DiscordClient {
    public deleteNonExistent: boolean;
    public cmdDir: string;
    public eventDir: string;
    public autoTyping: boolean;
    public languageFile: any;
    public language: GuildLocaleTypes;
    public categories: string[];
    public commands: Collection<string, Command>;
    public events: Collection<string, Event>;
    public context: OptionsCommandsContext;
    public loadFromCache: boolean;
    public allowDm: boolean;
    public defaultCooldown: string | number;
    public dispatcher: Dispatcher;
    public inhibitors: Map<number, any>;
    public cooldowns: Collection<string, Collection<string, number | object>>;
    public on: <K extends keyof DiscomEvents>(event: K, listener: (...args: DiscomEvents[K]) => void) => this;

    constructor(options: DiscomClientOptions) {
        super(options);

        if (!options.cmdDir) throw new DiscomError('[DEFAULT OPTIONS]', 'You must specify the cmdDir');
        if (!options.language) throw new DiscomError('[DEFAULT OPTIONS]', 'You must specify the language');

        /**
         * This will delete Application commands that are changed or deleted.
         * @type {boolean}
         */
        this.deleteNonExistent = String(options.commands?.deleteNonExistent).toLowerCase() === 'true';
        /**
         * The directory where the commands are located.
         * @type {string}
         */
        this.cmdDir = options.cmdDir;
        /**
         * The directory where the events are located.
         * @type {string}
         */
        this.eventDir = options.eventDir;
        /**
         * Whether the bot should auto type or not.
         * @type {boolean}
         */
        this.autoTyping = String(options.commands?.autoTyping).toLowerCase() === 'true';

        /**
         * The language file. This contains all the language strings like the message if you reached the time limit for arguments.
         * @type {any}
         */
        if (!options.ownLanguageFile) this.languageFile = require('../util/message.json');
        else this.languageFile = options.ownLanguageFile;

        /**
         * The language of the bot.
         * @type {GuildLocaleTypes}
         */
        this.language = options.language;
        /**
         * The categories of the commands.
         * @type {Array<string>}
         */
        this.categories = readdirSync(this.cmdDir);
        /**
         * The commands.
         * @type {Collection<string, Command>}
         */
        this.commands = new Collection();
        /**
         * The events.
         * @type {Collection<string, Event>}
         */
        this.events = new Collection();
        /**
         * Whether the commands that doesn't have context defined be: User Only, Message Only, Both, or Disabled.
         * @type {OptionsCommandsContext}
         */
        this.context = options.commands?.context || 'false';
        /**
         * Whether the commands should be loaded from cache or not.
         * @type {boolean}
         */
        this.loadFromCache = options.commands?.loadFromCache !== undefined ? String(options.commands?.loadFromCache).toLowerCase() === 'true' : true;
        /**
         * Whether the bot should listen to DM messages or not.
         * @type {boolean}
         */
        this.allowDm = options.commands?.allowDm !== undefined ? String(options.commands?.allowDm).toLowerCase() === 'true' : false;
        /**
         * The default cooldown of the commands.
         * @type {string | number}
         */
        this.defaultCooldown = options.commands.defaultCooldown ? options.commands.defaultCooldown : 0;
        /**
         * The dispatcher of the commands.
         * @type {Dispatcher}
         */
        this.dispatcher = new Dispatcher(this, true);

        setImmediate(() => {
            super.on('ready', () => {
                this.loadSys();
            });
        });
        Updater.__updater();
    }

    private loadSys() {
        setTimeout(() => {
            new EventHandler(this);
            new EventLoader(this);
            new CommandLoader(this);
        }, 1000);
    }
}
