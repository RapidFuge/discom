import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('messageUpdate', (oldMessage, newMessage) => {
        if (!oldMessage.partial && !newMessage.partial) {
            if (!oldMessage.pinned && newMessage.pinned) {
                /**
                 * Emitted when a message is pinned.
                 * @event DiscomClient#messagePinned
                 * @param {Message} message The message that was pinned
                 * @example client.on('messagePinned', (message) => {
                 * console.log(`${message.author.username}'s Message was pinned`);
                 * });
                 */
                client.emit('messagePinned', newMessage);
            }
            if (oldMessage.content !== newMessage.content) {
                /**
                 * Emitted when a message is updated.
                 * @event DiscomClient#messageUpdate
                 * @param {Message} message The message that was updated
                 * @param {string} oldContent The old content
                 * @param {string} newContent The new content
                 * @example client.on('messageUpdate', (message, oldContent, newContent) => {
                 * console.log(`${message.author.username}'s Message was edited`);
                 * });
                 */
                client.emit('messageContentEdited', newMessage, oldMessage.content, newMessage.content);
            }
        }
    });
};
