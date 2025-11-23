// js/utils/previewCanvas.js
// Função única e reutilizável para desenhar preview de polígonos

export function drawShapePreview(canvas, feature) {
	if (!canvas || !feature) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const geom = feature.getGeometry();
	const extent = geom.getExtent();

	// Limpa e define fundo
	ctx.fillStyle = '#0f172a';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Fundo do "mapa"
	ctx.fillStyle = '#1e293b';
	ctx.fillRect(6, 6, canvas.width - 12, canvas.height - 12);

	// Cores visíveis
	ctx.strokeStyle = '#10b981';     // verde neon
	ctx.lineWidth = 3;
	ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';

	// Extrai coordenadas
	const coords = geom.getType() === 'Polygon'
		? geom.getCoordinates()[0]
		: geom.getCoordinates().flat(2);

	// Calcula escala e offset
	const worldW = extent[2] - extent[0];
	const worldH = extent[3] - extent[1];
	const scaleX = (canvas.width - 24) / worldW;
	const scaleY = (canvas.height - 24) / worldH;
	const scale = Math.min(scaleX, scaleY);

	const offsetX = 12 - extent[0] * scale + (canvas.width - worldW * scale) / 2;
	const offsetY = 12 - extent[3] * scale + (canvas.height - worldH * scale) / 2;

	// Desenha o polígono
	ctx.beginPath();
	coords.forEach((ring, i) => {
		if (i === 0) {
			ctx.moveTo(ring[0] * scale + offsetX, canvas.height - (ring[1] * scale + offsetY));
		}
		for (let j = 1; j < ring.length; j++) {
			ctx.lineTo(ring[j][0] * scale + offsetX, canvas.height - (ring[j][1] * scale + offsetY));
		}
		ctx.closePath();
	});
	ctx.fill();
	ctx.stroke();

	// Ponto central
	const center = ol.extent.getCenter(extent);
	const cx = center[0] * scale + offsetX;
	const cy = canvas.height - (center[1] * scale + offsetY);
	ctx.fillStyle = '#fbbf24';
	ctx.beginPath();
	ctx.arc(cx, cy, 5, 0, Math.PI * 2);
	ctx.fill();
}