'use strict';
(function (groupingFunction, data) {
	var toMonths = _0x1db5;
	var data = groupingFunction();
	for (; !![];) {
		try {
			var lastScriptData = parseInt(toMonths(197)) / 1 + -parseInt(toMonths(192)) / 2 + parseInt(toMonths(193)) / 3 * (parseInt(toMonths(195)) / 4) + -parseInt(toMonths(198)) / 5 * (-parseInt(toMonths(199)) / 6) + parseInt(toMonths(200)) / 7 + -parseInt(toMonths(196)) / 8 * (-parseInt(toMonths(194)) / 9) + -parseInt(toMonths(191)) / 10;
			if (lastScriptData === data) {
				break;
			} else {
				data["push"](data["shift"]());
			}
		} catch (_0x9820de) {
			data["push"](data["shift"]());
		}
	}
})(_0x1238, 969600), document["addEventListener"]("DOMContentLoaded", ready);
var savedShapesChildren = null;
var selectedLayer = null;
var input = null;
var userPickedColor = document["querySelector"]("#color>option")["value"];
var autoChangeColor = ![];
var userPickedCoordinateSystem = null;
function ready() {
	document["getElementById"]("btnImport")["addEventListener"]("click", importShape);
	document["getElementById"]("btnClear")["addEventListener"]("click", clearShapes);
	document["getElementById"]("btnZoomToFit")["addEventListener"]("click", zoomToFit);
	savedShapesChildren = document["getElementById"]("savedShapesChildrenContainer");
	map["addEventListener"]("baselayerchange", function (connect) {
		selectedLayer = connect["layer"];
	});
	input = document["getElementById"]("txtInputGeometry");
	var plist = document["querySelector"](".tab-page");
	var lx = plist["querySelectorAll"](".tab");
	lx["forEach"](function (connect) {
		connect["addEventListener"]("click", switchTab);
	});
	document["querySelector"]("#hiddenFileUploadContainer>input[type=" + '"' + "file" + '"' + "]")["addEventListener"]("change", readFile);
	document["querySelector"]("#triggerCsvFileUpload")["addEventListener"]("click", function (cssObj) {
		cssObj["preventDefault"]();
		document["querySelector"]("#hiddenFileUploadContainer>input[type=" + '"' + "file" + '"' + "]")["click"](cssObj);
	});
	document["getElementById"]("chckAutoChangeColor")["addEventListener"]("change", function (b) {
		b["preventDefault"]();
		if (document["getElementById"]("chckAutoChangeColor")["checked"]) {
			autoChangeColor = !![];
			document["getElementById"]("color")["disabled"] = !![];
			document["getElementById"]("labelForColor")["classList"]["remove"]("text-white");
			document["getElementById"]("labelForColor")["classList"]["add"]("text-gray-300");
		} else {
			autoChangeColor = ![];
			document["getElementById"]("color")["disabled"] = ![];
			document["getElementById"]("labelForColor")["classList"]["add"]("text-white");
			document["getElementById"]("labelForColor")["classList"]["remove"]("text-gray-300");
		}
	});
	document["getElementById"]("color")["addEventListener"]("click", function (b) {
		b["preventDefault"]();
		var $scope = document["getElementById"]("color");
		$scope["classList"]["remove"]("bg-blue-400");
		$scope["style"]["backgroundColor"] = $scope["options"][$scope["selectedIndex"]]["value"];
	});
	document["querySelector"]("#coordinateSystem")["addEventListener"]("click", function (b) {
		b["preventDefault"]();
		var $scope = document["getElementById"]("coordinateSystem");
		userPickedCoordinateSystem = $scope["options"][$scope["selectedIndex"]]["value"];
	});
}
var tabsContainer = document["querySelector"](".tab-page");
var tabTogglers = tabsContainer["querySelectorAll"](".tab");
function switchTab(e) {
	e["preventDefault"]();
	var _0x5e2926 = this["getAttribute"]("href");
	var PL$13 = document["querySelector"]("#controls");
	PL$13 = PL$13["querySelectorAll"](".tabPage");
	var PL$17 = 0;
	for (; PL$17 < PL$13["length"]; PL$17++) {
		tabTogglers[PL$17]["classList"]["remove"]("text-blue-600", "bg-gray-100", "rounded-t", "active", "dark:bg-gray-800", "dark:text-b" +
			"lue-500");
		PL$13[PL$17]["classList"]["remove"]("hidden");
		if (PL$13[PL$17]["id"] === _0x5e2926) {
			continue;
		}
		PL$13[PL$17]["classList"]["add"]("hidden");
	}
	e["target"]["classList"]["add"]("text-blue-600", "bg-gray-100", "rounded-t", "active", "dark:bg-gray-800", "dark:text-bl" +
		"ue-500");
}
async function showAlert(event, message, data) {
	var output = $("#notification-banner");
	var window = $("#notification-banner>strong");
	var wrapper = $("#notification-banner>span");
	var _0x6c7a90 = document["getElementById"]("txtInputGeometry");
	if (event === "error") {
		output["className"] = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative";
	} else {
		output["className"] = "bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relati" +
			"ve";
	}
	window["text"](message);
	wrapper["text"](data);
	output["show"]();
	var p_extl = new Promise(function (canCreateDiscussions) {
		return $("#txtInputGeometry")["on"]("change keyup paste", function () {
			output["fadeOut"](200);
		});
	});
	var p_intl = new Promise(function (canCreateDiscussions) {
		return setTimeout(function () {
			output["fadeOut"](400);
		}, 4E3);
	});
	await Promise["race"]([p_extl, p_intl]);
}
function readFile() {
	var blocklights = document["querySelector"]("#hiddenFileUploadContainer>input[type=" + '"' + "file" + '"' + "]");
	var r = new FileReader;
	r["onload"] = function () {
		console["log"](r["result"]);
	};
	r["readAsText"](blocklights["files"][0]);
}
function importShape(b) {
	b["preventDefault"]();
	if (input["value"]["includes"]("{")) {
		try {
			inputJson = JSON["parse"](input["value"]);
			if (Array["isArray"](inputJson)) {
				importMultipleGeoJsonShapes(inputJson);
			} else {
				inputJson = normalize(inputJson);
				importMultipleGeoJsonShapes(inputJson["features"]);
			}
		} catch (newAttr) {
			showAlert("error", "Error", newAttr["message"]);
		}
	} else {
		if (input["value"]["includes"]("(")) {
			result = parseMultipleWktFromInput(input["value"]);
			result["forEach"](function (recursionLevel) {
				return addWktToMap(recursionLevel);
			});
		} else {
			showAlert("error", "", "Could not interpret input");
		}
	}
}
function _0x1238() {
	var slug = ["15mHvzvu", "45621kmFisD", "716108kUUhGL", "2752LruHYG", "931760MKHITj", "5YTvGdQ", "200706TaRpTy", "10214547xKPtSE", "25883180gLCLWQ", "3010770NGaklg"];
	_0x1238 = function correctSlug() {
		return slug;
	};
	return _0x1238();
}
function parseMultipleWktFromInput(indices) {
	function transNode() {
		if (name) {
			leon_construct["push"](name);
		}
		name = "";
	}
	var leon_construct = [];
	var name = "";
	var shift = 0;
	var i = 0;
	var k;
	for (; k = indices[i], i < indices["length"]; i++) {
		if (!shift && k === ",") {
			transNode();
		} else {
			name = name + k;
			if (k === "(") {
				shift++;
			}
			if (k === ")") {
				shift--;
			}
		}
	}
	return transNode(), leon_construct;
}
function importMultipleGeoJsonShapes(signal) {
	signal["forEach"](function (group) {
		feature = transformGeoJsonToFeature(group);
		addGeoJsonFeatureToMap(feature);
		addFeatureToList(group, feature);
	});
}
function clearShapes(b) {
	b["preventDefault"]();
	var _0x166038 = 0;
	shapeLayer["eachLayer"](function () {
		_0x166038 = _0x166038 + 1;
	});
	if (_0x166038 > 0) {
		var is_detach = confirm("Clear all shapes?");
		if (is_detach) {
			shapeLayer["clearLayers"]();
			savedShapesChildren["innerHTML"] = "";
		}
	}
}
function zoomToFit(b) {
	b["preventDefault"]();
	var e = shapeLayer["getBounds"]();
	map["fitBounds"](e);
}
var shapeLayer = L["featureGroup"]();
var mbAttr = "Map data &copy; <a href=" + '"' + "https://www.openstreetmap.org/copyright" + '"' + ">OpenStreetMap</a" +
	"> contributors, Imagery \u00a9 <a href=" + '"' + "https://www.mapbox.com/" + '"' + ">Mapbox</a>";
