import type { DiscomClient } from '../base/Client';
import { Util } from '../util/util';
import { DiscomError } from './DiscomError';

export interface EventOptions {
    client?: DiscomClient,
    name: string;
    once: boolean;
    ws: boolean;
    run: (...args: any[]) => any;
}

/**
 * The Event class
 */
export class Event {
    public client: DiscomClient;
    public name: string;
    public once: boolean;
    public ws: boolean;
    public run: (...args: any[]) => any;
    public _options: any;
    public _path: string;

    constructor(options: EventOptions) {
        /**
         * The Event name.
         * @type {string}
         */
        this.name = Util.resolveString(options.name);
        /**
         * Whether the event should only run once.
         * @type {boolean}
         */
        this.once = String(options.once).toLowerCase() === 'true';
        /**
         * Whether the event should run on websocket.
         * @type {boolean}
         */
        this.ws = String(options.ws).toLowerCase() === 'true';
        /**
         * The function to run when the event is triggered.
         * @type {(...args: any[]) => any}
         */
        this.run = typeof options.run === 'function' ? options.run : this.run;
        /**
         * Options. Custom options for the event.
         */
        this._options = options;
    }

    /**
     * Initializes the event.
     * @param {DiscomClient} client The client
     */
    init(client: DiscomClient) {
        this.client = client;
    }

    /**
     * Reloads the event.
     */
    async reload(): Promise<boolean> {
        const eventPath = this.client.events.get(this.name)._path;

        delete require.cache[require.resolve(eventPath)];
        this.client.events.delete(this.name);

        const newEvent: any = await require(eventPath);
        newEvent.init(this.client);
        if (!(newEvent instanceof Event)) throw new DiscomError('[EVENT]', `Event ${newEvent.name} doesn't belong in Events.`);

        newEvent._path = eventPath;
        this.client.events.set(newEvent.name, newEvent);
        return true;
    }
}
