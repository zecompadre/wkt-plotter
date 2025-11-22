export default class SettingsManager {
	constructor(containerId, storageKey, callbacks = []) {
		this.container = document.getElementById(containerId);
		this.storageKey = storageKey;
		this.callbacks = callbacks;
		if (!this.container) {
			throw new Error("Container not found");
		}
		this.loadSettings();
		this.attachEventListeners();
	}

	loadSettings() {
		const savedSettings = JSON.parse(localStorage.getItem(this.storageKey)) || {};
		this.container.querySelectorAll('input, select').forEach((element) => {
			const { id, type } = element;
			if (id && id in savedSettings) {
				if (type === 'checkbox') {
					element.checked = savedSettings[id];
				} else {
					element.value = savedSettings[id];
				}
			}
		});
	}

	saveSettings() {
		const settings = {};
		this.container.querySelectorAll('input, select').forEach((element) => {
			const { id, type } = element;
			if (id) {
				settings[id] = type === 'checkbox' ? element.checked : element.value;
			}
		});
		localStorage.setItem(this.storageKey, JSON.stringify(settings));
	}

	getSettings() {
		return JSON.parse(localStorage.getItem(this.storageKey)) || {};
	}

	getSettingById(id) {
		const settings = this.getSettings();
		return settings[id] !== undefined ? settings[id] : null;
	}

	attachEventListeners() {
		this.container.querySelectorAll('input, select').forEach((element) => {
			element.addEventListener('change', () => this.saveSettings());
		});
		this.callbacks.forEach(({ id, type, callback }) => {
			const element = this.container.querySelector(`#${id}`);
			if (element) {
				element.addEventListener(type, (e) => callback(e, this));
			}
		});
	}

	addEvent(elementId, eventType, eventCallback) {
		this.callbacks.push({ id: elementId, type: eventType, callback: eventCallback });
		const element = this.container.querySelector(`#${elementId}`);
		if (element) {
			element.addEventListener(eventType, (e) => eventCallback(e, this));
		}
	}
}