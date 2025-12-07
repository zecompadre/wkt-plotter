// classes/MapControls.js

import { MapManager, setupMap } from '../map/setupMap.js';
import { loading, utilities } from '../utils/utilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import { mapUtilities } from '../utils/mapUtilities.js';
import wktUtilities from './WKTUtilities.js';
import wktListManager from './WKTListManager.js';
import { colors } from '../utils/constants.js';

class MapControls {
	constructor() {
		this.controls = {};      // Botões e barras
		this.interactions = {};  // Interações OpenLayers
		this._events = new EventTarget();
	}

	// === Sistema de eventos ===
	on(eventName, callback) {
		this._events.addEventListener(eventName, (e) => callback(e.detail));
	}

	off(eventName, callback) {
		this._events.removeEventListener(eventName, callback);
	}

	dispatch(eventName, detail = {}) {
		this._events.dispatchEvent(new CustomEvent(eventName, { detail }));
	}

	// === Inicialização completa ===
	initialize() {
		this._setupBaseInteractions();
		this._createBars();
		this._createSelectControl();
		this._createDeleteButton();
		this._createInfoButton();
		this._createDrawControl();
		this._createModifyInteraction();
		this._createUndoRedo();
		this._createLocationBar();
		this._createLayerButton();
		this._createSnap();
		this._setupKeyboardShortcuts();
		this._setupClickOutsideDeselect();
		this._setupImportHandler();
	}

	// === Métodos privados ===
	_setupBaseInteractions() {
		MapManager.map.addInteraction(new ol.interaction.DragPan({ condition: () => true }));
		MapManager.map.addInteraction(new ol.interaction.MouseWheelZoom({ condition: () => true }));
	}

	_createBars() {
		const mainBar = new ol.control.Bar({ className: 'mainbar' });
		MapManager.map.addControl(mainBar);
		this.controls.mainBar = mainBar;

		const editBar = new ol.control.Bar({ className: 'editbar', toggleOne: true });
		mainBar.addControl(editBar);
		this.controls.editBar = editBar;

		const selectBar = new ol.control.Bar();
		MapManager.map.addControl(selectBar);
		this.controls.selectBar = selectBar;
		selectBar.setVisible(false);
	}

	_createSelectControl() {
		const updateSelectInteraction = () => {
			const multiSelect = window.settingsManager?.getSetting('multi-select') === true || false;

			if (this.interactions.select) {
				this.interactions.select.set('multi', multiSelect);
				this.interactions.select.changed();
				return;
			}

			const selectInteraction = new ol.interaction.Select({
				hitTolerance: 8,
				multi: multiSelect,
				toggleCondition: ol.events.condition.always,
				style: utilities.genericStyleFunction(colors.edit)
			});

			const selectToggle = new ol.control.Toggle({
				html: '<i class="fa-solid fa-arrow-pointer fa-lg"></i>',
				title: window.translator?.get("select") || "Select",
				interaction: selectInteraction,
				bar: this.controls.selectBar,
				autoActivate: true,
				active: true
			});

			this.controls.editBar.addControl(selectToggle);
			this.controls.selectCtrl = selectToggle;
			this.interactions.select = selectInteraction;

			selectInteraction.on('select', (e) => this._handleSelect(e));
		};

		updateSelectInteraction();
	}

	_createDeleteButton() {
		const btn = new ol.control.Button({
			html: '<i class="fa fa-times fa-lg"></i>',
			title: window.translator?.get("delete") || "Delete",
			handleClick: () => this.deleteSelected()
		});
		this.controls.selectBar.addControl(btn);
		this.controls.deleteBtn = btn;
	}

	_createInfoButton() {
		this.controls.infoBtn = new ol.control.Button({
			html: '<i class="fa fa-info fa-lg"></i>',
			title: window.translator?.get("showinfo") || "Show information",
			handleClick: () => {
				const features = this.interactions.select.getFeatures();
				const textarea = document.querySelector("#wktdefault textarea");
				textarea.value = features.getLength() === 1
					? featureUtilities.getFeatureWKT(features.item(0))
					: "Select only one feature";
			}
		});
	}

	_createDrawControl() {
		const drawInteraction = new ol.interaction.Draw({
			type: 'Polygon',
			source: MapManager.vectorLayer.getSource(),
			style: utilities.drawStyleFunction(colors.create)
		});

		const drawToggle = new ol.control.Toggle({
			html: '<i class="fa-solid fa-draw-polygon fa-lg"></i>',
			title: window.translator?.get("polygon") || "Polygon",
			interaction: drawInteraction
		});

		this.controls.editBar.addControl(drawToggle);
		this.controls.drawCtrl = drawToggle;
		this.interactions.draw = drawInteraction;

		drawInteraction.on('drawend', (e) => this._handleDrawEnd(e));
		drawInteraction.on('change:active', () => featureUtilities.deselectCurrentFeature(false));
		this.interactions.select.on('change:active', (e) => this.interactions.modify?.setActive(e.target.getActive()));
	}

