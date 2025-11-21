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

    async readClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text.includes("POLYGON")) {
                await navigator.clipboard.writeText("");
                return text;
            }
        } catch (e) { console.error(e); }
        return "";
    }
};