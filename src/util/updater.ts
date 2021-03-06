import fetch from 'node-fetch';
import { Color } from '../index';
const { version } = require('../../package.json');

export class Updater {
    static async __updater() {
        const Response: any = await fetch('https://registry.npmjs.org/discom');
        const data: any = await Response.json();
        const stableVersion = data['dist-tags'].latest;

        if (stableVersion !== version && !version.includes('dev')) {
            console.log(new Color(`&3[Discom] &aThere is a new version of Discom available! &e[${stableVersion}]`, { json: false }).getText());
        } else if (version.includes('dev')) {
            console.log(new Color(`&3[Discom] &aYou are running a development version of Discom! &e[${version}]`, { json: false }).getText());
        }
    }
}
