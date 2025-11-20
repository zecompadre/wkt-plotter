export default class LightUI {
	constructor() {
		this.initSelects();
	}

	// Enhance native selects
	initSelects() {
		document.querySelectorAll('.ui-select').forEach(select => {
			// Optional: Add additional behaviors or logging if needed
			select.addEventListener('change', (e) => {
				console.log(`Selected value: ${e.target.value}`);
			});
		});
	}
}
