export class TabSystem {
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
        this.buttons.forEach(btn => btn.classList.remove('active'));
        this.panes.forEach(pane => pane.classList.remove('active'));
        button.classList.add('active');
        const targetPane = this.container.querySelector(`#${button.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
    }
}