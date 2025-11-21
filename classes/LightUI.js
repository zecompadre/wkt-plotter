export class LightUI {
    constructor() {
        this.initSelects();
    }

    initSelects() {
        document.querySelectorAll('.ui-select').forEach(select => {
            select.addEventListener('change', (e) => {
                console.log(`Selected value: ${e.target.value}`);
            });
        });
    }
}