// js/app.js

import { setupMap } from './map/mapSetup.js';
import { initializeControls } from './map/mapInteractions.js';
import { mapUtilities } from './map/mapUtilities.js';
import { SettingsManager } from './classes/SettingsManager.js';
import { Translation } from './classes/Translation.js';
import { TabSystem } from './classes/TabSystem.js';
import { LightUI } from './classes/LightUI.js';
import { WKTUtilities } from './classes/WKTUtilities.js';     // ← NOVO (faltava!)
import { Loading } from './classes/Loading.js';               // ← NOVO (para loading.show/hide)

export class App {
	static async init() {
		// 1. Criação do mapa + layers + loading overlay
		const { map, vectorLayer, loading } = setupMap();

		// 2. Traduções e settings
		const translator = new Translation();
		const settingsManager = new SettingsManager('settingsContainer', 'wkt-settings');

		// Persistência automática dos WKTs
		settingsManager.addEvent('wkt-presistent', 'change', (e) => {
			if (e.target.checked) {
				WKTUtilities.save();
			} else {
				WKTUtilities.clear(false, true);
			}
		});

		// 3. UI básica
		new LightUI();
		const tabContainer = document.querySelector('#controls');
		if (tabContainer) new TabSystem(tabContainer);

		// 4. Todos os controles e interações do mapa
		initializeControls(map, vectorLayer, translator, settingsManager);

		// 5. Carrega WKTs persistentes + tenta ler automaticamente do clipboard
		loading.show();
		// 	try {
		// 		await mapUtilities.loadWKTs(true, false);  // ← true = tenta ler clipboard ao abrir
		// 	} catch (err) {
		// 		console.warn("Não foi possível ler o clipboard automaticamente:", err);
		// 	} finally {
		// 		loading.hide();
		// 	}
	}
}

// Inicia a app quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => App.init());