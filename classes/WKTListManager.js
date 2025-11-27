// js/classes/WKTListManager.js
import { map, vectorLayer } from '../map/setupMap.js';
import { utilities } from '../utils/utilities.js';
import { colors } from '../utils/constants.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import wktUtilities from './WKTUtilities.js';

class WKTListManager {
	constructor() {
		this.list = document.getElementById('wkt-list');
		if (!this.list) {
			console.error("Elemento #wkt-list não encontrado");
		}
	}

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
      <div>
        <strong>${geom.getType()}</strong>
        <div>lat: ${lat.toFixed(6)} | lon: ${lon.toFixed(6)}</div>
        <small>#${id.slice(0, 8)}</small>
      </div>
    `;
		li.querySelector('img').replaceWith(img);
		this.list.appendChild(li);

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

	remove(featureId) {
		const li = this.list?.querySelector(`li[data-id="${featureId}"]`);
		if (li) li.remove();
	}

	selectFeature(feature) {
		const select = map.getInteractions().getArray()
			.find(i => i instanceof ol.interaction.Select);

		if (!select) return;

		const isSelected = select.getFeatures().getArray().includes(feature);

		if (isSelected) {
			select.getFeatures().clear();
			document.querySelector("#wktdefault textarea").value = "";
			this.clearSelection();
			featureUtilities.centerOnVector();
		} else {
			select.getFeatures().clear();
			select.getFeatures().push(feature);
			document.querySelector("#wktdefault textarea").value = utilities.getFeatureWKT(feature);
			this.clearSelection();
			const li = this.list.querySelector(`li[data-id="${feature.getId()}"]`);
			if (li) li.classList.add('selected');
			featureUtilities.centerOnFeature(feature);
		}
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

		const infoDiv = li.querySelector('div');
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

	async wktToPngBlobUrl(wkt) {
		if (!wkt || wkt.trim() === '') return null;

		let geojson;
		try {
			geojson = Terraformer.WKT.parse(wkt);
		} catch (e) {
			console.warn('WKT inválido', e);
			return null;
		}

		// 1. Bounding box
		const [west, south, east, north] = Terraformer.Tools.calculateBounds(geojson);
		const geoW = east - west || 0.0001;
		const geoH = north - south || 0.0001;

		// 2. Canvas 90×70
		const canvas = document.createElement('canvas');
		canvas.width = 90;
		canvas.height = 70;
		const ctx = canvas.getContext('2d');

		// 3. Fundo do mapa
		const bg = new Image();
		bg.src = 'map-background.jpg';
		await new Promise(r => { bg.onload = r; bg.onerror = r; });
		ctx.drawImage(bg, 0, 0, 90, 70);

		// 4. Zoom out (padding) — 35% extra (idêntico ao PLOTTER)
		const paddingFactor = 1.35;
		const viewW = geoW * paddingFactor;
		const viewH = geoH * paddingFactor;

		// 5. Escala uniforme (preserva proporção)
		const scale = Math.min(90 / viewW, 70 / viewH);

		// 6. Centro da geometria (em coordenadas reais)
		const centerLon = west + geoW / 2;
		const centerLat = south + geoH / 2;

		// 7. Centro do canvas (em pixels)
		const canvasCenterX = 45;
		const canvasCenterY = 35;

		// 8. Transformação correta: mundo → pixel, com centro alinhado
		const toPixel = (lon, lat) => ({
			x: 45 + (lon - centerLon) * scale,        // 45 = centro horizontal do canvas
			y: 35 + (centerLat - lat) * scale         // 35 = centro vertical + Y invertido
		});

		// 9. Desenho da feature
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
			if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(drawRing));
			if (g.type === 'LineString') drawRing(g.coordinates);
			if (g.type === 'MultiLineString') g.coordinates.forEach(drawRing);
			if (g.type === 'Point' || g.type === 'MultiPoint') {
				const pts = g.type === 'Point' ? [g.coordinates] : g.coordinates;
				pts.forEach(c => {
					const p = toPixel(c[0], c[1]);
					ctx.beginPath();
					ctx.arc(p.x, p.y, ctx.lineWidth * 2.5, 0, Math.PI * 2);
					ctx.fill();
					ctx.stroke();
				});
			}
		};

		draw(geojson);

		// 10. Retorna blob URL
		return new Promise(resolve => {
			canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/png');
		});
	}
}

// === EXPORTA COMO OBJETO GLOBAL (sem new!) ===
const wktListManager = new WKTListManager();
export default wktListManager;