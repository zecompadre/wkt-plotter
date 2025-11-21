// js/app.js ← VERSÃO FINAL OFICIAL (21 Nov 2025)
import { setupMap } from './map/mapSetup.js';
import { initializeControls } from './map/mapInteractions.js';
import { mapUtilities } from './map/mapUtilities.js';
import { SettingsManager } from './classes/SettingsManager.js';
import { Translation } from './classes/Translation.js';
import { TabSystem } from './classes/TabSystem.js';
import { LightUI } from './classes/LightUI.js';
import { WKTUtilities } from './classes/WKTUtilities.js';
import { Loading } from './classes/Loading.js';

export class App {
	static async init() {

		const loading = new Loading({ dotSize: 25 });


		const { map, vectorLayer } = setupMap();

		const translator = new Translation();
		const settingsManager = new SettingsManager('settingsContainer', 'wkt-settings');

		settingsManager.addEvent('wkt-presistent', 'change', (e) => {
			e.target.checked ? WKTUtilities.save() : WKTUtilities.clear(false, true);
		});

		new LightUI();
		document.querySelector('#controls') && new TabSystem(document.querySelector('#controls'));

		initializeControls(map, vectorLayer, translator, settingsManager);

		loading.show();
		try {
			await mapUtilities.loadWKTs(true, false);
		} catch (err) {
			console.warn("Clipboard automático falhou (normal em alguns casos):", err);
		} finally {
			loading.hide();
		}
	}
}

document.addEventListener('DOMContentLoaded', () => App.init());