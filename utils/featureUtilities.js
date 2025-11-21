import { utilities } from './utilities.js';
import { projections } from '../constants.js';

export const featureUtilities = {
    deselectCurrentFeature: (active, selectInteraction) => {
        let condition = selectInteraction.getActive();
        if (!active) condition = !condition;
        const features = selectInteraction.getFeatures();
        if (condition && features.getLength() > 0) {
            const f = features.item(0);
            selectInteraction.dispatchEvent({ type: 'select', selected: [], deselected: [f] });
            features.remove(f);
        }
    },

    convertFeaturesToWKT: (vectorLayer) => {
        const format = new ol.format.WKT();
        const wkts = [];
        vectorLayer.getSource().getFeatures().forEach(f => {
            const geom = f.getGeometry().clone();
            geom.transform(projections.mercator, projections.geodetic);
            wkts.push(format.writeGeometry(geom, { decimals: 5 }));
        });
        return wkts;
    },

    centerOnFeature: (feature, map) => {
        const extent = feature.getGeometry().getExtent();
        map.getView().fit(extent, { size: map.getSize(), padding: [50,50,50,50] });
    },

    addToFeatures: (id, wkt, textarea, featureCollection, format) => {
        if (!wkt) return null;
        let feature;
        try {
            feature = format.readFeature(wkt);
        } catch (e) {
            textarea.style.borderColor = "red";
            textarea.style.backgroundColor = "#F7E8F3";
            return null;
        }
        feature.getGeometry().transform(projections.geodetic, projections.mercator);
        feature.setId(id);
        featureCollection.push(feature);
        utilities.restoreDefaultColors(textarea);
        return feature;
    }
};