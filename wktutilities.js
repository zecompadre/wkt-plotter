/**
 * Utility class for handling WKT (Well-Known Text) operations,
 * including saving, loading, removing, updating, and interacting with the clipboard.
 */
export default class WKTUtilities {
	/**
	 * Internal variable to hold the WKTs array.
	 */
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

	/**
	 * Loads WKT data from localStorage and updates the internal wkts variable.
	 */
	static load() {
		if (settingsManager.getSettingById('wkt-presistent')) {
			const storedData = localStorage.getItem(lfkey) || "[]";
			this.wkts = JSON.parse(storedData);
		} else {
			this.wkts = [];
		}
		map.set("wkts", this.wkts); // Sync with the map
		console.log("Loaded WKTs:", this.wkts);
	}

	/**
	 * Saves the current WKT data to localStorage and syncs with the map.
	 */
	static save() {
		if (settingsManager.getSettingById('wkt-presistent')) {
			localStorage.setItem(lfkey, JSON.stringify(this.wkts));
		}
		map.set("wkts", this.wkts); // Update the map's WKT collection
		console.log("Saved WKTs:", this.wkts);
	}

	/**
	 * Removes a WKT entry by its ID.
	 * @param {string} id - The ID of the WKT to remove.
	 */
	static remove(id) {
		this.wkts = this.wkts.filter((item) => item.id !== id);
		this.save();
		console.log(`Removed WKT with ID: ${id}`);
	}

	/**
	 * Adds a new WKT entry for a given feature after generating a checksum.
	 * @param {ol.Feature} feature - The OpenLayers feature to add.
	 * @async
	 */
	static async add(feature) {
		try {
			const wkt = utilities.getFeatureWKT(feature);

			if (!wkt) {
				throw new Error("Feature WKT is undefined or invalid.");
			}

			const checksum = await utilities.generateChecksum(wkt);

			// Check if the WKT already exists based on the checksum
			if (!this.wkts.some((item) => item.id === checksum)) {
				this.wkts.push({
					id: checksum,
					wkt
				});
				feature.setId(checksum); // Assign checksum as feature ID
				this.save(); // Persist changes
				console.log("Added new WKT:", {
					id: checksum,
					wkt
				});
			} else {
				console.log("WKT already exists with ID:", checksum);
			}
		} catch (error) {
			console.error("Error adding WKT:", error.message);
		}
	}

	/**
	 * Retrieves all WKT entries.
	 * @returns {Array} - An array of WKT objects.
	 */
	static get() {
		return this.wkts;
	}

	/**
	 * Updates an existing WKT entry by ID.
	 * @param {string} id - The ID of the WKT to update.
	 * @param {string} wkt - The updated WKT string.
	 */
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
