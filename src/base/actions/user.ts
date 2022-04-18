import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('userUpdate', (oldUser, newUser) => {
        if (oldUser.displayAvatarURL() !== newUser.displayAvatarURL()) {
            /**
             * Emitted when a user's avatar is updated.
             * @event DiscomClient#userAvatarUpdate
             * @param {User} user The user that had its avatar updated
             * @param {string} oldAvatarURL The old avatar URL
             * @param {string} newAvatarURL The new avatar URL
             * @example client.on('userAvatarUpdate', (user, oldAvatarURL, newAvatarURL) => {
             * console.log(`${user.username}'s avatar was updated`);
             * });
             */
            client.emit('userAvatarUpdate',
                newUser,
                oldUser.displayAvatarURL(),
                newUser.displayAvatarURL(),
            );
        }

        if (oldUser.username !== newUser.username) {
            /**
             * Emitted when a user's username is updated.
             * @event DiscomClient#userUsernameUpdate
             * @param {User} user The user that had its username updated
             * @param {string} oldUsername The old username
             * @param {string} newUsername The new username
             * @example client.on('userUsernameUpdate', (user, oldUsername, newUsername) => {
             * console.log(`${user.username}'s username was updated`);
             * });
             */
            client.emit('userUsernameUpdate',
                newUser,
                oldUser.username,
                newUser.username,
            );
        }

        if (oldUser.discriminator !== newUser.discriminator) {
            /**
             * Emitted when a user's discriminator is updated.
             * @event DiscomClient#userDiscriminatorUpdate
             * @param {User} user The user that had its discriminator updated
             * @param {string} oldDiscriminator The old discriminator
             * @param {string} newDiscriminator The new discriminator
             * @example client.on('userDiscriminatorUpdate', (user, oldDiscriminator, newDiscriminator) => {
             * console.log(`${user.username}'s discriminator was updated`);
             * });
             */
            client.emit('userDiscriminatorUpdate',
                newUser,
                oldUser.discriminator,
                newUser.discriminator,
            );
        }


        if (oldUser.flags !== newUser.flags) {
            /**
             * Emitted when a user's flags are updated.
             * @event DiscomClient#userFlagsUpdate
             * @param {User} user The user that had its flags updated
             * @param {number} oldFlags The old flags
             * @param {number} newFlags The new flags
             * @example client.on('userFlagsUpdate', (user, oldFlags, newFlags) => {
             * console.log(`${user.username}'s flags were updated`);
             * });
             */
            client.emit('userFlagsUpdate',
                newUser,
                oldUser.flags,
                newUser.flags,
            );
        }
    });
};
