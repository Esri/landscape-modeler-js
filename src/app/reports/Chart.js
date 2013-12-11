/*
Copyright 2013 Esri
 Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
define([
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/text!./templates/Chart.html",
	"dojo/i18n!../nls/resources",
  // "../app/context",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/_base/Color",
	"dojo/topic",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/Evented",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dijit/registry",
	"dijit/Tooltip",
	"dojox/charting/Chart",
	"dojox/charting/Theme",
	"dojox/charting/widget/Legend",
  "dojox/charting/plot2d/Pie",
	"dojox/charting/plot2d/ClusteredColumns",
	"dojox/charting/action2d/Magnify",
  "dojox/charting/action2d/Tooltip",
  "dojox/charting/action2d/MoveSlice",
	"dojox/charting/StoreSeries",
	"esri/map",
	"dojox/charting/axis2d/Default",
	"dojox/charting/plot2d/Default"
], function (
	declare, WidgetBase, TemplatedMixin, WidgetsInTemplateMixin, template, i18n,// context,
	lang, arrayUtil, Color, topic, domStyle, domClass, domConstruct, on, Evented, Memory, Observable, registry, dijitTooltip,
	Chart, Theme, Legend, Pie, ClusteredColumns, Magnify, Tooltip, MoveSlice, StoreSeries) {

	var _this;

	var oThisClass = declare([WidgetBase, TemplatedMixin, WidgetsInTemplateMixin, Evented], {

		appContext: null,
		i18n: i18n,
		templateString: template,
		header: null,
		type: "Pie", // default chart type is "pie chart"
		_type: null,
		chart: false,
		legend: false,
		_theme: null,
		_strokeStyle: null,
		_shadow: null,
		data: null,
		_newData: null,
		dataStore: null,
		keyType: null,	//only for donut chart: which field to use for calculating the percentage
		dataType: "area",
		_unit: " Acres",
		fPolygonLayer: null,
		selectedFieldName: null,

		postCreate: function () {
			this.inherited(arguments);

			if (this.type === "Donut") {
				// donut is a modification from pie chart
				this._type = "Pie";
			} else {
				this._type = this.type;
			}
			// set chart title if there is one
			if (this.header) {
				this.chartTitleNode.innerHTML = this.header;
			}
			else {
				domStyle.set(this.chartTitleNode, "display", "none");
			}
			// add chart type as a class name to the chart container
			domClass.add(this.chartContainer, this.type);
			// columns chart has stroke (border)
			if (this.type.toLowerCase() === "columns") {
				this._strokeStyle = { color: "#555", width: 1 };
				// this._shadow = { dx: 0, dy: -1, width: 3, color: [0, 0, 0, 0.1] };
			}
			// default theme
			this._theme = new dojox.charting.Theme({
				colors: [
					"#68C6E6",
					"#FA916C",
					"#9ADB70",
					"#EB490B",
					"#F2D780",
					"#E44960"
				]
			});
			this._theme.chart.fill = "transparent";
			this._theme.plotarea.fill = "transparent";

			//create chart
			this._create(this.type.toLowerCase());
		},

		_create: function(chartType) {
			this.chart = new Chart(this.chartContainerNode);
			this.chart.setTheme(this._theme);
			var plotParams = {
				type: this._type,
				labels: false,
				//animate: true,
				stroke: this._strokeStyle
			};
			if (chartType === "donut") {
				plotParams.startAngle = 90;
			}
			if (chartType === "columns") {
				plotParams.gap = 4;
				plotParams.maxBarSize = 25;
				if (this.data) {
					var newWidth = 127;
					var count = this.data.dataset.length;
					if (count >= 7) {
						plotParams.gap = 1;
						newWidth = 127 + 3 * 25;
					} else if (count > 4 && count < 7) {
						newWidth = 127 + (count - 4) * 25;
					}
					this._resizeColumnsContainer(newWidth);
				}
			}
			this.chart.addPlot("default", plotParams);

			// custom configuration
			switch (chartType) {
				case "pie": // pie
					new MoveSlice(this.chart, "default");
					break;
				case "donut":
					domStyle.set(this.donutChartValueNode, "display", "block");
					new Magnify(this.chart, "default", { scale: 1.1 });
					new Tooltip(this.chart, "default");
					break;
				case "columns":	// columns
					this.chart.addAxis("x", { type: "Invisible", fixLower: "minor", fixUpper: "minor", natural: true })
					.addAxis("y", { type: "Invisible", vertical: true, fixLower: "minor", fixUpper: "minor", includeZero: true });
					new Tooltip(this.chart, "default");
					break;
				default:
					//default handler
			}

			// add data series
			this._newData = this._createData(chartType, this.data);
			this.dataStore = Observable(new Memory({
				idProperty: "name",
				data: this._newData
			}));
			this.chart.addSeries("", new StoreSeries(this.dataStore, { query: {} }, lang.hitch(this, this._valueTrans)));

			this.chart.render();
			this._connectChartEvents();

			// topic.publish('/charts/areaChartAdded', this, {
			// 	type: chartType
			// });
			if (this.dataType == "area") {
				this.own(topic.subscribe("/charts/area/Refreshed", lang.hitch(this, function (sender, args) {
					this.data = args.data;
					this._refresh(args.removedFieldValues, args.data);
				})));
			} else if (this.dataType == "count") {
				this.own(topic.subscribe("/charts/histogram/Refreshed", lang.hitch(this, function (sender, args) {
					console.log(args);
					this.data = args.data;
					if (args.data) {
						if (args.data.dataset) {
							this._refresh(args.removedFieldValues, args.data);
						} else {
							this._refresh(args.removedFieldValues, null);
						}
					}
					this.chartTitleNode.innerHTML = args.title;
				})));
			}

			console.log(this.type + "chart added");
		},

		_valueTrans: function (object) {
			// reformat the displayed the value
			var value = object.value;
			var tooltip;
			// if (this.dataType === "count") {
			// 	value = value > 10000 ? (value / 1000) + "K" : value;
			// 	this._unit = "";
			// } else {
				value = value > 10000 ? (value / 1000).toFixed(2) + "K" : value.toFixed(0);
			//}

			if (this.type === "Pie") {
				tooltip = object.name + ": " + (object.percentage * 100).toFixed(2) + "%";
			}
			else {
				tooltip = object.name + ": ~" + value + this._unit;
			}
			return {
				text: object.name,
				y: object.value,
				fill: object.fill,
				tooltip: tooltip
			};
		},

		_createData: function (chartType, data) {
			var dataset;
			if (data) {
				if (chartType === "columns") {
					dataset = arrayUtil.map(data.dataset, lang.hitch(this, function (item, index) {
						return { name: item.name, value: item.value, fill: data.colors[item.name] };
					}));
				} else {
					var sum = 0;
					for (var i = 0; i < data.dataset.length; i++) {
						sum += data.dataset[i].value;
					}
					if (chartType === "pie") {
						dataset = arrayUtil.map(data.dataset, lang.hitch(this, function (item, index) {
							return { name: item.name, value: item.value, percentage: item.value / sum, fill: data.colors[item.name] };
						}));
					}
					else {
						dataset = [];
						var itemFill;
						var hasKeyType = false; // whether the dataset includes the key type
						arrayUtil.forEach(data.dataset, lang.hitch(this, function (dataObj, index) {
							if (dataObj.name === this.keyType) {
								hasKeyType = true;
								if (data.colors) {
									itemFill = data.colors[dataObj.name];
								} else {
									itemFill = this._theme.colors[index];
								}
								if (sum) {
									var percentage = ((dataObj.value / sum) * 100).toFixed(1);
									this.donutChartValueNode.innerHTML = percentage + "%";
									dataset.push({ name: dataObj.name, value: dataObj.value, fill: itemFill, tooltip: dataObj.name + ": " + percentage + "%" });
									var remainingValue = sum - dataObj.value;
									dataset.push({ name: "rest", value: remainingValue, fill: "transparent", tooltip: "rest: " + (100 - percentage) + "%" });
								}
							}
						}));

						//no key type defined: percentage equals to 0
						if (!hasKeyType) {
							this.donutChartValueNode.innerHTML = "0%";
							dataset.push({ name: this.keyType, value: 0, fill: "transparent", tooltip: "" });
							dataset.push({ name: "rest", value: sum, fill: "transparent", tooltip: "rest: " + 100 + "%" });
						}
					}
				}
			}
			return dataset;
		},

		_refresh: function (removedFieldValues, data) {
			if (data && this.type == "Columns") {
				//var newWidth = 127;
				//var count = data.dataset.length;
				//if (count >= 7) {
				//	this.chart.plotParams.gap = 1;
				//	newWidth = 127 + 3 * 25;
				//} else if (count > 4 && count < 7) {
				//	newWidth = 127 + (count - 4) * 25;
				//}
				//this._resizeColumnsContainer(newWidth);
			}
			//if (this.dataType === "area") {
				// remove items
			if (data) {
					arrayUtil.forEach(removedFieldValues, lang.hitch(this, function (value) {
						if (this.type != "Donut") {
							this.dataStore.remove(value);
						}
					}));
					this._newData = this._createData(this.type.toLowerCase(), this.data);
					// add/update items
					arrayUtil.forEach(this._newData, lang.hitch(this, function (obj) {
						this.dataStore.put(obj);
					}));
				} else {
					// when donut chart has no data
					if (this.type == "Donut") {
						this.dataStore.remove(this.keyType);
						this.dataStore.remove("rest");
						this.donutChartValueNode.innerHTML = "0%";
					}
					arrayUtil.forEach(this._newData, lang.hitch(this, function (obj) {
						this.dataStore.remove(obj.name);
					}));

				}

		},

		_resizeColumnsContainer: function (width) {
			width = width + "px";
			domStyle.set(this.chartContainerNode, "width", width);
			this.chart.resize();
			domStyle.set(this.chartTitleNode, "max-width", width);
		},

		_connectChartEvents: function () {
			var _this = this;
			var pieTooltip;
			this.chart.connectToPlot("default",lang.hitch(this, function(evt) {
				// console.log(evt);
				var type = evt.type;
				if (type != "onplotreset") {
					// Get access to the shape and type
					var shape = evt.shape, run = evt.run;
					var selectedType = run.data[evt.index].text;
					// React to mouse event
					if (type == "onclick") {
						if (this.dataType == "area") {
								var geometries = [];
								var fPolygonLayer = this.fPolygonLayer;
								arrayUtil.forEach(fPolygonLayer.graphics, lang.hitch(this, function (graphic) {
									if (graphic.attributes[this.selectedFieldName] === selectedType) {
										geometries.push(graphic.geometry);
									}
								}));
								_this.emit("type-select", {
									type: selectedType,
									geometries: geometries
								});

							//if(!shape.originalFill) {
							//	shape.originalFill = shape.fillStyle;
							//}
							//var highlightColor = shape.originalFill;
							//highlightColor.a = 0.7;
							//// Set the fill color to pink
							//shape.setFill(highlightColor);
						}
					}
						// If it's a mouseover event
					else if (type == "onmouseover") {
						if (this.type === "Pie") {
							if (!pieTooltip) {
								pieTooltip = domConstruct.create("div", { "class": "pieTooltip" }, this.domNode);
							}
							pieTooltip.innerHTML = run.data[evt.index].tooltip;
							domStyle.set(pieTooltip, { display: "", top: evt.event.layerY - pieTooltip.clientHeight + "px", left: evt.event.layerX - pieTooltip.clientWidth / 2 + "px" });
						}
					}
						// If it's a mouseout event
					else if (type == "onmouseout") {
						if (this.type === "Pie") {
							domStyle.set(pieTooltip, "display", "none");
						}
						//// Set the fill the original fill
						//shape.setFill(shape.originalFill);
					}
				}

			}));
		}


	});

	return oThisClass;
});
