// js/map/setupMap.js

import { utilities, formatArea } from '../utils/utilities.js';
import { mapDefaults, projections } from '../utils/constants.js';
import { osmLayer, arcgisLayer } from './layers.js';
import mapControls from '../classes/MapControls.js';
import { initWKTListManager } from '../classes/WKTListManager.js';

export let map;
export let vectorLayer;
export let format;
export let defaultCenter;
export let featureCollection;
export let textarea;
export let wktcontainer;
export let attributionControl;

// Cache de elementos DOM
textarea = document.querySelector("#wktdefault textarea");
wktcontainer = document.querySelector("#wkyContainer");

// Formato WKT e coleção de features
format = new ol.format.WKT();
featureCollection = new ol.Collection();

// Centro padrão (de geodésico → mercator)
defaultCenter = utilities.transformCoordinates(
	[mapDefaults.longitude, mapDefaults.latitude],
	projections.geodetic,
	projections.mercator
);

// Cria camada vetorial
vectorLayer = utilities.createVectorLayer();

// Cria controle de atribuição customizado
attributionControl = utilities.createAttributeControl();

export function setupMap() {
	map = new ol.Map({
		target: 'map',
		layers: [osmLayer, arcgisLayer, vectorLayer],
		controls: ol.control.defaults.defaults({ attribution: false }).extend([attributionControl]),
		view: new ol.View({
			center: defaultCenter,
			zoom: mapDefaults.zoom,
			maxZoom: 19
		})
	});

	// Tooltip de área
	const tooltip = new ol.Overlay({
		element: document.getElementById('tooltip') || (() => {
			const el = document.createElement('div');
			el.id = 'tooltip';
			el.className = 'ol-tooltip hidden';
			document.body.appendChild(el);
			return el;
		})(),
		offset: [0, -15],
		positioning: 'bottom-center',
		stopEvent: false,
		insertFirst: false,
	});
	map.addOverlay(tooltip);

	map.on('pointermove', function (event) {
		if (!window.settingsManager?.getSetting('show-area')) return;

		const feature = map.forEachFeatureAtPixel(event.pixel, f => f);
		const tooltipEl = tooltip.getElement();

		if (feature) {
			const area = formatArea(feature);
			if (area) {
				tooltip.setPosition(event.coordinate);
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