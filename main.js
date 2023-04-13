var app = angular.module('myapp', ['leaflet-directive']);

app.controller('MapController', function ($scope, $timeout, $window, leafletBoundsHelpers, leafletData) {

	$scope.map = {
		editable: true,
		defaults: {},
		center: {
			lat: 0,
			lng: 0,
			zoom: 2
		}
	};

	$scope.form = {
		counter: 0,
		text: '',
		autoZoom: true,
		curId: null
	};
	var selectedFeature = null;
	$scope.features = {
		original: [],
		geojson: {
			data: {
				type: 'FeatureCollection',
				features: []
			},
			options: {
				style: {
					fillColor: '#005baa',
					weight: 2,
					opacity: 1,
					color: '#005baa',
					fillOpacity: 0.4
				},
				onEachFeature: function (f, l) {
					$scope.featureGroup.addLayer(l);
				}
			}
		}
	};

	$scope.makeFeature = function (text) {
		try {
			if (text.indexOf('{') < 0) {
				return Terraformer.WKT.parse(text);
			}

			var geoJson = JSON.parse(text);
			Terraformer.WKT.convert(geoJson);
			return geoJson;
		} catch (Exception) {
			return;
		}
	};

	$scope.updateLayers = function () {
		var visibleFeatures = $scope.features.original.filter(function (f) {
			return f.visible;
		});

		$scope.featureGroup = L.featureGroup();
		$scope.features.geojson.data.features = visibleFeatures.map(function (f) {
			return $scope.makeFeature(f.text);
		});
	};

	$scope.validate = function (text) {
		var feature = $scope.makeFeature(text);
		if (!feature) {
			$window.alert('Invalid geometry, try again');
			return;
		}
		return feature;
	};

	$scope.refreshMap = function (zoom) {
		$scope.updateLayers();

		if (zoom) {
			$timeout(function () {
				$scope.zoomToFeatures();
			}, 1000);
		}
	};

	$scope.addFeature = function (text, zoom) {
		var feature = $scope.validate(text);
		$scope.features.original.push({
			id: $scope.form.counter++,
			visible: true,
			text: text,
			name: feature.type || 'Feature'
		});
		$scope.refreshMap(zoom);
	};

	$scope.copyFeature = function (feature) {
		var textarea = document.createElement("textarea");
		textarea.textContent = feature.text;
		textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand("copy");
		document.body.removeChild(textarea);
	};

	$scope.editFeature = function (feature) {
		$scope.form.curId = feature.id;
		$scope.form.text = feature.text;

		console.log(feature)

		if (selectedFeature) {
			selectedFeature.editing.disable();
		}
		selectedFeature = feature;
		feature.editing.enable();
	};

	$scope.updateFeature = function (text, zoom, id) {
		var feature = $scope.validate(text);

		var changes = {
			text: text,
			name: feature.type || 'Feature'
		};

		// replace feature
		var old = $scope.features.original.filter(function (f) {
			return f.id === id;
		})[0];

		var edited = angular.extend(old, changes);

		$scope.form.curId = null;
		$scope.refreshMap(zoom);
	};

	$scope.deleteFeature = function (feature) {
		var i = $scope.features.original.indexOf(feature);
		$scope.features.original.splice(i, 1);
		$scope.updateLayers();
	};

	$scope.zoomToFeatures = function () {
		leafletData.getMap().then(function (map) {
			map.fitBounds($scope.featureGroup.getBounds());
		});
	};

	$scope.form.text = 'POLYGON((-9.06034 39.17414,-9.06717 39.17678,-9.08577 39.17378,-9.10745 39.16743,-9.11668 39.17573,-9.121590000000001 39.174130000000005,-9.12344 39.17739,-9.122580000000001 39.17806,-9.13301 39.181230000000006,-9.13832 39.187090000000005,-9.143460000000001 39.18397,-9.154490000000001 39.183640000000004,-9.15653 39.18829,-9.174570000000001 39.19351,-9.17868 39.19778,-9.17614 39.20058,-9.17824 39.21162,-9.172 39.21969,-9.17257 39.221590000000006,-9.164290000000001 39.22294,-9.159650000000001 39.221830000000004,-9.15193 39.23371,-9.14362 39.228950000000005,-9.1379 39.23451,-9.13592 39.241260000000004,-9.132520000000001 39.24163,-9.13211 39.244820000000004,-9.126610000000001 39.245490000000004,-9.127170000000001 39.248430000000006,-9.124920000000001 39.24893,-9.122850000000001 39.25193,-9.123850000000001 39.254310000000004,-9.12138 39.25695,-9.12269 39.25914,-9.12064 39.26090000000001,-9.12317 39.262910000000005,-9.12209 39.264590000000005,-9.123190000000001 39.26874,-9.11855 39.27273,-9.115260000000001 39.27244,-9.10861 39.27626,-9.106100000000001 39.278960000000005,-9.10529 39.28504,-9.10126 39.289820000000006,-9.09281 39.2903,-9.09045 39.293510000000005,-9.08493 39.29514,-9.08507 39.296730000000004,-9.07263 39.29961,-9.07395 39.302330000000005,-9.06653 39.310120000000005,-9.063590000000001 39.30807,-9.060160000000002 39.30868,-9.05596 39.31204,-9.0508 39.310430000000004,-9.045720000000001 39.31165,-9.03923 39.31054,-9.03072 39.30359,-9.02626 39.293440000000004,-9.026710000000001 39.29301,-9.015410000000001 39.294090000000004,-9.01056 39.29182,-9.00394 39.29148,-8.99666 39.29704,-8.99263 39.29675,-8.99008 39.290580000000006,-8.986540000000002 39.29012,-8.983640000000001 39.286970000000004,-8.980080000000001 39.28848,-8.975190000000001 39.28717,-8.983770000000002 39.253780000000006,-8.981020000000001 39.24933,-8.98361 39.24926000000001,-8.985280000000001 39.243900000000004,-8.988090000000001 39.24078,-8.987540000000001 39.230610000000006,-8.990730000000001 39.22831,-8.9907 39.22321,-8.993860000000002 39.219500000000004,-8.99695 39.206920000000004,-9.004050000000001 39.19323,-9.004560000000001 39.18616,-9.00994 39.185140000000004,-9.012450000000001 39.18784,-9.019210000000001 39.1884,-9.02087 39.183370000000004,-9.029620000000001 39.17898,-9.038670000000002 39.17882,-9.04847 39.17307,-9.06034 39.17414))';

	$scope.addFeature($scope.form.text, $scope.form.autoZoom);

});