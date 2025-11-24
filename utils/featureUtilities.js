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
	featureToImage: async (feature) => {
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		const id = feature.getId();

		const img = document.querySelector(`li[data-id="${id}"] img`);

		console.log('Generating preview for feature ID:', id);
		console.log(img);

		const oldCenter = map.getView().getCenter();
		const oldRes = map.getView().getResolution();

		const allFeatures = vectorLayer.getSource().getFeatures();

		allFeatures.forEach(f => {
			if (f !== feature) f.setStyle(new ol.style.Style({})); // invisível
		});

		const extent = feature.getGeometry().getExtent();
		const resolution = map.getView().getResolutionForExtent(extent, map.getSize());
		const newCenter = ol.extent.getCenter(extent);

		map.getView().setCenter(newCenter);
		map.getView().setResolution(resolution * 0.7);

		const controls = document.querySelectorAll('.ol-control');
		controls.forEach(el => el.style.setProperty('display', 'none', 'important'));

		map.once('rendercomplete', () => {
			domtoimage.toPng(document.getElementById('map'), {
				bgcolor: '#000000'
			})
				.then(dataUrl => {
					img.src = dataUrl;
					img.style.opacity = '1';

					allFeatures.forEach(f => f.setStyle(undefined));

					// VOLTA AO ZOOM GERAL
					map.getView().setCenter(oldCenter);
					map.getView().setResolution(oldRes);

					// No final da lista → zoom geral
					if (list.lastElementChild === li) {
						setTimeout(() => featureUtilities.centerOnVector(), 400);
					}
				})
				.catch(err => {
					console.error("Erro no preview:", err);
					img.src = "data:image/svg+xml;base64,...";
					map.getView().setCenter(oldCenter);
					map.getView().setResolution(oldRes);
				});
		});
		map.renderSync(); // força render
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

		// 1. Bounding box real da geometria
		const [west, south, east, north] = Terraformer.Tools.calculateBounds(geojson);
		const geoW = east - west || 0.0001;
		const geoH = north - south || 0.0001;

		// 2. Canvas 90×70
		const canvas = document.createElement('canvas');
		canvas.width = 90;
		canvas.height = 70;
		const ctx = canvas.getContext('2d');

		// 3. Fundo mapa (a tua imagem)
		const bg = new Image();
		bg.src = 'map-background.jpg';
		await new Promise(r => { bg.onload = r; bg.onerror = r; });
		ctx.drawImage(bg, 0, 0, 90, 70);

		// 4. CÁLCULO DE CENTRALIZAÇÃO CORRETO (agora sim!)
		const paddingFactor = 1.35; // 35% de zoom out (ajustado visualmente = PLOTTER)
		const paddedW = geoW * paddingFactor;
		const paddedH = geoH * paddingFactor;

		// Escala uniforme (nunca distorce)
		const scale = Math.min(90 / paddedW, 70 / paddedH);

		// Centro da geometria no mundo
		const centerX = west + geoW / 2;
		const centerY = south + geoH / 2;

		// Centro do canvas
		const canvasCenterX = 45;
		const canvasCenterY = 35;

		// Offset para alinhar os dois centros
		const offsetX = canvasCenterX - centerX * scale;
		const offsetY = canvasCenterY - (north - centerY) * scale; // Y invertido

		const toPixel = (lon, lat) => ({
			x: offsetX + lon * scale,
			y: offsetY - lat * scale   // Y invertido
		});

		// 5. Desenho da feature (azul 50% + contorno)
		ctx.fillStyle = '#00AAFFBF';  // 50% opacity
		ctx.strokeStyle = '#141414BF';
		ctx.lineWidth = Math.max(1.6, scale * 0.0022 * geoW);
		ctx.lineJoin = ctx.lineCap = 'round';

		const drawRing = ring => {
			ctx.beginPath();
			ring.forEach((c, i) => {
				const p = toPixel(c[0], c[1]);
				i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
			});
			ctx.closePath();
			ctx.fill('evenodd');
			ctx.stroke();
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
					ctx.arc(p.x, p.y, ctx.lineWidth * 2.2, 0, Math.PI * 2);
					ctx.fill();
					ctx.stroke();
				});
			}
		};

		draw(geojson);

		// 6. Retorna blob URL
		return new Promise(resolve => {
			canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/png');
		});
	}
};