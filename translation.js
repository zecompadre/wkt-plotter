export default class Translation {
	constructor() {
		this.language = navigator.language || 'en'; // Default to English if no language is detected
		switch (this.language) {
			case 'en-US':
			case 'en-GB':
				this.language = 'en';
				break;
			case 'fr-FR':
			case 'fr':
				this.language = 'fr';
				break;
			case 'es-ES':
			case 'es':
				this.language = 'es';
				break;
			case 'pt-PT':
			case 'pt':
				this.language = 'pt';
				break;
		}

		this.translations = {
			en: {
				changebutton: "Change layer...",
				centerobjects: "Center on map objects...",
				centeronmylocation: "Center in my location...",
				redo: 'Redo...',
				undo: 'Undo...',
				polygon: 'Polygon',
				showinfo: "Show information",
				delete: 'Delete',
				select: 'Select',
			},
			fr: {
				changebutton: "Changer de couche...",
				centerobjects: "Centrer sur les objets de la carte...",
				centeronmylocation: "Centrer sur ma position...",
				redo: 'Refaire...',
				undo: 'Annuler...',
				polygon: 'Polygone',
				showinfo: "Afficher les informations",
				delete: 'Supprimer',
				select: 'Sélectionner',
			},
			es: {
				changebutton: "Cambiar capa...",
				centerobjects: "Centrar en objetos del mapa...",
				centeronmylocation: "Centrar en mi ubicación...",
				redo: 'Rehacer...',
				undo: 'Deshacer...',
				polygon: 'Polígono',
				showinfo: "Mostrar información",
				delete: 'Eliminar',
				select: 'Seleccionar',
			},
			pt: {
				changebutton: "Alterar camada...",
				centerobjects: "Centralizar em objetos no mapa...",
				centeronmylocation: "Centralizar na minha localização...",
				redo: 'Refazer...',
				undo: 'Desfazer...',
				polygon: 'Polígono',
				showinfo: "Mostrar informações",
				delete: 'Excluir',
				select: 'Selecionar',
			}
		};

		this.setLanguage(this.language);
	}

	// Set language and update translations
	setLanguage(lang) {
		this.language = lang;
		this.updateContent();
	}

	// Get translation by key for the current language
	get(key) {
		if (this.translations[this.language] && this.translations[this.language][key]) {
			return this.translations[this.language][key];
		}
		return key; // Return the key itself if no translation is found
	}

	// Update content on the page
	updateContent() {
		const elementsToTranslate = document.querySelectorAll('[data-translate]');
		elementsToTranslate.forEach(element => {
			const key = element.getAttribute('data-translate');
			element.textContent = this.get(key);
		});
	}

	// Get the current language
	getCurrentLanguage() {
		return this.language;
	}
}