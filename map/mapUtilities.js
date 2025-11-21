import { utilities } from '../utils/utilities.js';
import { WKTUtilities } from '../classes/WKTUtilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';

export const mapUtilities = {
	async loadWKTs(readcb = false, frompaste = false) {
		WKTUtilities.load();
		let wkts = WKTUtilities.get();
		const textarea = document.querySelector("#wktdefault textarea");
		const format = new ol.format.WKT();
		const featureCollection = window.map.getLayers().getArray().find(l => l instanceof ol.layer.Vector).getSource();

		if (readcb) {
			const clipboard = await utilities.readClipboard();
			if (clipboard) {
				const lines = clipboard.trim().split("\n");
				for (const line of lines) {
					if (line.trim()) {
						const checksum = await utilities.generateChecksum(line);
						if (!wkts.some(i => i.id === checksum)) {
							wkts.push({ id: checksum, wkt: line });
							const newFeature = featureUtilities.addToFeatures(checksum, line, textarea, featureCollection, format);
							if (frompaste && newFeature) featureUtilities.centerOnFeature(newFeature, window.map);
						}
					}
				}
				WKTUtilities.save();
			}
		}

		// Load existing
		featureCollection.clear();
		wkts.forEach(item => {
			try {
				const f = format.readFeature(item.wkt);
				f.getGeometry().transform('EPSG:4326', 'EPSG:3857');
				f.setId(item.id);
				featureCollection.addFeature(f);
			} catch (e) { console.error(e); }
		});
	}
};