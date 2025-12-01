// classes/SettingsManager.js
export default class SettingsManager {
	#container;
	#storageKey;
	#listeners = new Map(); // event → Set de callbacks

	constructor(containerId, storageKey = 'app_settings', initialCallbacks = []) {
		this.#container = document.getElementById(containerId);
		this.#storageKey = storageKey;

		if (!this.#container) {
			throw new Error(`SettingsManager: Container #${containerId} não encontrado`);
		}

		this.#loadSettings();
		this.#attachEventListeners();
		this.#registerInitialCallbacks(initialCallbacks);
	}

	// === Eventos públicos ===
	on(event, callback) {
		if (!this.#listeners.has(event)) {
			this.#listeners.set(event, new Set());
		}
		this.#listeners.get(event).add(callback);
	}

	off(event, callback) {
		const callbacks = this.#listeners.get(event);
		if (callbacks) {
			callbacks.delete(callback);
			if (callbacks.size === 0) this.#listeners.delete(event);
		}
	}

	dispatch(event, data) {

		console.log(`Dispatching event: ${event}`, data);

		const callbacks = this.#listeners.get(event);
		if (callbacks) {
			callbacks.forEach(cb => {
				try { cb(data); }
				catch (err) { console.error('Erro no callback:', err); }
			});
		}
	}

	// === Métodos privados ===
	#loadSettings() {
		try {
			const saved = localStorage.getItem(this.#storageKey);
			if (!saved) return;

			const settings = JSON.parse(saved);
			this.#container.querySelectorAll('input, select, textarea').forEach(el => {
				const id = el.id || el.name;
				if (!id || !(id in settings)) return;

				if (el.type === 'checkbox' || el.type === 'radio') {
					el.checked = !!settings[id];
				} else {
					el.value = settings[id];
				}
			});
		} catch (err) {
			console.warn('Erro ao carregar configurações:', err);
		}
	}

	#saveSingleSetting(id, value) {
		try {
			const current = this.#getAllSettings();
			if (current[id] === value) return;

			current[id] = value;
			localStorage.setItem(this.#storageKey, JSON.stringify(current));
			this.dispatch('settingChanged', { id, value });
		} catch (err) {
			console.error('Erro ao salvar configuração:', err);
		}
	}

	#getAllSettings() {
		try {
			const saved = localStorage.getItem(this.#storageKey);
			return saved ? JSON.parse(saved) : {};
		} catch {
			return {};
		}
	}

	#attachEventListeners() {
		this.#container.querySelectorAll('input, select, textarea').forEach(el => {
			const id = el.id || el.name;
			if (!id) return;

			const save = () => {
				const value = (el.type === 'checkbox' || el.type === 'radio')
					? el.checked
					: el.value;
				this.#saveSingleSetting(id, value);
			};

			el.addEventListener('change', save);
			if (el.type === 'range' || el.tagName === 'TEXTAREA') {
				el.addEventListener('input', save);
			}
		});
	}

	#registerInitialCallbacks(callbacks) {
		callbacks.forEach(({ id, event = 'change', callback }) => {
			const el = this.#container.querySelector(`#${id}`);
			if (el) {
				el.addEventListener(event, (e) => callback(e, this));
			}
		});
	}

	// === Métodos públicos ===
	getSetting(id, defaultValue = null) {
		return this.#getAllSettings()[id] ?? defaultValue;
	}

	setSetting(id, value) {
		this.#saveSingleSetting(id, value);
	}

	toggle(id) {
		const el = this.#container.querySelector(`#${id}`);
		if (el && (el.type === 'checkbox' || el.type === 'radio')) {
			el.checked = !el.checked;
			el.dispatchEvent(new Event('change'));
		}
	}

	reset() {
		localStorage.removeItem(this.#storageKey);

		this.#container.querySelectorAll('input, select, textarea').forEach(el => {
			const type = el.type?.toLowerCase();

			if (type === 'checkbox' || type === 'radio') {
				el.checked = el.defaultChecked || false;
			} else if (el.tagName === 'SELECT') {
				el.selectedIndex = 0;
			} else {
				el.value = el.defaultValue || '';
			}
		});

		this.dispatch('settingsReset');
		this.dispatch('settingChanged', { id: 'all', value: 'reset' });
	}
}