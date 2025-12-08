import { MapManager } from '../map/setupMap.js';
import { utilities } from './utilities.js';
import { projections, colors } from './constants.js';
import wktListManager from '../classes/WKTListManager.js';
import wktUtilities from '../classes/WKTUtilities.js';
import { mapUtilities } from './mapUtilities.js';

export const featureUtilities = {
	deselectCurrentFeature: (active) => {
		const selectInteraction = MapManager.map.getInteractions().getArray()
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
		MapManager.map.getView().setCenter(center);
		MapManager.map.getView().fit(extent, { size: MapManager.map.getSize(), padding: [50, 50, 50, 50] });
	},

	centerOnVector: () => {
		const source = MapManager.vectorLayer.getSource();
		const features = source.getFeatures().filter(f => !f.get('hidden'));
		
		if (features.length === 0) return;

		const extent = ol.extent.createEmpty();
		features.forEach(f => {
			const geom = f.getGeometry();
			if (geom) {
				ol.extent.extend(extent, geom.getExtent());
			}
		});

		MapManager.map.getView().fit(extent, { size: MapManager.map.getSize(), padding: [50, 50, 50, 50] });
	},

	addVectorLayer: async () => {
		if (MapManager.vectorLayer) MapManager.map.removeLayer(MapManager.vectorLayer);
		MapManager.vectorLayer = featureUtilities.createVectorLayer();
		MapManager.map.addLayer(MapManager.vectorLayer);
	},

	createVectorLayer: () => {
		const layer = new ol.layer.Vector({
			source: new ol.source.Vector({ features: MapManager.featureCollection }),
			style: utilities.genericStyleFunction(colors.normal)
		});
		layer.set('displayInLayerSwitcher', false);
		return layer;
	},

	addFeature: async (id, wkt) => {
		const textarea = document.querySelector("#wktdefault textarea");
		const wktString = wkt;

		if (!wktString.trim()) {
			return null;
		}

		let newFeature;
		try {
			newFeature = MapManager.format.readFeature(wktString);
		} catch (err) {
			console.error('Error reading WKT:', err);
			return null;
		}

		if (!newFeature) {
			return null;
		}

		newFeature.getGeometry().transform(projections.geodetic, projections.mercator);
		newFeature.setId(id);
		MapManager.featureCollection.push(newFeature);

		textarea.value = "";
		textarea.style.borderColor = "";
		textarea.style.backgroundColor = "";

		await wktListManager.add(newFeature);

		return newFeature;
	},

	featuresToMultiPolygonJoin: (features) => {
		if (!features || features.length === 0) return null;

		const polygons = features
			.map(f => f.getGeometry())
			.filter(geom => geom && ['Polygon', 'MultiPolygon'].includes(geom.getType()));

		if (polygons.length === 0) return null;

		// Extrai todas as coordenadas de polígonos
		const allCoords = polygons.flatMap(geom =>
			geom.getType() === 'Polygon'
				? [geom.getCoordinates()]
				: geom.getCoordinates()
		);

		// Sempre devolve MultiPolygon (mesmo que tenha só 1)
		return new ol.Feature({
			geometry: new ol.geom.MultiPolygon(allCoords)
		});
	},

	featuresToMultiPolygonUnion: (features) => {
		if (!features || features.length === 0) return null;

		const reader = new jsts.io.OL3Parser();
		reader.inject(
			ol.geom.Point, ol.geom.LineString, ol.geom.LinearRing,
			ol.geom.Polygon, ol.geom.MultiPoint,
			ol.geom.MultiLineString, ol.geom.MultiPolygon
		);

		let unionGeom = null;

		features.forEach(feature => {
			const geom = feature.getGeometry();
			if (!geom) return;

			const jstsGeom = reader.read(geom);

			if (!unionGeom) {
				unionGeom = jstsGeom;
			} else {
				unionGeom = unionGeom.union(jstsGeom);  // dissolve real
			}
		});

		if (!unionGeom) return null;

		// Converter JSTS → OL
		const writer = new jsts.io.OL3Parser();
		writer.inject(
			ol.geom.Point, ol.geom.LineString, ol.geom.LinearRing,
			ol.geom.Polygon, ol.geom.MultiPoint,
			ol.geom.MultiLineString, ol.geom.MultiPolygon
		);

		const finalGeom = writer.write(unionGeom);

		return new ol.Feature({
			geometry: finalGeom
		});
	},

	// Obtém WKT de uma feature
	getFeatureWKT: (feature) => {
		if (!feature) return "";
		const geom = feature.getGeometry().clone();
		const transformedGeom = geom.transform(projections.mercator, projections.geodetic);

		let wkt = MapManager.format.writeGeometry(transformedGeom);
		wkt = utilities.normalizeWKT(wkt);
		return wkt;
	},

	removeAllFeatures: () => {
		// 1. Limpa a layer do mapa
		if (MapManager.vectorLayer) {
			MapManager.vectorLayer.getSource().clear();
		}

		// 2. Limpa a coleção de features
		MapManager.featureCollection.clear();

		// 3. Limpa a lista lateral
		wktListManager.clear();

		// 4. Limpa a persistência
		if (wktUtilities) wktUtilities.clear();

		// 5. Atualiza layout (botões)
		if (mapUtilities && mapUtilities.reviewLayout) {
			mapUtilities.reviewLayout(false);
		}
	},


}
