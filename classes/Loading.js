export class Loading {
    constructor({ dotCount = 4, dotSize = 25, dotGap = 10, animationDuration = 1.4 } = {}) {
        this.colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
        this.overlay = this.createOverlay(dotCount, dotSize, dotGap, animationDuration);
        this.isVisible = false;
    }

    createOverlay(dotCount, dotSize, dotGap, duration) {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            opacity: 0, transition: 'opacity 0.3s'
        });

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = `${dotGap}px`;

        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('div');
            Object.assign(dot.style, {
                width: `${dotSize}px`, height: `${dotSize}px`,
                backgroundColor: this.colors[i % this.colors.length],
                borderRadius: '50%',
                animation: `bounce ${duration}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
            });
            container.appendChild(dot);
        }

        const style = document.createElement('style');
        style.textContent = `@keyframes bounce {0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)}}`;
        document.head.appendChild(style);

        overlay.appendChild(container);
        return overlay;
    }

    show() {
        if (this.isVisible) return;
        document.body.appendChild(this.overlay);
        requestAnimationFrame(() => this.overlay.style.opacity = 1);
        this.isVisible = true;
    }

    hide() {
        if (!this.isVisible) return;
        this.overlay.style.opacity = 0;
        this.overlay.addEventListener('transitionend', () => {
            if (this.overlay.parentNode) document.body.removeChild(this.overlay);
        }, { once: true });
        this.isVisible = false;
    }
}