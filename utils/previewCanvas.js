// js/utils/previewCanvas.js
export function drawShapePreview(canvas, feature) {
	if (!canvas || !feature) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	// Limpa tudo
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Fundo preto (como na tua imagem)
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Usa geometria já em mercator (correto!)
	const geom = feature.getGeometry();
	const extent = geom.getExtent();

	// Evita erro se extent for inválido
	if (ol.extent.isEmpty(extent)) return;

	// Cores finais (exatamente como queres)
	ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';   // verde com transparência
	ctx.strokeStyle = '#10b981';                // verde neon
	ctx.lineWidth = 3;

	// Extrai coordenadas corretas
	let coordinates = [];
	if (geom.getType() === 'Polygon') {
		coordinates = geom.getCoordinates()[0];
	} else if (geom.getType() === 'MultiPolygon') {
		coordinates = geom.getCoordinates()[0][0]; // primeiro anel do primeiro polígono
	} else {
		return; // não suportado
	}

	// Calcula escala e offset (PERFEITO!)
	const padding = 12;
	const worldWidth = extent[2] - extent[0];
	const worldHeight = extent[3] - extent[1];
	const scaleX = (canvas.width - padding * 2) / worldWidth;
	const scaleY = (canvas.height - padding * 2) / worldHeight;
	const scale = Math.min(scaleX, scaleY);

	const offsetX = padding + (canvas.width - worldWidth * scale) / 2 - extent[0] * scale;
	const offsetY = padding + (canvas.height - worldHeight * scale) / 2 - extent[3] * scale;

	// Desenha o polígono
	ctx.beginPath();
	coordinates.forEach((coord, i) => {
		const x = coord[0] * scale + offsetX;
		const y = canvas.height - (coord[1] * scale + offsetY);
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
	ctx.closePath();
	ctx.fill();
	ctx.stroke();

	// Ponto central (amarelo)
	const center = ol.extent.getCenter(extent);
	const cx = center[0] * scale + offsetX;
	const cy = canvas.height - (center[1] * scale + offsetY);

	ctx.fillStyle = '#fbbf24';
	ctx.beginPath();
	ctx.arc(cx, cy, 4, 0, Math.PI * 2);
	ctx.fill();
}