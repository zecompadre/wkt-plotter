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
		let newfeature = null;

		// 1. Carrega os WKTs existentes do localStorage
		WKTUtilities.load();
		let wkts = WKTUtilities.get() || [];

		const textarea = document.querySelector("#wktdefault textarea");
		textarea?.focus();

		// 2. Lê do clipboard se pedido
		let clipboardText = "";
		if (readcb) {
			clipboardText = await utilities.readClipboard();
		}

		const newLines = clipboardText
			? clipboardText.split("\n").map(l => l.trim()).filter(Boolean)
			: [];

		// 3. Processa apenas os NOVOS WKTs (não os antigos!)
		for (const singleWkt of newLines) {
			if (!singleWkt) continue;

			const checksum = await utilities.generateChecksum(singleWkt);
			const exists = wkts.some(item => item.id === checksum);

			if (!exists) {
				// NOVO WKT → adiciona
				newfeature = featureUtilities.addToFeatures(checksum, singleWkt);
				wkts.push({ id: checksum, wkt: singleWkt });
			} else {
				// Já existe → só atualiza (opcional)
				featureUtilities.addToFeatures(checksum, singleWkt);
				newfeature = vectorLayer.getSource().getFeatureById(checksum);
			}
		}

		// 4. Só salva se houver algo novo
		if (newLines.length > 0) {
			map.set("wkts", wkts);
			WKTUtilities.save();
		}

		// 5. Atualiza o mapa
		await featureUtilities.addFeatures();
		await this.reviewLayout(!frompaste);  // ← correto: !frompaste

		// 6. ZOOM SÓ QUANDO FOR DO CLIPBOARD!
		if (/*!frompaste && */newfeature) {
			featureUtilities.centerOnFeature(newfeature);
		}
	},
};