	_createModifyInteraction() {
		const modify = new ol.interaction.ModifyFeature({
			features: this.interactions.select.getFeatures(),
			style: utilities.modifyStyleFunction(colors.edit),
			insertVertexCondition: () => true,
			virtualVertices: true,
			pixelTolerance: 12,
			hitTolerance: 8,
			condition: () => true  // permite editar sempre que estiver selecionado
		});

		MapManager.map.addInteraction(modify);
		this.interactions.modify = modify;

		// CORRIGIDO: funciona com array ou Collection
		modify.on('modifyend', (e) => {
			const features = Array.isArray(e.features)
				? e.features
				: e.features.getArray();

			features.forEach(f => {
				wktListManager.updateIfChanged(f);
			});
			this.dispatch('featureModified');
		});

		// Termina edição ao clicar fora (corrigido e seguro)
		MapManager.map.on('singleclick', (evt) => {
			const hit = MapManager.map.hasFeatureAtPixel(evt.pixel, {
				layerFilter: (l) => l === MapManager.vectorLayer,
				hitTolerance: 10
			});

			if (!hit && modify.getActive()) {
				const selected = this.interactions.select.getFeatures();
				const features = selected.getArray ? selected.getArray() : Array.from(selected);
				features.forEach(f => wktListManager.updateIfChanged(f));
				this.dispatch('modifyend');
			}
		});

		// Ativa/desativa modify conforme seleção
		this.interactions.select.on('change:active', (e) => {
			modify.setActive(e.target.getActive());
		});
	}

	_createUndoRedo() {
		const undoRedo = new ol.interaction.UndoRedo();
		MapManager.map.addInteraction(undoRedo);
		this.interactions.undoRedo = undoRedo;

		this.controls.undoBtn = new ol.control.Button({
			html: '<i class="fa-solid fa-rotate-left fa-lg"></i>',
			title: window.translator?.get("undo") || "Undo",
			handleClick: () => undoRedo.undo()
		});
		console.log(this.controls.undoBtn);
		this.controls.undoBtn.button_.setAttribute('data-i18n', 'undo');
		this.controls.undoBtn.button_.setAttribute('data-i18n-title', 'undo');

		this.controls.redoBtn = new ol.control.Button({
			html: '<i class="fa-solid fa-rotate-right fa-lg"></i>',
			title: window.translator?.get("redo") || "Redo",
			handleClick: () => undoRedo.redo()
		});

		this.controls.editBar.addControl(this.controls.undoBtn);
		this.controls.editBar.addControl(this.controls.redoBtn);
	}

	_createLocationBar() {
		const locationBar = new ol.control.Bar({ className: 'locationbar' });
		this.controls.mainBar.addControl(locationBar);

		this.controls.locationBtn = new ol.control.Button({
			html: '<i class="fa-solid fa-location-crosshairs fa-lg"></i>',
			title: window.translator?.get("center-location") || "Center on my location",
			handleClick: () => this.centerOnMyLocation()
		});
		locationBar.addControl(this.controls.locationBtn);

		this.controls.centerObjectsBtn = new ol.control.Button({
			html: '<i class="fa-solid fa-arrows-to-dot fa-lg"></i>',
			title: window.translator?.get("center-objects") || "Center on objects",
			handleClick: () => featureUtilities.centerOnVector()
		});
		locationBar.addControl(this.controls.centerObjectsBtn);
	}

	_createLayerButton() {
		const layerBar = new ol.control.Bar({ className: 'layerbar' });
		MapManager.map.addControl(layerBar);

		this.controls.layerChangeBtn = new ol.control.Button({
			html: utilities.layerChangeBtnHtml(),
			title: window.translator?.get("change-layer") || "Change layer...",
			handleClick: mapUtilities.toggleLayers
		});
		layerBar.addControl(this.controls.layerChangeBtn);
	}

	_createSnap() {
		MapManager.map.addInteraction(new ol.interaction.Snap({ source: MapManager.vectorLayer.getSource() }));
	}

