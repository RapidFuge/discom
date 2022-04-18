import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('guildMemberUpdate', (oldMember, newMember) => {
        if (oldMember.premiumSince && newMember.premiumSince) {
            /**
             * Emitted when a guild member's premium status changes.
             * @event DiscomClient#guildMemberPremiumStatusUpdate
             * @param {GuildMember} member The guild member that had its premium status updated
             * @param {boolean} oldPremiumStatus The old premium status
             * @param {boolean} newPremiumStatus The new premium status
             * @example client.on('guildMemberPremiumStatusUpdate', (member, oldPremiumStatus, newPremiumStatus) => {
             * console.log(`${member.user.username}'s premium status was updated`);
             * });
             */
            client.emit('guildMemberBoost',
                newMember,
                oldMember.premiumSince,
                newMember.premiumSince,
            );
        }

        if (oldMember.premiumSince && !newMember.premiumSince) {
            /**
             * Emitted when a guild member's premium status goes down.
             * @event DiscomClient#guildMemberPremiumStatusDown
             * @param {GuildMember} member The guild member that had its premium status updated
             * @param {boolean} oldPremiumStatus The old premium status
             * @param {boolean} newPremiumStatus The new premium status
             * @example client.on('guildMemberPremiumStatusDown', (member, oldPremiumStatus, newPremiumStatus) => {
             * console.log(`${member.user.username}'s premium status was updated`);
             * });
             */
            client.emit('guildMemberUnboost',
                newMember,
                oldMember.premiumSince,
                newMember.premiumSince,
            );
        }

        if (oldMember.nickname !== newMember.nickname) {
            /**
             * Emitted when a guild member's nickname is changed.
             * @event DiscomClient#guildMemberNicknameUpdate
             * @param {GuildMember} member The guild member that had its nickname updated
             * @param {string} oldNickname The old nickname
             * @param {string} newNickname The new nickname
             * @example client.on('guildMemberNicknameUpdate', (member, oldNickname, newNickname) => {
             * console.log(`${member.user.username}'s nickname was updated`);
             * });
             */
            client.emit('guildMemberNicknameUpdate',
                newMember,
                oldMember.nickname,
                newMember.nickname,
            );
        }

        newMember.roles.cache.forEach(role => {
            if (!oldMember.roles.cache.has(role.id)) {
                /**
                 * Emitted when a member acquires a new role.
                 * @event DiscomCLient#guildMemberRoleAdd
                 * @param {GuildMember} member The member who acquired the role.
                 * @param {Role} role The role the member has acquired.
                 * @example client.on("guildMemberRoleAdd", (member, role) => {
                 *   console.log(`${member.user.username} has acquired the ${role.name} role`);
                 * });
                */
                client.emit('guildMemberRoleAdd', oldMember, role);
            }
        });

        oldMember.roles.cache.forEach(role => {
            if (!newMember.roles.cache.has(role.id)) {
                /**
                 * Emitted when a member loses a new role.
                 * @event DiscomClient#guildMemberRoleRemove
                 * @param {GuildMember} member The member who lost the role.
                 * @param {Role} role The role the member has lost.
                 * @example client.on("guildMemberRoleRemove", (member, role) => {
                 *   console.log(`${member.user.username} has lost the ${role.name} role`);
                 * });
                */
                client.emit('guildMemberRoleRemove', oldMember, role);
            }
        });

        if ((oldMember.nickname === newMember.nickname) && (oldMember.premiumSince === newMember.premiumSince) && (oldMember.roles.cache.size === 0) && (newMember.roles.cache.size === 0)) {
            const response = newMember.pending;
            if (response) return;

            /**
             * When a guild member's ship screening was accepted.
             * @event DiscomClient#guildMemberAcceptShipScreening
             * @param {GuildMember} member The guild member
             * @example client.on('guildMemberAcceptShipScreening', (member) => {
             * console.log(`${member.user.username}'s ship screening was accepted`);
             * });
             */
            client.emit('guildMemberAcceptShipScreening',
                newMember,
            );
        }
    });
};
