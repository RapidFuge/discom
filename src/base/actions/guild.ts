import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('guildUpdate', (oldGuild, newGuild) => {
        if (oldGuild.premiumTier < newGuild.premiumTier) {
            /**
             * Emitted when a guild's premium tier goes up.
             * @event DiscomClient#guildPremiumTierUpdate
             * @param {Guild} guild The guild that had its premium tier updated
             * @param {number} oldPremiumTier The old premium tier
             * @param {number} newPremiumTier The new premium tier
             * @example client.on('guildPremiumTierUpdate', (guild, oldPremiumTier, newPremiumTier) => {
             * console.log(`${guild.name}'s premium tier was updated`);
             * });
             */
            client.emit('guildBoostLevelUp',
                newGuild,
                oldGuild.premiumTier,
                newGuild.premiumTier,
            );
        }

        if (oldGuild.premiumTier > newGuild.premiumTier) {
            /**
             * Emitted when a guild's premium tier goes down.
             * @event DiscomClient#guildPremiumTierDown
             * @param {Guild} guild The guild that had its premium tier updated
             * @param {number} oldPremiumTier The old premium tier
             * @param {number} newPremiumTier The new premium tier
             * @example client.on('guildPremiumTierDown', (guild, oldPremiumTier, newPremiumTier) => {
             * console.log(`${guild.name}'s premium tier was updated`);
             * });
             */
            client.emit('guildBoostLevelDown',
                newGuild,
                oldGuild.premiumTier,
                newGuild.premiumTier,
            );
        }

        if (oldGuild.banner !== newGuild.banner) {
            /**
             * Emitted when a guild's banner is changed.
             * @event DiscomClient#guildBannerUpdate
             * @param {Guild} guild The guild that had its banner updated
             * @param {string} oldBanner The old banner
             * @param {string} newBanner The new banner
             * @example client.on('guildBannerUpdate', (guild, oldBanner, newBanner) => {
             * console.log(`${guild.name}'s banner was updated`);
             * });
             */
            client.emit('guildBannerUpdate',
                newGuild,
                oldGuild.banner,
                newGuild.banner,
            );
        }

        if (oldGuild.afkChannel !== newGuild.afkChannel) {
            /**
             * Emitted when a guild's AFK channel is changed.
             * @event DiscomClient#guildAFKChannelUpdate
             * @param {Guild} guild The guild that had its AFK channel updated
             * @param {?VoiceChannel} oldAFKChannel The old AFK channel
             * @param {?VoiceChannel} newAFKChannel The new AFK channel
             * @example client.on('guildAFKChannelUpdate', (guild, oldAFKChannel, newAFKChannel) => {
             * console.log(`${guild.name}'s AFK channel was updated`);
             * });
             */
            client.emit('guildAfkChannelUpdate',
                newGuild,
                oldGuild.afkChannel,
                newGuild.afkChannel,
            );
        }

        if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
            /**
             * Emitted when a guild's vanity URL code is changed.
             * @event DiscomClient#guildVanityURLCodeUpdate
             * @param {Guild} guild The guild that had its vanity URL code updated
             * @param {?string} oldVanityURLCode The old vanity URL code
             * @param {?string} newVanityURLCode The new vanity URL code
             * @example client.on('guildVanityURLCodeUpdate', (guild, oldVanityURLCode, newVanityURLCode) => {
             * console.log(`${guild.name}'s vanity URL code was updated`);
             * });
             */
            client.emit('guildVanityURLUpdate',
                newGuild,
                oldGuild.vanityURLCode,
                newGuild.vanityURLCode,
            );
        }

        if (oldGuild.features.length !== newGuild.features.length) {
            /**
             * Emitted when a guild's features are changed.
             * @event DiscomClient#guildFeaturesUpdate
             * @param {Guild} guild The guild that had its features updated
             * @param {string[]} oldFeatures The old features
             * @param {string[]} newFeatures The new features
             * @example client.on('guildFeaturesUpdate', (guild, oldFeatures, newFeatures) => {
             * console.log(`${guild.name}'s features were updated`);
             * });
             */
            client.emit('guildFeaturesUpdate',
                newGuild,
                oldGuild.features,
                newGuild.features,
            );
        }

        if (oldGuild.nameAcronym !== newGuild.nameAcronym) {
            /**
             * Emitted when a guild's name acronym is changed.
             * @event DiscomClient#guildNameAcronymUpdate
             * @param {Guild} guild The guild that had its name acronym updated
             * @param {?string} oldNameAcronym The old name acronym
             * @param {?string} newNameAcronym The new name acronym
             * @example client.on('guildNameAcronymUpdate', (guild, oldNameAcronym, newNameAcronym) => {
             * console.log(`${guild.name}'s name acronym was updated`);
             * });
             */
            client.emit('guildAcronymUpdate',
                newGuild,
                oldGuild.nameAcronym,
                newGuild.nameAcronym,
            );
        }

        if (oldGuild.ownerId !== newGuild.ownerId) {
            /**
             * Emitted when a guild's owner is changed.
             * @event DiscomClient#guildOwnerUpdate
             * @param {Guild} guild The guild that had its owner updated
             * @param {?User} oldOwner The old owner
             * @param {?User} newOwner The new owner
             * @example client.on('guildOwnerUpdate', (guild, oldOwner, newOwner) => {
             * console.log(`${guild.name}'s owner was updated`);
             * });
             */
            client.emit('guildOwnerUpdate',
                newGuild,
                oldGuild.ownerId,
                newGuild.ownerId,
            );
        }

        if (oldGuild.maximumMembers !== newGuild.maximumMembers) {
            /**
             * Emitted when a guild's maximum members is changed.
             * @event DiscomClient#guildMaximumMembersUpdate
             * @param {Guild} guild The guild that had its maximum members updated
             * @param {?number} oldMaximumMembers The old maximum members
             * @param {?number} newMaximumMembers The new maximum members
             * @example client.on('guildMaximumMembersUpdate', (guild, oldMaximumMembers, newMaximumMembers) => {
             * console.log(`${guild.name}'s maximum members was updated`);
             * });
             */
            client.emit('guildMaximumMembersUpdate',
                newGuild,
                oldGuild.maximumMembers,
                newGuild.maximumMembers,
            );
        }

        if (oldGuild.partnered !== newGuild.partnered) {
            /**
             * Emitted when a guild's partnered status is changed.
             * @event DiscomClient#guildPartneredUpdate
             * @param {Guild} guild The guild that had its partnered status updated
             * @param {?boolean} oldPartnered The old partnered status
             * @param {?boolean} newPartnered The new partnered status
             * @example client.on('guildPartneredUpdate', (guild, oldPartnered, newPartnered) => {
             * console.log(`${guild.name}'s partnered status was updated`);
             * });
             */
            client.emit('guildPartnerUpdate',
                newGuild,
                oldGuild.partnered,
                newGuild.partnered,
            );
        }

        if (oldGuild.verified !== newGuild.verified) {
            /**
             * Emitted when a guild's verified status is changed.
             * @event DiscomClient#guildVerifiedUpdate
             * @param {Guild} guild The guild that had its verified status updated
             * @param {?boolean} oldVerified The old verified status
             * @param {?boolean} newVerified The new verified status
             * @example client.on('guildVerifiedUpdate', (guild, oldVerified, newVerified) => {
             * console.log(`${guild.name}'s verified status was updated`);
             * });
             */
            client.emit('guildVerifyUpdate',
                newGuild,
                oldGuild.verified,
                newGuild.verified,
            );
        }
    });
};
