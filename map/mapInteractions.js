import { colors } from '../constants.js';
import { utilities } from '../utils/utilities.js';
import { featureUtilities } from '../utils/featureUtilities.js';
import { WKTUtilities } from '../classes/WKTUtilities.js';

export function initializeControls(map, vectorLayer, translator, settingsManager) {
    window.map = map;
    window.settingsManager = settingsManager;

    const selectInteraction = new ol.interaction.Select({
        hitTolerance: 2,
        style: feature => [new ol.style.Style({
            stroke: new ol.style.Stroke({ color: colors.edit, width: 3 }),
            fill: new ol.style.Fill({ color: utilities.hexToRgbA(colors.edit, '0.3') })
        })]
    });
    map.addInteraction(selectInteraction);

    const modifyInteraction = new ol.interaction.ModifyFeature({
        features: selectInteraction.getFeatures(),
        style: feature => [new ol.style.Style({
            stroke: new ol.style.Stroke({ color: colors.edit, width: 4 })
        })]
    });
    map.addInteraction(modifyInteraction);

    const drawInteraction = new ol.interaction.Draw({
        type: 'Polygon',
        source: vectorLayer.getSource(),
        style: feature => [new ol.style.Style({
            stroke: new ol.style.Stroke({ color: colors.create, width: 3 }),
            fill: new ol.style.Fill({ color: utilities.hexToRgbA(colors.create, '0.3') })
        })]
    });
    map.addInteraction(drawInteraction);

    drawInteraction.on('drawend', async evt => {
        await WKTUtilities.add(evt.feature);
        featureUtilities.centerOnFeature(evt.feature, map);
        selectInteraction.setActive(true);
    });

    const undoRedo = new ol.interaction.UndoRedo();
    map.addInteraction(undoRedo);
    map.addInteraction(new ol.interaction.Snap({ source: vectorLayer.getSource() }));

    // Tooltip area
    const tooltip = new ol.Overlay({ element: document.getElementById('tooltip'), offset: [0, -15], positioning: 'bottom-center' });
    map.addOverlay(tooltip);
    map.on('pointermove', evt => {
        if (settingsManager.getSettingById('show-area')) {
            const feature = map.forEachFeatureAtPixel(evt.pixel, f => f);
            tooltip.getElement().className = 'ol-tooltip hidden';
            if (feature && feature.getGeometry().getType() === 'Polygon') {
                const area = ol.sphere.getArea(feature.getGeometry());
                if (area > 0) {
                    const output = area > 10000
                        ? (area / 1000000).toFixed(2) + ' km²'
                        : Math.round(area) + ' m²';
                    tooltip.setPosition(evt.coordinate);
                    tooltip.getElement().innerHTML = output;
                    tooltip.getElement().className = 'ol-tooltip ol-tooltip-static';
                }
            }
        }
    });
}