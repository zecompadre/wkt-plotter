// js/utils/featureUtilities.js

import { map, vectorLayer, format, featureCollection } from '../map/setupMap.js';
import { utilities } from './utilities.js';
import { projections } from './constants.js';
import { drawShapePreview } from './previewCanvas.js';

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
	wktToPngBlobUrl: async function (wktString) {
		const geojson = Terraformer.WKT.parse(wktString);
		const bbox = Terraformer.Tools.calculateBounds(geojson); // [west, south, east, north]
		const [xmin, ymin, xmax, ymax] = bbox;

		const worldWidth = xmax - xmin;
		const worldHeight = ymax - ymin;
		if (worldWidth === 0 || worldHeight === 0) throw "Geometria sem área";

		const padding = 0.1; // 10% de margem em cada lado
		const paddedW = worldWidth * (1 + 2 * padding);
		const paddedH = worldHeight * (1 + 2 * padding);

		// Calcula a proporção original (sem distorcer)
		const aspectRatio = paddedW / paddedH;

		// Tamanho do canvas temporário que mantém a proporção exata
		let tempWidth, tempHeight;
		if (aspectRatio > 90 / 70) {
			tempWidth = 900;           // resolução 10× para ficar bonito
			tempHeight = Math.round(900 / aspectRatio);
		} else {
			tempHeight = 700;
			tempWidth = Math.round(700 * aspectRatio);
		}

		const canvas = document.getElementById('offscreen');
		canvas.width = tempWidth;
		canvas.height = tempHeight;
		const ctx = canvas.getContext('2d');

		// Fundo branco
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, tempWidth, tempHeight);

		// Transformação de coordenadas mundo → pixel (com padding)
		function toPixel(x, y) {
			const px = (x - xmin) / paddedW;
			const py = (ymax - y) / paddedH; // Y invertido
			return {
				x: px * tempWidth,
				y: py * tempHeight
			};
		}

		// Desenho
		ctx.fillStyle = ctx.strokeStyle = 'black';
		ctx.lineWidth = tempWidth / 300; // linha proporcional ao tamanho

		function drawRing(ring) {
			ctx.beginPath();
			ring.forEach((c, i) => {
				const p = toPixel(c[0], c[1]);
				i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
			});
			ctx.closePath();
			ctx.fill('evenodd'); // suporta buracos
			ctx.stroke();
		}

		function drawGeometry(g) {
			if (g.type === 'Polygon') g.coordinates.forEach(drawRing);
			if (g.type === 'MultiPolygon') g.coordinates.forEach(poly => poly.forEach(drawRing));
			if (g.type === 'LineString') { drawRing(g.coordinates); ctx.fillStyle = 'transparent'; }
			if (g.type === 'Point') {
				const p = toPixel(g.coordinates[0], g.coordinates[1]);
				ctx.beginPath(); ctx.arc(p.x, p.y, ctx.lineWidth * 2, 0, Math.PI * 2); ctx.fill();
			}
		}

		drawGeometry(geojson);

		// === Redimensiona para exatamente 90×70 com qualidade máxima ===
		const finalCanvas = document.createElement('canvas');
		finalCanvas.width = 90;
		finalCanvas.height = 70;
		const fctx = finalCanvas.getContext('2d');

		// Melhor qualidade possível no browser
		fctx.imageSmoothingEnabled = true;
		fctx.imageSmoothingQuality = 'high';

		fctx.drawImage(canvas, 0, 0, 90, 70);

		// Converte para Blob URL
		return new Promise(resolve => {
			finalCanvas.toBlob(blob => {
				resolve(URL.createObjectURL(blob));
			}, 'image/png');
		});
	}
};