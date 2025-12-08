// js/main.js  →  ou  WKTapp.js  (o nome que preferires)

import { setupMap } from './map/setupMap.js';
import SettingsManager from './classes/SettingsManager.js';
import TabSystem from './classes/TabSystem.js';
import Translation from './classes/Translation.js';
import { loading, utilities } from './utils/utilities.js';
import { mapUtilities } from './utils/mapUtilities.js';

(async () => {
	loading.show();

	const tabSystem = new TabSystem(document.querySelector('#controls'));

	const settingsManager = new SettingsManager('settingsContainer', 'wkt-settings');
	window.settingsManager = settingsManager;

	// 2. Tradução e configurações
	const translator = new Translation();
	window.translator = translator;

	const langSelect = document.getElementById('language');
	if (langSelect) {
		// Reads saving form SettingsManager (loaded first)
		// If SettingsManager restored a value, use it. 
		// Otherwise, use browser default (and SettingsManager will pick it up on next change)
		const savedLang = settingsManager.getSetting('language');
		
		if (savedLang) {
			translator.setLanguage(savedLang);
			langSelect.value = savedLang; 
		} else {
			// No saved setting? Use translator's auto-detected
			langSelect.value = translator.getCurrentLanguage();
		}

		langSelect.addEventListener('change', () => {
			const newLang = langSelect.value;
			translator.setLanguage(newLang);
			console.log('Language changed to:', newLang);
		});
	}

	// 3. INICIA O MAPA (agora com await!)
	try {
		await setupMap();
		console.log("Mapa iniciado com sucesso!");
	} catch (err) {
		console.error("Erro ao iniciar o mapa:", err);
	}

	// 4. Carrega WKTs do clipboard + localStorage
	await mapUtilities.loadOnStart();

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

	const traducao = window.translator?.getCurrentTranslations();
	console.log(JSON.stringify(traducao, null, 2));

})();
