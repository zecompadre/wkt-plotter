// js/utils/featureUtilities.js

import { map, vectorLayer, format, featureCollection } from '../map/setupMap.js';
import { utilities } from './utilities.js';
import { projections, colors } from './constants.js';
import WKTListManager from '../classes/WKTListManager.js';

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

		textarea.value = "";
		textarea.style.borderColor = "";
		textarea.style.backgroundColor = "";

		// CHAMA A FUNÇÃO COMUM!
		await WKTListManager.add(newFeature);

		return newFeature;
	},

	// featureUtilities.js → FUNÇÃO COMUM PARA ATUALIZAR O <li>
	updateListItem: async (feature) => {
		if (!feature) return;

		console.log("updateListItem: ", feature.getId());

		const featureId = feature.getId();
		const list = document.getElementById('wkt-list');
		if (!list) return;

		let li = list.querySelector(`li[data-id="${featureId}"]`);

		// Se não existir (novo), cria
		if (!li) {
			li = document.createElement('li');
			li.dataset.id = featureId;
			li.className = 'wkt-item';
			list.appendChild(li);
		}

		const geom = feature.getGeometry();
		const center = ol.extent.getCenter(geom.getExtent());
		const [lon, lat] = ol.proj.toLonLat(center);
		const wktText = utilities.getFeatureWKT(feature);

		// Gera preview com a tua função
		const blobUrl = await featureUtilities.wktToPngBlobUrl(wktText);

		// Atualiza HTML
		li.innerHTML = `
    <img width="120" height="90">
    <div>
      <strong>${geom.getType()}</strong>
      <div>lat: ${lat.toFixed(6)} | lon: ${lon.toFixed(6)}</div>
      <small>#${featureId.slice(0, 8)}</small>
    </div>
  `;

		const img = li.querySelector('img');
		img.style.borderRadius = '12px';
		img.style.background = '#000';
		img.style.boxShadow = '0 4px 16px rgba(0,0,0,0.6)';

		if (blobUrl) {
			img.src = blobUrl;
			img.onload = () => URL.revokeObjectURL(blobUrl);
		}

		// Clique → seleciona no mapa
		li.onclick = () => {
			const select = map.getInteractions().getArray().find(i => i instanceof ol.interaction.Select);
			if (!select) return;

			const isSelected = select.getFeatures().getArray().includes(feature);

			if (isSelected) {
				select.getFeatures().clear();
				document.querySelector("#wktdefault textarea").value = "";
				list.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
				featureUtilities.centerOnVector();
			} else {
				select.getFeatures().clear();
				select.getFeatures().push(feature);
				document.querySelector("#wktdefault textarea").value = wktText;
				list.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
				li.classList.add('selected');
				featureUtilities.centerOnFeature(feature);
			}
		};

		li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	},
	featuresToMultiPolygon: (features) => {
		const polygons = features
			.map(f => f.getGeometry())
			.filter(geom => geom.getType() === 'Polygon' || geom.getType() === 'MultiPolygon');

		if (polygons.length === 0) return null;

		const coords = polygons.flatMap(geom =>
			geom.getType() === 'Polygon' ? geom.getCoordinates() : geom.getCoordinates().flat(1)
		);

		return new ol.Feature(new ol.geom.MultiPolygon(coords));
	}
}
