// utils/Translation.js
export default class Translation {
	#defaultLang;
	#currentLang;
	#translations;
	#trackedElements = new Map(); // ← Map (não WeakMap) para poder usar forEach

	constructor(defaultLang = 'en') {
		this.#defaultLang = defaultLang;
		this.#currentLang = this.#detectLanguage();

		console.log(`Idioma detectado: ${this.#currentLang}`);

		this.#translations = {
			"pt": {
				"import": "Importar",
				"clear-selection": "Desselecionar Tudo",
				"copy-selected": "Copiar Selecionados",
				"show-area": "Mostrar Área",
				"persistent-objects": "Reter Objectos",
				"multi-select": "Multi-Seleção (Ctrl+Click)",
				"union-multi-select": "Unir Multi-Seleção",
				"close": "Fechar",
				"textarea-placeholder": "Cole ou importe um WKT aqui...",
				"wkt-imported": "WKT importado com sucesso!",
				"no-common-area": "Não há área comum entre as features selecionadas",
				"copied": "Copiado!",
				"all-deselected": "Todas as features desselecionadas",
				"change-layer": "Alterar camada...",
				"center-objects": "Centralizar nos objetos do mapa...",
				"center-location": "Centralizar na minha localização...",
				"undo": "Desfazer",
				"redo": "Refazer",
				"polygon": "Polígono",
				"showinfo": "Mostrar informações",
				"delete": "Excluir",
				"select": "Selecionar",
				"language": "Idioma"
			},
			"en": {
				"import": "Import",
				"clear-selection": "Clear",
				"copy-selected": "Copy",
				"show-area": "Show Area",
				"persistent-objects": "Keep Objects",
				"multi-select": "Multi-Selection (Ctrl+Click)",
				"union-multi-select": "Union Multi-Selection",
				"close": "Close",
				"textarea-placeholder": "Paste or import a WKT here...",
				"wkt-imported": "WKT imported successfully!",
				"no-common-area": "No common area between selected features",
				"copied": "Copied!",
				"all-deselected": "All features deselected",
				"change-layer": "Change layer...",
				"center-objects": "Center on map objects...",
				"center-location": "Center on my location...",
				"undo": "Undo",
				"redo": "Redo",
				"polygon": "Polygon",
				"showinfo": "Show information",
				"delete": "Delete",
				"select": "Select",
				"language": "Language"
			},
			"es": {
				"import": "Importar",
				"clear-selection": "Deseleccionar Todo",
				"copy-selected": "Copiar Seleccionados",
				"show-area": "Mostrar Área",
				"persistent-objects": "Mantener Objetos",
				"multi-select": "Multi-Selección (Ctrl+Click)",
				"union-multi-select": "Unir Multi-Selección",
				"close": "Cerrar",
				"textarea-placeholder": "Pega o importa un WKT aquí...",
				"wkt-imported": "WKT importado con éxito!",
				"no-common-area": "No hay área común entre las features seleccionadas",
				"copied": "¡Copiado!",
				"all-deselected": "Todas las features deseleccionadas",
				"change-layer": "Cambiar capa...",
				"center-objects": "Centrar en objetos del mapa...",
				"center-location": "Centrar en mi ubicación...",
				"undo": "Deshacer",
				"redo": "Rehacer",
				"polygon": "Polígono",
				"showinfo": "Mostrar información",
				"delete": "Eliminar",
				"select": "Seleccionar",
				"language": "Idioma"
			},
			"fr": {
				"import": "Importer",
				"clear-selection": "Tout désélectionner",
				"copy-selected": "Copier la sélection",
				"show-area": "Afficher l'aire",
				"persistent-objects": "Conserver les objets",
				"multi-select": "Multi-sélection (Ctrl+Clic)",
				"union-multi-select": "Unir la multi-sélection",
				"close": "Fermer",
				"textarea-placeholder": "Collez ou importez un WKT ici...",
				"wkt-imported": "WKT importé avec succès !",
				"no-common-area": "Aucune zone commune entre les objets sélectionnés",
				"copied": "Copié !",
				"all-deselected": "Toutes les features désélectionnées",
				"change-layer": "Changer de couche...",
				"center-objects": "Centrer sur les objets de la carte...",
				"center-location": "Centrer sur ma position...",
				"undo": "Annuler",
				"redo": "Rétablir",
				"polygon": "Polygone",
				"showinfo": "Afficher les informations",
				"delete": "Supprimer",
				"select": "Sélectionner",
				"language": "Langue"
			}
		};

		this.setLanguage(this.#currentLang);
	}

	#detectLanguage() {
		const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
		if (lang.startsWith('pt')) return 'pt';
		if (lang.startsWith('es')) return 'es';
		if (lang.startsWith('fr')) return 'fr';
		if (lang.startsWith('en')) return 'en';
		return this.#defaultLang;
	}

	// Traduz e regista elemento dinâmico
	get(key, element = null, fallback = key) {
		const text = this.#translations[this.#currentLang]?.[key]
			?? this.#translations[this.#defaultLang]?.[key]
			?? fallback;

		if (element && element instanceof Element) {
			if (!element.hasAttribute('data-i18n')) {
				element.setAttribute('data-i18n', key);
			}
			this.#trackedElements.set(element, key);

			// Atualiza imediatamente
			if (element.tagName === 'INPUT' || element.tagName === 'BUTTON' || element.tagName === 'TEXTAREA') {
				element.value = text;
			} else if (element.hasAttribute('placeholder')) {
				element.placeholder = text;
			} else if (element.hasAttribute('title')) {
				element.title = text;
			} else {
				element.textContent = text;
			}
		}

		return text;
	}

	t(key, element = null, fallback = key) {
		return this.get(key, element, fallback);
	}

	setLanguage(lang) {
		if (!this.#translations[lang]) {
			console.warn(`Idioma "${lang}" não encontrado. Usando ${this.#defaultLang}`);
			lang = this.#defaultLang;
		}
		this.#currentLang = lang;
		document.documentElement.lang = lang;
		this.updateAll();
	}

	updateAll() {
		// Elementos estáticos
		document.querySelectorAll('[data-i18n]').forEach(el => {
			const key = el.getAttribute('data-i18n');
			const text = this.get(key);
			if (el.tagName === 'INPUT' || el.tagName === 'BUTTON') {
				el.value = text;
			} else {
				el.textContent = text;
			}
		});

		document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
			el.placeholder = this.get(el.getAttribute('data-i18n-placeholder'));
		});

		document.querySelectorAll('[data-i18n-title]').forEach(el => {
			el.title = this.get(el.getAttribute('data-i18n-title'));
		});

		// Elementos dinâmicos registados
		this.#trackedElements.forEach((key, el) => {
			if (document.body.contains(el)) {
				const text = this.get(key);
				if (el.tagName === 'INPUT' || el.tagName === 'BUTTON' || el.tagName === 'TEXTAREA') {
					el.value = text;
				} else if (el.hasAttribute('placeholder')) {
					el.placeholder = text;
				} else if (el.hasAttribute('title')) {
					el.title = text;
				} else {
					el.textContent = text;
				}
			} else {
				this.#trackedElements.delete(el);
			}
		});
	}

	getCurrentLanguage() {
		return this.#currentLang;
	}

	addTranslations(lang, dict) {
		if (!this.#translations[lang]) this.#translations[lang] = {};
		Object.assign(this.#translations[lang], dict);
		if (this.#currentLang === lang) this.updateAll();
	}
}