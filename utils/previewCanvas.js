// js/utils/previewCanvas.js
// Função única e reutilizável para desenhar preview de polígonos
// js/utils/previewCanvas.js
export function drawShapePreview(canvas, feature) {
	if (!canvas || !feature) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	// Limpa o canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Fundo preto (como na tua imagem)
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Usa uma cópia da geometria já transformada para mercator
	const geom = feature.getGeometry().clone();
	geom.transform('EPSG:4326', 'EPSG:3857');
	const extent = geom.getExtent();

	// Evita polígonos gigantes ou minúsculos
	if (!ol.extent.isEmpty(extent)) {
		// Cores bonitas e visíveis
		ctx.strokeStyle = '#10b981';     // verde neon
		ctx.lineWidth = 2.5;
		ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';

		// Extrai coordenadas
		let rings = [];
		if (geom.getType() === 'Polygon') {
			rings = geom.getCoordinates();
		} else if (geom.getType() === 'MultiPolygon') {
			rings = geom.getCoordinates().flat(1);
		}

		// Calcula escala e offset
		const padding = 12;
		const worldW = extent[2] - extent[0] || 1;
		const worldH = extent[3] - extent[1] || 1;
		const scaleX = (canvas.width - padding * 2) / worldW;
		const scaleY = (canvas.height - padding * 2) / worldH;
		const scale = Math.min(scaleX, scaleY);

		const offsetX = padding - extent[0] * scale + (canvas.width - worldW * scale) / 2;
		const offsetY = padding - extent[3] * scale + (canvas.height - worldH * scale) / 2;

		// Desenha todos os anéis
		rings.forEach(ring => {
			ctx.beginPath();
			ring.forEach((coord, i) => {
				const x = (coord[0] - extent[0]) * scale + padding;
				const y = canvas.height - ((coord[1] - extent[1]) * scale + padding);
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			});
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		});

		// Ponto central amarelo
		const center = ol.extent.getCenter(extent);
		const cx = (center[0] - extent[0]) * scale + padding;
		const cy = canvas.height - ((center[1] - extent[1]) * scale + padding);

		ctx.fillStyle = '#fbbf24';
		ctx.beginPath();
		ctx.arc(cx, cy, 4, 0, Math.PI * 2);
		ctx.fill();
	}
}