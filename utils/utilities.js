// js/utils/utilities.js

import Loading from '../classes/Loading.js';
import { colors, projections, mapDefaults } from './constants.js';
import { format, featureCollection } from '../map/setupMap.js';
import { osmLayer, arcgisLayer } from './layers.js';
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
	// Transforma coordenadas entre projeções
	transformCoordinates: (coords, from, to) => ol.proj.transform(coords, from, to),

	// HTML do botão de troca de camada
	layerChangeBtnHtml: () => {
		const osmTitle = osmLayer.get("title") || osmLayer.get("name");
		const osmImg = osmLayer.getPreview?.() || '';
		const arcgisTitle = arcgisLayer.get("title") || arcgisLayer.get("name");
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
		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	},

	// Obtém WKT de uma feature
	getFeatureWKT: (feature) => {
		if (!feature) return "";
		const geom = feature.getGeometry().clone();
		const transformedGeom = geom.transform(projections.mercator, projections.geodetic);
		return format.writeGeometry(transformedGeom);
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

	// Cria a camada vetorial
	createVectorLayer: () => {
		// Cria uma camada nova e retorna
		const layer = new ol.layer.Vector({
			source: new ol.source.Vector({ features: featureCollection }),
			style: utilities.genericStyleFunction(colors.normal)
		});
		layer.set('displayInLayerSwitcher', false);
		return layer; // Retorna a camada!
	},

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
	restoreDefaultColors: function () {
		const textarea = document.querySelector("#wktdefault textarea");
		if (textarea) {
			textarea.style.borderColor = "";
			textarea.style.backgroundColor = "";
		}
	},

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

	// Captura screenshot do mapa
	imageCanvas: function (feature) {
		const mapEl = document.getElementById("map");
		const width = mapEl.offsetWidth;
		const height = mapEl.offsetHeight;
		loading.show();
		domtoimage.toPng(mapEl, { width, height })
			.then(dataUrl => {
				const img = new Image();
				img.src = dataUrl;
				document.body.appendChild(img);
				loading.hide();
			})
			.catch(error => {
				console.error('oops, something went wrong!', error);
				loading.hide();
			});
	},

	// Lê clipboard (procura por POLYGON)
	readClipboard: async function () {
		let returnVal = "";
		try {
			const permission = await navigator.permissions.query({ name: "clipboard-read" });
			if (permission.state === "denied") throw new Error("Not allowed to read clipboard.");
			const text = await navigator.clipboard.readText();
			if (text.includes("POLYGON")) {
				returnVal = text;
				await navigator.clipboard.writeText("");
			}
		} catch (error) {
			console.error("Error reading clipboard:", error.message);
		}
		return returnVal;
	},

	// Cola WKT do clipboard
	paste: async () => {
		try {
			const { mapUtilities } = await import('./mapUtilities.js');
			await mapUtilities.loadWKTs(true, true);
		} catch (error) {
			console.error("Error pasting WKT:", error);
		}
	},
};

// Exporta também a função de área (usada no tooltip)
export { formatArea };