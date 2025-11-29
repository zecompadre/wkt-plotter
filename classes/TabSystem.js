// js/classes/TabSystem.js

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
		// Remove active de todos os botões e painéis
		this.buttons.forEach(btn => btn.classList.remove('active'));
		this.panes.forEach(pane => pane.classList.remove('active'));

		// Ativa o botão clicado
		button.classList.add('active');

		// Ativa o painel correspondente
		const targetPaneId = button.getAttribute('data-tab');
		const targetPane = this.container.querySelector(`#${targetPaneId}`);
		if (targetPane) {
			targetPane.classList.add('active');
		}
	}

	showTabById(tabId) {
		const button = this.container.querySelector(`.tab-buttons button[data-tab="${tabId}"]`);
		if (button) {
			this.showTab(button);
		}
	}
}