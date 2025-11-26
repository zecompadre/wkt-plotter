// js/map/controls.js

import { map, vectorLayer } from './setupMap.js';
import { utilities } from '../utils/utilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import { mapUtilities } from '../utils/mapUtilities.js';
import WKTUtilities from '../classes/WKTUtilities.js';
import { colors } from '../utils/constants.js';

export let mapControls = {};

export function initializeMapControls() {
	map.addInteraction(new ol.interaction.DragPan({ condition: () => true }));
	map.addInteraction(new ol.interaction.MouseWheelZoom({ condition: () => true }));

	const mainBar = new ol.control.Bar({ className: 'mainbar' });
	map.addControl(mainBar);
	mapControls.mainBar = mainBar;

	const editBar = new ol.control.Bar({ className: 'editbar', toggleOne: true });
	mainBar.addControl(editBar);
	mapControls.editBar = editBar;

	// Select Control
	const selectBar = new ol.control.Bar();
	map.addControl(selectBar);
	mapControls.selectBar = selectBar;

	const selectCtrl = new ol.control.Toggle({
		html: '<i class="fa-solid fa-arrow-pointer fa-lg"></i>',
		title: window.translator?.get("select") || "Select",
		interaction: new ol.interaction.Select({
			hitTolerance: 5,
			multi: true,
			toggleCondition: ol.events.condition.always,
			style: utilities.genericStyleFunction(colors.edit)
		}),
		bar: selectBar,
		autoActivate: true,
		active: true
	});

	editBar.addControl(selectCtrl);
	selectCtrl.getInteraction().on('select', handleSelectEvents);
	mapControls.selectCtrl = selectCtrl;

	// Delete Button
	const deleteBtn = new ol.control.Button({
		html: '<i class="fa fa-times fa-lg"></i>',
		title: window.translator?.get("delete") || "Delete",
		handleClick: () => {
			const features = selectCtrl.getInteraction().getFeatures();
			if (features.getLength() === 0) {
				textarea.value = "Select an object first...";
				return;
			}
			const feature = features.item(0);
			WKTUtilities.remove(feature.getId());
			vectorLayer.getSource().removeFeature(feature);
			features.clear();
			mapUtilities.reviewLayout(false);
			selectBar.setVisible(false);
		}
	});
	selectBar.addControl(deleteBtn);
	mapControls.deleteBtn = deleteBtn;

	// Info Button (opcional)
	const infoBtn = new ol.control.Button({
		html: '<i class="fa fa-info fa-lg"></i>',
		title: window.translator?.get("showinfo") || "Show information",
		handleClick: () => {
			const features = selectCtrl.getInteraction().getFeatures();
			if (features.getLength() === 1) {
				textarea.value = utilities.getFeatureWKT(features.item(0));
			} else {
				textarea.value = "Select an object first...";
			}
		}
	});
	// selectBar.addControl(infoBtn);
	mapControls.infoBtn = infoBtn;

	selectBar.setVisible(false);

	// Draw Control
	const drawCtrl = new ol.control.Toggle({
		html: '<i class="fa-solid fa-draw-polygon fa-lg"></i>',
		title: window.translator?.get("polygon") || "Polygon",
		interaction: new ol.interaction.Draw({
			type: 'Polygon',
			source: vectorLayer.getSource(),
			style: utilities.drawStyleFunction(colors.create)
		})
	});
	editBar.addControl(drawCtrl);
	mapControls.drawCtrl = drawCtrl;

	drawCtrl.getInteraction().on('drawend', async (evt) => {
		await WKTUtilities.add(evt.feature);
		mapUtilities.reviewLayout(false);
		featureUtilities.centerOnFeature(evt.feature);
		selectCtrl.setActive(true);
		featureUtilities.deselectCurrentFeature(false);
	});

	// Modify Interaction
	const modifyInteraction = new ol.interaction.ModifyFeature({
		features: selectCtrl.getInteraction().getFeatures(),
		style: utilities.modifyStyleFunction(colors.edit),
		insertVertexCondition: () => true,
		virtualVertices: true,
		pixelTolerance: 10,
		hitTolerance: 5,

		// Esta linha é a chave!
		condition: (evt) => {
			const features = selectCtrl.getInteraction().getFeatures();
			if (features.getLength() <= 1) return true;

			// Multi-select → só permite modificar se clicou exatamente na feature
			const hitFeatures = map.getFeaturesAtPixel(evt.pixel, {
				hitTolerance: 10,
				layerFilter: (layer) => layer === vectorLayer
			});

			return hitFeatures.length === 1;
		}
	});
	map.addInteraction(modifyInteraction);

	modifyInteraction.on('modifyend', handleModifyEvents);

	drawCtrl.getInteraction().on('change:active', () => featureUtilities.deselectCurrentFeature(false));
	selectCtrl.getInteraction().on('change:active', (evt) => modifyInteraction.setActive(evt.target.getActive()));

	// Undo/Redo
	const undoInteraction = new ol.interaction.UndoRedo();
	map.addInteraction(undoInteraction);
	mapControls.undoInteraction = undoInteraction;

	const undoBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-rotate-left fa-lg"></i>',
		title: window.translator?.get("undo") || "Undo",
		handleClick: () => undoInteraction.undo()
	});
	const redoBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-rotate-right fa-lg"></i>',
		title: window.translator?.get("redo") || "Redo",
		handleClick: () => undoInteraction.redo()
	});
	editBar.addControl(undoBtn);
	editBar.addControl(redoBtn);
	mapControls.undoBtn = undoBtn;
	mapControls.redoBtn = redoBtn;

	// Location Bar
	const locationBar = new ol.control.Bar({ className: 'locationbar' });
	mainBar.addControl(locationBar);
	mapControls.locationBar = locationBar;

	const locationBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-location-crosshairs fa-lg"></i>',
		title: window.translator?.get("centeronmylocation") || "Center in my location...",
		handleClick: centerOnUserLocation
	});
	locationBar.addControl(locationBtn);
	mapControls.locationBtn = locationBtn;

	const centerObjectsBtn = new ol.control.Button({
		html: '<i class="fa-solid fa-arrows-to-dot fa-lg"></i>',
		title: window.translator?.get("centerobjects") || "Center on map objects...",
		handleClick: () => featureUtilities.centerOnVector()
	});
	locationBar.addControl(centerObjectsBtn);
	mapControls.centerObjectsBtn = centerObjectsBtn;

	// Layer Change Button
	const layerBar = new ol.control.Bar({ className: 'layerbar' });
	map.addControl(layerBar);

	const layerChangeBtn = new ol.control.Button({
		html: utilities.layerChangeBtnHtml(),
		title: window.translator?.get("changebutton") || "Change layer...",
		handleClick: mapUtilities.toggleLayers
	});
	layerBar.addControl(layerChangeBtn);
	mapControls.layerChangeBtn = layerChangeBtn;

	// Snap
	map.addInteraction(new ol.interaction.Snap({ source: vectorLayer.getSource() }));

	// Keyboard shortcuts
	document.addEventListener('keydown', (evt) => {
		if (evt.key === 'Escape') {
			if (!selectCtrl.getActive()) selectCtrl.setActive(true);
			else featureUtilities.deselectCurrentFeature(true);
		}
		if (evt.key === 'Delete' && selectCtrl.getActive()) {
			const features = selectCtrl.getInteraction().getFeatures();
			if (features.getLength() > 0) deleteBtn.getButtonElement().click();
		}
		if (evt.ctrlKey && evt.key === 'z') undoInteraction.undo();
		if (evt.ctrlKey && evt.key === 'y') undoInteraction.redo();
	});

	document.addEventListener('paste', utilities.paste);

	function centerOnUserLocation() {
		utilities.getLocation()
			.then(loc => {
				const coord = ol.proj.transform([+loc.longitude, +loc.latitude], projections.geodetic, projections.mercator);
				map.getView().setCenter(coord);
				map.getView().setZoom(18);
			})
			.catch(console.error);
	}

	function handleModifyEvents(evt) {

	}

	let skipNextDeselectUpdate = false; // ← só para clique fora

	map.on('singleclick', (evt) => {
		const feature = map.forEachFeatureAtPixel(evt.pixel, f => f, { hitTolerance: 5 });

		if (!feature) {
			const select = map.getInteractions().getArray()
				.find(i => i instanceof ol.interaction.Select);

			if (select && select.getFeatures().getLength() > 0) {
				// Deseleciona tudo
				const deselected = select.getFeatures().getArray().slice(); // copia
				select.getFeatures().clear();

				// === GRAVA TODAS AS FEATURES MODIFICADAS ===
				deselected.forEach(async (f) => {
					await featureUtilities.updateListItemIfChanged(f);
				});
			}
		}
	});

	function handleSelectEvents(evt) {
		const textarea = document.querySelector("#wktdefault textarea");
		const wktList = document.getElementById('wkt-list');
		const multiSelect = window.settingsManager?.getSettingById('multi-select') === true;

		const selectedFeatures = evt.target.getFeatures().getArray();

		// === 1. DESELEÇÃO → ATUALIZA SE HOUVER MUDANÇA (EXCETO CLIQUE FORA) ===
		if (evt.deselected.length > 0) {
			evt.deselected.forEach(async (feature) => {
				// SÓ IGNORA SE FOR CLIQUE FORA
				if (!skipNextDeselectUpdate) {
					await featureUtilities.updateListItemIfChanged(feature);
				}
			});
		}

		// === 2. SELEÇÃO → ATUALIZA ANTERIORES (Ctrl+Click ou troca) ===
		if (evt.selected.length > 0) {
			// Features que estavam selecionadas ANTES desta ação
			const previouslySelected = [...selectedFeatures];
			evt.selected.forEach(f => {
				const index = previouslySelected.indexOf(f);
				if (index > -1) previouslySelected.splice(index, 1);
			});

			// Atualiza as anteriores (mesmo com Ctrl+Click!)
			previouslySelected.forEach(async (f) => {
				await featureUtilities.updateListItemIfChanged(f);
			});

			// Destaca novas
			evt.selected.forEach(f => {
				const li = wktList?.querySelector(`li[data-id="${f.getId()}"]`);
				if (li) {
					li.classList.add('selected');
					li.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			});
		}

		// === 3. TEXTAREA ===
		if (multiSelect && selectedFeatures.length > 1) {
			const multi = featureUtilities.featuresToMultiPolygon(selectedFeatures);
			textarea.value = multi ? utilities.getFeatureWKT(multi) : "";
		} else if (selectedFeatures.length === 1) {
			textarea.value = utilities.getFeatureWKT(selectedFeatures[0]);
		} else {
			textarea.value = "";
		}

		// === 4. LIMPEZA ===
		if (selectedFeatures.length === 0) {
			wktList?.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
		}

		mapControls.selectBar.setVisible(selectedFeatures.length > 0);
	}

}