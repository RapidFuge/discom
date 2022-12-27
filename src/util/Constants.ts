type ApplicationCommandTypesRaw = 'user' | 'message' | 'both';

const ApplicationCommandTypesRaw = {
    user: 2,
    message: 3,
    both: 4,
    2: 2,
    3: 3,
    4: 4,
};

type Events = 'DEBUG' | 'LOG' | 'COMMAND_EXECUTE' | 'COMMAND_ERROR' | 'COMMANDS_LOADED' | 'COMMAND_NOT_FOUND' | 'AUTOCOMPLETE_EXECUTE' | 'AUTOCOMPLETE_ERROR' | 'AUTOCOMPLETE_NOT_FOUND';

/**
 * Emitted for command loading/deletion
 * @event DiscomClient#log
 * @param {string} info The message that was emitted.
 * @example client.on('log', (info) => { console.log(info); });
*/

/**
 * Emmited when a command is executed.
 * @event DiscomClient#commandExecute
 * @param {any} options The object containing the importnat information.
 * @example client.on('commandExecute', options => {
 * console.log(options.command);
 * });
 */

/**
 * Emmited when a command throws an error.
 * @event DiscomClient#commandError
 * @param {any} options The object containing the importnat information.
 * @example client.on('commandError', options => {
 * console.log(options.error);
 * });
 */

/**
 * Emitted for general debugging information.
 * @event DiscomClient#debug
 * @param {string} info The message that was emitted.
 * @example client.on('debug', (info) => { console.log(info); });
*/

/**
 * Emitted when a command is not found
 * @event DiscomClient#commandNotFound
 * @param {string} info Command not found
 * @example client.on('commandNotFound', (info) => { console.log(info); });
*/

/**
 * Emitted when an autocomplete interaction executes
 * @event DiscomClient#autocompleteExecute
 * @param {string} info Autocomplete revieved and handled.
 * @example client.on('autocompleteExecute', (info) => { console.log(info); });
*/

/**
 * Emitted when a error occurs inside an autocomplete interaction
 * @event DiscomClient#autocompleteError
 * @param {string} info Error from autocomplete interaction
 * @example client.on('autocompleteError', (info) => { console.log(info); });
*/

/**
 * Emitted when an autocomplete interaction is not found
 * @event DiscomClient#autocompleteNotFound
 * @param {string} info Autocomplete not found
 * @example client.on('autocompleteNotFound', (info) => { console.log(info); });
*/

const Events = {
    DEBUG: 'debug',
    LOG: 'log',
    COMMAND_EXECUTE: 'commandExecute',
    COMMAND_ERROR: 'commandError',
    COMMANDS_LOADED: 'commandsLoaded',
    COMMAND_NOT_FOUND: 'commandNotFound',
    AUTOCOMPLETE_EXECUTE: 'autocompleteExecute',
    AUTOCOMPLETE_ERROR: 'autocompleteError',
    AUTOCOMPLETE_NOT_FOUND: 'autocompleteNotFound',
};

type ArgumentType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
const ArgumentType = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    MENTIONABLE: 9,
    NUMBER: 10,
    ATTACHMENT: 11,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
};

type ArgumentChannelTypes = 'GUILD_TEXT' | 'DM' | 'GUILD_VOICE' | 'GROUP_DM' | 'GUILD_CATEGORY' | 'GUILD_ANNOUNCEMENT' | 'ANNOUNCEMENT_THREAD' | 'PUBLIC_THREAD' | 'PRIVATE_THREAD' | 'GUILD_STAGE_VOICE' | 'GUILD_DIRECTORY' | 'GUILD_FORUM';
const ArgumentChannelTypes = [
    'GUILD_TEXT',
    'DM',
    'GUILD_VOICE',
    'GROUP_DM',
    'GUILD_CATEGORY',
    'GUILD_ANNOUNCEMENT',
    'ANNOUNCEMENT_THREAD',
    'PUBLIC_THREAD',
    'PRIVATE_THREAD',
    'GUILD_STAGE_VOICE',
    'GUILD_DIRECTORY',
    'GUILD_FORUM',
];

export {
    ApplicationCommandTypesRaw,
    Events,
    ArgumentType,
    ArgumentChannelTypes,
};
