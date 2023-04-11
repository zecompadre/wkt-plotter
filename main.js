var app = angular.module('myapp', ['leaflet-directive']);

app.controller('MapController', function ($scope, $timeout, $window, leafletBoundsHelpers, leafletData) {

	$scope.map = {
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

	$scope.features = {
		original: [],
		geojson: {
			data: {
				type: 'FeatureCollection',
				features: []
			},
			options: {
				style: {
					fillColor: 'green',
					weight: 2,
					opacity: 1,
					color: 'black',
					fillOpacity: 0.7
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

	$scope.editFeature = function (feature) {
		$scope.form.curId = feature.id;
		$scope.form.text = feature.text;
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

	// initial data
	$scope.form.text = '{ "type": "Polygon", "coordinates": [[[30, 10], [40, 40], [20, 40], [10, 20], [30, 10]]]}';
	//$scope.form.text = 'POINT(30 10)';
	$scope.addFeature($scope.form.text, false);

});