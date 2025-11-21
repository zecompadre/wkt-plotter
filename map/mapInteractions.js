// js/map/mapInteractions.js — VERSÃO QUE NUNCA DÁ "Maximum call stack size exceeded"

import { colors } from '../constants.js';
import { utilities } from '../utils/utilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import { WKTUtilities } from '../classes/WKTUtilities.js';

export function initializeControls(map, vectorLayer, translator, settingsManager) {
	window.map = map;
	window.vectorLayer = vectorLayer;
	window.settingsManager = settingsManager;

	const source = vectorLayer.getSource();

	// ========= BARRAS =========
	const mainBar = new ol.control.Bar({ className: 'mainbar' });
	const editBar = new ol.control.Bar({ className: 'editbar', toggleOne: true });
	const selectBar = new ol.control.Bar({ className: 'selectbar' });
	const locationBar = new ol.control.Bar({ className: 'locationbar' });
	const layerBar = new ol.control.Bar({ className: 'layerbar' });

	// ========= INTERAÇÕES (criadas ANTES dos toggles) =========
	const selectInteraction = new ol.interaction.Select({
		hitTolerance: 5,
		style: new ol.style.Style({
			stroke: new ol.style.Stroke({ color: colors.edit, width: 4 }),
			fill: new ol.style.Fill({ color: utilities.hexToRgbA(colors.edit, '0.3') })
		})
	});

	const drawInteraction = new ol.interaction.Draw({
		type: 'Polygon',
		source: source,
		style: new ol.style.Style({
			stroke: new ol.style.Stroke({ color: colors.create, width: 4 }),
			fill: new ol.style.Fill({ color: utilities.hexToRgbA(colors.create, '0.3') })
		})
	});

	const modifyInteraction = new ol.interaction.ModifyFeature({
		features: selectInteraction.getFeatures()
	});

	const undoRedo = new ol.interaction.UndoRedo();

	// ========= ADICIONA INTERAÇÕES AO MAPA PRIMEIRO =========
	map.addInteraction(selectInteraction);
	map.addInteraction(modifyInteraction);
	map.addInteraction(drawInteraction);
	map.addInteraction(undoRedo);
	map.addInteraction(new ol.interaction.Snap({ source }));

	// ========= BOTÕES (sem interaction no Toggle para evitar loop) =========
	editBar.addControl(new ol.control.Toggle({
		html: '<i class="fa-solid fa-arrow-pointer fa-lg"></i>',
		title: translator.get('select'),
		onToggle: active => selectInteraction.setActive(active),
		active: true
	}));

	editBar.addControl(new ol.control.Toggle({
		html: '<i class="fa-solid fa-draw-polygon fa-lg"></i>',
		title: translator.get('polygon'),
		onToggle: active => drawInteraction.setActive(active)
	}));

	editBar.addControl(new ol.control.Button({
		html: '<i class="fa-solid fa-rotate-left fa-lg"></i>',
		title: translator.get('undo'),
		handleClick: () => undoRedo.undo()
	}));

	editBar.addControl(new ol.control.Button({
		html: '<i class="fa-solid fa-rotate-right fa-lg"></i>',
		title: translator.get('redo'),
		handleClick: () => undoRedo.redo()
	}));

	// Delete
	const deleteBtn = new ol.control.Button({
		html: '<i class="fa fa-times fa-lg"></i>',
		title: translator.get('delete'),
		handleClick: () => {
			const f = selectInteraction.getFeatures().item(0);
			if (f) {
				WKTUtilities.remove(f.getId());
				source.removeFeature(f);
				selectInteraction.getFeatures().clear();
				selectBar.setVisible(false);
			}
		}
	});
	selectBar.addControl(deleteBtn);

	// Center + Location
	locationBar.addControl(new ol.control.Button({
		html: '<i class="fa-solid fa-arrows-to-dot fa-lg"></i>',
		title: translator.get('centerobjects'),
		handleClick: () => map.getView().fit(source.getExtent(), { padding: [50, 50, 50, 50], size: map.getSize() })
	}));

	locationBar.addControl(new ol.control.Button({
		html: '<i class="fa-solid fa-location-crosshairs fa-lg"></i>',
		title: translator.get('centeronmylocation'),
		handleClick: () => {
			navigator.geolocation.getCurrentPosition(pos => {
				const coord = ol.proj.fromLonLat([pos.coords.longitude, pos.coords.latitude]);
				map.getView().animate({ center: coord, zoom: 18 });
			});
		}
	}));

	// Layer toggle
	layerBar.addControl(new ol.control.Button({
		html: '🗺️',
		title: translator.get('changebutton'),
		handleClick: function () {
			const visible = window.osmLayer.getVisible();
			window.osmLayer.setVisible(!visible);
			window.arcgisLayer.setVisible(visible);
			this.element.innerHTML = visible ? '🛰️' : '🗺️';
		}
	}));

	// ========= MONTAGEM =========
	mainBar.addControl(editBar);
	mainBar.addControl(locationBar);

	map.addControl(mainBar);
	map.addControl(selectBar);
	map.addControl(layerBar);

	// ========= SELEÇÃO → WKT NA TEXTAREA =========
	selectInteraction.on('select', evt => {
		const textarea = document.querySelector('#wktdefault textarea');
		if (!textarea) return;

		if (evt.selected.length > 0) {
			textarea.value = utilities.getFeatureWKT(evt.selected[0]);
			selectBar.setVisible(true);
		} else {
			selectBar.setVisible(false);
		}
	});

	// Tooltip área
	const tooltip = new ol.Overlay({
		element: document.getElementById('tooltip') || (() => {
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
		if (feature?.getGeometry()?.getType() === 'Polygon') {
			const area = ol.sphere.getArea(feature.getGeometry());
			if (area > 100) {
				const output = area > 10000 ? (area / 1e6).toFixed(2) + ' km²' : Math.round(area) + ' m²';
				tooltip.setPosition(evt.coordinate);
				tooltip.getElement().innerHTML = output;
				tooltip.getElement().className = 'ol-tooltip ol-tooltip-static';
			}
		}
	});
}