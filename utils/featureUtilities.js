// js/utils/featureUtilities.js

import { map, vectorLayer, format, featureCollection } from '../map/setupMap.js';
import { utilities } from './utilities.js';
import { projections } from './constants.js';

export const featureUtilities = {
	deselectCurrentFeature: (active) => {
		const selectInteraction = map.getInteractions().getArray()
			.find(i => i instanceof ol.interaction.Select);
		if (!selectInteraction) return;

		let conditionSelection = selectInteraction.getActive();
		if (!active) conditionSelection = !conditionSelection;

		const selectedFeatures = selectInteraction.getFeatures();
		if (conditionSelection && selectedFeatures.getLength() > 0) {
			const activeFeature = selectedFeatures.item(0);
			selectInteraction.dispatchEvent({
				type: 'select',
				selected: [],
				deselected: [activeFeature]
			});
			selectedFeatures.remove(activeFeature);
		}
	},

	createFromAllFeatures: () => {
		const wktArray = featureUtilities.convertFeaturesToWKT(vectorLayer);
		const textarea = document.querySelector("#wktdefault textarea");
		if (textarea && wktArray.length > 0) {
			textarea.value = wktArray.join("\n");
		}
	},

	convertFeaturesToWKT: (vectorLayer) => {
		const source = vectorLayer.getSource();
		const features = source.getFeatures();
		const wktFormat = new ol.format.WKT();
		const wktRepresentations = [];

		features.forEach(feature => {
			try {
				let geometry = feature.getGeometry();
				if (geometry) {
					const geom = geometry.clone();
					geom.transform(projections.mercator, projections.geodetic);
					const wkt = wktFormat.writeGeometry(geom, { decimals: 5 });
					wktRepresentations.push(wkt);
				}
			} catch (error) {
				console.error(`Error converting feature ${feature.getId()} to WKT:`, error);
			}
		});

		return wktRepresentations;
	},

	centerOnFeature: (feature) => {
		if (!feature) return;
		const geometry = feature.getGeometry();
		const extent = geometry.getExtent();
		const center = ol.extent.getCenter(extent);
		map.getView().setCenter(center);
		map.getView().fit(extent, { size: map.getSize(), padding: [50, 50, 50, 50] });
	},

	centerOnVector: () => {
		if (vectorLayer.getSource().getFeatures().length === 0) return;
		const extent = vectorLayer.getSource().getExtent();
		map.getView().fit(extent, { size: map.getSize(), padding: [50, 50, 50, 50] });
	},

	featuresToMultiPolygon: () => {
		const features = vectorLayer.getSource().getFeatures();
		const polygons = features.filter(f =>
			['Polygon', 'MultiPolygon'].includes(f.getGeometry().getType())
		);

		if (polygons.length === 0) return null;
		if (polygons.length === 1) {
			return new ol.Feature(new ol.geom.Polygon(polygons[0].getGeometry().getCoordinates()));
		}

		const coords = polygons.map(f => f.getGeometry().getCoordinates());
		return new ol.Feature(new ol.geom.MultiPolygon(coords));
	},

	addFeatures: async () => {
		if (vectorLayer) map.removeLayer(vectorLayer);
		utilities.createVectorLayer();
		map.addLayer(vectorLayer);
		featureUtilities.createFromAllFeatures();
	},

	addToFeatures: (id, wkt) => {
		const textarea = document.querySelector("#wktdefault textarea");
		const wktString = wkt || textarea.value;

		if (!wktString.trim()) {
			textarea.style.borderColor = "red";
			textarea.style.backgroundColor = "#F7E8F3";
			return null;
		}

		let newFeature;
		try {
			newFeature = format.readFeature(wktString);
		} catch (err) {
			console.error('Error reading WKT:', err);
			textarea.style.borderColor = "red";
			textarea.style.backgroundColor = "#F7E8F3";
			return null;
		}

		if (!newFeature) {
			textarea.style.borderColor = "red";
			textarea.style.backgroundColor = "#F7E8F3";
			return null;
		}

		newFeature.getGeometry().transform(projections.geodetic, projections.mercator);
		newFeature.setId(id);
		featureCollection.push(newFeature);

		textarea.style.borderColor = "";
		textarea.style.backgroundColor = "";

		// ============ LISTA COM MINI PREVIEW ============
		const list = document.getElementById('wkt-list');
		if (list) {
			const geom = newFeature.getGeometry();
			const type = geom.getType();
			const extent = geom.getExtent();
			const center = ol.extent.getCenter(extent);
			const [lon, lat] = ol.proj.toLonLat(center);

			// Remove item antigo (evita duplicados)
			list.querySelectorAll(`li[data-id="${id}"]`).forEach(el => el.remove());

			const li = document.createElement('li');
			li.dataset.id = id;
			li.style.cssText = `
      display: flex; align-items: center; gap: 12px;
      padding: 12px; margin: 8px 0;
      background: #2d3748; color: white;
      border-radius: 10px; cursor: pointer;
      border-left: 5px solid #4299e1;
      transition: all 0.3s;
    `;

			// Mini canvas preview
			const canvas = document.createElement('canvas');
			canvas.width = 90;
			canvas.height = 70;
			canvas.style.borderRadius = '6px';
			canvas.style.background = '#1a202c';

			li.innerHTML += `
      <div style="flex:1;">
        <strong style="color:#63b3ed;">${type}</strong>
        <div style="font-size:0.8em; opacity:0.9; margin-top:4px;">
          lat: ${lat.toFixed(6)} | lon: ${lon.toFixed(6)}
        </div>
        <small style="opacity:0.7;">#${id.slice(0, 8)}</small>
      </div>
    `;
			li.prepend(canvas);

			// Hover + clique
			li.addEventListener('mouseenter', () => li.style.transform = 'translateX(4px)');
			li.addEventListener('mouseleave', () => li.style.transform = '');
			li.addEventListener('click', () => {
				const feature = vectorLayer.getSource().getFeatureById(id);
				if (feature) {
					const select = map.getInteractions().getArray()
						.find(i => i instanceof ol.interaction.Select);
					if (select) {
						select.getFeatures().clear();
						select.getFeatures().push(feature);
					}
					featureUtilities.centerOnFeature(feature);
					list.querySelectorAll('li').forEach(el => el.style.opacity = '0.6');
					li.style.opacity = '1';
					li.style.borderLeftColor = '#48bb78';
				}
			});

			list.appendChild(li);

			// ============ DESENHA A PREVIEW NO CANVAS ============
			const ctx = canvas.getContext('2d');
			const size = canvas.width;
			const padding = 10;

			// Fundo
			ctx.fillStyle = '#1a202c';
			ctx.fillRect(0, 0, size, size);

			// Converte extent para coordenadas do canvas
			const worldWidth = extent[2] - extent[0];
			const worldHeight = extent[3] - extent[1];
			const scaleX = (size - padding * 2) / worldWidth;
			const scaleY = (size - padding * 2) / worldHeight;
			const scale = Math.min(scaleX, scaleY);

			const offsetX = padding - extent[0] * scale + (size - worldWidth * scale) / 2;
			const offsetY = padding - extent[3] * scale + (size - worldHeight * scale) / 2;

			// Desenha o polígono
			ctx.strokeStyle = '#48bb78';
			ctx.lineWidth = 2;
			ctx.fillStyle = 'rgba(72, 187, 120, 0.3)';

			const coords = type === 'Polygon' ? geom.getCoordinates()[0] : geom.getCoordinates().flat(2);
			ctx.beginPath();
			coords.forEach((ring, i) => {
				if (i === 0) {
					ctx.moveTo(
						ring[0] * scale + offsetX,
						size - (ring[1] * scale + offsetY)
					);
				}
				for (let j = 1; j < ring.length; j++) {
					ctx.lineTo(
						ring[j][0] * scale + offsetX,
						size - (ring[j][1] * scale + offsetY)
					);
				}
				ctx.closePath();
			});
			ctx.fill();
			ctx.stroke();

			li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}

		return newFeature;
	},
};