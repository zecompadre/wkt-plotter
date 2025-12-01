// js/main.js  →  ou  WKTapp.js  (o nome que preferires)

import { setupMap } from './map/setupMap.js';
import LightUI from './classes/LightUI.js';
import SettingsManager from './classes/SettingsManager.js';
import TabSystem from './classes/TabSystem.js';
import Translation from './classes/Translation.js';
import wktUtilities from './classes/WKTUtilities.js';
import { loading, utilities } from './utils/utilities.js';
import { mapUtilities } from './utils/mapUtilities.js';

(async () => {
	// 1. UI básica
	new LightUI();
	const tabSystem = new TabSystem(document.querySelector('#controls'));

	// 2. Tradução e configurações
	const translator = new Translation();
	window.translator = translator;

	const settingsManager = new SettingsManager('settingsContainer', 'wkt-settings');
	window.settingsManager = settingsManager;

	// 3. INICIA O MAPA (agora com await!)
	loading.show();
	try {
		await setupMap();
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

	$("#settings-btn").on("click", function () {
		tabSystem.showTabById('settingsContainer');
		$("#settings-btn").hide();
	});

	$("#settings-close-btn").on("click", function () {
		tabSystem.showTabById('importContainer');
		$("#settings-btn").show();
	});
})();