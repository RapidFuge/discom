import { Color } from './Color';

/**
 * A DiscomError is a custom error that can be thrown by the Discom library.
 * @extends {Error}
 */
export class DiscomError extends Error {
    public message: any;
    public name: any;

    constructor(name: any, message: any) {
        super(message);

        this.message = new Color(`&c${message}`).getText();
        this.name = new Color(`&a${name}`).getText();
    }
}
