import { projections, colors } from '../constants.js';

export const utilities = {
	transformCoordinates: (coords, from, to) => ol.proj.transform(coords, from, to),

	layerChangeBtnHtml: (osmVisible) => {
		const osmImg = "data:image/png;base64,..."; // ou usa getPreview() se existir
		const arcgisImg = "data:image/png;base64,...";
		const imgSrc = osmVisible ? arcgisImg : osmImg;
		const titles = osmVisible ? "Satellite" : "Streets";
		return `<img src="${imgSrc}" width="36" height="36" alt="${titles}" title="${titles}" />`;
	},

	hexToRgbA: (hex, opacity = '0.2') => {
		const bigint = parseInt(hex.replace(/^#/, ''), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return `rgba(${r},${g},${b},${opacity})`;
	},

	getFeatureWKT: (feature) => {
		if (!feature) return "";
		const geom = feature.getGeometry().clone();
		geom.transform(projections.mercator, projections.geodetic);
		return new ol.format.WKT().writeGeometry(geom);
	},

	generateChecksum: async (input) => {
		if (!input) return input;
		const data = new TextEncoder().encode(input);
		const hash = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
	},

	restoreDefaultColors: (textarea) => {
		textarea.style.borderColor = "";
		textarea.style.backgroundColor = "";
	},

	async getIP() {
		try {
			const res = await fetch('https://api.ipify.org?format=json');
			const data = await res.json();
			return data.ip;
		} catch (e) {
			return 'Unable to retrieve IP';
		}
	},

	getLocation: () => new Promise((resolve, reject) => {
		if (!navigator.geolocation) return reject('Geolocation not supported');
		navigator.geolocation.getCurrentPosition(
			pos => resolve({ latitude: pos.coords.latitude.toFixed(4), longitude: pos.coords.longitude.toFixed(4) }),
			reject
		);
	}),

	// utils/utilities.js  ← substitui a função antiga por esta
	async readClipboard() {
		// 1. Primeiro tenta o método normal (funciona se já tiver foco ou permissão)
		try {
			const text = await navigator.clipboard.readText();
			if (text?.includes("POLYGON") || text?.includes("MULTIPOLYGON")) {
				console.log("Clipboard lido diretamente!");
				return text.trim();
			}
		} catch (err) {
			// Silencia o erro esperado "Document is not focused"
			if (!err.message.includes("not focused")) console.error(err);
		}

		// 2. Truque mágico: cria um textarea invisível, dá foco, executa "paste" e lê
		return new Promise((resolve) => {
			const textarea = document.createElement('textarea');
			textarea.style.position = 'fixed';
			textarea.style.opacity = 0;
			textarea.style.pointerEvents = 'none';
			document.body.appendChild(textarea);

			textarea.focus();
			textarea.select();

			// Força o comando Paste (funciona mesmo sem interação real do utilizador em muitos casos)
			document.execCommand('paste');

			setTimeout(() => {
				const text = textarea.value;
				document.body.removeChild(textarea);

				if (text?.includes("POLYGON") || text?.includes("MULTIPOLYGON")) {
					console.log("Clipboard lido com truque execCommand!");
					resolve(text.trim());
				} else {
					resolve(""); // nada útil no clipboard
				}
			}, 50);
		});
	}
};