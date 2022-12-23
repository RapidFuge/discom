import type { DiscomClient, OptionsCommandsContext } from '../base/Client';
import type { Snowflake, InteractionReplyOptions, ApplicationCommandOption, AutocompleteInteraction, CommandInteraction, InteractionDeferReplyOptions, MessagePayload, ContextMenuCommandInteraction, GuildMember, Message, Guild, TextChannel, NewsChannel, ThreadChannel, User, DMChannel, ModalBuilder } from 'discord.js';
import { ArgumentChannelTypes, ArgumentType } from '../util/Constants';
import { DiscomError } from './DiscomError';

export interface AutocompleteRunOptions {
    client: DiscomClient;
    interaction: AutocompleteInteraction;
    member: GuildMember;
    user: User;
    guild: Guild;
    channel: TextChannel | NewsChannel | ThreadChannel | DMChannel;
    command: Command;
    locale: string;
    value: string;

    respond: (choices: Array<ArgumentChoice>) => Promise<void>;
}


export interface CommandRunOptions {
    client: DiscomClient;
    interaction?: CommandInteraction | ContextMenuCommandInteraction;
    member: GuildMember;
    message?: Message;
    guild: Guild;
    channel: TextChannel | NewsChannel | ThreadChannel | DMChannel;
    args: Array<ApplicationCommandOption>;
    command: Command;
    author: User;
    locale: string;

    reply(options: string | MessagePayload | InteractionReplyOptions): Promise<Message>;
    edit(options: string | MessagePayload | InteractionReplyOptions): Promise<void>;
    followUp(options: string | MessagePayload | InteractionReplyOptions): Promise<void>;
    deferReply(options?: InteractionDeferReplyOptions): Promise<void>;
    showModal(modal: ModalBuilder): Promise<void>;
    deleteReply(): Promise<void>;
}

export interface ArgumentChoice {
    name: string;
    name_localizations: any;
    value: string | number;
}

export interface CommandArgsAutocompleteOptions {
    interaction: AutocompleteInteraction;
    client: DiscomClient;
    command: Command;
    guild: Guild;
    channel: TextChannel | NewsChannel | DMChannel;
    member: GuildMember;
    locale: string;
    value: string | number;
    respond: (choices: Array<ArgumentChoice>) => Promise<void>;
}

export interface CommandArgsOptions {
    type: ArgumentType;
    name: string;
    name_localizations?: any;
    description: string;
    description_localizations?: string;
    required: boolean;
    choices?: ArgumentChoice[];
    options?: CommandArgsOptions;
    channel_types?: ArgumentChannelTypes[];
    min_value?: number;
    max_value?: number;
    min_length?: number;
    max_length?: number;
    autocomplete?: boolean;
    run?: CommandArgsAutocompleteOptions;
    subcommands?: any;
}

export interface CommandOptions {
    client?: DiscomClient;
    name: string;
    name_localizations?: any;
    contextMenuName?: string;
    description: string;
    description_localizations?: any;
    cooldown?: string;
    disabled?: boolean;
    args?: Array<CommandArgsOptions>;
    userRequiredPermissions?: string | Array<string>;
    userRequiredRoles?: Snowflake | Array<Snowflake>;
    clientRequiredPermissions?: string | Array<string>;
    userId?: Snowflake | Array<Snowflake>;
    channelId?: Snowflake | Array<Snowflake>;
    guildId?: Snowflake | Array<Snowflake>;
    allowDm?: boolean;
    nsfw?: boolean;
    category?: string;
    usage?: string;
    context?: OptionsCommandsContext;
    onError?: (options: CommandRunOptions, error: any) => any;
    run: (options: CommandRunOptions) => any;
}

/**
 * The Command class
 */
export class Command {
    public client: DiscomClient;
    public name: string;
    public name_localizations: any;
    public contextMenuName?: string;
    public description: string;
    public description_localizations: any;
    public cooldown?: string;
    public disabled?: boolean;
    public args?: Array<CommandArgsOptions>;
    public clientRequiredPermissions?: Array<string>;
    public userRequiredPermissions?: Array<string>;
    public userRequiredRoles?: Array<Snowflake>;
    public userId?: Array<Snowflake>;
    public guildId?: Array<Snowflake>;
    public channelId?: Array<Snowflake>;
    public nsfw?: boolean;
    public context?: OptionsCommandsContext;
    public usage?: string;
    public allowDm?: boolean;
    public category?: string;
    public _path: string;
    public _options: CommandOptions;
    public onError?: (options: CommandRunOptions, error: any) => any;
    public run: (options: CommandRunOptions) => any;

