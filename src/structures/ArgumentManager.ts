import type { DiscomClient, GuildLanguageTypes } from '../base/Client';
import type { Command, CommandArgsOptions } from './Command';
import { Argument } from './Argument';
import { ArgumentType } from '../util/Constants';
import { CommandInteractionOptionResolver, Collection, Message } from 'discord.js';

export interface ArgumentManagerDataOption {
    message: Message;
    args: Array<string>;
    language: GuildLanguageTypes,
    isNotDm: boolean;
    commandos: Command
}

/**
 * Manages arguments for normal commands.
 */
export class ArgumentManager {
    public client: DiscomClient;
    public message: Message;
    public args: Array<any>;
    public language: GuildLanguageTypes;
    public isNotDm: boolean;
    public cmdArgs: Array<CommandArgsOptions>;
    public commandos: Command;
    public timeLimitMessage: string;
    public options: Array<any>;
    public resolved: any;

    constructor(client: DiscomClient, data: ArgumentManagerDataOption) {
        /**
         * The client.
         * @type {DiscomClient}
         */
        this.client = client;
        /**
         * The message.
         * @type {Message}
         */
        this.message = data.message;
        /**
         * The arguments.
         * @type {Array<any>}
         */
        this.args = data.args;
        /**
         * The language.
         * @type {GuildLanguageTypes}
         */
        this.language = data.language;
        /**
         * Whether the command is ran on a DM channel.
         * @type {boolean}
         */
        this.isNotDm = data.isNotDm;
        /**
         * The command arguments.
         * @type {Array<CommandArgsOptions>}
         */
        this.cmdArgs = JSON.parse(JSON.stringify(data.commandos.args));
        /**
         * The command.
         * @type {Command}
         */
        this.commandos = data.commandos;
        /**
         * The time limit message.
         * @type {string}
         */
        this.timeLimitMessage = this.client.languageFile.ARGS_TIME_LIMIT[data.language];
        /**
         * The options.
         * @type {Array<any>}
         */
        this.options = [];
        /**
         * The resolved options.
         * @type {any}
         */
        this.resolved = {};
    }

    /**
     * Adds an argument to the manager.
     * @returns {Promise<any>}
     */
    async get() {
        for (let i = 0; i < this.cmdArgs.length; i++) {
            const arg: any = this.cmdArgs[i];
            if ([ArgumentType.SUB_COMMAND, ArgumentType.SUB_COMMAND_GROUP].includes(arg.type)) arg.subcommands = this.cmdArgs.filter((sc: any) => [ArgumentType.SUB_COMMAND, ArgumentType.SUB_COMMAND_GROUP].includes(sc.type));

            const argument = new Argument(this.client, arg, this.isNotDm);
            if (argument.type === 'invalid') continue;

            const rawArg = this.cmdArgs[i + 1] ? this.args[0] : argument.type === 'ATTACHMENT' && this.message.attachments.size ? this.message : argument.type === 'STRING' ? this.args.join(' ') : this.args[0];
            let result;

            if (rawArg) {
                const invalid = argument.argument.validate(argument, { content: this.args[0]?.toLowerCase(), guild: this.message.guild, attachments: this.message.attachments }, this.language);

                if (invalid) {
                    result = await argument.obtain(this.message, this.language, invalid);
                } else {
                    result = argument.get(rawArg);
                }
            } else {
                result = await argument.obtain(this.message, this.language, arg.prompt);
            }

            if (result === 'cancel') return false;

            if (result === 'timelimit' && argument.required) {
                this.message.reply(this.timeLimitMessage);
                return false;
            } else if (result === 'timelimit') { continue; }

            if (result === 'skip') continue;

            if (this.args[0]) this.args.shift();

            if (typeof result === 'object') {
                this.addArgument({
                    type: argument.type,
                    name: result.name,
                });
                this.cmdArgs = result.options ?? [];
                return this.get();
            } else {
                this.addArgument(argument.argument.resolve({
                    type: argument.type,
                    value: result,
                    name: argument.name,
                }));
            }
        }
    }

    /**
     * Resolves the options.
     */
    resolve(): CommandInteractionOptionResolver {
        // @ts-expect-error Because its a private method retard
        return new CommandInteractionOptionResolver(this.client, this.options, this.resolved);
    }

    /**
     * Adds an argument to the manager.
     * @param argument The argument to add.
     */
    addArgument(argument) {
        this.addResolved(argument);
        if (['SUB_COMMAND', 'SUB_COMMAND_GROUP'].includes(this.options[0]?.type)) {
            if (!Array.isArray(this.options[0].options)) this.options[0].options = [];

            if (['SUB_COMMAND', 'SUB_COMMAND_GROUP'].includes(this.options[0].options[0]?.type)) {
                if (!Array.isArray(this.options[0].options[0].options)) this.options[0].options[0].options = [];
                return this.options[0].options[0].options.push(argument);
            }

            return this.options[0].options.push(argument);
        }
        return this.options.push(argument);
    }

    /**
     * Adds a resolved argument to the manager.
     * @param argument The argument to add.
     */
    addResolved(argument) {
        if (!this.resolved[argument.type]) this.resolved[argument.type] = new Collection();
        this.resolved[argument.type].set(argument.name, argument);
    }
}
