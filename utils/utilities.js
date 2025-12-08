import Loading from '../classes/Loading.js';
import { colors, projections, mapDefaults } from './constants.js';
import { osmLayer, arcgisLayer } from '../map/layers.js';
import { MapManager, setupMap } from '../map/setupMap.js';

// Instância única do Loading (usada em toda a app)
export const loading = new Loading({ dotCount: 4, dotSize: 25 });

// Formatação da área (função global original)
const formatArea = function (feature) {
	const area = ol.sphere.getArea(feature.getGeometry());
	if (area === 0) return '';
	let output;
	if (area > 10000) {
		output = Math.round((area / 1000000) * 100) / 100 + ' km²';
	} else {
		output = Math.round(area * 100) / 100 + ' m²';
	}
	return output;
};

export const utilities = {

	hexToRgba: function (hex, alpha = 1) {
		// Remove # se existir
		hex = hex.replace('#', '');

		// Converte para RGB
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);

		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	},
	// Transforma coordenadas entre projeções
	transformCoordinates: (coords, from, to) => ol.proj.transform(coords, from, to),

	// HTML do botão de troca de camada
	layerChangeBtnHtml: () => {
		const osmTitle = window.translator?.f("layer-streets", "Streets");
		const osmImg = osmLayer.getPreview?.() || '';
		const arcgisTitle = window.translator?.f("layer-satellite", "Satellite");
		const arcgisImg = arcgisLayer.getPreview?.() || '';

		const isOsmVisible = osmLayer.getVisible();
		const imgSrc = isOsmVisible ? arcgisImg : osmImg;
		const imgAlt = isOsmVisible ? arcgisTitle : osmTitle;

		return `<img src="${imgSrc}" width="36" height="36" alt="${imgAlt}" title="${imgAlt}" />`;
	},

	// Converte hex para rgba
	hexToRgbA: (hex, opacity = '0.2') => {
		const bigint = parseInt(hex.replace(/^#/, ''), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
		return rgba;
	},

	// Gera checksum SHA-256
	generateChecksum: async (input) => {
		if (!input) return input;

		const encoder = new TextEncoder();
		const data = encoder.encode(input);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hashBuffer))
			.map(byte => byte.toString(16).padStart(2, '0'))
			.join('');
	},

	normalizeWKT(wkt) {
		if (!wkt || typeof wkt !== 'string') return '';

		let trimmed = wkt.trim()
			.replace(/\s+/g, ' ')          // remove quebras de linha e espaços extras
			.replace(/,\s*/g, ',')         // remove espaços após vírgulas
			.replace(/\(\s*/g, '(')        // remove espaços após (
			.replace(/\s*\)/g, ')')        // remove espaços antes )
			.toUpperCase()                 // WKT é case-insensitive para tipo
			.replace(/(\d+\.\d{6})\d*/g, '$1'); // Opcional: arredondar coordenadas para 6 casas (evita diferenças mínimas)

		return trimmed;
	},
	// Cria a camada vetorial

	// Cria controle de atribuição personalizado
	createAttributeControl: function () {
		const attributionControl = new ol.control.Attribution({ collapsible: true });
		const buttonElement = attributionControl.element.querySelector('button');
		if (buttonElement) {
			buttonElement.innerHTML = '<i class="fa-solid fa-circle-info fa-lg"></i>';
		} else {
			console.warn('Attribution control button element not found.');
		}
		return attributionControl;
	},

	// Estilo de modificação (vértices)
	modifyStyleFunction: (color) => {
		return (feature, segments) => {
			const styles = utilities.genericStyleFunction(color);
			return styles;
		};
	},

	// Estilo genérico (quadrados nos vértices)
	genericStyleFunction: (color) => [
		new ol.style.Style({
			image: new ol.style.RegularShape({
				fill: new ol.style.Fill({ color: colors.normal }),
				stroke: new ol.style.Stroke({ color: colors.normal, width: 3 }),
				points: 4,
				radius: 10,
				radius2: 0,
				angle: 0,
			}),
			fill: new ol.style.Fill({ color: utilities.hexToRgbA(color, '0.3') }),
			stroke: new ol.style.Stroke({ color, width: 2 }),
		}),
	],

	// Estilo durante desenho
	drawStyleFunction: (color) => {
		return function (feature) {
			const geometry = feature.getGeometry();
			color = color || colors.normal;

			if (geometry.getType() === 'LineString') {
				return [new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: utilities.hexToRgbA(color, '1'),
						width: 3
					})
				})];
			}
			if (geometry.getType() === 'Point') {
				return [new ol.style.Style({
					image: new ol.style.RegularShape({
						fill: new ol.style.Fill({ color: colors.normal }),
						stroke: new ol.style.Stroke({ color: colors.normal, width: 3 }),
						points: 4,
						radius: 10,
						radius2: 0,
						angle: 0,
					}),
				})];
			}
			if (geometry.getType() === 'Polygon') {
				return [new ol.style.Style({
					stroke: new ol.style.Stroke({ color: utilities.hexToRgbA(color, 0), width: 3 }),
					fill: new ol.style.Fill({ color: utilities.hexToRgbA(color, '0.3') })
				})];
			}
			return false;
		};
	},

	// Restaura cores padrão do textarea
	// restoreDefaultColors: function () {
	// 	const textarea = document.querySelector("#wktdefault textarea");
	// 	if (textarea) {
	// 		textarea.style.borderColor = "";
	// 		textarea.style.backgroundColor = "";
	// 	}
	// },

	// Obtém IP público
	getIP: async function () {
		try {
			const response = await fetch('https://api.ipify.org?format=json');
			if (!response.ok) throw new Error('Failed to fetch IP address');
			const data = await response.json();
			return data.ip;
		} catch (error) {
			console.error('Error fetching IP:', error);
			return 'Unable to retrieve IP address';
		}
	},

	// Obtém localização do usuário
	getLocation: async function () {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject('Geolocation is not supported by your browser');
				return;
			}
			function handleError(error) {
				switch (error.code) {
					case error.PERMISSION_DENIED: reject('User denied the request for Geolocation'); break;
					case error.POSITION_UNAVAILABLE: reject('Location information is unavailable'); break;
					case error.TIMEOUT: reject('The request to get user location timed out'); break;
					default: reject('An unknown error occurred while retrieving coordinates'); break;
				}
			}
			navigator.geolocation.getCurrentPosition(
				(position) => {
					resolve({
						latitude: position.coords.latitude.toFixed(4),
						longitude: position.coords.longitude.toFixed(4)
					});
				},
				handleError
			);
		});
	},

	readClipboard: async function () {
		let returnVal = "";

		// Cria a textarea invisível
		const textarea = document.createElement("textarea");
		textarea.style.cssText = `
        position: fixed;
        left: -9999px;
        top: -9999px;
        opacity: 0;
        pointer-events: none;
        z-index: -9999;
    `;
		document.body.appendChild(textarea);

		// Força foco (ajuda muito no Chrome/Firefox)
		textarea.focus();
		textarea.select();

		try {
			// Tenta ler com Clipboard API (melhor quando funciona)
			const text = await navigator.clipboard.readText();

			const linhasValidas = text
				.split("\n")
				.map(l => l.trim())
				.filter(l => /^((MULTI)?POLYGON|POINT|LINESTRING|GEOMETRYCOLLECTION)\s*\(/i.test(l));

			if (linhasValidas.length === 0) {
				utilities.showToast?.(window.translator?.f("clipboard-empty", "No polygons found in clipboard"), "warning");
				return "";
			}

			returnVal = linhasValidas.join("\n");
			utilities.showToast?.(`${linhasValidas.length} ${window.translator?.f("clipboard-paste-success", "polygons pasted!")}`, "success");

			// Limpa clipboard (opcional)
			await navigator.clipboard.writeText("").catch(() => { });

		} catch (error) {
			console.warn("Clipboard API failed (normal), using fallback with manual paste");

			// Fallback seguro: força o paste com execCommand (ainda funciona em 2025!)
			const sucesso = document.execCommand("paste");

			setTimeout(() => {
				const text = textarea.value || "";

				const linhasValidas = text
					.split("\n")
					.map(l => l.trim())
					.filter(l => /^((MULTI)?POLYGON|POINT|LINESTRING|GEOMETRYCOLLECTION)\s*\(/i.test(l));

				if (linhasValidas.length > 0) {
					returnVal = linhasValidas.join("\n");
					utilities.showToast?.(`${linhasValidas.length} ${window.translator?.f("clipboard-paste-success", "polygons pasted!")}`, "success");
					navigator.clipboard.writeText("").catch(() => { });
				} else {
					utilities.showToast?.(window.translator?.f("clipboard-invalid", "No valid polygons in clipboard"), "warning");
				}
			}, 50);

		} finally {
			// GARANTE que a textarea é removida SEMPRE (mesmo com erro!)
			if (document.body.contains(textarea)) {
				document.body.removeChild(textarea);
			}
		}

		return returnVal;
	},
	// Cola WKT do clipboard
	// paste: async () => {
	// 	try {
	// 		const { mapUtilities } = await import('./mapUtilities.js');
	// 		await mapUtilities.loadWKTs(true, true);
	// 	} catch (error) {
	// 		console.error("Error pasting WKT:", error);
	// 	}
	// },

	showToast: (message, type = 'info', duration = 3000) => {
		// Remove toasts antigos
		document.querySelectorAll('.wkt-copy-toast').forEach(t => t.remove());

		const toast = document.createElement('div');
		toast.className = `wkt-copy-toast wkt-toast-${type}`;

		// Ícone + mensagem
		const icons = {
			success: '<i class="fas fa-check-circle"></i>',
			error: '<i class="fas fa-exclamation-circle"></i>',
			info: '<i class="fas fa-info-circle"></i>'
		};

		toast.innerHTML = `
        <div class="wkt-toast-icon">${icons[type] || icons.info}</div>
        <div class="wkt-toast-message">${message}</div>
        <div class="wkt-toast-progress"></div>`;

		document.body.appendChild(toast);

		// Força reflow para animação funcionar
		toast.offsetHeight;

		// Remove após duração
		setTimeout(() => {
			toast.classList.add('wkt-toast-hide');
			toast.addEventListener('transitionend', () => toast.remove());
		}, duration);
	},
};

// Exporta também a função de área (usada no tooltip)
export { formatArea };