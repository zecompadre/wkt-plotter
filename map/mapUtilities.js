// js/map/mapUtilities.js

import { WKTUtilities } from '../classes/WKTUtilities.js';
import { utilities } from '../utils/utilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';

export const mapUtilities = {
	async loadWKTs(readClipboard = false, fromPaste = false) {
		WKTUtilities.load();
		const wkts = WKTUtilities.get();

		// Elementos essenciais
		const textarea = document.querySelector("#wktdefault textarea");
		const format = new ol.format.WKT();

		// Vector source (não collection!)
		const vectorLayer = window.map.getLayers().getArray().find(l => l instanceof ol.layer.Vector);
		const vectorSource = vectorLayer.getSource();

		// 1. Carrega primeiro os WKTs persistentes do localStorage
		vectorSource.clear(); // limpa o que estiver no mapa
		wkts.forEach(item => {
			try {
				const feature = format.readFeature(item.wkt);
				feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
				feature.setId(item.id);
				vectorSource.addFeature(feature);
			} catch (e) {
				console.warn("WKT persistente inválido ignorado:", item.id);
			}
		});

		// 2. Se pediu para ler o clipboard...
		if (readClipboard) {
			const clipboardText = await utilities.readClipboard();

			console.log(clipboardText);

			if (clipboardText) {
				const lines = clipboardText.trim().split(/\n/).filter(line => line.trim());

				for (const line of lines) {
					const checksum = await utilities.generateChecksum(line);

					// Evita duplicados
					if (wkts.some(item => item.id === checksum)) continue;

					// Adiciona o novo
					const newFeature = featureUtilities.addToFeatures(
						checksum,
						line,
						textarea,
						vectorSource,   // ← agora passa o source
						format
					);

					if (newFeature) {
						wkts.push({ id: checksum, wkt: line });
						if (fromPaste) {
							featureUtilities.centerOnFeature(newFeature, window.map);
						}
					}
				}
				WKTUtilities.save();
			}
		}

		// Atualiza o textarea com todos os WKTs (opcional, mas útil)
		if (vectorSource.getFeatures().length > 0) {
			const allWKTs = featureUtilities.convertFeaturesToWKT(vectorLayer);
			textarea.value = allWKTs.join("\n");
		}
	}
};