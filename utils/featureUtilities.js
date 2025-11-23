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

	addToFeatures: (id, wkt) => {
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

};