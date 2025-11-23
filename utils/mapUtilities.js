// js/utils/mapUtilities.js

import { map, vectorLayer, featureCollection, defaultCenter } from '../map/setupMap.js';
import { featureUtilities } from './featureUtilities.js';
import { utilities } from './utilities.js';
import WKTUtilities from '../classes/WKTUtilities.js';
import { osmLayer, arcgisLayer } from '../map/layers.js';

export const mapUtilities = {
	toggleLayers: function () {
		const osmVisible = osmLayer.getVisible();
		osmLayer.setVisible(!osmVisible);
		arcgisLayer.setVisible(osmVisible);

		const btn = map.getControls().getArray()
			.find(c => c instanceof ol.control.Button && c.get('name') === 'layerChange');
		if (btn) btn.setHtml(utilities.layerChangeBtnHtml());
	},

	reviewLayout: async function (center = true) {
		const count = mapUtilities.getFeatureCount();
		const selectBar = map.getControls().getArray().find(c => c.get('className')?.includes('selectbar'));
		const centerBtn = map.getControls().getArray().find(c => c.get('name') === 'centerObjects');

		if (count > 0) {
			featureUtilities.createFromAllFeatures();
			if (centerBtn) centerBtn.setVisible(true);
		} else {
			if (selectBar) selectBar.setVisible(false);
			if (centerBtn) centerBtn.setVisible(false);
		}

		if (center && count > 0) await mapUtilities.center();
		map.updateSize();
	},

	center: async function () {
		if (featureCollection.getLength() > 0) {
			const extent = ol.extent.createEmpty();
			featureCollection.forEach(f => ol.extent.extend(extent, f.getGeometry().getExtent()));
			map.getView().fit(extent, { size: map.getSize(), padding: [50, 50, 50, 50] });
		} else {
			map.getView().setCenter(defaultCenter);
			map.getView().setZoom(16);
		}
	},

	getFeatureCount: function () {
		const vl = map.getLayers().getArray().find(l => l instanceof ol.layer.Vector && l !== vectorLayer);
		return vl ? vl.getSource().getFeatures().length : 0;
	},

	// js/utils/mapUtilities.js
	// js/utils/mapUtilities.js → VERSÃO DEFINITIVA E CORRETA!
	loadWKTs: async function (readcb = false, frompaste = false) {
		const self = this; // Capture the correct context
		let newfeature = null;
		try {
			// Load existing WKT entries from localStorage
			WKTUtilities.load();
			let wkts = WKTUtilities.get();

			if (!Array.isArray(wkts)) {
				wkts = [];
			}

			// Focus on textarea to prepare for possible WKT paste
			const textarea = document.querySelector("#wktdefault textarea");
			textarea.focus();

			let wkt = readcb ? await utilities.readClipboard() : "";

			// Ensure wkts is an array

			let arrWKT = wkt.split("\n");
			(async () => {
				for (const wkt of arrWKT) {
					console.dir(arrWKT);

					// Generate checksum for the WKT string
					const checksum = await utilities.generateChecksum(wkt);

					// Check for existing WKT entries and add them to features
					let exists = false;
					wkts.forEach(item => {
						if (checksum && item.id === checksum) {
							exists = true;
						}
						featureUtilities.addToFeatures(item.id, item.wkt);
					});

					// Add the new WKT if it doesn't exist
					if (wkt && !exists) {
						wkts.push({
							id: checksum,
							wkt
						});
						newfeature = featureUtilities.addToFeatures(checksum, wkt);
					}
				}

				// Save the updated WKT list
				map.set("wkts", wkts);

				WKTUtilities.save();

				// Add features to the map and review layout
				await featureUtilities.addFeatures();

				await self.reviewLayout(!frompaste);

				// console.log(newfeature);

				if (frompaste && newfeature) {
					featureUtilities.centerOnFeature(newfeature);
				}
			})();

		} catch (error) {
			console.error('Error loading WKTs:', error);
		}
	}
};