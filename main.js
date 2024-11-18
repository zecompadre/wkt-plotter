var app = (function () {

	var raster;
	var vector;
	var map;
	var draw;
	var snap;
	var drag;
	var select;
	var modify;
	var mousewheelzoom;
	var features = new ol.Collection();
	var format = new ol.format.WKT();

	var current_wkts = [];

	var shape = "Polygon";

	var lfkey = "zecompadre-wkt";

	var normalColor = '#141414'; //'#005baa';
	var editColor = '#ec7063';
	var snapColor = '#34495e';

	var center = ol.proj.transform([-8.1234, 39.6945], 'EPSG:4326', 'EPSG:3857');

	var main = document.querySelector(".maincontainer");
	var textarea = document.querySelector("#wktdefault textarea");

	function deselectFeature() {
		select.getFeatures().clear();
		map.getControls().forEach(function (control) {
			if (control instanceof EditorControl) {
				control.hide();
			}
		});
	}

	async function centerMap() {

		if (!main.classList.contains("nowkt")) {

			console.log("centerMap - features");

			var extent = ol.extent.createEmpty();
			features.forEach(function (feature) {
				ol.extent.extend(extent, feature.getGeometry().getExtent());
			});

			map.getView().fit(extent, map.getSize());
		}
		else {

			console.log("centerMap - no features");

			map.getView().setCenter(center);
			map.getView().setZoom(6);
		}
	}

	function hexToRgbA(hex) {
		// Remove the "#" if present
		hex = hex.replace(/^#/, '');

		// Parse the hex color into RGB components
		let bigint = parseInt(hex, 16);
		let r = (bigint >> 16) & 255;
		let g = (bigint >> 8) & 255;
		let b = bigint & 255;

		return `rgba(${r}, ${g}, ${b},0.2)`;
	}

	async function generateChecksum(inputString) {
		if (inputString === "")
			return inputString;

		const encoder = new TextEncoder();
		const data = encoder.encode(inputString);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const checksum = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
		return checksum;
	}

	var CurrentTextarea = {
		get: function (id) {
			return textarea.value;
		},
		set: function (feature) {
			app.restoreDefaultColors();
			var geo = feature.getGeometry().transform('EPSG:3857', 'EPSG:4326');
			textarea.value = format.writeGeometry(geo);
			var geo = feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
		}
	};

	var LS_WKTs = {
		load: function () {
			var wkts = localStorage.getItem(lfkey) || "[]";
			current_wkts = JSON.parse(wkts);
		},
		remove: function (id) {
			current_wkts = current_wkts.filter(function (item) {
				return item.id !== id;
			});
			this.save();
		},
		save: function () {
			localStorage.setItem(lfkey, JSON.stringify(current_wkts));
		},
		add: async function (wkt) {
			var self = this;
			await generateChecksum(wkt).then(function (checksum) {
				var exists = false;
				if (current_wkts.length > 0) {
					current_wkts.forEach(item => {
						if (checksum !== "" && item.id === checksum)
							exists = true;
					});
				}
				if (wkt != "" && !exists) {
					current_wkts.push({ id: checksum, wkt: wkt });
				}
				self.save();
			});

		},
		get: function () {
			return current_wkts;
		},
		update: function (id, wkt) {
			current_wkts.forEach(function (item) {
				if (item.id === id)
					item.wkt = wkt;
			});
			this.save();
		}
	}

	class EditorControl extends ol.control.Control {
		/**
		 * @param {Object} [opt_options] Control options.
		 */
		constructor(opt_options) {
			const options = opt_options || {};

			const buttonClear = document.createElement('button');
			buttonClear.innerHTML = '<i class="fa-solid fa-trash fa-sm"></i>';
			buttonClear.classList.add('btn', 'btn-danger');

			const buttonCopy = document.createElement('button');
			buttonCopy.innerHTML = '<i class="fa-regular fa-clipboard fa-sm"></i>';
			buttonCopy.classList.add('btn', 'btn-warning');

			const buttonPlot = document.createElement('button');
			buttonPlot.innerHTML = '<i class="fa-solid fa-check fa-sm"></i>';
			buttonPlot.classList.add('btn', 'btn-primary');

			const element = document.createElement('div');
			element.className = 'ol-top-right ol-unselectable ol-control';
			element.appendChild(buttonClear);
			element.appendChild(buttonCopy);
			element.appendChild(buttonPlot);

			super({
				element: element,
				target: options.target,
			});

			buttonClear.addEventListener('click', app.removeWKT.bind(this), false);
			buttonCopy.addEventListener('click', app.copyWKT.bind(this), false);
			buttonPlot.addEventListener('click', app.addWKT.bind(this), false);

			var buttons = this.element.querySelectorAll("button");
			buttons[0].style.display = "none";
			buttons[1].style.display = "none";
			buttons[2].style.display = "";
		}

		hide() {
			var buttons = this.element.querySelectorAll("button");
			buttons[0].style.display = "none";
			buttons[1].style.display = "none";
			buttons[2].style.display = "";
		}

		show() {
			var buttons = this.element.querySelectorAll("button");
			buttons[0].style.display = "";
			buttons[1].style.display = "";
			buttons[2].style.display = "none";
		}
	}

	function styles(color) {
		return [
			new ol.style.Style({
				image: new ol.style.Circle({
					fill: new ol.style.Fill({
						color: hexToRgbA(color)
					}),
					stroke: new ol.style.Stroke({
						color: color,
						width: 2
					}),
					radius: 5
				}),
				fill: new ol.style.Fill({
					color: hexToRgbA(color)
				}),
				stroke: new ol.style.Stroke({
					color: color,
					width: 2
				})
			})
		];
	}


	return {
		addInteraction: function (shape) {
			draw = new ol.interaction.Draw({
				features: features,
				type: /** @type {ol.geom.GeometryType} */ shape
			});
			map.addInteraction(draw);
			snap = new Snap({ sfeatures: features });
			map.addInteraction(snap);
		},
		createVector: function () {
			vector = new ol.layer.Vector({
				source: new ol.source.Vector({ features: features }),
				style: styles(normalColor)
			});
		},
		toEPSG4326: function (element, index, array) {
			element = element.getGeometry().transform('EPSG:3857', 'EPSG:4326');
		},
		toEPSG3857: function (element, index, array) {
			element = element.getGeometry().transform('EPSG:4326', 'EPSG:3857');
		},
		selectGeom: function (shape) {
			current_shape = shape;
			map.removeInteraction(draw);
			this.addInteraction(shape);
			console.log(shape);

		},
		restoreDefaultColors: function () {
			textarea.style.borderColor = "";
			textarea.style.backgroundColor = "";
		},
		addFeatures: async function () {
			map.removeLayer(vector);
			vector = new ol.layer.Vector({
				source: new ol.source.Vector({ features: features }),
				style: styles(normalColor)
			});
			map.addLayer(vector);
		},
		resetFeatures: async function () {
			features = new ol.Collection();
			map.removeLayer(vector);
			deselectFeature()
		},
		plotWKT: function (id, wkt) {

			var new_feature;
			wkt_string = wkt || textarea.value;
			if (wkt_string == "") {
				textarea.style.borderColor = "red";
				textarea.style.backgroundColor = "#F7E8F3";
				return;
			} else {
				try {
					new_feature = format.readFeature(wkt_string);
				} catch (err) {
				}
			}
			if (!new_feature) {
				textarea.style.borderColor = "red";
				textarea.style.backgroundColor = "#F7E8F3";
				return;
			} else {
				new_feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
				new_feature.setId(id);
				features.push(new_feature);
			}
		},
		removeWKT: async function () {

			var selected = this.get();

			LS_WKTs.remove(selected.id);

			await app.loadWKTs(false);

		},
		addWKT: function () {
			map.removeInteraction(select);
			map.addInteraction(draw);
		},
		copyWKT: async function () {

			var selected = this.get();

			textarea = selected.textarea;

			textarea.select();
			document.execCommand("copy");
			textarea.blur();

			deselectFeature();

			app.restoreDefaultColors();
		},
		clipboardWKT: async function () {

			var returnVal = "";

			try {

				textarea.focus();

				const permission = await navigator.permissions.query({ name: 'clipboard-read' });
				if (permission.state === 'denied') {
					throw new Error('Not allowed to read clipboard.');
				}

				const text = await navigator.clipboard.readText();
				if (text.indexOf('POLYGON') !== -1) {
					returnVal = text;
					navigator.clipboard.writeText("");
				}
			} catch (error) {
				console.error('clipboardWKT:', error.message);
			}
			return returnVal;
		},
		pasteWKT: async function (ele) {

			await LS_WKTs.add(ele.value).then(async function (result) {
				await this.loadWKTs();
			});
		},
		loadWKTs: async function (readcb) {

			var self = this;

			await self.resetFeatures().then(async function () {
				LS_WKTs.load();

				var wkts = current_wkts;

				textarea.focus();

				var wkt = "";
				if (readcb)
					wkt = await self.clipboardWKT();

				await generateChecksum(wkt).then(async function (checksum) {
					if (wkts == null || wkts == undefined)
						wkts = [];

					var exists = false;
					var idx = 0;

					if (wkts.length > 0) {
						wkts.forEach(item => {
							idx = idx + 1;
							if (checksum !== "" && item.id === checksum)
								exists = true;
							self.plotWKT(item.id, item.wkt);
						});
					}

					if (wkt != "" && !exists) {
						idx = idx + 1;
						self.plotWKT(checksum, wkt);
						wkts.push({ id: checksum, wkt: wkt });
					}

					current_wkts = wkts;

					LS_WKTs.save()

					await self.addFeatures().then(async function () {
						if (current_wkts.length > 0) {
							main.classList.remove("nowkt");
						}
						else {
							main.classList.add("nowkt");
						}

						await centerMap().then(function () { map.updateSize(); });

					});
				});
			});
		},
		init: function () {
			var self = this;

			main = document.querySelector(".maincontainer");
			textarea = document.querySelector("#wktdefault textarea");

			this.createVector();
			raster = new ol.layer.Tile({
				source: new ol.source.OSM()
			});

			select = new ol.interaction.Select({
				style: styles(editColor),
			});

			select.on('select', function (evt) {

				if (evt.deselected.length > 0) {

					evt.deselected.forEach(function (feature) {

						self.restoreDefaultColors();
						var geo = feature.getGeometry().transform('EPSG:3857', 'EPSG:4326');
						textarea.value = format.writeGeometry(geo);
						var geo = feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');

						LS_WKTs.update(feature.getId(), textarea.value);

						textarea.value = "";

					});

					map.getControls().forEach(function (control) {
						if (control instanceof EditorControl) {
							control.hide();
						}
					});
				}

				if (evt.selected.length > 0) {
					map.getControls().forEach(function (control) {
						if (control instanceof EditorControl) {
							control.show();
						}
					});

					evt.selected.forEach(function (feature) {
						CurrentTextarea.set(feature);
					});
				}
			});

			modify = new ol.interaction.Modify({
				features: select.getFeatures(),
				style: styles(snapColor),
				insertVertexCondition: function () {
					return true;
				},
			});

			drag = new ol.interaction.DragPan({
				condition: function (event) {
					return true;
				}
			});

			mousewheelzoom = new ol.interaction.MouseWheelZoom({
				condition: function (event) {
					return true;
				}
			});

			draw = new ol.interaction.Draw({
				features: features,
				type: /** @type {ol.geom.GeometryType} */ shape
			});

			draw.on('drawend', async function (evt) {

				var geo = evt.feature.getGeometry().transform('EPSG:3857', 'EPSG:4326');
				var wkt = format.writeGeometry(geo);

				await LS_WKTs.add(wkt).then(async function (result) {
					await app.loadWKTs(false).then(function () {
						map.removeInteraction(draw);
						map.addInteraction(select);
					});


				});

			});


			map = new ol.Map({
				controls: ol.control.defaults.defaults().extend([new EditorControl()]),
				interactions: [mousewheelzoom, drag, select, modify],
				layers: [raster, vector],
				target: 'map',
				view: new ol.View({
					center: center,
					zoom: 6
				})
			});

			thisapp = self;

			//createBaseContent();

			self.loadWKTs(true);

		}
	};

}());
