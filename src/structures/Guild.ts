import { Guild as guild } from 'discord.js';
import type { GuildLanguageTypes } from '../base/Client';

declare module 'discord.js' {
    export interface Guild {
        /**
         * Method to get command prefix
         * @param {object} options
        */
        getCommandPrefix: (options?: any) => Promise<string>;
        /**
         * Method to set command prefix
         * @param {string} prefix
        */
        setCommandPrefix: (prefix: string) => Promise<boolean>;
        /**
         * Method to get language
         * @param {object} options
        */
        getLanguage: (options?: any) => Promise<string>;
        /**
         * Method to set language
         * @param {string} language
        */
        setLanguage: (language: GuildLanguageTypes) => Promise<boolean>;
        /**
         * Method to get data
         * @param {object} options
        */
        getData: (options?: any) => Promise<any>;
        /**
         * Method to set data
         * @param {object} data
        */
        setData: (data: any) => Promise<boolean>;
    }
}

/**
 * The Guild Class
 * @extends {Guild}
 */
export class Guild {
    public getCommandPrefix: (options: any) => Promise<string>;
    /**
     * Method to set command prefix
     * @param {string} prefix
    */
    public setCommandPrefix: (prefix: string) => Promise<boolean>;
    /**
     * Method to get language
     * @param {object} options
    */
    public getLanguage: (options: any) => Promise<string>;
    /**
     * Method to set language
     * @param {string} language
    */
    public setLanguage: (language: GuildLanguageTypes) => Promise<boolean>;
    /**
     * Method to get data
     * @param {object} options
    */
    public getData: (options: any) => Promise<any>;
    /**
     * Method to set data
     * @param {object} data
    */
    public setData: (data: any) => Promise<boolean>;

    constructor() {
        Object.defineProperties(guild.prototype, {
            getCommandPrefix: {
                value: async function () {
                    const prefix = await this.client.dispatcher.getGuildPrefix(this);
                    return prefix || this.client.prefix;
                },
            },
            setCommandPrefix: {
                value: async function (prefix) {
                    const isSet = await this.client.dispatcher.setGuildPrefix(this, prefix);
                    /**
                     * Emmited when a guild's prefix is changed.
                     * @event DiscomClient#commandPrefixChange
                     * @param {string} prefix The new prefix
                     * @example client.on('commandPrefixChange', (prefix) => console.log(prefix));
                     */
                    this.client.emit('commandPrefixChange', prefix);
                    return isSet;
                },
            },

            getLanguage: {
                value: async function () {
                    const language = await this.client.dispatcher.getGuildLanguage(this);
                    return language || this.client.language || 'english';
                },
            },
            setLanguage: {
                value: async function (lang) {
                    const isSet = await this.client.dispatcher.setGuildLanguage(this, lang);
                    /**
                     * Emmited when a guild's language is changed.
                     * @event DiscomClient#guildLanguageChange
                     * @param {string} language The new language
                     * @example client.on('guildLanguageChange', (language) => console.log(language));
                     */
                    this.client.emit('guildLanguageChange', lang);
                    return isSet;
                },
            },
            getData: {
                value: async function (options = {}) {
                    const data = await this.client.dispatcher.getGuildData(this, options);
                    if (data) this.data = data;
                    return data;
                },
            },
            setData: {
                value: async function (data) {
                    if (!data) data = this.data;
                    const isSet = await this.client.dispatcher.setGuildData(this, data);
                    if (isSet) this.data = data;
                    return isSet;
                },
            },
        });
    }
}
