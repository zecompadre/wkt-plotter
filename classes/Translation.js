// utils/Translation.js
export default class Translation {
	#defaultLang;
	#currentLang;
	#translations;
	#trackedElements = new Map(); // ← Map (não WeakMap) para poder usar forEach

	constructor(defaultLang = 'en') {
		this.#defaultLang = defaultLang;
		this.#currentLang = this.#detectLanguage();

		console.log(`Detected language: ${this.#currentLang}`);

		this.#translations = {
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
				"language": "Language",
				"zoom-btn": "Zoom",
				"copy-btn": "Copy",
				"delete-btn": "Delete",
				"wkt-copied": "WKT copied!",
				"wkt-deleted": "WKT deleted!",
				"delete-all": "Delete All",
				"error-combining-polygons": "Error combining polygons",
				"multi-polygon-copied": "MultiPolygon copied successfully!",
				"clipboard-empty": "No polygons found in clipboard",
				"clipboard-paste-success": "polygons pasted!",
				"clipboard-invalid": "No valid polygons in clipboard",
				"select-only-one": "Select only one feature",
				"wkt-import-error": "Error importing WKT. Please check the format.",
				"invalid-wkt": "Please paste or write a valid WKT.",
				"all-deleted": "All features deleted",
				"settings": "Settings",
				"import-tab": "Import",
				"settings-tab": "Settings",
				"layer-satellite": "Satellite",
				"layer-streets": "Streets"
			},
			"pt": {
				"import": "Importar",
				"clear-selection": "Limpar seleção",
				"copy-selected": "Copiar",
				"show-area": "Mostrar área",
				"persistent-objects": "Manter objetos",
				"multi-select": "Multi-seleção (Ctrl+Clique)",
				"union-multi-select": "Unir multi-seleção",
				"close": "Fechar",
				"textarea-placeholder": "Cole ou importe um WKT aqui...",
				"wkt-imported": "WKT importado com sucesso!",
				"no-common-area": "Não há área comum entre os elementos selecionados",
				"copied": "Copiado!",
				"all-deselected": "Todos os elementos desmarcados",
				"change-layer": "Alterar camada...",
				"center-objects": "Centrar nos objetos do mapa...",
				"center-location": "Centrar na minha localização...",
				"undo": "Desfazer",
				"redo": "Refazer",
				"polygon": "Polígono",
				"showinfo": "Mostrar informações",
				"delete": "Eliminar",
				"select": "Selecionar",
				"language": "Idioma",
				"zoom-btn": "Zoom",
				"copy-btn": "Copiar",
				"delete-btn": "Eliminar",
				"wkt-copied": "WKT copiado!",
				"wkt-deleted": "WKT eliminado!",
				"delete-all": "Eliminar tudo",
				"error-combining-polygons": "Erro ao combinar polígonos",
				"multi-polygon-copied": "MultiPolígono copiado com sucesso!",
				"clipboard-empty": "Nenhum polígono encontrado",
				"clipboard-paste-success": "polígonos colados!",
				"clipboard-invalid": "Nenhum polígono válido",
				"select-only-one": "Selecione apenas um elemento",
				"wkt-import-error": "Erro ao importar WKT. Verifique o formato.",
				"invalid-wkt": "Por favor, cole ou escreva um WKT válido.",
				"all-deleted": "Todos os elementos eliminados",
				"settings": "Definições",
				"import-tab": "Importar",
				"settings-tab": "Definições",
				"layer-satellite": "Satélite",
				"layer-streets": "Ruas"
			},
			"es": {
				"import": "Importar",
				"clear-selection": "Deseleccionar",
				"copy-selected": "Copiar",
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
				"language": "Idioma",
				"zoom-btn": "Zoom",
				"copy-btn": "Copiar",
				"delete-btn": "Eliminar",
				"wkt-copied": "¡WKT copiado!",
				"wkt-deleted": "¡WKT eliminado!",
				"delete-all": "Eliminar todo",
				"error-combining-polygons": "Error al combinar polígonos",
				"multi-polygon-copied": "¡MultiPolígono copiado con éxito!",
				"clipboard-empty": "Ningún polígono encontrado",
				"clipboard-paste-success": "polígonos pegados!",
				"clipboard-invalid": "Ningún polígono válido",
				"select-only-one": "Selecciona solo una feature",
				"wkt-import-error": "Error al importar WKT. Verifique el formato.",
				"invalid-wkt": "Por favor, pega o escribe un WKT válido.",
				"all-deleted": "Todas las features eliminadas",
				"settings": "Ajustes",
				"import-tab": "Importar",
				"settings-tab": "Ajustes",
				"layer-satellite": "Satélite",
				"layer-streets": "Calles"
			},
			"fr": {
				"import": "Importer",
				"clear-selection": "Désélectionner",
				"copy-selected": "Copier",
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
				"language": "Langue",
				"zoom-btn": "Zoom",
				"copy-btn": "Copier",
				"delete-btn": "Supprimer",
				"wkt-copied": "WKT copié !",
				"wkt-deleted": "WKT supprimé !",
				"delete-all": "Supprimer tout",
				"error-combining-polygons": "Erreur lors de la combinaison des polygones",
				"multi-polygon-copied": "MultiPolygone copié avec succès !",
				"clipboard-empty": "Aucun polygone trouvé",
				"clipboard-paste-success": "polygones collés !",
				"clipboard-invalid": "Aucun polygone valide",
				"select-only-one": "Sélectionnez une seule feature",
				"wkt-import-error": "Erreur lors de l'importation WKT. Vérifiez le format.",
				"invalid-wkt": "Veuillez coller ou écrire un WKT valide.",
				"all-deleted": "Toutes les features supprimées",
				"settings": "Paramètres",
				"import-tab": "Importer",
				"settings-tab": "Paramètres",
				"layer-satellite": "Satellite",
				"layer-streets": "Rues"
			}
		};

		this.setLanguage(this.#currentLang);

		this.#startDomObserver();
	}

	#detectLanguage() {
		const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
		if (lang.startsWith('pt')) return 'pt';
		if (lang.startsWith('es')) return 'es';
		if (lang.startsWith('fr')) return 'fr';
		if (lang.startsWith('en')) return 'en';
		
		return this.#defaultLang;
	}

	get(key, element = null, fallback = key) {
		let text =
			this.#translations[this.#currentLang]?.[key] ??
			this.#translations[this.#defaultLang]?.[key];

		// If missing → use fallback and auto-register it
		if (text === undefined) {
			text = fallback;

			// Ensure default language object exists
			this.#translations[this.#defaultLang] ??= {};

			// Add only if not already present
			if (!(key in this.#translations[this.#defaultLang])) {
				this.#translations[this.#defaultLang][key] = text;
			}

			// Optional: also add to current language (faster next time)
			if (this.#currentLang !== this.#defaultLang) {
				this.#translations[this.#currentLang] ??= {};
				this.#translations[this.#currentLang][key] = text;
			}
		}

		// DOM element auto-update
		if (element && element instanceof Element) {
			if (!element.hasAttribute('data-i18n')) {
				element.setAttribute('data-i18n', key);
			}
			this.#trackedElements.set(element, key);

			if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(element.tagName)) {
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

	f(k, def) {
		return this.get(k, null, def);
	}

	t(key, element = null, fallback = key) {
		return this.get(key, element, fallback);
	}

	set(key, element) {
		element.setAttribute('data-i18n', key);
		element.setAttribute('data-i18n-title', key);
	}

	setLanguage(lang) {
		if (!this.#translations[lang]) {
			console.warn(`Language "${lang}" not found. Using ${this.#defaultLang}`);
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

	getCurrentTranslations() {
		return this.#translations[this.#currentLang];
	}

	scanAndTranslateNewElements() {
		// 1. Elementos com data-i18n (texto, value, etc)
		document.querySelectorAll('[data-i18n]:not([data-i18n-translated])').forEach(el => {
			const key = el.getAttribute('data-i18n');
			if (key) {
				const text = this.get(key);
				if (['INPUT', 'BUTTON', 'TEXTAREA'].includes(el.tagName)) {
					el.value = text;
				} else {
					el.textContent = text;
				}
				el.setAttribute('data-i18n-translated', 'true'); // marca como já traduzido
			}
		});

		// 2. Placeholder
		document.querySelectorAll('[data-i18n-placeholder]:not([data-i18n-ph-translated])').forEach(el => {
			const key = el.getAttribute('data-i18n-placeholder');
			if (key) {
				el.placeholder = this.get(key);
				el.setAttribute('data-i18n-ph-translated', 'true');
			}
		});

		// 3. Title / tooltip
		document.querySelectorAll('[data-i18n-title]:not([data-i18n-title-translated])').forEach(el => {
			const key = el.getAttribute('data-i18n-title');
			if (key) {
				el.title = this.get(key);
				el.setAttribute('data-i18n-title-translated', 'true');
			}
		});
	}

	#startDomObserver() {
		const observer = new MutationObserver((mutations) => {
			let needsScan = false;
			for (const mutation of mutations) {
				if (mutation.addedNodes.length > 0) {
					needsScan = true;
					break;
				}
			}
			if (needsScan) {
				// Pequeno delay pra dar tempo do elemento ser renderizado
				requestAnimationFrame(() => {
					this.scanAndTranslateNewElements();
				});
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		// Também roda uma vez no início (caso já tenha elementos)
		requestAnimationFrame(() => this.scanAndTranslateNewElements());
	}

}