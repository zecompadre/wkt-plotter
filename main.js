document.addEventListener('DOMContentLoaded', ready)
var savedShapesChildren = null,
	selectedLayer = null,
	input = null,
	userPickedColor = document.querySelector('#color>option').value,
	autoChangeColor = false,
	userPickedCoordinateSystem = null
function ready() {
	document.getElementById('btnImport').addEventListener('click', importShape)
	document.getElementById('btnClear').addEventListener('click', clearShapes)
	document.getElementById('btnZoomToFit').addEventListener('click', zoomToFit)
	savedShapesChildren = document.getElementById('savedShapesChildrenContainer')
	map.addEventListener('baselayerchange', function (_0x26e608) {
		selectedLayer = _0x26e608.layer
	})
	input = document.getElementById('txtInputGeometry')


	return;

	let _0x1a430e = document.querySelector('.tab-page'),
		_0x31e26d = _0x1a430e.querySelectorAll('.tab')
	_0x31e26d.forEach(function (_0x235275) {
		_0x235275.addEventListener('click', switchTab)
	})
	document
		.querySelector('#hiddenFileUploadContainer>input[type="file"]')
		.addEventListener('change', readFile)
	document
		.querySelector('#triggerCsvFileUpload')
		.addEventListener('click', function (_0x4ac845) {
			_0x4ac845.preventDefault()
			document
				.querySelector('#hiddenFileUploadContainer>input[type="file"]')
				.click(_0x4ac845)
		})
	document
		.getElementById('chckAutoChangeColor')
		.addEventListener('change', (_0xb80fdf) => {
			_0xb80fdf.preventDefault()
			document.getElementById('chckAutoChangeColor').checked
				? ((autoChangeColor = true),
					(document.getElementById('color').disabled = true),
					document
						.getElementById('labelForColor')
						.classList.remove('text-white'),
					document
						.getElementById('labelForColor')
						.classList.add('text-gray-300'))
				: ((autoChangeColor = false),
					(document.getElementById('color').disabled = false),
					document.getElementById('labelForColor').classList.add('text-white'),
					document
						.getElementById('labelForColor')
						.classList.remove('text-gray-300'))
		})
	document.getElementById('color').addEventListener('click', (_0x26ca7f) => {
		_0x26ca7f.preventDefault()
		let _0x155d33 = document.getElementById('color')
		_0x155d33.classList.remove('bg-blue-400')
		_0x155d33.style.backgroundColor =
			_0x155d33.options[_0x155d33.selectedIndex].value
	})
	document
		.querySelector('#coordinateSystem')
		.addEventListener('click', function (_0xf13df) {
			_0xf13df.preventDefault()
			let _0x5d6d96 = document.getElementById('coordinateSystem')
			userPickedCoordinateSystem =
				_0x5d6d96.options[_0x5d6d96.selectedIndex].value
		})
}
let tabsContainer = document.querySelector('.tab-page'),
	tabTogglers = tabsContainer.querySelectorAll('.tab')
