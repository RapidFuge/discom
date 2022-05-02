import type { DiscomClient, GuildLanguageTypes } from '../base/Client';
import type { ArgumentChoice, Command, CommandArgsOptions } from './Command';
import { MessageActionRow, MessageButton, MessageSelectMenu, AutocompleteInteraction, Message, GuildMember, DMChannel, ThreadChannel, NewsChannel, TextChannel, Guild, User } from 'discord.js';
import { SubCommandArgumentType } from './types/sub_command';
import { SubCommandGroupArgumentType } from './types/sub_command_group';
import { StringArgumentType } from './types/string';
import { IntegerArgumentType } from './types/integer';
import { BooleanArgumentType } from './types/boolean';
import { ChannelArgumentType } from './types/channel';
import { UserArgumentType } from './types/user';
import { RoleArgumentType } from './types/role';
import { NumberArgumentType } from './types/number';
import { MentionableArgumentType } from './types/mentionable';
import { AttachmentArgumentType } from './types/attachment';
import { ArgumentType } from '../util/Constants';

export type ArgumentTypes = 'SUB_COMMAND' | 'SUB_COMMAND_GROUP' | 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE' | 'MENTIONABLE' | 'NUMBER' | 'ATTACHMENT' | 'invalid';

export interface AutocompleteRunOptions {
    client: DiscomClient;
    interaction: AutocompleteInteraction;
    member: GuildMember;
    user: User;
    guild: Guild;
    channel: TextChannel | NewsChannel | ThreadChannel | DMChannel;
    command: Command;
    language: GuildLanguageTypes;
    value: string;

    respond: (choices: Array<ArgumentChoice>) => Promise<void>;
}

/**
 * The Argument class
 */
export class Argument {
    public client: DiscomClient;
    public name: string;
    public isNotDm: boolean;
    public required: boolean;
    public argument: any;
    public type: ArgumentTypes;
    public prompt?: string;
    public choices?: Array<ArgumentChoice>;
    public channel_types?: string[];
    public min_value: number;
    public max_value: number;
    public subcommands?: Array<any>;

    constructor(client: DiscomClient, argument: CommandArgsOptions, isNotDm: boolean) {
        /**
         * The client.
         * @type {DiscomClient}
         */
        this.client = client;
        /**
         * The name of the argument.
         * @type {string}
         */
        this.name = argument.name;
        /**
         * Whether or not the command was ran in a DM channel.
         * @type {boolean}
         */
        this.isNotDm = isNotDm;
        /**
         * Whether or not the argument is required.
         * @type {boolean}
         */
        this.required = argument.required;
        /**
         * The argument object.
         * @type {Argument}
         */
        this.argument = this.determineArgument(client, argument);
        /**
         * The type of the argument.
         * @type {ArgumentTypes}
         */
        this.type = this.argument.type;
        /**
         * The prompt for the argument.
         * @type {string}
         */
        this.prompt = argument.prompt || `Please define argument ${argument.name}`;
        /**
         * The choices for the argument.
         * @type {Array<ArgumentChoice>}
         */
        this.choices = argument.choices;
        /**
         * The channel types for the argument.
         * @type {Array<string>}
         */
        this.channel_types = argument.channel_types || [];
        /**
         * The minimum value for the argument. NOTE: This is only used for number arguments.
         * @type {number}
         */
        this.min_value = argument.min_value;
        /**
         * The maximum value for the argument. NOTE: This is only used for number arguments.
         */
        this.max_value = argument.max_value;
        /**
         * The subcommands for the argument.
         * @type {Array<any>}
         */
        this.subcommands = argument.subcommands;
    }

