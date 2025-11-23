// js/map/controls.js

import { map, vectorLayer } from './setupMap.js';
import { utilities } from '../utils/utilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import { mapUtilities } from '../utils/mapUtilities.js';
import WKTUtilities from '../classes/WKTUtilities.js';

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
			hitTolerance: 2,
			style: utilities.genericStyleFunction('#ec7063')
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
			style: utilities.drawStyleFunction('#00AAFF')
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
		style: utilities.modifyStyleFunction('#ec7063'),
		insertVertexCondition: () => true,
		virtualVertices: true
	});
	map.addInteraction(modifyInteraction);

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

	function handleSelectEvents(evt) {
		utilities.restoreDefaultColors();
		if (evt.deselected.length > 0) {
			evt.deselected.forEach(feature => {
				textarea.value = utilities.getFeatureWKT(feature);
				WKTUtilities.update(feature.getId(), textarea.value);
				featureUtilities.createFromAllFeatures();
			});
			mapControls.selectBar.setVisible(false);
		}
		if (evt.selected.length > 0) {
			evt.selected.forEach(feature => {
				textarea.value = utilities.getFeatureWKT(feature);
			});
			mapControls.selectBar.setVisible(true);
		}
	}

}