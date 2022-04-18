import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('voiceStateUpdate', (oldState, newState) => {
        const newMember = newState.member;

        if (!oldState.channel && newState.channel) {
            /**
             * Emitted when a member joins a voice channel.
             * @event DiscomClient#voiceChannelJoin
             * @param {GuildMember} member The member that joined the voice channel
             * @param {VoiceChannel} channel The voice channel that the member joined
             * @example client.on('voiceChannelJoin', (member, channel) => {
             * console.log(`${member.displayName} joined ${channel.name}`);
             * });
             */
            client.emit('voiceChannelJoin',
                newMember,
                newState.channel,
            );
        }

        if (oldState.channel && !newState.channel) {
            /**
             * Emitted when a member leaves a voice channel.
             * @event DiscomClient#voiceChannelLeave
             * @param {GuildMember} member The member that left the voice channel
             * @param {VoiceChannel} channel The voice channel that the member left
             * @example client.on('voiceChannelLeave', (member, channel) => {
             * console.log(`${member.displayName} left ${channel.name}`);
             * });
             */
            client.emit('voiceChannelLeave',
                newMember,
                oldState.channel,
            );
        }

        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            /**
             * Emitted when a member changes voice channels.
             * @event DiscomClient#voiceChannelSwitch
             * @param {GuildMember} member The member that switched voice channels
             * @param {VoiceChannel} oldChannel The voice channel that the member left
             * @param {VoiceChannel} newChannel The voice channel that the member joined
             * @example client.on('voiceChannelSwitch', (member, oldChannel, newChannel) => {
             * console.log(`${member.displayName} switched from ${oldChannel.name} to ${newChannel.name}`);
             * });
             */
            client.emit('voiceChannelSwitch',
                newMember,
                oldState.channel,
                newState.channel,
            );
        }

        if (!oldState.mute && newState.mute) {
            const muteType = newState.selfMute ? 'self-muted' : 'server-muted';
            /**
             * Emitted when a member is muted.
             * @event DiscomClient#voiceChannelMute
             * @param {GuildMember} member The member that was muted
             * @param {VoiceChannel} channel The voice channel that the member was muted in
             * @param {string} muteType The type of mute that was applied
             * @example client.on('voiceChannelMute', (member, channel, muteType) => {
             * console.log(`${member.displayName} was ${muteType} in ${channel.name}`);
             * });
             */
            client.emit('voiceChannelMute',
                newMember,
                muteType,
            );
        }

        if (oldState.mute && !newState.mute) {
            const muteType = oldState.selfMute ? 'self-muted' : 'server-muted';

            /**
             * Emitted when a member is unmuted.
             * @event DiscomClient#voiceChannelUnmute
             * @param {GuildMember} member The member that was unmuted
             * @param {VoiceChannel} channel The voice channel that the member was unmuted in
             * @param {string} muteType The type of mute that was removed
             * @example client.on('voiceChannelUnmute', (member, channel, muteType) => {
             * console.log(`${member.displayName} was ${muteType} in ${channel.name}`);
             * });
             */
            client.emit('voiceChannelUnmute',
                newMember,
                muteType,
            );
        }

        if (!oldState.deaf && newState.deaf) {
            const deafType = newState.selfDeaf ? 'self-deafened' : 'server-deafened';

            /**
             * Emitted when a member is deafened.
             * @event DiscomClient#voiceChannelDeaf
             * @param {GuildMember} member The member that was deafened
             * @param {VoiceChannel} channel The voice channel that the member was deafened in
             * @param {string} deafType The type of deafen that was applied
             * @example client.on('voiceChannelDeaf', (member, channel, deafType) => {
             * console.log(`${member.displayName} was ${deafType} in ${channel.name}`);
             * });
             */
            client.emit('voiceChannelDeafen',
                newMember,
                deafType,
            );
        }

        if (oldState.deaf && !newState.deaf) {
            const deafType = oldState.selfDeaf ? 'self-deafened' : 'server-deafened';

            /**
             * Emitted when a member is undeafened.
             * @event DiscomClient#voiceChannelUndeaf
             * @param {GuildMember} member The member that was undeafened
             * @param {VoiceChannel} channel The voice channel that the member was undeafened in
             * @param {string} deafType The type of deafen that was removed
             * @example client.on('voiceChannelUndeaf', (member, channel, deafType) => {
             * console.log(`${member.displayName} was ${deafType} in ${channel.name}`);
             * });
             */
            client.emit('voiceChannelUndeafen',
                newMember,
                deafType,
            );
        }

        if (!oldState.streaming && newState.streaming) {
            /**
             * Emitted when a member starts streaming.
             * @event DiscomClient#voiceStreamingStart
             * @param {GuildMember} member The member that started streaming
             * @param {VoiceChannel} channel The voice channel that the member started streaming in
             * @example client.on('voiceStreamingStart', (member, channel) => {
             * console.log(`${member.displayName} started streaming in ${channel.name}`);
             * });
             */
            client.emit('voiceStreamingStart',
                newMember,
                newState.channel,
            );
        }

        if (oldState.streaming && !newState.streaming) {
            /**
             * Emitted when a member stops streaming.
             * @event DiscomClient#voiceStreamingStop
             * @param {GuildMember} member The member that stopped streaming
             * @param {VoiceChannel} channel The voice channel that the member stopped streaming in
             * @example client.on('voiceStreamingStop', (member, channel) => {
             * console.log(`${member.displayName} stopped streaming in ${channel.name}`);
             * });
             */
            client.emit('voiceStreamingStop',
                newMember,
                newState.channel,
            );
        }
    });
};
