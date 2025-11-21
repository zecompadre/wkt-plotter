// js/map/mapInteractions.js — VERSÃO FINAL E DEFINITIVA (21 Nov 2025)

import { colors } from '../constants.js';
import { utilities } from '../utils/utilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import { WKTUtilities } from '../classes/WKTUtilities.js';

export function initializeControls(map, vectorLayer, translator, settingsManager) {
	window.map = map;
	window.vectorLayer = vectorLayer;
	window.settingsManager = settingsManager;

	console.log(map, vectorLayer, translator, settingsManager);

	const source = vectorLayer.getSource();

	// ========= BARRAS =========
	const mainBar = new ol.control.Bar({ className: 'mainbar' });
	const editBar = new ol.control.Bar({ className: 'editbar', toggleOne: true });
	const selectBar = new ol.control.Bar({ className: 'selectbar' });
	const locationBar = new ol.control.Bar({ className: 'locationbar' });
	const layerBar = new ol.control.Bar({ className: 'layerbar' });

	// ========= INTERAÇÕES =========
	const selectInteraction = new ol.interaction.Select({
		hitTolerance: 5,
		style: feature => [new ol.style.Style({
			stroke: new ol.style.Stroke({ color: colors.edit, width: 4 }),
			fill: new ol.style.Fill({ color: utilities.hexToRgbA(colors.edit, '0.3') })
		})]
	});
	map.addInteraction(selectInteraction);

	const modifyInteraction = new ol.interaction.ModifyFeature({
		features: selectInteraction.getFeatures(),
		style: feature => [new ol.style.Style({
			stroke: new ol.style.Stroke({ color: colors.edit, width: 5 })
		})]
	});
	map.addInteraction(modifyInteraction);

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

	const undoRedo = new ol.interaction.UndoRedo();
	map.addInteraction(undoRedo);

	map.addInteraction(new ol.interaction.Snap({ source }));

	// ========= TOOLTIP ÁREA =========
	const tooltip = new ol.Overlay({
		element: document.getElementById('tooltip') || (function () {
			const el = document.createElement('div');
			el.id = 'tooltip';
			el.className = 'ol-tooltip hidden';
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

	// ========= BOTÕES =========
	const selectBtn = new ol.control.Toggle({
		html: '<i class="fa-solid fa-arrow-pointer fa-lg"></i>',
		title: translator.get('select'),
		interaction: selectInteraction,
		bar: editBar,
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
			if (features.getLength() > 0) {
				const feature = features.item(0);
				WKTUtilities.remove(feature.getId());
				source.removeFeature(feature);
				features.clear();
				selectBar.setVisible(false);
			}
		}
	});

	const centerObjectsBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-arrows-to-dot fa-lg"></i>',
		title: translator.get('centerobjects'),
		handleClick: () => map.getView().fit(source.getExtent(), { padding: [50, 50, 50, 50], size: map.getSize() })
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
		html: '🗺️',
		title: translator.get('changebutton'),
		handleClick: function () {
			const osmVisible = window.osmLayer.getVisible();
			window.osmLayer.setVisible(!osmVisible);
			window.arcgisLayer.setVisible(osmVisible);
			this.element.innerHTML = osmVisible ? '🛰️' : '🗺️';
		}
	});

	// ========= ADICIONA BOTÕES ÀS BARRAS =========
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

	// ========= ADICIONA BARRAS AO MAPA (OBRIGATÓRIO!) =========
	map.addControl(mainBar);
	map.addControl(selectBar);
	map.addControl(locationBar);
	map.addControl(layerBar);

	// ========= EVENTO DE SELEÇÃO (WKT na textarea + update ao desselecionar) =========
	selectInteraction.on('select', evt => {
		const textarea = document.querySelector('#wktdefault textarea');
		if (!textarea) return;

		utilities.restoreDefaultColors();

		if (evt.selected.length > 0) {
			evt.selected.forEach(feature => {
				textarea.value = utilities.getFeatureWKT(feature);
			});
			selectBar.setVisible(true);
		}

		if (evt.deselected.length > 0) {
			evt.deselected.forEach(feature => {
				textarea.value = utilities.getFeatureWKT(feature);
				WKTUtilities.update(feature.getId(), textarea.value);
				featureUtilities.createFromAllFeatures(); // opcional: atualiza o textarea com todos
			});
			selectBar.setVisible(false);
		}
	});
}