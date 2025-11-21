import { lfkey } from '../constants.js';
import { utilities } from '../utils/utilities.js';

export class WKTUtilities {
    static wkts = [];

    static clear(fromMap, fromStorage) {
        if (fromStorage) localStorage.removeItem(lfkey);
        if (fromMap) window.map.set("wkts", []);
    }

    static load() {
        if (window.settingsManager?.getSettingById('wkt-presistent')) {
            const stored = localStorage.getItem(lfkey) || "[]";
            this.wkts = JSON.parse(stored);
        } else {
            this.wkts = [];
        }
        window.map.set("wkts", this.wkts);
    }

    static save() {
        if (window.settingsManager?.getSettingById('wkt-presistent')) {
            localStorage.setItem(lfkey, JSON.stringify(this.wkts));
        }
        window.map.set("wkts", this.wkts);
    }

    static remove(id) {
        this.wkts = this.wkts.filter(item => item.id !== id);
        this.save();
    }

    static async add(feature) {
        const wkt = utilities.getFeatureWKT(feature);
        if (!wkt) return;

        const checksum = await utilities.generateChecksum(wkt);
        if (!this.wkts.some(item => item.id === checksum)) {
            this.wkts.push({ id: checksum, wkt });
            feature.setId(checksum);
            this.save();
        }
    }

    static get() { return this.wkts; }

    static update(id, wkt) {
        const item = this.wkts.find(i => i.id === id);
        if (item) {
            item.wkt = wkt;
            this.save();
        }
    }
}