	_setupKeyboardShortcuts() {
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				this.controls.selectCtrl.getActive()
					? featureUtilities.deselectCurrentFeature(true)
					: this.controls.selectCtrl.setActive(true);
			}
			if (e.key === 'Delete' && this.interactions.select.getFeatures().getLength() > 0) {
				this.controls.deleteBtn.getButtonElement().click();
			}
			if (e.ctrlKey && e.key === 'z') this.interactions.undoRedo.undo();
			if (e.ctrlKey && e.key === 'y') this.interactions.undoRedo.redo();
		});
	}

	_setupImportHandler() {
		const importBtn = document.getElementById('import-wkt-btn');
		const textarea = document.querySelector("#wktdefault textarea");

		if (!importBtn || !textarea) return;

		importBtn.addEventListener('click', async (e) => {
			e.preventDefault();
			e.stopPropagation();

			const text = textarea.value.trim();

			if (!text) {
				utilities.showToast?.('Por favor, cola ou escreve um WKT válido.', 'error');
				textarea.focus();
				return;
			}

			try {
				importBtn.disabled = true;
				loading.show();

				await mapUtilities.loadWKT(text);

				utilities.showToast('WKT importado com sucesso!');
				setTimeout(() => {
					importBtn.disabled = false;
					loading.hide();
				}, 500);

				textarea.value = "";

			} catch (error) {
				console.error("Erro ao importar WKT:", error);
				utilities.showToast?.('Erro ao importar WKT. Verifica o formato.', 'error');
				importBtn.disabled = false;
				loading.hide();
			}
		});
	}

	_setupClickOutsideDeselect() {
		MapManager.map.on('singleclick', (evt) => {
			if (!MapManager.map.forEachFeatureAtPixel(evt.pixel, () => true, { hitTolerance: 5 })) {
				const sel = this.interactions.select.getFeatures();
				if (sel.getLength() > 0) {
					const deselected = sel.getArray().slice();
					sel.clear();
					deselected.forEach(f => wktListManager.updateIfChanged(f));
					this.dispatch('deselectedOutside', { features: deselected });
					this.dispatch('selectionChanged');
				}
			}
		});
	}

	// === Handlers ===
	async _handleDrawEnd(evt) {

		const feature = evt.feature;

		await wktUtilities.add(feature);

		wktListManager.add(feature);

		mapUtilities.reviewLayout(false);
		featureUtilities.centerOnFeature(feature);

		this.controls.selectCtrl.setActive(true);
		featureUtilities.deselectCurrentFeature(false);
		this.dispatch('featureCreated', { feature });
		this.dispatch('selectionChanged');
	}

	_handleSelect(evt) {
		const selected = evt.target.getFeatures().getArray();
		const textarea = document.querySelector("#wktdefault textarea");
		const list = document.getElementById('wkt-list');
		const multiSelect = window.settingsManager?.getSetting('multi-select') === true || false;
		const multiSelectUnion = window.settingsManager?.getSetting('multi-select-union') === true;

		if (!multiSelect) {
			if (selected.length > 1) {
				let lastSelected = evt.selected[0];
				evt.target.getFeatures().forEach(feature => {
					if (feature !== lastSelected) {
						evt.target.getFeatures().remove(feature);
					}
				});
			}
		}

		this._updateListHighlight(evt.selected, evt.deselected, list);

		if (multiSelect && selected.length > 1) {
			let multi = null;
			if (multiSelectUnion)
				multi = featureUtilities.featuresToMultiPolygonUnion(selected);
			else
				multi = featureUtilities.featuresToMultiPolygonJoin(selected);
			textarea.value = multi ? featureUtilities.getFeatureWKT(multi) : "";
		} else if (selected.length === 1) {
			textarea.value = featureUtilities.getFeatureWKT(selected[0]);
		} else {
			textarea.value = "";
		}

		this.controls.selectBar.setVisible(selected.length > 0);
		this.dispatch('selectionChanged', { selected, deselected: evt.deselected }); // Já tinhas
	}

	_updateListHighlight(selected, deselected, list) {
		selected.forEach(f => {
			const li = list?.querySelector(`li[data-id="${f.getId()}"]`);
			if (li) {
				li.classList.add('selected');
				li.scrollIntoView({ behavior: 'smooth', block: 'center' });
				const img = li.querySelector('img');
				if (img) {
					img.style.opacity = '0.5';
					wktListManager.wktToPngBlobUrl(featureUtilities.getFeatureWKT(f))
						.then(url => { if (url) { img.src = url; img.style.opacity = '1'; } });
				}
			}
		});

		deselected.forEach(f => {
			const li = list?.querySelector(`li[data-id="${f.getId()}"]`);
			if (li) li.classList.remove('selected');
			wktListManager.updateIfChanged(f);
		});

		if (this.interactions.select.getFeatures().getLength() === 0) {
			list?.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
		}
	}

	async deleteSelected() {
		const features = this.interactions.select.getFeatures();
		if (features.getLength() === 0) return;

		const feature = features.item(0);
		const id = feature.getId();

		await wktUtilities.remove(id);
		wktListManager.remove(id);
		MapManager.vectorLayer.getSource().removeFeature(feature);
		features.clear();
		mapUtilities.reviewLayout(false);
		this.controls.selectBar.setVisible(false);

		this.dispatch('featureDeleted', { feature, id });
		this.dispatch('selectionChanged');
	}

	centerOnMyLocation() {
		utilities.getLocation()
			.then(loc => {
				const coord = ol.proj.fromLonLat([+loc.longitude, +loc.latitude]);
				MapManager.map.getView().setCenter(coord);
				MapManager.map.getView().setZoom(18);
				this.dispatch('userLocationCentered', { coord });
			})
			.catch(console.error);
	}

	// === API pública ===
	getSelectedFeatures() {
		return this.interactions.select?.getFeatures().getArray() || [];
	}

	clearSelection() {
		this.interactions.select?.getFeatures().clear();
		this.dispatch('selectionChanged');
	}

	activateSelect() { this.controls.selectCtrl?.setActive(true); }
	activateDraw() { this.controls.drawCtrl?.setActive(true); }
	deactivateAllTools() {
		this.controls.selectCtrl?.setActive(false);
		this.controls.drawCtrl?.setActive(false);
	}
}

// Instância única e exportação limpa
const mapControls = new MapControls();
export default mapControls;