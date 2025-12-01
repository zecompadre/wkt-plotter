// classes/SettingsManager.js
export default class SettingsManager {
	constructor(containerId, storageKey = 'app_settings', initialCallbacks = []) {
		this.container = document.getElementById(containerId);
		this.storageKey = storageKey;
		this.listeners = new Map(); // event → Set de callbacks (evita duplicados)

		if (!this.container) {
			throw new Error(`SettingsManager: Container #${containerId} não encontrado`);
		}

		this.loadSettings();
		this.attachEventListeners();
		this.registerInitialCallbacks(initialCallbacks);
	}

	// === Eventos (melhor que array simples) ===
	on(event, callback) {
		console.log('Adding event listener:', event, callback);
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event).add(callback);
	}

	off(event, callback) {

		console.log('Removing event listener:', event, callback);

		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.delete(callback);
			if (callbacks.size === 0) this.listeners.delete(event);
		}
	}

	dispatch(event, data) {

		console.log('Dispatching event:', event, data);

		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.forEach(cb => {
				try { cb(data); }
				catch (err) { console.error('Erro no callback do SettingsManager:', err); }
			});
		}
	}

	// === Persistência ===
	loadSettings() {
		try {
			const saved = localStorage.getItem(this.storageKey);
			const settings = saved ? JSON.parse(saved) : {};

			this.container.querySelectorAll('input, select, textarea').forEach(el => {
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

	saveSettings() {
		const settings = {};

		this.container.querySelectorAll('input, select, textarea').forEach(el => {
			const id = el.id || el.name;
			if (!id) return;

			if (el.type === 'checkbox' || el.type === 'radio') {
				settings[id] = el.checked;
			} else {
				settings[id] = el.value;
			}

			// Dispara evento por configuração alterada
			this.dispatch('settingChanged', { id, value: settings[id] });
		});

		try {
			localStorage.setItem(this.storageKey, JSON.stringify(settings));
		} catch (err) {
			console.error('Erro ao salvar configurações:', err);
		}
	}

	// === Acesso rápido ===
	getSetting(id, defaultValue = null) {
		try {
			const saved = localStorage.getItem(this.storageKey);
			const settings = saved ? JSON.parse(saved) : {};
			return settings[id] !== undefined ? settings[id] : defaultValue;
		} catch {
			return defaultValue;
		}
	}

	setSetting(id, value) {
		const settings = this.getAllSettings();
		settings[id] = value;
		localStorage.setItem(this.storageKey, JSON.stringify(settings));
		this.dispatch('settingChanged', { id, value });
	}

	getAllSettings() {
		try {
			const saved = localStorage.getItem(this.storageKey);
			return saved ? JSON.parse(saved) : {};
		} catch {
			return {};
		}
	}

	// === Eventos automáticos ===
	attachEventListeners() {
		const inputs = this.container.querySelectorAll('input, select, textarea');
		inputs.forEach(el => {
			el.addEventListener('change', () => this.saveSettings());
			// Suporte a input em tempo real (ex: sliders, range)
			if (el.type === 'range' || el.tagName === 'TEXTAREA') {
				el.addEventListener('input', () => this.saveSettings());
			}
		});
	}

	// === Callbacks iniciais (mais limpo) ===
	registerInitialCallbacks(callbacks) {
		callbacks.forEach(({ id, event = 'change', callback }) => {
			const el = this.container.querySelector(`#${id}`);
			if (el) {
				el.addEventListener(event, (e) => callback(e, this));
			}
		});
	}

	// === Utilitário: toggleor de configuração específica ===
	toggle(id) {
		const el = this.container.querySelector(`#${id}`);
		if (el && (el.type === 'checkbox')) {
			el.checked = !el.checked;
			el.dispatchEvent(new Event('change'));
		}
	}

	// === Reset total (útil) ===
	reset() {
		// Remove do localStorage
		localStorage.removeItem(this.storageKey);

		// Reseta todos os inputs/selects/checkboxes no container
		this.container.querySelectorAll('input, select, textarea').forEach(el => {
			const type = el.type?.toLowerCase();

			if (type === 'checkbox' || type === 'radio') {
				el.checked = el.defaultChecked || false;
			} else if (type === 'text' || type === 'textarea' || type === 'password' || type === 'number' || type === 'range') {
				el.value = el.defaultValue || '';
			} else if (el.tagName === 'SELECT') {
				el.selectedIndex = 0;
			}
		});

		// Dispara evento para atualizar tudo (ex: multi-select, temas, etc.)
		this.dispatch('settingsReset');
		this.dispatch('settingChanged', { id: 'all', value: 'reset' });

		console.log('Configurações resetadas com sucesso');
	}
}