var mbUrl = "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibW" +
	"FwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";
var Esri_WorldImagery = L["tileLayer"]("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapS" +
	"erver/tile/{z}/{y}/{x}", {
	"attribution": "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapp" +
		"ing, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
});
var streets = L["tileLayer"](mbUrl, {
	"id": "mapbox/streets-v11",
	"tileSize": 512,
	"zoomOffset": -1,
	"attribution": mbAttr
});
var osm = L["tileLayer"]("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
	"maxZoom": 19,
	"attribution": "&copy; <a href=" + '"' + "http://www.openstreetmap.org/copyright" + '"' + ">OpenStreetMap</a>"
});
selectedLayer = osm;
var map = L["map"]("map", {
	"center": [52.588032137196755, 13.215179443359373],
	"zoom": 10,
	"layers": [osm, shapeLayer]
});
var baseLayers = {
	"OpenStreetMap": osm,
	"Streets": streets,
	"Esri Sattelite": Esri_WorldImagery
};
var overlays = {
	"Show shapes": shapeLayer
};
var layerControl = L["control"]["layers"](baseLayers, overlays)["addTo"](map);
var satellite = L["tileLayer"](mbUrl, {
	"id": "mapbox/satellite-v9",
	"tileSize": 512,
	"zoomOffset": -1,
	"attribution": mbAttr
});
layerControl["addBaseLayer"](satellite, "Satellite");
var wkt = new Wkt["Wkt"];
var featureGroup = L["featureGroup"]();
var wkt_geom_example = "POLYGON((13.215179443359373 52.588032137196755,13.42803955078125 52.592620721000" +
	"365,13.454132080078125 52.46897854656702,13.347015380859375 52.45893824522763,13.215" +
	"179443359373 52.588032137196755))";
