import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('channelUpdate', (oldChannel: any, newChannel: any) => {
        if (oldChannel.permissionOverwrites !== newChannel.permissionOverwrites) {
            /**
             * Emitted when a channel's permission overwrites are changed.
             * @event DiscomClient#channelPermissionsUpdate
             * @param {Channel} channel The channel that had its permissions updated
             * @param {Collection<Snowflake, PermissionOverwrites>} oldPermissions The old permission overwrites
             * @param {Collection<Snowflake, PermissionOverwrites>} newPermissions The new permission overwrites
             * @example client.on('channelPermissionsUpdate', (channel, oldPermissions, newPermissions) => {
             *  console.log(`${channel.name}'s permissions were updated`);
             * });
             */
            client.emit('guildChannelPermissionsUpdate',
                newChannel,
                oldChannel.permissionOverwrites,
                newChannel.permissionOverwrites,
            );
        }

        if (oldChannel.type === 'text' && oldChannel.topic !== newChannel.topic) {
            /**
             * Emitted when a text channel's topic is changed.
             * @event DiscomClient#channelTopicUpdate
             * @param {TextChannel} channel The channel that had its topic updated
             * @param {string} oldTopic The old topic
             * @param {string} newTopic The new topic
             * @example client.on('channelTopicUpdate', (channel, oldTopic, newTopic) => {
             * console.log(`${channel.name}'s topic was updated`);
             * });
             */
            client.emit('guildChannelTopicUpdate',
                newChannel,
                oldChannel.topic,
                newChannel.topic,
            );
        }

        if (oldChannel.type === 'text' && oldChannel.nsfw !== newChannel.nsfw) {
            /**
             * Emitted when a text channel's nsfw status is changed.
             * @event DiscomClient#channelNsfwUpdate
             * @param {TextChannel} channel The channel that had its nsfw status updated
             * @param {boolean} oldNsfw The old nsfw status
             * @param {boolean} newNsfw The new nsfw status
             * @example client.on('channelNsfwUpdate', (channel, oldNsfw, newNsfw) => {
             * console.log(`${channel.name}'s nsfw status was updated`);
             * });
             */
            client.emit('guildChannelNSFWUpdate',
                newChannel,
                oldChannel.nsfw,
                newChannel.nsfw,
            );
        }

        if (oldChannel.type !== newChannel.type) {
            /**
             * Emitted when a channel's type is changed.
             * @event DiscomClient#channelTypeUpdate
             * @param {Channel} channel The channel that had its type updated
             * @param {string} oldType The old type
             * @param {string} newType The new type
             * @example client.on('channelTypeUpdate', (channel, oldType, newType) => {
             * console.log(`${channel.name}'s type was updated`);
             * });
             */
            client.emit('guildChannelTypeUpdate',
                newChannel,
                oldChannel.type,
                newChannel.type,
            );
        }

        if (oldChannel.type === 'voice' && oldChannel.userLimit !== newChannel.userLimit) {
            /**
             * Emitted when a voice channel's user limit is changed.
             * @event DiscomClient#channelUserLimitUpdate
             * @param {VoiceChannel} channel The channel that had its user limit updated
             * @param {number} oldUserLimit The old user limit
             * @param {number} newUserLimit The new user limit
             * @example client.on('channelUserLimitUpdate', (channel, oldUserLimit, newUserLimit) => {
             * console.log(`${channel.name}'s user limit was updated`);
             * });
             */
            client.emit('guildChannelUserLimitUpdate',
                newChannel,
                oldChannel.userLimit,
                newChannel.userLimit,
            );
        }

        if (oldChannel.type === 'voice' && oldChannel.bitrate !== newChannel.bitrate) {
            /**
             * Emitted when a voice channel's bitrate is changed.
             * @event DiscomClient#channelBitrateUpdate
             * @param {VoiceChannel} channel The channel that had its bitrate updated
             * @param {number} oldBitrate The old bitrate
             * @param {number} newBitrate The new bitrate
             * @example client.on('channelBitrateUpdate', (channel, oldBitrate, newBitrate) => {
             * console.log(`${channel.name}'s bitrate was updated`);
             * });
             */
            client.emit('guildChannelBitrateUpdate',
                newChannel,
                oldChannel.bitrate,
                newChannel.bitrate,
            );
        }
    });
};
