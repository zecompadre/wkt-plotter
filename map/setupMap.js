// js/map/setupMap.js

import { utilities, formatArea } from '../utils/utilities.js';
import { mapDefaults, projections } from '../utils/constants.js';
import { osmLayer, arcgisLayer } from './layers.js';
import mapControls from '../classes/MapControls.js';
import { initWKTListManager } from '../classes/WKTListManager.js';
import { featureUtilities } from '../utils/featureUtilities.js';

// =============================================
// Central mutable state object (this is the fix!)
// =============================================
export const MapManager = {
	map: null,
	vectorLayer: null,
	format: null,
	defaultCenter: null,
	featureCollection: null,
	textarea: null,
	wktcontainer: null,
	attributionControl: null,
	tooltip: null,

	// Helper to replace vector layer (common need)
	setVectorLayer(layer) {
		this.vectorLayer?.getSource()?.clear();
		this.vectorLayer = layer;
		if (this.map) {
			const layers = this.map.getLayers().getArray();
			const oldIndex = layers.indexOf(this.vectorLayer);
			if (oldIndex !== -1) {
				layers[oldIndex] = layer;
			}
		}
	},

	// Optional: add more helpers
	addOverlay(overlay) {
		this.map?.addOverlay(overlay);
	}
};

// Cache DOM elements
MapManager.textarea = document.querySelector("#wktdefault textarea");
MapManager.wktcontainer = document.querySelector("#wkyContainer");

// WKT format & collection
MapManager.format = new ol.format.WKT();
MapManager.featureCollection = new ol.Collection();

// Default center
MapManager.defaultCenter = utilities.transformCoordinates(
	[mapDefaults.longitude, mapDefaults.latitude],
	projections.geodetic,
	projections.mercator
);

// Create vector layer
MapManager.vectorLayer = featureUtilities.createVectorLayer();

// Custom attribution
MapManager.attributionControl = utilities.createAttributeControl();

export function setupMap() {
	MapManager.map = new ol.Map({
		target: 'map',
		layers: [osmLayer, arcgisLayer, MapManager.vectorLayer],
		controls: ol.control.defaults.defaults({ attribution: false }).extend([MapManager.attributionControl]),
		view: new ol.View({
			center: MapManager.defaultCenter,
			zoom: mapDefaults.zoom,
			maxZoom: 19
		})
	});

	// Tooltip setup
	const tooltipElement = document.getElementById('tooltip') || createTooltipElement();
	MapManager.tooltip = new ol.Overlay({
		element: tooltipElement,
		offset: [0, -15],
		positioning: 'bottom-center',
		stopEvent: false,
		insertFirst: false,
	});
	MapManager.map.addOverlay(MapManager.tooltip);

	MapManager.map.on('pointermove', function (event) {
		if (!window.settingsManager?.getSetting('show-area')) return;

		const feature = MapManager.map.forEachFeatureAtPixel(event.pixel, f => f);
		const tooltipEl = MapManager.tooltip.getElement();

		if (feature && feature.getGeometry()) {
			const area = formatArea(feature);
			if (area) {
				MapManager.tooltip.setPosition(event.coordinate);
				tooltipEl.innerHTML = area;
				tooltipEl.className = 'ol-tooltip ol-tooltip-static';
				return;
			}
		}
		tooltipEl.className = 'ol-tooltip hidden';
	});

	mapControls.initialize();
	initWKTListManager();
}

function createTooltipElement() {
	const el = document.createElement('div');
	el.id = 'tooltip';
	el.className = 'ol-tooltip hidden';
	document.body.appendChild(el);
	return el;
}