import { lfkey } from '../utils/constants.js';
import { map } from '../map/setupMap.js';
import { utilities } from '../utils/utilities.js';

export default class WKTUtilities {
	static wkts = [];

	static clear(fromMap, fromStorage) {
		if (fromStorage) {
			localStorage.removeItem(lfkey);
			console.log("Removed WKTs from localStorage.");
		}
		if (fromMap) {
			map.set("wkts", []);
			console.log("Removed WKTs from map.");
		}
	}

	static load() {
		if (window.settingsManager?.getSettingById('wkt-presistent')) {
			const storedData = localStorage.getItem(lfkey) || "[]";
			this.wkts = JSON.parse(storedData);
		} else {
			this.wkts = [];
		}
		map.set("wkts", this.wkts);
	}

	static save() {
		if (window.settingsManager?.getSettingById('wkt-presistent')) {
			localStorage.setItem(lfkey, JSON.stringify(this.wkts));
		}
		map.set("wkts", this.wkts);
	}

	static remove(id) {
		this.wkts = this.wkts.filter((item) => item.id !== id);
		this.save();
		console.log(`Removed WKT with ID: ${id}`);
	}

	static async add(feature) {
		try {
			const wkt = utilities.getFeatureWKT(feature);
			if (!wkt) throw new Error("Feature WKT is undefined or invalid.");
			const checksum = await utilities.generateChecksum(wkt);
			if (!this.wkts.some((item) => item.id === checksum)) {
				this.wkts.push({ id: checksum, wkt });
				feature.setId(checksum);
				this.save();
				console.log("Added new WKT:", { id: checksum });
			} else {
				console.log("WKT already exists with ID:", checksum);
			}
		} catch (error) {
			console.error("Error adding WKT:", error.message);
		}
	}

	static get() {
		return this.wkts;
	}

	static update(id, wkt) {
		const updated = this.wkts.find((item) => item.id === id);
		if (updated) {
			updated.wkt = wkt;
			this.save();
			console.log(`Updated WKT with ID: ${id}`, updated);
		} else {
			console.warn(`WKT with ID: ${id} not found.`);
		}
	}
}