function switchTab(_0x147138) {
	_0x147138.preventDefault()
	let _0x5e2926 = this.getAttribute('href'),
		_0x2e54e0 = document.querySelector('#controls')
	_0x2e54e0 = _0x2e54e0.querySelectorAll('.tabPage')
	for (let _0x498c26 = 0; _0x498c26 < _0x2e54e0.length; _0x498c26++) {
		tabTogglers[_0x498c26].classList.remove(
			'text-blue-600',
			'bg-gray-100',
			'rounded-t',
			'active',
			'dark:bg-gray-800',
			'dark:text-blue-500'
		)
		_0x2e54e0[_0x498c26].classList.remove('hidden')
		if (_0x2e54e0[_0x498c26].id === _0x5e2926) {
			continue
		}
		_0x2e54e0[_0x498c26].classList.add('hidden')
	}
	_0x147138.target.classList.add(
		'text-blue-600',
		'bg-gray-100',
		'rounded-t',
		'active',
		'dark:bg-gray-800',
		'dark:text-blue-500'
	)
}
async function showAlert(_0x2de110, _0x1b1204, _0x200773) {
	let _0x3f8f2b = $('#notification-banner'),
		_0x12e80a = $('#notification-banner>strong'),
		_0x4ebcd8 = $('#notification-banner>span'),
		_0x6c7a90 = document.getElementById('txtInputGeometry')
	_0x2de110 === 'error'
		? (_0x3f8f2b.className =
			'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative')
		: (_0x3f8f2b.className =
			'bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative')
	_0x12e80a.text(_0x1b1204)
	_0x4ebcd8.text(_0x200773)
	_0x3f8f2b.show()
	const _0x21db76 = new Promise((_0x1d8fb3) =>
		$('#txtInputGeometry').on('change keyup paste', function () {
			_0x3f8f2b.fadeOut(200)
		})
	),
		_0x18d9b4 = new Promise((_0x43bf6e) =>
			setTimeout(function () {
				_0x3f8f2b.fadeOut(400)
			}, 4000)
		)
	await Promise.race([_0x21db76, _0x18d9b4])
}
function readFile() {
	let _0x10ba18 = document.querySelector(
		'#hiddenFileUploadContainer>input[type="file"]'
	)
	const _0x1cbba2 = new FileReader()
	_0x1cbba2.onload = () => {
		console.log(_0x1cbba2.result)
	}
	_0x1cbba2.readAsText(_0x10ba18.files[0])
}
function importShape(_0x318dc5) {
	_0x318dc5.preventDefault()
	if (input.value.includes('{')) {
		try {
			inputJson = JSON.parse(input.value)
			Array.isArray(inputJson)
				? importMultipleGeoJsonShapes(inputJson)
				: ((inputJson = normalize(inputJson)),
					importMultipleGeoJsonShapes(inputJson.features))
		} catch (_0x87b111) {
			showAlert('error', 'Error', _0x87b111.message)
		}
	} else {
		input.value.includes('(')
			? ((result = parseMultipleWktFromInput(input.value)),
				result.forEach((_0x40d155) => addWktToMap(_0x40d155)))
			: showAlert('error', '', 'Could not interpret input')
	}
}
function parseMultipleWktFromInput(_0x55053e) {
	let _0x46a724 = [],
		_0x8674df = '',
		_0x4034a0 = 0
	function _0x41b889() {
		if (_0x8674df) {
			_0x46a724.push(_0x8674df)
		}
		_0x8674df = ''
	}
	for (
		let _0x571984 = 0, _0x3fdbd5;
		(_0x3fdbd5 = _0x55053e[_0x571984]), _0x571984 < _0x55053e.length;
		_0x571984++
	) {
		if (!_0x4034a0 && _0x3fdbd5 === ',') {
			_0x41b889()
		} else {
			_0x8674df += _0x3fdbd5
			if (_0x3fdbd5 === '(') {
				_0x4034a0++
			}
			if (_0x3fdbd5 === ')') {
				_0x4034a0--
			}
		}
	}
	return _0x41b889(), _0x46a724
}
function importMultipleGeoJsonShapes(_0x77f69f) {
	_0x77f69f.forEach((_0x32fde9) => {
		feature = transformGeoJsonToFeature(_0x32fde9)
		addGeoJsonFeatureToMap(feature)
		addFeatureToList(_0x32fde9, feature)
	})
}
function clearShapes(_0x4601f8) {
	_0x4601f8.preventDefault()
	let _0x166038 = 0
	shapeLayer.eachLayer(function () {
		_0x166038 += 1
	})
	if (_0x166038 > 0) {
		const _0x1d8868 = confirm('Clear all shapes?')
		_0x1d8868 &&
			(shapeLayer.clearLayers(), (savedShapesChildren.innerHTML = ''))
	}
}
function zoomToFit(_0x5429ec) {
	_0x5429ec.preventDefault()
	var _0x126366 = shapeLayer.getBounds()
	map.fitBounds(_0x126366)
}
const shapeLayer = L.featureGroup(),
	mbAttr =
		'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery \xA9 <a href="https://www.mapbox.com/">Mapbox</a>',
	mbUrl =
		'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
var Esri_WorldImagery = L.tileLayer(
	'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
	{
		attribution:
			'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
	}
)
const streets = L.tileLayer(mbUrl, {
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1,
	attribution: mbAttr,
}),
	osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution:
			'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	})
selectedLayer = osm
const map = L.map('map', {
	center: [52.588032137196755, 13.215179443359373],
	zoom: 10,
	layers: [osm, shapeLayer],
}),
	baseLayers = {
		OpenStreetMap: osm,
		Streets: streets,
		'Esri Sattelite': Esri_WorldImagery,
	},
	overlays = { 'Show shapes': shapeLayer },
	layerControl = L.control.layers(baseLayers, overlays).addTo(map),
	satellite = L.tileLayer(mbUrl, {
		id: 'mapbox/satellite-v9',
		tileSize: 512,
		zoomOffset: -1,
		attribution: mbAttr,
	})
layerControl.addBaseLayer(satellite, 'Satellite')
var wkt = new Wkt.Wkt(),
	featureGroup = L.featureGroup(),
	wkt_geom_example =
		'POLYGON((13.215179443359373 52.588032137196755,13.42803955078125 52.592620721000365,13.454132080078125 52.46897854656702,13.347015380859375 52.45893824522763,13.215179443359373 52.588032137196755))',
	wkt_geom2_example = 'POINT((13.215179443359373 52.588032137196755))'