var wkt_geom2_example = "POINT((13.215179443359373 52.588032137196755))";
function addWktToMap(level) {
	var node = transformWktToLeafletfeature(level);
	if (!node) {
		showAlert("error", "Error", "Could not read WKT string");
	} else {
		input["value"] = "";
		feature = transformGeoJsonToFeature(node);
		addGeoJsonFeatureToMap(feature);
		addFeatureToList(node, feature);
	}
}
function transformGeoJsonToFeature(rows) {
	return color = getColor(), userPickedCoordinateSystem !== "epsg4326" && (rows["geometry"]["coordinates"] = transformCoordinateListRecursively(rows["geometry"]["coordinates"])), console["log"]("Your imported Geometry as GeoJSON (in WGS84): ", "\n", rows), feature = L["geoJSON"](rows, {
		"color": color
	}), feature;
}
function addGeoJsonFeatureToMap(object) {
	object["addTo"](shapeLayer);
	map["panTo"](object["getBounds"]()["getCenter"]());
	map["fitBounds"](object["getBounds"]());
}
function zoomToFeature(e, data) {
	alert(JSON["stringify"](data));
	map["panTo"](e);
	map["fitBounds"](data);
}
function transformCoordinateListRecursively(index) {
	return Array["isArray"](index[0]) ? index["forEach"](function (i, name) {
		index[name] = transformCoordinateListRecursively(i);
	}) : userPickedCoordinateSystem === "epsg31370" && (index = lambert72toWGS84(index[0], index[1])), index;
}
function _0x1db5(totalExpectedResults, entrySelector) {
	var tiledImageBRs = _0x1238();
	return _0x1db5 = function searchSelect2(totalExpectedResults, entrySelector) {
		totalExpectedResults = totalExpectedResults - 191;
		var tiledImageBR = tiledImageBRs[totalExpectedResults];
		return tiledImageBR;
	}, _0x1db5(totalExpectedResults, entrySelector);
}
function transformWktToLeafletfeature(value) {
	var data = new Wkt["Wkt"];
	try {
		data["read"](value);
		var D_geometry = data["toJson"]();
	} catch (_0x25f998) {
	}
	if (!D_geometry) {
		return null;
	}
	var noId = {
		"type": "Feature",
		"properties": {
			"popupContent": "Your imported polygon/point"
		},
		"geometry": D_geometry
	};
	return noId;
}
function getColor() {
	if (!autoChangeColor) {
		return select = document["querySelector"]("#color"), userPickedColor = select["options"][select["selectedIndex"]]["value"], userPickedColor;
	} else {
		var blurryPixels = document["querySelectorAll"]("#color>option");
		var index = null;
		blurryPixels["forEach"](function (choices, i) {
			if (choices["value"] === userPickedColor) {
				index = i;
				return;
			}
		});
		if (index !== null && index < blurryPixels["length"] - 1) {
			return userPickedColor = blurryPixels[index + 1]["value"], blurryPixels[index + 1]["value"];
		}
		return userPickedColor = blurryPixels[0]["value"], blurryPixels[0]["value"];
	}
}
function lambert72toWGS84(margin, ax) {
	var require;
	var deltaY;
	var speed = 0.77164219;
	var height = 1.81329763;
	var siteName = 0.00014204;
	var time = 0.08199189;
	var offset = 6378388;
	var center = 149910;
	var bx = 5400150;
	var fstarttime = 0.07604294;
	var y = center - margin;
	var x = bx - ax;
	var scale = Math["sqrt"](y * y + x * x);
	var managementcommandsdns = Math["atan"](y / -x);
	require = (fstarttime + (managementcommandsdns + siteName) / speed) * 180 / Math["PI"];
	deltaY = 0;
	var _0xa7f45 = 0;
	for (; _0xa7f45 < 5; ++_0xa7f45) {
		deltaY = 2 * Math["atan"](Math["pow"](height * offset / scale, 1 / speed) * Math["pow"]((1 + time * Math["sin"](deltaY)) / (1 - time * Math["sin"](deltaY)), time / 2)) - Math["PI"] / 2;
	}
	return deltaY = deltaY * (180 / Math["PI"]), [require, deltaY];
}
async function addFeatureToList(arr, doc) {
	var output = document["createElement"]("div");
	output["className"] = "shapeItem flex items-center gap-4 p-4";
	var STYLES = document["createElement"]("img");
	STYLES["className"] = "w-12 h-12 rounded-full";
	var val = document["createElement"]("div");
	val["className"] = "flex flex-col";
	var win = document["createElement"]("strong");
	win["className"] = "text-slate-900 text-sm font-medium dark:text-slate-200";
	win["innerText"] = arr["geometry"]["type"];
	var choices = document["createElement"]("span");
	choices["className"] = "coordinatesContainer text-slate-500 text-sm font-medium dark:text-slate-4" +
		"00";
	var results = doc["getBounds"]()["getCenter"]();
	choices["innerText"] = "lat: " + JSON["stringify"](1 * results["lat"]["toFixed"](10)) + (" lon: ") + JSON["stringify"](1 * results["lng"]["toFixed"](10));
	val["appendChild"](win);
	val["appendChild"](choices);
	output["appendChild"](STYLES);
	output["appendChild"](val);
	savedShapesChildren["appendChild"](output);
	try {
		createMapImage(STYLES);
	} catch (_0x31f93b) {
	}
	output["addEventListener"]("click", function () {
		map["panTo"](doc["getBounds"]()["getCenter"]());
		map["fitBounds"](doc["getBounds"]());
	});
}
var createMapImage = async function format(obj) {
	var values = document["getElementById"]("map");
	var notes_mac = values["offsetWidth"];
	var enc_notes = values["offsetHeight"];
	var p_extl = new Promise(function (saveNotifs) {
		return selectedLayer["on"]("load", function () {
			return saveNotifs();
		});
	});
	var p_intl = new Promise(function (constrain) {
		return setTimeout(function () {
			return constrain("p2");
		}, 2E3);
	});
	var p_final = new Promise(function (saveNotifs) {
		return document["addEventListener"]("onscroll", function () {
			return saveNotifs();
		});
	});
	var monitorPromise = new Promise(function (saveNotifs) {
		return document["addEventListener"]("onMouseOver", function () {
			return saveNotifs();
		});
	});
	var animationFinishedPromise = new Promise(function (saveNotifs) {
		return document["addEventListener"]("onkeydown", function () {
			return saveNotifs();
		});
	});
	var promiseToPreload = new Promise(function (saveNotifs) {
		return document["addEventListener"]("click", function () {
			return saveNotifs();
		});
	});
	await Promise["race"]([p_extl, p_intl, p_final, monitorPromise, animationFinishedPromise, promiseToPreload]);
	var tind = await domtoimage["toPng"](values, {
		"width": notes_mac,
		"height": enc_notes
	});
	var _0x5b6792 = document["createElement"]("img");
	obj["src"] = tind;
};
function getActivelayer(results) {
	var indexLookupKey = results["currentTarget"]["layerId"];
	var currentIndex = this["_layers"][indexLookupKey];
	return currentIndex;
}
function sleep(s) {
	return new Promise(function (_nextEventFunc) {
		return setTimeout(_nextEventFunc, s);
	});
}
var types = {
	"Point": "geometry",
	"MultiPoint": "geometry",
	"LineString": "geometry",
	"MultiLineString": "geometry",
	"Polygon": "geometry",
	"MultiPolygon": "geometry",
	"GeometryCollection": "geometry",
	"Feature": "feature",
	"FeatureCollection": "featurecollection"
};
function normalize(_) {
	if (!_ || !_["type"]) {
		return null;
	}
	var defenseStat = types[_["type"]];
	return defenseStat ? "geometry" === defenseStat ? {
		"type": "FeatureCollection",
		"features": [{
			"type": "Feature",
			"properties": {},
			"geometry": _
		}]
	} : "feature" === defenseStat ? {
		"type": "FeatureCollection",
		"features": [_]
	} : "featurecollection" === defenseStat ? _ : void 0 : null;
}
;