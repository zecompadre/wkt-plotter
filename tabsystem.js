export default class TabSystem {
	constructor(container) {
		this.container = container;
		this.buttons = container.querySelectorAll('.tab-buttons button');
		this.panes = container.querySelectorAll('.tab-pane');

		this.addEventListeners();
	}

	addEventListeners() {
		this.buttons.forEach(button => {
			button.addEventListener('click', () => this.showTab(button));
		});
	}

	showTab(button) {
		// Remove active class from all buttons and panes
		this.buttons.forEach(btn => btn.classList.remove('active'));
		this.panes.forEach(pane => pane.classList.remove('active'));

		// Add active class to the clicked button and the corresponding pane
		button.classList.add('active');
		const targetPane = this.container.querySelector(`#${button.dataset.tab}`);
		if (targetPane) targetPane.classList.add('active');
	}
}
