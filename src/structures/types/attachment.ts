import type { DiscomClient } from '../../base/Client';
import { ArgumentType } from './base';
import { MessageAttachment } from 'discord.js';

/**
 * Represents an attachment type.
 * @extends {ArgumentType}
 */
export class AttachmentArgumentType extends ArgumentType {
    constructor(client: DiscomClient) {
        super(client, 'ATTACHMENT');
        this.client = client;
    }

    public validate(argument, message, language) {
        if (!message.attachments.first() || !(message.attachments.first() instanceof MessageAttachment)) return this.client.languageFile.ARGS_MUST_CONTAIN[language].replace('{argument}', argument.name).replace('{type}', 'file');
    }

    public get(argument, message) {
        return message.attachments?.first();
    }
}
