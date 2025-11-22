// js/main.js

import { setupMap } from './map/setupMap.js';
import LightUI from './classes/LightUI.js';
import SettingsManager from './classes/SettingsManager.js';
import TabSystem from './classes/TabSystem.js';
import Translation from './classes/Translation.js';
import WKTUtilities from './classes/WKTUtilities.js';
import { loading, utilities } from './utils/utilities.js';
import { mapUtilities } from './utils/mapUtilities.js';

document.addEventListener('DOMContentLoaded', () => {
	new LightUI();

	const tabContainer = document.querySelector('#controls');
	if (tabContainer) new TabSystem(tabContainer);

	const translator = new Translation();
	window.translator = translator;

	const settingsManager = new SettingsManager('settingsContainer', 'wkt-settings');
	window.settingsManager = settingsManager;

	settingsManager.addEvent('wkt-presistent', 'change', (e) => {
		if (e.target.checked) WKTUtilities.save();
		else WKTUtilities.clear(false, true);
	});

	setupMap();

	mapUtilities.loadWKTs(true, false);

	loading.show();
	utilities.getIP()
		.then(ip => console.log('IP:', ip))
		.catch(console.error)
		.finally(() => loading.hide());
});