import type { DiscomClient } from '../../base/Client';
import type { ArgumentTypes } from '../Argument';
import { DiscomError } from '../DiscomError';

export class ArgumentType {
    public client: DiscomClient;
    public type: ArgumentTypes;

    constructor(client: DiscomClient, type: ArgumentTypes) {
        if (!client) throw new DiscomError('[ARGUMENTS]', 'You must specify the client');
        if (!type) throw new DiscomError('[ARGUMENTS]', 'You must specify the argument type');

        this.client = client;
        this.type = type;

        return this;
    }

    public resolve(option) {
        return option;
    }
}
