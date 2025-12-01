// classes/WKTListManager.js

import { vectorLayer } from '../map/setupMap.js';
import { utilities } from '../utils/utilities.js';
import { colors } from '../utils/constants.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import wktUtilities from './WKTUtilities.js';
import mapControls from './MapControls.js';

// Referências ao DOM
const copyMultiButton = document.getElementById('copy-selected-multipolygon');
const selectedCountSpan = document.getElementById('selected-count');
const clearSelectionBtn = document.getElementById('clear-selection-btn');

class WKTListManager {
	constructor() {
		this.list = document.getElementById('wkt-list');
		if (!this.list) throw new Error("Elemento #wkt-list não encontrado");
	}

	initAfterMapReady() {
		if (this._initialized) return;
		this._initialized = true;

		this.observeSelection();
		this.observeSettingsChange(); // NOVO: respeita multi-select
		this.updateCopyButton();
		this.updateListSelectionStyle(); // Atualiza visual inicial

		// Botão Desselecionar Tudo
		if (clearSelectionBtn) {
			clearSelectionBtn.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				mapControls.clearSelection();
				this.clearSelection();
				this.updateCopyButton();
				utilities.showToast?.('Todas as features desselecionadas');
			});
		}
	}

	// Ouve seleção
	observeSelection() {
		mapControls.on('selectionChanged', () => {
			this.updateCopyButton();
			this.updateListSelectionStyle(); // Atualiza visual da lista
		});
	}

	// NOVO: Ouve mudanças na configuração multi-select
	observeSettingsChange() {
		if (window.settingsManager?.on) {
			window.settingsManager.on('settingChanged', (id) => {
				if (id === 'multi-select') {
					this.updateListSelectionStyle();
					console.log('Configuração multi-select alterada → lista atualizada');
				}
			});
		}
	}

	// Atualiza botão e contador
	updateCopyButton() {
		const count = mapControls.getSelectedFeatures().length;

		if (selectedCountSpan) selectedCountSpan.textContent = count;

		if (copyMultiButton) {
			const enabled = count >= 1;
			copyMultiButton.disabled = !enabled;
			copyMultiButton.style.opacity = enabled ? '1' : '0.6';
			copyMultiButton.style.cursor = enabled ? 'pointer' : 'not-allowed';
		}

		if (clearSelectionBtn) {
			clearSelectionBtn.classList.toggle('hidden', count === 0);
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
				<button class="copy-btn" type="button" title="Copiar"><i class="fa-regular fa-copy"></i></button>
				<button class="delete-btn" type="button" title="Apagar"><i class="fa fa-times fa-lg"></i></button>
			</div>
            <div>
                <strong>${geom.getType()}</strong>
                <div>lat: ${lat.toFixed(6)} | lon: ${lon.toFixed(6)}</div>
                <small>#${id.slice(0, 8)}</small>
            </div>
        `;
		li.querySelector('img').replaceWith(img);

		// Copiar individual
		li.querySelector('.copy-btn').addEventListener('click', e => {
			e.stopPropagation();
			const wkt = utilities.getFeatureWKT(feature);
			this.copyToClipboard(wkt).then(() => {
				utilities.showToast?.('WKT copiado!') || this.showToast('WKT copiado!');
			});
		});

		// Apagar
		li.querySelector('.delete-btn').addEventListener('click', e => {
			e.stopPropagation();
			const f = vectorLayer.getSource().getFeatureById(id);
			if (f) {
				const select = mapControls.interactions.select;
				select.getFeatures().clear();
				select.getFeatures().push(f);
				mapControls.deleteSelected();
			}
		});

		this.list.appendChild(li);

		// Preview
		this.wktToPngBlobUrl(utilities.getFeatureWKT(feature))
			.then(url => {
				if (url) {
					img.src = url;
					img.onload = () => URL.revokeObjectURL(url);
				}
			});

		li.addEventListener('click', () => this.selectFeature(feature));
		li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	// Seleção com suporte total a multi-select
	selectFeature(feature) {
		const select = mapControls.interactions.select;
		if (!select) return;

		const multiSelect = window.settingsManager?.getSettingById('multi-select') === true;
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
		const textarea = document.querySelector("#wktdefault textarea");
		if (selected.length === 1) {
			textarea.value = utilities.getFeatureWKT(selected[0]);
		} else if (selected.length > 1 && multiSelect) {
			const multi = featureUtilities.featuresToMultiPolygon(selected);
			textarea.value = multi ? utilities.getFeatureWKT(multi) : "";
		} else {
			textarea.value = "";
		}

		// Atualiza visual da lista
		this.updateListSelectionStyle();
		featureUtilities.centerOnFeature(feature);
	}

	remove(featureId) {
		const li = this.list?.querySelector(`li[data-id="${featureId}"]`);
		if (li) li.remove();
	}

	clearSelection() {
		this.list?.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
	}

	clear() {
		if (this.list) this.list.innerHTML = '';
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
			const url = await this.wktToPngBlobUrl(utilities.getFeatureWKT(feature));
			if (url) {
				img.src = url;
				img.style.opacity = '1';
				img.onload = () => URL.revokeObjectURL(url);
			}
		}
	}

	async updateIfChanged(feature) {
		if (!feature) return false;
		const currentWKT = utilities.getFeatureWKT(feature);
		const savedWKT = wktUtilities.get()?.find(i => i.id === feature.getId())?.wkt;
		if (currentWKT === savedWKT) return false;

		wktUtilities.update(feature.getId(), currentWKT);
		await this.update(feature);
		return true;
	}

	async copyToClipboard(text) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
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
			console.warn('WKT inválido', e);
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