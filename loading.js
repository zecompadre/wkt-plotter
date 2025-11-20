/**
 * Class representing a loading overlay with animated bouncing dots.
 */
export default class Loading {
	/**
	 * Creates an instance of the Loading class.
	 * @param {Object} [options={}] - Configuration options for the loading overlay.
	 * @param {number} [options.dotCount=4] - Number of dots in the loading animation.
	 * @param {number} [options.dotSize=15] - Size of each dot in pixels.
	 * @param {number} [options.dotGap=10] - Gap between dots in pixels.
	 * @param {number} [options.animationDuration=1.4] - Duration of the bounce animation in seconds.
	 */
	constructor({
		dotCount = 4,
		dotSize = 15,
		dotGap = 10,
		animationDuration = 1.4
	} = {}) {
		/**
		 * Colors used for the dots.
		 * @type {string[]}
		 * @private
		 */
		this.colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

		/**
		 * Overlay element for the loading screen.
		 * @type {HTMLDivElement}
		 * @private
		 */
		this.overlay = document.createElement('div');
		Object.assign(this.overlay.style, {
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 1000,
			opacity: 0,
			transition: 'opacity 0.3s',
		});

		/**
		 * Container element for the dots.
		 * @type {HTMLDivElement}
		 * @private
		 */
		this.dotsContainer = document.createElement('div');
		Object.assign(this.dotsContainer.style, {
			display: 'flex',
			gap: `${dotGap}px`,
		});

		/**
		 * Array of dot elements.
		 * @type {HTMLDivElement[]}
		 * @private
		 */
		this.dots = [];
		for (let i = 0; i < dotCount; i++) {
			const dot = document.createElement('div');
			Object.assign(dot.style, {
				width: `${dotSize}px`,
				height: `${dotSize}px`,
				backgroundColor: this.colors[i % this.colors.length],
				borderRadius: '50%',
				animation: `bounce ${animationDuration}s ease-in-out infinite`,
				animationDelay: `${i * 0.2}s`,
			});
			this.dots.push(dot);
			this.dotsContainer.appendChild(dot);
		}

		// Add keyframe animation for bouncing dots
		const styleSheet = document.createElement('style');
		styleSheet.type = 'text/css';
		styleSheet.innerText = `
			@keyframes bounce {
				0%, 80%, 100% { transform: scale(0); }
				40% { transform: scale(1); }
			}
		`;
		document.head.appendChild(styleSheet);

		// Append dots container to overlay
		this.overlay.appendChild(this.dotsContainer);

		/**
		 * Visibility status of the overlay.
		 * @type {boolean}
		 * @private
		 */
		this.isVisible = false;
	}

	/**
	 * Shows the loading overlay.
	 */
	show() {
		if (this.isVisible) return;
		document.body.appendChild(this.overlay);
		requestAnimationFrame(() => {
			this.overlay.style.opacity = 1;
		});
		this.isVisible = true;
	}

	/**
	 * Hides the loading overlay.
	 */
	hide() {
		if (!this.isVisible) return;
		this.overlay.style.opacity = 0;
		this.overlay.addEventListener('transitionend', () => {
			if (this.overlay.parentNode) {
				document.body.removeChild(this.overlay);
			}
		}, {
			once: true
		});
		this.isVisible = false;
	}
}
