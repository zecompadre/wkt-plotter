// js/utils/featureUtilities.js

import { map, vectorLayer, format, featureCollection } from '../map/setupMap.js';
import { utilities } from './utilities.js';
import { projections, colors } from './constants.js';

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

	addToFeatures: async (id, wkt) => {
		const textarea = document.querySelector("#wktdefault textarea");
		const wktString = wkt || textarea.value;

		if (!wktString.trim()) {
			return null;
		}

		console.log('Adding WKT to features:', wktString);

		let newFeature;
		try {
			newFeature = format.readFeature(wktString);
		} catch (err) {
			console.error('Error reading WKT:', err);
			return null;
		}

		if (!newFeature) {
			return null;
		}

		newFeature.getGeometry().transform(projections.geodetic, projections.mercator);
		newFeature.setId(id);
		featureCollection.push(newFeature);

		const list = document.getElementById('wkt-list');
		if (list) {
			list.querySelectorAll(`li[data-id="${id}"]`).forEach(el => el.remove());

			const li = document.createElement('li');
			li.dataset.id = id;
			li.className = 'wkt-item';

			const img = document.createElement('img');
			img.width = 120;
			img.height = 90;

			const blobUrl = await featureUtilities.wktToPngBlobUrl(wktString);

			img.src = blobUrl;

			const center = ol.extent.getCenter(newFeature.getGeometry().getExtent());
			const [lon, lat] = ol.proj.toLonLat(center);

			li.innerHTML = `
      <img>
      <div>
        <strong>${newFeature.getGeometry().getType()}</strong>
        <div>lat: ${lat.toFixed(6)} | lon: ${lon.toFixed(6)}</div>
        <small>#${id.slice(0, 8)}</small>
      </div>
    `;
			li.querySelector('img').replaceWith(img);
			list.appendChild(li);

			//featureUtilities.featureToImage(newFeature);

			// === CLIQUE NA LISTA ===
			li.addEventListener('click', () => {
				const f = vectorLayer.getSource().getFeatureById(id);
				if (f) {
					const select = map.getInteractions().getArray().find(i => i instanceof ol.interaction.Select);
					if (select) {
						const isSelected = select.getFeatures().getArray().includes(f);
						if (isSelected) {
							select.getFeatures().clear();
							textarea.value = "";
							list.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
							featureUtilities.centerOnVector();
						} else {
							select.getFeatures().clear();
							select.getFeatures().push(f);
							textarea.value = utilities.getFeatureWKT(f);
							list.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
							li.classList.add('selected');
							featureUtilities.centerOnFeature(f);
						}
					}
				}
			});

			li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}

		textarea.value = "";
		textarea.style.borderColor = "";
		textarea.style.backgroundColor = "";

		return newFeature;
	},
	wktToPngBlobUrl: async function (wkt) {
		if (!wkt || wkt.trim() === '') return null;

		let geojson;
		try {
			geojson = Terraformer.WKT.parse(wkt);
		} catch (e) {
			console.warn('WKT inválido', e);
			return null;
		}

		// 1. Bounding box
		const [west, south, east, north] = Terraformer.Tools.calculateBounds(geojson);
		const geoW = east - west || 0.0001;
		const geoH = north - south || 0.0001;

		// 2. Canvas 90×70
		const canvas = document.createElement('canvas');
		canvas.width = 90;
		canvas.height = 70;
		const ctx = canvas.getContext('2d');

		// 3. Fundo do mapa
		const bg = new Image();
		bg.src = 'map-background.jpg';
		await new Promise(r => { bg.onload = r; bg.onerror = r; });
		ctx.drawImage(bg, 0, 0, 90, 70);

		// 4. Zoom out (padding) — 35% extra (idêntico ao PLOTTER)
		const paddingFactor = 1.35;
		const viewW = geoW * paddingFactor;
		const viewH = geoH * paddingFactor;

		// 5. Escala uniforme (preserva proporção)
		const scale = Math.min(90 / viewW, 70 / viewH);

		// 6. Centro da geometria (em coordenadas reais)
		const centerLon = west + geoW / 2;
		const centerLat = south + geoH / 2;

		// 7. Centro do canvas (em pixels)
		const canvasCenterX = 45;
		const canvasCenterY = 35;

		// 8. Transformação correta: mundo → pixel, com centro alinhado
		const toPixel = (lon, lat) => ({
			x: 45 + (lon - centerLon) * scale,        // 45 = centro horizontal do canvas
			y: 35 + (centerLat - lat) * scale         // 35 = centro vertical + Y invertido
		});

		// 9. Desenho da feature
		const drawRing = ring => {
			ctx.beginPath();
			ring.forEach((c, i) => {
				const p = toPixel(c[0], c[1]);
				i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
			});
			ctx.closePath();

			ctx.globalAlpha = 1;
			ctx.lineWidth = Math.max(0.9, scale * 0.0012 * geoW);
			ctx.strokeStyle = colors.normal;
			ctx.stroke();

			ctx.globalAlpha = 0.50;
			ctx.fillStyle = colors.snap;
			ctx.fill('evenodd');

			ctx.globalAlpha = 1;

		};

		const draw = g => {
			if (!g) return;
			if (g.type === 'Polygon') g.coordinates.forEach(drawRing);
			if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(drawRing));
			if (g.type === 'LineString') drawRing(g.coordinates);
			if (g.type === 'MultiLineString') g.coordinates.forEach(drawRing);
			if (g.type === 'Point' || g.type === 'MultiPoint') {
				const pts = g.type === 'Point' ? [g.coordinates] : g.coordinates;
				pts.forEach(c => {
					const p = toPixel(c[0], c[1]);
					ctx.beginPath();
					ctx.arc(p.x, p.y, ctx.lineWidth * 2.5, 0, Math.PI * 2);
					ctx.fill();
					ctx.stroke();
				});
			}
		};

		draw(geojson);

		// 10. Retorna blob URL
		return new Promise(resolve => {
			canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/png');
		});
	}
};
