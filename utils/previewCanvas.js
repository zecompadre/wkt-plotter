// js/utils/previewCanvas.js
export function drawShapePreview(canvas, feature, map) {
	if (!canvas || !feature || !map) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const geom = feature.getGeometry();
	const extent = geom.getExtent();
	const size = [canvas.width, canvas.height];

	// 1. Renderiza o mapa real no canvas (com o mesmo view!)
	const view = map.getView();
	const resolution = view.getResolutionForExtent(extent, size);
	const center = ol.extent.getCenter(extent);

	// Cria um view temporário para o preview
	const tempView = new ol.View({
		center: center,
		resolution: resolution * 1.3, // zoom um pouco mais fora
		projection: view.getProjection()
	});

	// Renderiza todas as layers visíveis
	map.getLayers().forEach(layer => {
		if (layer.getVisible()) {
			map.renderSync(); // força render
			layer.render(tempView, ctx, size);
		}
	});

	// 2. Desenha o polígono por cima (highlight verde)
	ctx.strokeStyle = '#10b981';
	ctx.lineWidth = 3;
	ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';

	const coordinates = geom.getType() === 'Polygon'
		? geom.getCoordinates()[0]
		: geom.getCoordinates().flat(2);

	const pixelCoords = coordinates.map(coord =>
		map.getPixelFromCoordinate(coord)
	);

	ctx.beginPath();
	pixelCoords.forEach((pixel, i) => {
		if (i === 0) ctx.moveTo(pixel[0], pixel[1]);
		else ctx.lineTo(pixel[0], pixel[1]);
	});
	ctx.closePath();
	ctx.fill();
	ctx.stroke();

	// 3. Ponto central amarelo
	const centerPixel = map.getPixelFromCoordinate(center);
	ctx.fillStyle = '#fbbf24';
	ctx.beginPath();
	ctx.arc(centerPixel[0], centerPixel[1], 5, 0, Math.PI * 2);
	ctx.fill();
}