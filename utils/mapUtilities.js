// js/utils/mapUtilities.js

import { map, vectorLayer, featureCollection, defaultCenter } from '../map/setupMap.js';
import { featureUtilities } from './featureUtilities.js';
import { utilities } from './utils/utilities.js';
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

	loadWKTs: async function (readcb = false, frompaste = false) {
		let newfeature = null;
		WKTUtilities.load();
		let wkts = WKTUtilities.get() || [];

		const textarea = document.querySelector("#wktdefault textarea");
		textarea.focus();

		let wkt = readcb ? await utilities.readClipboard() : "";
		let arrWKT = wkt ? wkt.split("\n") : [];

		for (const singleWkt of arrWKT) {
			if (!singleWkt.trim()) continue;
			const checksum = await utilities.generateChecksum(singleWkt);
			let exists = wkts.some(item => item.id === checksum);

			if (!exists) {
				newfeature = featureUtilities.addToFeatures(checksum, singleWkt);
				wkts.push({ id: checksum, wkt: singleWkt });
			} else {
				featureUtilities.addToFeatures(checksum, singleWkt);
			}
		}

		map.set("wkts", wkts);
		WKTUtilities.save();
		await featureUtilities.addFeatures();
		await mapUtilities.reviewLayout(!frompaste);

		if (frompaste && newfeature) {
			featureUtilities.centerOnFeature(newfeature);
		}
	}
};