// js/map/mapInteractions.js

import { colors } from '../constants.js';
import { utilities } from '../utils/utilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import { WKTUtilities } from '../classes/WKTUtilities.js';

export function initializeControls(map, vectorLayer, translator, settingsManager) {
	window.map = map;                    // Necessário para outros módulos
	window.vectorLayer = vectorLayer;    // Necessário para snap, draw, etc.
	window.settingsManager = settingsManager;

	const source = vectorLayer.getSource();
	const selectBar = new ol.control.Bar({ className: 'selectbar' });
	const mainBar = new ol.control.Bar({ className: 'mainbar' });
	const editBar = new ol.control.Bar({ className: 'editbar', toggleOne: true });
	const locationBar = new ol.control.Bar({ className: 'locationbar' });
	const layerBar = new ol.control.Bar({ className: 'layerbar' });

	// === SELECT INTERACTION ===
	const selectInteraction = new ol.interaction.Select({
		hitTolerance: 5,
		style: feature => [new ol.style.Style({
			stroke: new ol.style.Stroke({ color: colors.edit, width: 4 }),
			fill: new ol.style.Fill({ color: utilities.hexToRgbA(colors.edit, '0.3') })
		})]
	});
	map.addInteraction(selectInteraction);

	// === MODIFY INTERACTION ===
	const modifyInteraction = new ol.interaction.ModifyFeature({
		features: selectInteraction.getFeatures(),
		style: feature => [new ol.style.Style({
			stroke: new ol.style.Stroke({ color: colors.edit, width: 5 })
		})]
	});
	map.addInteraction(modifyInteraction);

	// === DRAW INTERACTION ===
	const drawInteraction = new ol.interaction.Draw({
		type: 'Polygon',
		source: source,
		style: feature => [new ol.style.Style({
			stroke: new ol.style.Stroke({ color: colors.create, width: 4 }),
			fill: new ol.style.Fill({ color: utilities.hexToRgbA(colors.create, '0.3') })
		})]
	});
	map.addInteraction(drawInteraction);

	drawInteraction.on('drawend', async evt => {
		await WKTUtilities.add(evt.feature);
		featureUtilities.centerOnFeature(evt.feature, map);
		selectInteraction.setActive(true);
	});

	// === UNDO / REDO ===
	const undoRedo = new ol.interaction.UndoRedo();
	map.addInteraction(undoRedo);

	// === SNAP ===
	map.addInteraction(new ol.interaction.Snap({ source }));

	// === TOOLTIP DE ÁREA ===
	const tooltip = new ol.Overlay({
		element: document.getElementById('tooltip') || (() => {
			const el = document.createElement('div');
			el.id = 'tooltip';
			el.className = 'ol-tooltip';
			document.body.appendChild(el);
			return el;
		})(),
		offset: [0, -15],
		positioning: 'bottom-center'
	});
	map.addOverlay(tooltip);

	map.on('pointermove', evt => {
		if (!settingsManager.getSettingById('show-area')) return;
		const feature = map.forEachFeatureAtPixel(evt.pixel, f => f);
		tooltip.getElement().className = 'ol-tooltip hidden';
		if (feature && feature.getGeometry().getType() === 'Polygon') {
			const area = ol.sphere.getArea(feature.getGeometry());
			if (area > 100) {
				const output = area > 10000
					? (area / 1e6).toFixed(2) + ' km²'
					: Math.round(area) + ' m²';
				tooltip.setPosition(evt.coordinate);
				tooltip.getElement().innerHTML = output;
				tooltip.getElement().className = 'ol-tooltip ol-tooltip-static';
			}
		}
	});

	// === BOTÕES ===
	const selectBtn = new ol.control.Toggle({
		html: '<i class="fa-solid fa-arrow-pointer fa-lg"></i>',
		title: translator.get('select'),
		interaction: selectInteraction,
		bar: selectBar,
		active: true,
		autoActivate: true
	});

	const drawBtn = new ol.control.Toggle({
		html: '<i class="fa-solid fa-draw-polygon fa-lg"></i>',
		title: translator.get('polygon'),
		interaction: drawInteraction,
		bar: editBar
	});

	const undoBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-rotate-left fa-lg"></i>',
		title: translator.get('undo'),
		handleClick: () => undoRedo.undo()
	});

	const redoBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-rotate-right fa-lg"></i>',
		title: translator.get('redo'),
		handleClick: () => undoRedo.redo()
	});

	const deleteBtn = new ol.control.Button({
		html: '<i class="fa fa-times fa-lg"></i>',
		title: translator.get('delete'),
		handleClick: () => {
			const features = selectInteraction.getFeatures();
			if (features.getLength() === 0) return;
			const feature = features.item(0);
			WKTUtilities.remove(feature.getId());
			source.removeFeature(feature);
			features.clear();
			selectBar.setVisible(false);
		}
	});

	const centerObjectsBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-arrows-to-dot fa-lg"></i>',
		title: translator.get('centerobjects'),
		handleClick: () => featureUtilities.centerOnVector(vectorLayer, map)
	});

	const locationBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-location-crosshairs fa-lg"></i>',
		title: translator.get('centeronmylocation'),
		handleClick: () => {
			navigator.geolocation.getCurrentPosition(pos => {
				const coord = ol.proj.fromLonLat([pos.coords.longitude, pos.coords.latitude]);
				map.getView().animate({ center: coord, zoom: 18 });
			});
		}
	});

	const layerBtn = new ol.control.Button({
		html: utilities.layerChangeBtnHtml(osmLayer.getVisible()),
		title: translator.get('changebutton'),
		handleClick: () => {
			const osmVisible = osmLayer.getVisible();
			osmLayer.setVisible(!osmVisible);
			arcgisLayer.setVisible(osmVisible);
			layerBtn.setHtml(utilities.layerChangeBtnHtml(!osmVisible));
		}
	});

	// === MONTAGEM DAS BARRAS ===
	editBar.addControl(selectBtn);
	editBar.addControl(drawBtn);
	editBar.addControl(undoBtn);
	editBar.addControl(redoBtn);

	selectBar.addControl(deleteBtn);
	selectBar.setVisible(false);

	locationBar.addControl(centerObjectsBtn);
	locationBar.addControl(locationBtn);

	layerBar.addControl(layerBtn);

	mainBar.addControl(editBar);
	mainBar.addControl(locationBar);

	map.addControl(mainBar);
	map.addControl(selectBar);
	map.addControl(layerBar);

	// Eventos de seleção
	selectInteraction.on('select', evt => {
		const textarea = document.querySelector('#wktdefault textarea');
		if (evt.selected.length > 0) {
			textarea.value = utilities.getFeatureWKT(evt.selected[0]);
			selectBar.setVisible(true);
		} else if (evt.deselected.length > 0) {
			selectBar.setVisible(false);
		}
	});
}