    async obtain(message: Message, language: GuildLanguageTypes, prompt = this.prompt) {
        if (message.author.bot) return;

        if (!this.required && !this.subcommands) return 'skip';
        const wait = 30000;

        const getComponents = disabled => {
            const components = [
                new MessageActionRow()
                    .addComponents([
                        new MessageButton()
                            .setLabel('Cancel')
                            .setStyle('DANGER')
                            .setCustomId(`argument_cancel_${message.id}`)
                            .setDisabled(disabled),
                    ]),
            ];
            if (this.type === 'BOOLEAN') {
                components[1] = new MessageActionRow().addComponents([
                    new MessageButton()
                        .setLabel('True')
                        .setStyle('SUCCESS')
                        .setCustomId(`argument_true_${message.id}`)
                        .setDisabled(disabled),
                    new MessageButton()
                        .setLabel('False')
                        .setStyle('DANGER')
                        .setCustomId(`argument_false_${message.id}`)
                        .setDisabled(disabled),
                ]);
            }
            if (this.choices && Array.isArray(this.choices) && this.choices[0]) {
                const menu = new MessageSelectMenu()
                    .setPlaceholder('Select a choice')
                    .setMaxValues(1)
                    .setMinValues(1)
                    .setCustomId(`argument_choice_${message.id}_${this.name}`)
                    .setDisabled(disabled);

                for (const choice of this.choices) {
                    menu.addOptions([{ label: choice.name, value: choice.name }]);
                }

                components[1] = new MessageActionRow().addComponents([
                    menu,
                ]);
            }
            if (this.subcommands && Array.isArray(this.subcommands) && this.subcommands[0]) {
                const menu = new MessageSelectMenu()
                    .setPlaceholder('Select a subcommand')
                    .setMaxValues(1)
                    .setMinValues(1)
                    .setCustomId(`argument_subcommand_${message.id}_${this.name}`)
                    .setDisabled(disabled);

                for (const subcommand of this.subcommands) {
                    menu.addOptions([{ label: subcommand.name, value: subcommand.name }]);
                }

                components[1] = new MessageActionRow().addComponents([
                    menu,
                ]);
            }

            return components.reverse();
        };

        if ((this.type === 'SUB_COMMAND' || 'SUB_COMMAND_GROUP') && this.subcommands) prompt = this.client.languageFile.ARGS_COMMAND[language].replace('{choices}', this.subcommands.map(sc => `\`${sc.name}\``).join(', '));

        const msgReply = await message.reply({
            content: prompt,
            components: getComponents(false),
        });

        const messageCollectorfilter = msg => msg.author.id === message.author.id;
        const componentsCollectorfilter = i => i.user.id === message.author.id && i.message && i.message.id === msgReply.id && i.customId.includes(message.id) && i.customId.includes('argument');

        const collectors = [
            message.channel.awaitMessages({ filter: messageCollectorfilter, max: 1, time: wait, errors: ['TIME'] }),
            message.channel.awaitMessageComponent({ filter: componentsCollectorfilter, componentType: 'BUTTON', time: (wait + 1) }),
            message.channel.awaitMessageComponent({ filter: componentsCollectorfilter, componentType: 'SELECT_MENU', time: (wait + 1) }),
        ];

        const responses: any = await Promise.race(collectors).catch();
        if (responses.size === 0) return 'timelimit';

        const resFirst = typeof responses.first === 'function' ? responses.first() : responses;

        if (resFirst.customId) {
            resFirst.deferUpdate().catch();
            if (resFirst.isSelectMenu()) {
                resFirst.content = resFirst.values[0];
            } else { resFirst.content = resFirst.customId.split('_')[1]; }
        }

        if (this.client.deletePrompt) await msgReply.delete();
        else await msgReply.edit({ content: msgReply.content, components: getComponents(true) });

        if (this.client.deleteInput && this.isNotDm && (message.channel as any).permissionsFor(this.client.user.id).has('MANAGE_MESSAGES')) await resFirst.delete();

        if (resFirst.content === 'cancel') return 'cancel';
        const invalid = await this.argument.validate(this, { content: resFirst.content.toLowerCase(), guild: resFirst.guild, attachments: resFirst.attachments }, language);

        if (invalid) {
            return this.obtain(message, language, invalid);
        }

        return this.get(resFirst);
    }

    determineArgument(client, argument) {
        if (argument.type === ArgumentType.SUB_COMMAND) return new SubCommandArgumentType(client);
        if (argument.type === ArgumentType.SUB_COMMAND_GROUP) return new SubCommandGroupArgumentType(client);
        if (argument.type === ArgumentType.STRING) return new StringArgumentType(client);
        if (argument.type === ArgumentType.INTEGER) return new IntegerArgumentType(client);
        if (argument.type === ArgumentType.BOOLEAN) return new BooleanArgumentType(client);
        if (this.isNotDm && argument.type === ArgumentType.USER) return new UserArgumentType(client);
        if (this.isNotDm && argument.type === ArgumentType.CHANNEL) return new ChannelArgumentType(client);
        if (this.isNotDm && argument.type === ArgumentType.ROLE) return new RoleArgumentType(client);
        if (this.isNotDm && argument.type === ArgumentType.MENTIONABLE) return new MentionableArgumentType(client);
        if (argument.type === ArgumentType.NUMBER) return new NumberArgumentType(client);
        if (argument.type === ArgumentType.ATTACHMENT) return new AttachmentArgumentType(client);
        else return { type: 'invalid' };
    }

    get(message: any) {
        if (typeof message === 'string' || this.type === 'ATTACHMENT') return this.argument.get(this, message);
        else return this.argument.get(this, message.content);
    }
}
