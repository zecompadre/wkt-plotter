import { setupMap } from './map/mapSetup.js';
import { initializeControls } from './map/mapInteractions.js';
import { mapUtilities } from './map/mapUtilities.js';
import { SettingsManager } from './classes/SettingsManager.js';
import { Translation } from './classes/Translation.js';
import { TabSystem } from './classes/TabSystem.js';
import { LightUI } from './classes/LightUI.js';
import { Loading } from './classes/Loading.js';

class App {
    static async init() {
        const { map, vectorLayer, loading } = setupMap();

        const translator = new Translation();
        const settingsManager = new SettingsManager('settingsContainer', 'wkt-settings');
        settingsManager.addEvent('wkt-presistent', 'change', (e) => {
            if (e.target.checked) WKTUtilities.save();
            else WKTUtilities.clear(false, true);
        });

        new LightUI();
        const tabContainer = document.querySelector('#controls');
        if (tabContainer) new TabSystem(tabContainer);

        initializeControls(map, vectorLayer, translator, settingsManager);

        loading.show();
        await mapUtilities.loadWKTs(true, false);
        loading.hide();
    }
}

document.addEventListener('DOMContentLoaded', () => App.init());