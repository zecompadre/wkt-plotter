export class Translation {
    constructor() {
        this.language = navigator.language.split('-')[0] || 'en';
        this.translations = {
            en: { changebutton: "Change layer...", centerobjects: "Center on map objects...", centeronmylocation: "Center in my location...", redo: 'Redo...', undo: 'Undo...', polygon: 'Polygon', showinfo: "Show information", delete: 'Delete', select: 'Select' },
            fr: { changebutton: "Changer de couche...", centerobjects: "Centrer sur les objets de la carte...", centeronmylocation: "Centrer sur ma position...", redo: 'Refaire...', undo: 'Annuler...', polygon: 'Polygone', showinfo: "Afficher les informations", delete: 'Supprimer', select: 'Sélectionner' },
            es: { changebutton: "Cambiar capa...", centerobjects: "Centrar en objetos del mapa...", centeronmylocation: "Centrar en mi ubicación...", redo: 'Rehacer...', undo: 'Deshacer...', polygon: 'Polígono', showinfo: "Mostrar información", delete: 'Eliminar', select: 'Seleccionar' },
            pt: { changebutton: "Alterar camada...", centerobjects: "Centralizar em objetos no mapa...", centeronmylocation: "Centralizar na minha localização...", redo: 'Refazer...', undo: 'Desfazer...', polygon: 'Polígono', showinfo: "Mostrar informações", delete: 'Excluir', select: 'Selecionar' }
        };
        this.setLanguage(this.language);
    }

    setLanguage(lang) {
        this.language = this.translations[lang] ? lang : 'en';
        this.updateContent();
    }

    get(key) {
        return this.translations[this.language]?.[key] || key;
    }

    updateContent() {
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            el.textContent = this.get(key);
        });
    }

    getCurrentLanguage() {
        return this.language;
    }
}