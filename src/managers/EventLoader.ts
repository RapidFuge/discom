import type { DiscomClient } from '../base/Client';
import { Color } from '../structures/Color';
import { Events } from '../util/Constants';
import fs from 'fs';
import { Event } from '../structures/Event';
import path from 'path';

/**
 * The Event Loader class.
 */
export class EventLoader {
    public client: DiscomClient;
    public eventDir: string;

    constructor(client: DiscomClient) {
        this.client = client;
        this.eventDir = this.client.eventDir;

        if (!this.eventDir) return;
        this.__loadEventFiles();
    }

    private async __loadEventFiles() {
        for await (const fsDirent of fs.readdirSync(this.eventDir, { withFileTypes: true })) {
            let file: any = fsDirent.name;
            const fileType = path.extname(file);
            const fileName = path.basename(file, fileType);

            if (fsDirent.isDirectory()) {
                await this.__loadEventCategoryFiles(file);
                continue;
            } else if (!['.js', '.ts'].includes(fileType)) { continue; }

            file = require(`${this.eventDir}/${file}`);
            file.init(this.client);
            if (!(file instanceof Event)) return console.log(new Color(`&3[EVENT] &hEvent ${fileName} doesnt belong in Events.`).getText());

            file._path = `${this.eventDir}/${fileName}${fileType}`;

            this.client.events.set(fileName, file);

            this.client.emit(Events.LOG, new Color(`&b[&3Discom&b] &2Loaded Event: &b➜ &9${fileName}`, { json: false }).getText());
        }

        await this.__loadEvents();
    }

    private async __loadEventCategoryFiles(categoryFolder) {
        for await (const fsDirent of fs.readdirSync(`${this.eventDir}/${categoryFolder}`, { withFileTypes: true })) {
            let file: any = fsDirent.name;
            const fileType = path.extname(file);
            const fileName = path.basename(file, fileType);

            if (fsDirent.isDirectory()) {
                await this.__loadEventCategoryFiles(`${categoryFolder}/${file}`);
                continue;
            } else if (!['.js', '.ts'].includes(fileType)) { continue; }

            file = require(`${this.eventDir}/${categoryFolder}/${file}`);
            file.init(this.client);
            if (!(file instanceof Event)) return console.log(new Color(`&3[EVENTS] &hEvent ${fileName} doesnt belong in Events.`).getText());

            file._path = `${this.eventDir}/${categoryFolder}/${fileName}${fileType}`;

            this.client.events.set(fileName, file);
            this.client.emit(Events.LOG, new Color(`&b[&3Discom&b] &3Loaded Event: &b➜ &9${fileName}`, { json: false }).getText());
        }
    }

    private __loadEvents() {
        this.client.events.forEach((event: any) => {
            if (event.name === 'ready') return event.run(this.client);

            if (event.ws) {
                if (event.once) return this.client.ws.once(event.name, (...args) => this.client.events.get(event.name)?.run(this.client, ...args));
                this.client.ws.on(event.name, (...args) => this.client.events.get(event.name)?.run(this.client, ...args));
            } else {
                if (event.once) return this.client.once(event.name, (...args) => this.client.events.get(event.name)?.run(this.client, ...args));
                this.client.on(event.name, (...args) => this.client.events.get(event.name)?.run(this.client, ...args));
            }
        });
    }
}
