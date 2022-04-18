import type { DiscomClient } from '../base/Client';
import { DiscomError } from '../structures/DiscomError';
import Keyv from 'keyv';

/**
 * The database loader class.
 */
export class DatabaseLoader {
    public client: DiscomClient;

    constructor(client: DiscomClient) {
        this.client = client;
        this.__loadDB();
    }

    private __loadDB() {
        const dbType = this.client.database;
        if (!dbType) { this.client.database = undefined; } else {
            try {
                this.client.database = new Keyv(dbType);
            } catch (e) {
                throw new DiscomError('[DATABASE]', e);
            }
        }
    }
}
