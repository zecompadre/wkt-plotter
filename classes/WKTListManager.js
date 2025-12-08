// classes/WKTListManager.js

import { MapManager, setupMap } from '../map/setupMap.js';
import { utilities } from '../utils/utilities.js';
import { colors } from '../utils/constants.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import wktUtilities from './WKTUtilities.js';
import mapControls from './MapControls.js';

// Referências ao DOM
const copyMultiButton = document.getElementById('copy-selected-btn');
const selectedCountSpan = document.getElementById('selected-count');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const deleteAllBtn = document.getElementById('delete-all-btn');
const textarea = document.querySelector("#wktdefault textarea");

class WKTListManager {
	constructor() {
		this.list = document.getElementById('wkt-list');
		if (!this.list) throw new Error("Element #wkt-list not found");
	}

	initAfterMapReady() {
		if (this._initialized) return;
		this._initialized = true;

		this.observeSelection();
		this.observeSettingsChange();
		this.updateCopyButton();
		this.updateListSelectionStyle();

		// Botão Desselecionar Tudo
		if (clearSelectionBtn) {
			clearSelectionBtn.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				mapControls.clearSelection();
				this.clearSelection();
				this.updateCopyButton();
				utilities.showToast?.(window.translator?.f("all-deselected", "All features deselected"));
			});
		}

		if (deleteAllBtn) {
			deleteAllBtn.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				mapControls.clearSelection(); // Limpa seleção visual
				featureUtilities.removeAllFeatures(); // Remove tudo
				utilities.showToast?.(window.translator?.f("all-deleted", "All features deleted"));
			});
		}

		if (copyMultiButton) {
			copyMultiButton.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();

				if (copyMultiButton.disabled) return;

				const features = mapControls.getSelectedFeatures();
				if (features.length < 1) return;

				const multiSelectUnion = window.settingsManager?.getSetting('multi-select-union') === true || false;

				let multi = null;
				if (multiSelectUnion)
					multi = featureUtilities.featuresToMultiPolygonUnion(features);
				else
					multi = featureUtilities.featuresToMultiPolygonJoin(features);

				if (!multi) {
					console.log("Multi result is null", multi);
					utilities.showToast?.(window.translator?.f("error-combining-polygons", "Error combining polygons"), 'error');
					return;
				}

				const wkt = featureUtilities.getFeatureWKT(multi);

				this.copyToClipboard(wkt).then(() => {
					utilities.showToast?.(window.translator?.f("multi-polygon-copied", "MultiPolygon copied successfully!"));
				});

			});
		}
	}

	observeSelection() {
		mapControls.on('selectionChanged', () => {
			this.updateCopyButton();
			this.updateListSelectionStyle(); // Atualiza visual da lista
		});
	}

	observeSettingsChange() {

		console.log('Observing settings changes for WKTListManager');
		if (window.settingsManager?.on) {
			window.settingsManager.on('multi-select', (data) => {
				this.updateListSelectionStyle();
				console.log('Multi-select setting changed -> list updated');
			});
		}
	}

	updateCopyButton() {
		const totalFeatures = MapManager.vectorLayer.getSource().getFeatures().length;     // total no mapa
		const selectedCount = mapControls.getSelectedFeatures().length;         // selecionadas

		console.log(`Updating copy button: ${selectedCount} selected of ${totalFeatures} total`);

		// Atualiza o contador
		if (selectedCountSpan) {
			selectedCountSpan.textContent = selectedCount;
		}

		if (copyMultiButton) {
			if (totalFeatures === 0) {
				// 1. Mapa vazio → esconde o botão
				copyMultiButton.classList.add('hidden');
			} else {
				// Mostra o botão
				copyMultiButton.classList.remove('hidden');

				if (selectedCount >= 1) {
					// 2. Basta 1 selecionada → habilita o botão
					copyMultiButton.disabled = false;
					copyMultiButton.style.opacity = '1';
					copyMultiButton.style.cursor = 'pointer';
				} else {
					// 3. Tem features, mas nenhuma selecionada → desabilita
					copyMultiButton.disabled = true;
					copyMultiButton.style.opacity = '0.6';
					copyMultiButton.style.cursor = 'not-allowed';
				}
			}
		}

		// === BOTÃO "DESSELECIONAR TUDO" ===
		if (clearSelectionBtn) {
			clearSelectionBtn.classList.toggle('hidden', selectedCount === 0);
		}

		// === BOTÃO "APAGAR TUDO" ===
		if (deleteAllBtn) {
			deleteAllBtn.classList.toggle('hidden', totalFeatures === 0);
		}

		// === ATUALIZA CONTADOR DE VISÍVEIS PARA CSS ===
		const container = document.querySelector('.actions-container');
		if (container) {
			const visibleButtons = Array.from(container.querySelectorAll('button'))
				.filter(btn => !btn.classList.contains('hidden')).length;
			container.dataset.visibleCount = visibleButtons;
		}
	}

	// NOVO: Atualiza visual da lista conforme seleção e configuração
	updateListSelectionStyle() {
		const selectedFeatures = mapControls.getSelectedFeatures();
		const selectedIds = new Set(selectedFeatures.map(f => f.getId()));

		this.list.querySelectorAll('li.wkt-item').forEach(li => {
			const id = li.dataset.id;
			const isSelected = selectedIds.has(id);
			li.classList.toggle('selected', isSelected);
		});
	}

	// ADD ITEM
	add(feature) {
		if (!feature || !this.list) return;

		const id = feature.getId();
		this.remove(id);

		const li = document.createElement('li');
		li.dataset.id = id;
		li.className = 'wkt-item';

		const img = document.createElement('img');
		img.width = 120;
		img.height = 90;
		img.style.cssText = 'border-radius:12px;background:#000;box-shadow:0 4px 16px rgba(0,0,0,0.6);';

		const geom = feature.getGeometry();
		const center = ol.extent.getCenter(geom.getExtent());
		const [lon, lat] = ol.proj.toLonLat(center);

		li.innerHTML = `
            <img>
			<div class="wkt-item-buttons">
				<button class="zoom-btn" type="button" data-i18n-title="zoom-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
				<button class="visibility-btn" type="button" data-i18n-title="hide-feature"><i class="fa-regular fa-eye"></i></button>
				<button class="copy-btn" type="button" data-i18n-title="copy-btn"><i class="fa-regular fa-copy"></i></button>
				<button class="delete-btn" type="button" data-i18n-title="delete-btn"><i class="fa fa-trash"></i></button>
			</div>
            <div>
                <strong>${geom.getType()}</strong>
                <div>lat: ${lat.toFixed(6)} | lon: ${lon.toFixed(6)}</div>
                <small>#${id.slice(0, 8)}</small>
            </div>
        `;
		li.querySelector('img').replaceWith(img);

		li.querySelector('.zoom-btn').addEventListener('click', e => {
			e.stopPropagation();
			if (feature.get('hidden')) return;
			featureUtilities.centerOnFeature(feature);
		});

		// Visibilidade
		const visibilityBtn = li.querySelector('.visibility-btn');
		visibilityBtn.addEventListener('click', e => {
			e.stopPropagation();
			// ... existing visibility logic ...
			const isHidden = feature.get('hidden') === true;
			feature.set('hidden', !isHidden);
			
			// Atualiza ícone e título
			const icon = visibilityBtn.querySelector('i');
			if (!isHidden) {
				// FICOU HIDDEN
				icon.className = 'fa-regular fa-eye-slash';
				visibilityBtn.setAttribute('data-i18n-title', 'show-feature');
				window.translator?.set('show-feature', visibilityBtn);
				li.classList.add('hidden-feature');

				// Deseleciona se estiver selecionada
				const select = mapControls.interactions.select;
				if (select && select.getFeatures().getArray().includes(feature)) {
					select.getFeatures().remove(feature);
					mapControls.dispatch('selectionChanged');
				}
			} else {
				// FICOU VISIVEL
				icon.className = 'fa-regular fa-eye';
				visibilityBtn.setAttribute('data-i18n-title', 'hide-feature');
				window.translator?.set('hide-feature', visibilityBtn);
				li.classList.remove('hidden-feature');
			}

			// Força refresh da layer
			feature.changed();
		});

		li.querySelector('.copy-btn').addEventListener('click', e => {
			e.stopPropagation();
			const wkt = featureUtilities.getFeatureWKT(feature);

			console.log('Copying WKT to clipboard:', wkt);

			this.copyToClipboard(wkt).then(() => {
				utilities.showToast?.(window.translator?.f("wkt-copied", "WKT copied!"), 'success');
			});
		});

		// Apagar
		li.querySelector('.delete-btn').addEventListener('click', e => {
			e.stopPropagation();
			const f = MapManager.vectorLayer.getSource().getFeatureById(id);
			if (f) {
				const select = mapControls.interactions.select;
				if (select) {
					select.getFeatures().clear();
					select.getFeatures().push(f);
					mapControls.deleteSelected();
					utilities.showToast?.(window.translator?.f("wkt-deleted", "WKT deleted!"), 'error')
				}
			}
		});

		this.list.appendChild(li);

		// Preview
		this.wktToPngBlobUrl(featureUtilities.getFeatureWKT(feature))
			.then(url => {
				if (url) {
					img.src = url;
					img.onload = () => URL.revokeObjectURL(url);
				}
			});

		li.addEventListener('click', () => {
			if (feature.get('hidden')) return;
			this.selectFeature(feature);
		});
		li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

		this.updateCopyButton();
	}

	// Seleção com suporte total a multi-select
	selectFeature(feature) {
		const select = mapControls.interactions.select;
		if (!select) return;

		const multiSelect = window.settingsManager?.getSetting('multi-select') === true || false;
		const multiSelectUnion = window.settingsManager?.getSetting('multi-select-union') === true;
		const already = select.getFeatures().getArray().includes(feature);

		if (!multiSelect && !already) {
			select.getFeatures().clear();
		}

		if (already && !multiSelect) {
			select.getFeatures().clear();
		} else if (already && multiSelect) {
			select.getFeatures().remove(feature);
		} else {
			select.getFeatures().push(feature);
		}

		// Atualiza textarea
		const selected = select.getFeatures().getArray();
		if (selected.length === 1) {
			textarea.value = featureUtilities.getFeatureWKT(selected[0]);
		} else if (selected.length > 1 && multiSelect) {
			let multi = null;
			if (multiSelectUnion)
				multi = featureUtilities.featuresToMultiPolygonUnion(selected);
			else
				multi = featureUtilities.featuresToMultiPolygonJoin(selected);
			textarea.value = multi ? featureUtilities.getFeatureWKT(multi) : "";
		} else {
			textarea.value = "";
		}

		// Atualiza visual da lista
		this.updateListSelectionStyle();
		featureUtilities.centerOnFeature(feature);

		// AQUI ESTAVA O PROBLEMA → FALTAVA DISPARAR O EVENTO!
		mapControls.dispatch('selectionChanged');
	}

	remove(featureId) {
		const li = this.list?.querySelector(`li[data-id="${featureId}"]`);
		if (li) li.remove();
		textarea.value = "";
		this.updateCopyButton();
	}

	clearSelection() {
		this.list?.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
		textarea.value = "";
	}

	clear() {
		if (this.list) this.list.innerHTML = '';
		textarea.value = "";
		this.updateCopyButton();
	}

	async update(feature) {
		const li = this.list?.querySelector(`li[data-id="${feature.getId()}"]`);
		if (!li) return;

		const geom = feature.getGeometry();
		const center = ol.extent.getCenter(geom.getExtent());
		const [lon, lat] = ol.proj.toLonLat(center);

		const infoDiv = li.querySelector('div:not(.wkt-item-buttons)');
		if (infoDiv) {
			infoDiv.innerHTML = `
                <strong>${geom.getType()}</strong>
                <div>lat: ${lat.toFixed(6)} | lon: ${lon.toFixed(6)}</div>
                <small>#${feature.getId().slice(0, 8)}</small>
            `;
		}

		const img = li.querySelector('img');
		if (img) {
			img.style.opacity = '0.5';
			const url = await this.wktToPngBlobUrl(featureUtilities.getFeatureWKT(feature));
			if (url) {
				img.src = url;
				img.style.opacity = '1';
				img.onload = () => URL.revokeObjectURL(url);
			}
		}
	}

	async updateIfChanged(feature) {
		if (!feature) return false;
		const currentWKT = featureUtilities.getFeatureWKT(feature);
		const savedWKT = wktUtilities.get()?.find(i => i.id === feature.getId())?.wkt;
		if (currentWKT === savedWKT) return false;

		wktUtilities.update(feature.getId(), currentWKT);
		await this.update(feature);
		return true;
	}

	async copyToClipboard(text) {
		// Modern Clipboard API (preferred)
		if (navigator.clipboard && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(text);
				return; // Success
			} catch (err) {
				console.warn('Clipboard API failed, falling back...', err);
				// Continue to fallback
			}
		}

		// Fallback for older browsers or non-HTTPS contexts
		const textarea = document.createElement('textarea');
		textarea.value = text;

		// Avoid scrolling to bottom and keyboard popping up on mobile
		textarea.style.position = 'fixed';
		textarea.style.left = '-9999px';
		textarea.style.top = '-9999px';
		textarea.style.opacity = '0';

		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();

		try {
			const successful = document.execCommand('copy');
			if (!successful) throw new Error('execCommand failed');
		} catch (err) {
			console.error('Fallback copy failed:', err);
			throw new Error('Copy to clipboard failed');
		} finally {
			document.body.removeChild(textarea);
		}
	}

	showToast(msg) {
		const toast = document.createElement('div');
		toast.className = 'wkt-copy-toast';
		toast.textContent = msg;
		document.body.appendChild(toast);
		setTimeout(() => toast.remove(), 3000);
	}

	// Preview (inalterado)
	async wktToPngBlobUrl(wkt) {
		if (!wkt || wkt.trim() === '') return null;

		let geojson;
		try {
			geojson = Terraformer.WKT.parse(wkt);
		} catch (e) {
			console.warn('Invalid WKT', e);
			return null;
		}

		const [west, south, east, north] = Terraformer.Tools.calculateBounds(geojson);
		const geoW = east - west || 0.0001;
		const geoH = north - south || 0.0001;

		const canvas = document.createElement('canvas');
		canvas.width = 90;
		canvas.height = 70;
		const ctx = canvas.getContext('2d');

		const bg = new Image();
		bg.src = 'map-background.jpg';
		await new Promise(r => { bg.onload = r; bg.onerror = r; });
		ctx.drawImage(bg, 0, 0, 90, 70);

		const paddingFactor = 1.35;
		const viewW = geoW * paddingFactor;
		const viewH = geoH * paddingFactor;
		const scale = Math.min(90 / viewW, 70 / viewH);

		const centerLon = west + geoW / 2;
		const centerLat = south + geoH / 2;

		const toPixel = (lon, lat) => ({
			x: 45 + (lon - centerLon) * scale,
			y: 35 + (centerLat - lat) * scale
		});

		const drawRing = ring => {
			ctx.beginPath();
			ring.forEach((c, i) => {
				const p = toPixel(c[0], c[1]);
				i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
			});
			ctx.closePath();

			ctx.globalAlpha = 1;
			ctx.lineWidth = Math.max(0.9, scale * 0.0012 * geoW);
			ctx.strokeStyle = colors.normal;
			ctx.stroke();

			ctx.globalAlpha = 0.25;
			ctx.fillStyle = colors.snap;
			ctx.fill('evenodd');
			ctx.globalAlpha = 1;
		};

		const draw = g => {
			if (!g) return;
			if (g.type === 'Polygon') g.coordinates.forEach(drawRing);
			if (g.type === 'MultiPolygon') g.coordinates.forEach(poly => poly.forEach(drawRing));
			if (g.type === 'LineString') drawRing(g.coordinates);
			if (g.type === 'MultiLineString') g.coordinates.forEach(drawRing);
			if (g.type === 'Point' || g.type === 'MultiPoint') {
				const pts = g.type === 'Point' ? [g.coordinates] : g.coordinates;
				pts.forEach(c => {
					const p = toPixel(c[0], c[1]);
					ctx.beginPath();
					ctx.arc(p.x, p.y, ctx.lineWidth * 2.5, 0, Math.PI * 2);
					ctx.fillStyle = colors.normal;
					ctx.fill();
					ctx.strokeStyle = colors.normal;
					ctx.stroke();
				});
			}
		};

		draw(geojson);

		return new Promise(resolve => {
			canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/png');
		});
	}
}

// Instância única
const wktListManager = new WKTListManager();

export default wktListManager;
export const initWKTListManager = () => wktListManager.initAfterMapReady();