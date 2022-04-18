import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('threadUpdate', (oldThread, newThread) => {
        if (oldThread.archived !== newThread.archived) {
            /**
             * Emitted when a thread is archived or unarchived.
             * @event DiscomClient#threadStateUpdate
             * @param {ThreadChannel} thread The thread that was archived or unarchived
             * @param {boolean} oldState The old state of the thread
             * @param {boolean} newState The new state of the thread
             * @example client.on('threadStateUpdate', (thread, oldState, newState) => {
             * console.log(`${thread.name} was ${oldState ? 'un' : ''}archived`);
             * });
             */
            client.emit('threadStateUpdate', newThread, oldThread.archived, newThread.archived);
        }
        if (oldThread.name !== newThread.name) {
            /**
             * Emitted when a thread's name is updated.
             * @event DiscomClient#threadNameUpdate
             * @param {ThreadChannel} thread The thread that had its name updated
             * @param {string} oldName The old name
             * @param {string} newName The new name
             * @example client.on('threadNameUpdate', (thread, oldName, newName) => {
             * console.log(`${thread.name}'s name was updated`);
             * });
             */
            client.emit('threadNameUpdate', newThread, oldThread.name, newThread.name);
        }
        if (String(oldThread.locked) !== String(newThread.locked)) {
            /**
             * Emitted when a thread's lock status is updated.
             * @event DiscomClient#threadLockStateUpdate
             * @param {ThreadChannel} thread The thread that had its lock status updated
             * @param {boolean} oldState The old state of the thread
             * @param {boolean} newState The new state of the thread
             * @example client.on('threadLockStateUpdate', (thread, oldState, newState) => {
             * console.log(`${thread.name} was ${oldState ? 'un' : ''}locked`);
             * });
             */
            client.emit('threadLockStateUpdate', oldThread, oldThread.locked, newThread.locked);
        }
        if (String(oldThread.rateLimitPerUser) !== String(newThread.rateLimitPerUser)) {
            /**
             * Emitted when a thread's rate limit per user is updated.
             * @event DiscomClient#threadRateLimitPerUserUpdate
             * @param {ThreadChannel} thread The thread that had its rate limit updated
             * @param {number} oldRateLimit The old rate limit
             * @param {number} newRateLimit The new rate limit
             * @example client.on('threadRateLimitPerUserUpdate', (thread, oldRateLimit, newRateLimit) => {
             * console.log(`${thread.name}'s rate limit was updated`);
             * });
             */
            client.emit('threadRateLimitPerUserUpdate', newThread, oldThread.rateLimitPerUser, newThread.rateLimitPerUser);
        }
        if (String(oldThread.autoArchiveDuration) !== String(newThread.autoArchiveDuration)) {
            /**
             * Emitted when a thread's auto archive duration is updated.
             * @event DiscomClient#threadAutoArchiveDurationUpdate
             * @param {ThreadChannel} thread The thread that had its auto archive duration updated
             * @param {number} oldDuration The old auto archive duration
             * @param {number} newDuration The new auto archive duration
             * @example client.on('threadAutoArchiveDurationUpdate', (thread, oldDuration, newDuration) => {
             * console.log(`${thread.name}'s auto archive duration was updated`);
             * });
             */
            client.emit('threadAutoArchiveDurationUpdate', newThread, oldThread.autoArchiveDuration, newThread.autoArchiveDuration);
        }
    });
};