function addWktToMap(_0x6dfc70) {
	var _0x3cd868 = transformWktToLeafletfeature(_0x6dfc70)
	!_0x3cd868
		? showAlert('error', 'Error', 'Could not read WKT string')
		: ((input.value = ''),
			(feature = transformGeoJsonToFeature(_0x3cd868)),
			addGeoJsonFeatureToMap(feature),
			addFeatureToList(_0x3cd868, feature))
}
function transformGeoJsonToFeature(_0x190de5) {
	return (
		(color = getColor()),
		userPickedCoordinateSystem !== 'epsg4326' &&
		(_0x190de5.geometry.coordinates = transformCoordinateListRecursively(
			_0x190de5.geometry.coordinates
		)),
		console.log(
			'Your imported Geometry as GeoJSON (in WGS84): ',
			'\n',
			_0x190de5
		),
		(feature = L.geoJSON(_0x190de5, { color: color })),
		feature
	)
}
function addGeoJsonFeatureToMap(_0x504a33) {
	_0x504a33.addTo(shapeLayer)
	map.panTo(_0x504a33.getBounds().getCenter())
	map.fitBounds(_0x504a33.getBounds())
}
function zoomToFeature(_0x220256, _0xe5fe08) {
	alert(JSON.stringify(_0xe5fe08))
	map.panTo(_0x220256)
	map.fitBounds(_0xe5fe08)
}
function transformCoordinateListRecursively(_0x4231c8) {
	return (
		Array.isArray(_0x4231c8[0])
			? _0x4231c8.forEach((_0x227a58, _0x376dfe) => {
				_0x4231c8[_0x376dfe] = transformCoordinateListRecursively(_0x227a58)
			})
			: userPickedCoordinateSystem === 'epsg31370' &&
			(_0x4231c8 = lambert72toWGS84(_0x4231c8[0], _0x4231c8[1])),
		_0x4231c8
	)
}
function transformWktToLeafletfeature(_0x213f09) {
	var _0x1e3528 = new Wkt.Wkt()
	try {
		_0x1e3528.read(_0x213f09)
		var _0x296800 = _0x1e3528.toJson()
	} catch (_0x25f998) { }
	if (!_0x296800) {
		return null
	}
	var _0x46dde6 = {
		type: 'Feature',
		properties: { popupContent: 'Your imported polygon/point' },
		geometry: _0x296800,
	}
	return _0x46dde6
}
function getColor() {
	if (!autoChangeColor) {
		return (
			(select = document.querySelector('#color')),
			(userPickedColor = select.options[select.selectedIndex].value),
			userPickedColor
		)
	} else {
		let _0x4b8b83 = document.querySelectorAll('#color>option'),
			_0x3775d6 = null
		_0x4b8b83.forEach((_0x54c9c9, _0x5502df) => {
			if (_0x54c9c9.value === userPickedColor) {
				_0x3775d6 = _0x5502df
				return
			}
		})
		if (_0x3775d6 !== null && _0x3775d6 < _0x4b8b83.length - 1) {
			return (
				(userPickedColor = _0x4b8b83[_0x3775d6 + 1].value),
				_0x4b8b83[_0x3775d6 + 1].value
			)
		}
		return (userPickedColor = _0x4b8b83[0].value), _0x4b8b83[0].value
	}
}
function lambert72toWGS84(_0x16536b, _0x982134) {
	var _0x5e7a03,
		_0x5aabf7,
		_0x57e1b6 = 149910 - _0x16536b,
		_0x3bb602 = 5400150 - _0x982134,
		_0x3e51d0 = Math.sqrt(_0x57e1b6 * _0x57e1b6 + _0x3bb602 * _0x3bb602),
		_0x2d175e = Math.atan(_0x57e1b6 / -_0x3bb602)
	_0x5e7a03 =
		((0.07604294 + (_0x2d175e + 0.00014204) / 0.77164219) * 180) / Math.PI
	_0x5aabf7 = 0
	for (var _0xa7f45 = 0; _0xa7f45 < 5; ++_0xa7f45) {
		_0x5aabf7 =
			2 *
			Math.atan(
				Math.pow(11565915.84362044 / _0x3e51d0, 1.295937434421516) *
				Math.pow(
					(1 + 0.08199189 * Math.sin(_0x5aabf7)) /
					(1 - 0.08199189 * Math.sin(_0x5aabf7)),
					0.040995945
				)
			) -
			Math.PI / 2
	}
	return (_0x5aabf7 *= 180 / Math.PI), [_0x5e7a03, _0x5aabf7]
}
async function addFeatureToList(_0x2c41f2, _0x1dacdb) {
	let _0x28c5d1 = document.createElement('div')
	_0x28c5d1.className = 'shapeItem flex items-center gap-4 p-4'
	let _0x54fb27 = document.createElement('img')
	_0x54fb27.className = 'w-12 h-12 rounded-full'
	let _0x415c67 = document.createElement('div')
	_0x415c67.className = 'flex flex-col'
	let _0x3a1c2c = document.createElement('strong')
	_0x3a1c2c.className = 'text-slate-900 text-sm font-medium dark:text-slate-200'
	_0x3a1c2c.innerText = _0x2c41f2.geometry.type
	let _0x539616 = document.createElement('span')
	_0x539616.className =
		'coordinatesContainer text-slate-500 text-sm font-medium dark:text-slate-400'
	let _0x20460c = _0x1dacdb.getBounds().getCenter()
	_0x539616.innerText =
		'lat: ' +
		JSON.stringify(1 * _0x20460c.lat.toFixed(10)) +
		' lon: ' +
		JSON.stringify(1 * _0x20460c.lng.toFixed(10))
	_0x415c67.appendChild(_0x3a1c2c)
	_0x415c67.appendChild(_0x539616)
	_0x28c5d1.appendChild(_0x54fb27)
	_0x28c5d1.appendChild(_0x415c67)
	savedShapesChildren.appendChild(_0x28c5d1)
	try {
		createMapImage(_0x54fb27)
	} catch (_0x31f93b) { }
	_0x28c5d1.addEventListener('click', function () {
		map.panTo(_0x1dacdb.getBounds().getCenter())
		map.fitBounds(_0x1dacdb.getBounds())
	})
}
const createMapImage = async (_0x4dd0ae) => {
	const _0x20ab7a = document.getElementById('map'),
		_0x152441 = _0x20ab7a.offsetWidth,
		_0x3b58bd = _0x20ab7a.offsetHeight,
		_0x11180d = new Promise((_0x4a5778) =>
			selectedLayer.on('load', () => _0x4a5778())
		),
		_0x1d3be0 = new Promise((_0x4f5bae) =>
			setTimeout(() => _0x4f5bae('p2'), 2000)
		),
		_0x2cc14c = new Promise((_0x29bd8e) =>
			document.addEventListener('onscroll', () => _0x29bd8e())
		),
		_0x4f7d37 = new Promise((_0x3af904) =>
			document.addEventListener('onMouseOver', () => _0x3af904())
		),
		_0x357b09 = new Promise((_0x1a14f8) =>
			document.addEventListener('onkeydown', () => _0x1a14f8())
		),
		_0x1867b8 = new Promise((_0x4d1e90) =>
			document.addEventListener('click', () => _0x4d1e90())
		)
	await Promise.race([
		_0x11180d,
		_0x1d3be0,
		_0x2cc14c,
		_0x4f7d37,
		_0x357b09,
		_0x1867b8,
	])
	const _0x5c88b3 = await domtoimage.toPng(_0x20ab7a, {
		width: _0x152441,
		height: _0x3b58bd,
	}),
		_0x5b6792 = document.createElement('img')
	_0x4dd0ae.src = _0x5c88b3
}
function getActivelayer(_0x475a2a) {
	var _0x8ae387 = _0x475a2a.currentTarget.layerId,
		_0x105e30 = this['_layers'][_0x8ae387]
	return _0x105e30
}
function sleep(_0xd863da) {
	return new Promise((_0xbcb96b) => setTimeout(_0xbcb96b, _0xd863da))
}
var types = {
	Point: 'geometry',
	MultiPoint: 'geometry',
	LineString: 'geometry',
	MultiLineString: 'geometry',
	Polygon: 'geometry',
	MultiPolygon: 'geometry',
	GeometryCollection: 'geometry',
	Feature: 'feature',
	FeatureCollection: 'featurecollection',
}
function normalize(_0x3ee1dc) {
	if (!_0x3ee1dc || !_0x3ee1dc.type) {
		return null
	}
	var _0x2a75fc = types[_0x3ee1dc.type]
	return _0x2a75fc
		? 'geometry' === _0x2a75fc
			? {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						properties: {},
						geometry: _0x3ee1dc,
					},
				],
			}
			: 'feature' === _0x2a75fc
				? {
					type: 'FeatureCollection',
					features: [_0x3ee1dc],
				}
				: 'featurecollection' === _0x2a75fc
					? _0x3ee1dc
					: void 0
		: null
}