    constructor(options: CommandOptions) {
        /**
         * The name of the command. This is the name that is used to call the command.
         * @type {string}
         */
        this.name = options.name;
        /**
         * The name of the command. But in different languages. see the list of discord locales [here](https://discord.com/developers/docs/reference#locales)
         * @type {any}
         */
        this.name_localizations = options.name_localizations || {};
        /**
         * The context menu name of the command. This is the name that is used to call the command in the context menu if this is defined. If not, the name is used.
         * @type {string}
         */
        this.contextMenuName = options.contextMenuName;
        /**
         * The description of the command. This is the description that is shown in the help command.
         * @type {string}
         */
        this.description = options.description;
        /**
         * The description of the command. But in different languages. see the list of discord locales [here](https://discord.com/developers/docs/reference#locales)
         * @type {any}
         */
        this.description_localizations = options.description_localizations || {};
        /**
         * The cooldown of the command. This is the time in seconds that the bot has to wait before being able to be used again.
         * @type {string | number}
         */
        this.cooldown = options.cooldown;
        /**
         * Determines if the command would be enabled or disabled.
         * @type {boolean}
         */
        this.disabled = options.disabled;
        /**
         * The arguments/options of the command. This is the arguments that are used to call the command.
         * @type {Array<CommandArgsOptions>}
         */
        this.args = options.args ? options.args.map(arg => {
            const types = arg.channel_types ? !Array.isArray(arg.channel_types) ? [arg.channel_types] : arg.channel_types : [];
            const final = [];

            for (const type of types) {
                final.push(ArgumentChannelTypes[type]);
            }

            if (final.length !== 0) arg.channel_types = final;
            if (arg.run && !arg.autocomplete) arg.autocomplete = true;

            return arg;
        }) : [];
        /**
         * The client required permissions of the command. This is the permissions that the client has to have to be able to use the command.
         * @type {Array<Snowflake>}
         */
        this.userRequiredPermissions = options.userRequiredPermissions ? Array.isArray(options.userRequiredPermissions) ? options.userRequiredPermissions : Array(options.userRequiredPermissions) : [];
        /**
         * The user required roles of the command. This is the roles that the user has to have to be able to use the command.
         * @type {Array<Snowflake>}
         */
        this.userRequiredRoles = options.userRequiredRoles ? Array.isArray(options.userRequiredRoles) ? options.userRequiredRoles : Array(options.userRequiredRoles) : [];
        /**
         * The client required permissions of the command. This is the permissions that the client has to have to be able to use the command.
         * @type {Array<Snowflake>}
         */
        this.clientRequiredPermissions = options.clientRequiredPermissions ? Array.isArray(options.clientRequiredPermissions) ? options.clientRequiredPermissions : Array(options.clientRequiredPermissions) : [];
        /**
         * If the command is for a specific user(s), Set the id or snowflake of the user. NOTE: The command will be disabled for other users if the command is guild only, if not, it will not respond to users not included in the array.
         * @type {Array<Snowflake>}
         */
        this.userId = options.userId ? Array.isArray(options.userId) ? options.userId : Array(options.userId) : [];
        /**
         * If the command is for a specific channel(s) only, Set the id or snowflake of the channel. NOTE: The command will be disabled for other channels if the command is guild only, if not, it will not respond to channels not included in the array.
         * @type {Array<Snowflake>}
         */
        this.channelId = options.channelId ? Array.isArray(options.channelId) ? options.channelId : Array(options.channelId) : [];
        /**
         * If the command is allowed to respond in the DMs.
         * @type {Array<Snowflake>}
         */
        this.allowDm = options.allowDm;
        /**
         * If the command is for a specific guild(s) only. Set the id or snowflake of the guild.
         * @type {Array<Snowflake>}
         */
        this.guildId = options.guildId ? Array.isArray(options.guildId) ? options.guildId : Array(options.guildId) : [];
        /**
         * If the command is for nsfw channels only. NOTE: This command will show up in non nsfw channelss too. BUT, it will not respond to channels that are NOT nsfw,
         * @type {boolean}
         */
        this.nsfw = String(options.nsfw).toLowerCase() === 'true';
        /**
         * If the command should be: User Only, Message Only, Both, Or None. See more info here: https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
         */
        this.context = options.context;
        /**
         * The category of the command. This is used to group commands together.
         * @type {string}
         */
        this.category = options.category;
        /**
         * The usage of the command. This is used to show the usage of the command.
         * @type {string}
         */
        this.usage = options.usage;
        /**
         * Whenever an error occurs inside the run function, this will be called.
         * @param {CommandRunOptions} options The run options of the command.
         * @param {Error} error The error that was thrown.
         */
        this.onError = options.onError && typeof options.run !== 'function' ? options.onError : undefined;
        /**
         * The run function of the command. This is the function that is called when the command is called.
         * @param {CommandRunOptions} options The options of the run function.
         */
        this.run = options.run;
        /**
         * The Local path of the command. This is the path of the command.
         * @type {string}
         */
        this._path;
        /**
         * Options, ability to add own options
         * @type {Object}
         */
        this._options = options;
    }

    /**
    * Initialize the command
    * @param {DiscomClient} client
    */
    init(client) {
        this.client = client;
    }

    /**
     * Reloads the command.
     */
    async reload(): Promise<boolean> {
        const cmdPath = this.client.commands.get(this.name)._path;

        delete require.cache[require.resolve(cmdPath)];
        this.client.commands.delete(this.name);

        const newCommand = await require(cmdPath);
        newCommand.init(this.client);

        if (!(newCommand instanceof Command)) throw new DiscomError('[COMMAND]', `Command ${newCommand.name} doesn't belong in Commands.`);
        if (newCommand.name !== this.name) throw new DiscomError('[COMMAND]', 'Command name cannot change.');

        const nglds = newCommand.guildId;
        const check1 = nglds.every((x, i) => x === this.guildId[i]);
        const check2 = this.guildId.every((x, i) => x === nglds[i]);
        if (!check1 || !check2) throw new DiscomError('[COMMAND]', 'guildId values cannot be changed. Restart the client to apply changes.');

        newCommand._path = cmdPath;
        this.client.commands.set(newCommand.name, newCommand);
        return true;
    }
}
