export function drawShapePreview(canvas, feature) {
	if (!canvas || !feature) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	// Limpa o canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Fundo preto puro (como na tua imagem)
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const geom = feature.getGeometry();
	const extent = geom.getExtent();

	if (ol.extent.isEmpty(extent)) return;

	// Extrai coordenadas corretas (Polygon ou MultiPolygon)
	let coordinates = [];
	if (geom.getType() === 'Polygon') {
		coordinates = geom.getCoordinates()[0];
	} else if (geom.getType() === 'MultiPolygon') {
		// Usa o primeiro polígono do primeiro MultiPolygon
		coordinates = geom.getCoordinates()[0][0];
	} else {
		return;
	}

	// Cálculo PERFEITO de escala e offset
	const padding = 14;
	const worldWidth = extent[2] - extent[0];
	const worldHeight = extent[3] - extent[1];

	const scaleX = (canvas.width - padding * 2) / worldWidth;
	const scaleY = (canvas.height - padding * 2) / worldHeight;
	const scale = Math.min(scaleX, scaleY);

	// Centraliza perfeitamente
	const offsetX = padding + (canvas.width - worldWidth * scale) / 2 - extent[0] * scale;
	const offsetY = padding + (canvas.height - worldHeight * scale) / 2 - extent[3] * scale;

	// Verde neon + preenchimento (exatamente como na tua foto)
	ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
	ctx.strokeStyle = '#10b981';
	ctx.lineWidth = 2.5;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';

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

	// Triângulo pequeno no centro (como na tua foto!)
	const center = ol.extent.getCenter(extent);
	const cx = center[0] * scale + offsetX;
	const cy = canvas.height - (center[1] * scale + offsetY);

	ctx.fillStyle = '#10b981';
	ctx.beginPath();
	ctx.moveTo(cx, cy - 8);
	ctx.lineTo(cx - 6, cy + 4);
	ctx.lineTo(cx + 6, cy + 4);
	ctx.closePath();
	ctx.fill();
}