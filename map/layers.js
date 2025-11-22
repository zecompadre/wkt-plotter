// js/map/layers.js

export const arcgisLayer = new ol.layer.Tile({
	name: 'Satellite',
	title: 'Satellite',
	source: new ol.source.XYZ({
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
		attributions: 'Tiles Esri'
	}),
	visible: false,
});

export const osmLayer = new ol.layer.Tile({
	name: 'Streets',
	title: 'Streets',
	source: new ol.source.OSM(),
	visible: true
});