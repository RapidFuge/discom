import type { DiscomClient } from '../Client';

export default (client: DiscomClient) => {
    client.on('interactionCreate', interaction => {
        if (interaction.isButton()) {
            /**
             * Emitted when a button interaction is created.
             * @event DiscomClient#clickButton
             * @param {ButtonInteraction} interaction The button interaction that was created
             * @example client.on('clickButton', interaction => {
             * console.log(`${interaction.channel.name} has a new interaction`);
             * });
             */
            client.emit('clickButton', interaction);
        }
        if (interaction.isSelectMenu()) {
            /**
             * Emitted when a select menu interaction is created.
             * @event DiscomClient#selectMenu
             * @param {SelectMenuInteraction} interaction The select menu interaction that was created
             * @example client.on('selectMenu', interaction => {
             * console.log(`${interaction.channel.name} has a new interaction`);
             * });
             */
            client.emit('selectMenu', interaction);
        }

        if (interaction.isContextMenu()) {
            /**
             * Emitted when a context menu interaction is created.
             * @event DiscomClient#contextMenu
             * @param {ContextMenuInteraction} interaction The context menu interaction that was created
             * @example client.on('contextMenu', interaction => {
             * console.log(`${interaction.channel.name} has a new interaction`);
             * });
             */
            client.emit('contextMenu', interaction);
        }

        if (interaction.isAutocomplete()) {
            /**
             * Emitted when an autocomplete interaction is created.
             * @event DiscomClient#autocomplete
             * @param {AutocompleteInteraction} interaction The autocomplete interaction that was created
             * @example client.on('autocomplete', interaction => {
             * console.log(`${interaction.channel.name} has a new interaction`);
             * });
             */
            client.emit('autoComplete', interaction);
        }
    });
};
