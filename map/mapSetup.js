import { mapDefaults, projections, colors } from '../constants.js';
import { utilities } from '../utils/utilities.js';

export function setupMap() {

	const osmLayer = new ol.layer.Tile({ source: new ol.source.OSM(), visible: true });
	const arcgisLayer = new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			attributions: 'Tiles � Esri'
		}),
		visible: false
	});

	const vectorSource = new ol.source.Vector();
	const vectorLayer = new ol.layer.Vector({
		source: vectorSource,
		style: feature => [new ol.style.Style({
			image: new ol.style.RegularShape({
				fill: new ol.style.Fill({ color: colors.normal }),
				stroke: new ol.style.Stroke({ color: colors.normal, width: 3 }),
				points: 4, radius: 10, radius2: 0, angle: 0
			}),
			fill: new ol.style.Fill({ color: utilities.hexToRgbA(colors.normal, '0.3') }),
			stroke: new ol.style.Stroke({ color: colors.normal, width: 2 })
		})],
		displayInLayerSwitcher: false
	});

	const defaultCenter = utilities.transformCoordinates(
		[mapDefaults.longitude, mapDefaults.latitude],
		projections.geodetic,
		projections.mercator
	);

	const map = new ol.Map({
		target: 'map',
		layers: [osmLayer, arcgisLayer, vectorLayer],
		view: new ol.View({ center: defaultCenter, zoom: mapDefaults.zoom, maxZoom: 19 }),
		controls: ol.control.defaults.defaults({ attribution: false }).extend([
			new ol.control.Attribution({ collapsible: true })
		])
	});

	return { map, vectorLayer, vectorSource, osmLayer, arcgisLayer };
}