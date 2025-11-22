// js/main.js  →  ou  WKTapp.js  (o nome que preferires)

import { setupMap } from './map/setupMap.js';
import LightUI from './classes/LightUI.js';
import SettingsManager from './classes/SettingsManager.js';
import TabSystem from './classes/TabSystem.js';
import Translation from './classes/Translation.js';
import WKTUtilities from './classes/WKTUtilities.js';
import { loading, utilities } from './utils/utilities.js';
import { mapUtilities } from './utils/mapUtilities.js';

(async () => {
	// 1. UI básica
	new LightUI();

	const tabContainer = document.querySelector('#controls');
	if (tabContainer) new TabSystem(tabContainer);

	// 2. Tradução e configurações
	const translator = new Translation();
	window.translator = translator;

	const settingsManager = new SettingsManager('settingsContainer', 'wkt-settings');
	window.settingsManager = settingsManager;

	settingsManager.addEvent('wkt-presistent', 'change', (e) => {
		if (e.target.checked) WKTUtilities.save();
		else WKTUtilities.clear(false, true);
	});

	// 3. INICIA O MAPA (agora com await!)
	loading.show();
	try {
		await setupMap();                    // ← AQUI ESTAVA O PROBLEMA!
		console.log("Mapa iniciado com sucesso!");
	} catch (err) {
		console.error("Erro ao iniciar o mapa:", err);
	}

	// 4. Carrega WKTs do clipboard + localStorage
	await mapUtilities.loadWKTs(true, false);

	// 5. IP (opcional)
	utilities.getIP()
		.then(ip => console.log('IP:', ip))
		.catch(console.error)
		.finally(() => loading.hide());
})();