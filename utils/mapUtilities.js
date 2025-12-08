// js/utils/mapUtilities.js

import { MapManager } from '../map/setupMap.js';
import { featureUtilities } from './featureUtilities.js';
import { utilities } from './utilities.js';
import wktUtilities from '../classes/WKTUtilities.js';
import wktListManager from '../classes/WKTListManager.js';
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
		const selectBar = MapManager.map.getControls().getArray().find(c => c.get('className')?.includes('selectbar'));
		const centerBtn = MapManager.map.getControls().getArray().find(c => c.get('name') === 'centerObjects');

		if (count > 0) {
			//featureUtilities.createFromAllFeatures();
			if (centerBtn) centerBtn.setVisible(true);
		} else {
			if (selectBar) selectBar.setVisible(false);
			if (centerBtn) centerBtn.setVisible(false);
		}

		if (center && count > 0) await mapUtilities.center();
		MapManager.map.updateSize();
	},

	center: async function () {
		if (MapManager.featureCollection.getLength() > 0) {
			const extent = ol.extent.createEmpty();
			MapManager.featureCollection.forEach(f => ol.extent.extend(extent, f.getGeometry().getExtent()));
			MapManager.map.getView().fit(extent, { size: MapManager.map.getSize(), padding: [50, 50, 50, 50] });
		} else {
			MapManager.map.getView().setCenter(defaultCenter);
			MapManager.map.getView().setZoom(16);
		}
	},

	getFeatureCount: function () {
		const vl = MapManager.map.getLayers().getArray().find(l => l instanceof ol.layer.Vector && l !== MapManager.vectorLayer);
		return vl ? vl.getSource().getFeatures().length : 0;
	},

	loadWKT: async function (wkt) {

		try {
			const wkts = wktUtilities.get() || [];

			(async () => {
				for (let wkt of wkts) {
					console.log('Processing Memoria WKT:', wkt);
					await featureUtilities.addFeature(wkt.id, wkt.wkt);
				}
			})();

			const arrWKT = (wkt || "")
				.split(/\r?\n/)
				.map(line => line.trim())
				.filter(line => line.length > 0)
				.map(raw => ({
					original: raw,
					normalized: utilities.normalizeWKT(raw)
				}))
				.filter(item => item.normalized.length > 0)
				.filter((item, index, self) =>
					index === self.findIndex(i => i.normalized === item.normalized)
				)
				.map(item => item.normalized);

			console.log('Normalized WKTs to load:', arrWKT);

			(async () => {
				for (let wkt of arrWKT) {
					console.log('Processing Clipboard WKT:', wkt);
					const checksum = await utilities.generateChecksum(wkt);
					let exists = false;
					for (const item of wkts) {
						if (checksum && item.id === checksum) {
							exists = true;
							break;
						}
					}
					if (!exists) {
						wkts.push({ id: checksum, wkt });

						MapManager.map.set("wkts", wkts);

						console.log('Processing WKT:', wkt);

						wktUtilities.save();
						await featureUtilities.addFeature(checksum, wkt);
					}
				}
			})();

			MapManager.map.set("wkts", wkts);

			wktUtilities.save();

			await featureUtilities.addVectorLayer();

			featureUtilities.centerOnVector();

			await this.reviewLayout();

			wktListManager.updateCopyButton();

		} catch (error) {
			console.error('Error loading WKT:', error);
		}
	},

	loadOnStart: async function () {

		const textarea = document.querySelector("#wktdefault textarea");

		try {
			// Load existing WKT entries from localStorage
			wktUtilities.load();
			let wkts = wktUtilities.get();

			console.log('Existing WKTs:', wkts);

			if (!Array.isArray(wkts)) {
				wkts = [];
			}

			textarea.focus();

			let wktClipboard = await utilities.readClipboard();

			console.log('WKT from clipboard:', wktClipboard);

			await this.loadWKT(wktClipboard);

		} catch (error) {
			console.error('Error loading WKTs:', error);
		}
	}
};