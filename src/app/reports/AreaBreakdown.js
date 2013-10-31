define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/_base/array",
  "dojo/_base/fx",
  "dojo/fx",
  "dojo/query",
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/dom-attr",
  "dojo/on",
  "dojo/topic",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "esri/tasks/GeometryService",
  "esri/tasks/AreasAndLengthsParameters",

  "./Chart",

  "dojo/text!./templates/AreaBreakdown.html",
  "dojo/i18n!../nls/resources",

  "dijit/form/Button",
  "dijit/form/Select"
], function (
  declare, lang, conn, arrayUtil, fx, coreFx, queryUtil, domStyle, domClass, domConstruct, domAttr, on, topic,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  GeometryService, AreasAndLengthsParameters,
  Chart,
  template, i18n
    //, geometry, Button
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

     i18n: i18n,
     templateString: template,

     isVisible: false,

     selectedFieldName: null,
     // selectedFieldNameValues: [],
     // colors: [],
     dataset: null,
     fPolygonLayer: null,
     projectId: null,
     scenarioId: null,
     _geometryService: null,
     _settingDialog: null,
     // _defaultCharts: [],
     // _histogramCharts: { selectedType: "", charts: [] },
      constructor: function() {
        this.colors = [];
        this.selectedFieldNameValues = [];
        this._defaultCharts = [];
        this._histogramCharts = { selectedType: "", charts: [] };
      },
     postCreate: function () {
       this.inherited(arguments);
       this._geometryService = new GeometryService(this.config.geometryServiceUrl);
       this._createButtons();
       this.isVisible = true;
       if (this.fPolygonLayer.visible) {
         this.selectedFieldNameValues = this._getFieldNameValues();
       }
       this._createData(lang.hitch(this, function (data) {
         // console.log(data);
         //test: create charts
         var chartTitle = this.fPolygonLayer.name + " Area";
         var defaultPie = this.createChart({
           type: "Pie",
           header: chartTitle,
           dataType: "area",
           fPolygonLayer: this.fPolygonLayer,
                          selectedFieldName: this.selectedFieldName
         }, data);
         this._defaultCharts.push(defaultPie);
         var defaultColumns = this.createChart({
           type: "Columns",
           header: chartTitle,
           dataType: "area",
           fPolygonLayer: this.fPolygonLayer,
           selectedFieldName: this.selectedFieldName
         }, data);
         this._defaultCharts.push(defaultColumns);
         // to horizontally center the container
         this.reposition();
       }));
     },
     startup: function () {
       //map updated event handler
       this.own(conn.connect(this.fPolygonLayer, "onUpdateEnd", lang.hitch(this, function () {
         this.refresh();
       })));
       this.own(conn.connect(this.fPolygonLayer, "onEditsComplete", lang.hitch(this, function (/*addResults, updateResults, deleteResults*/) {
         this.refresh();
       })));

       // raster model updated
       this.own(topic.subscribe(this.config.topics.MODELER_MODEL_RUN, lang.hitch(this, function (/*sender, args*/) {
         if (this._histogramCharts.charts.length > 0) {
           this.refresh();
         }
       })));
     },

     showModelCharts: function (args) {
       // console.log(args);
       arrayUtil.forEach(this._defaultCharts, lang.hitch(this, function (chart, index) {
         if (index === this._defaultCharts.length - 1) {
           domClass.add(chart.domNode.parentNode, "rootLevelChart lastChart");
         } else {
           domClass.add(chart.domNode.parentNode, "rootLevelChart");
         }
       }));
       var data = { colors: args.colors, dataset: args.dataset };
       var chartTitle = args.type + " " + args.currentModelName;
       this._histogramCharts.selectedType = args.type;
       if (this._histogramCharts.charts.length === 0) {
         var histogramPie = this.createChart({
           type: "Pie",
           header: chartTitle,
           dataType: "count"
         }, data);
         this._histogramCharts.charts.push(histogramPie);
         var histogramColumns = this.createChart({
           type: "Columns",
           header: chartTitle,
           dataType: "count"
         }, data);
         this._histogramCharts.charts.push(histogramColumns);
         //re-calculate the height for each chart container
         var maxHeight = 0;
         var chartLiContainers = queryUtil(".mdlrCharts li");
         chartLiContainers.forEach(lang.hitch(this, function (li) {
           maxHeight = domStyle.get(li, "height") > maxHeight ? li.clientHeight : maxHeight;
         }));
         chartLiContainers.forEach(lang.hitch(this, function (li) {
           domStyle.set(li, "height", maxHeight + "px");
         }));
         // display close histogram charts icon
         domStyle.set(this.collapseButton, "display", "");
       } else {
         topic.publish('/charts/histogram/Refreshed', this, {
           removedFieldValues: [],
           data: data,
           title: chartTitle
         });
       }
     },
     _createButtons: function(){
       on(this.closeButton, "click", lang.hitch(this, function () {
         fx.fadeOut({
           node: this.domNode,
           onEnd: lang.hitch(this, function () {
             domStyle.set(this.domNode, "display", "none");
             this.isVisible = false;
           })
         }).play();
       }));
       on(this.minimizeRestoreButton, "click", lang.hitch(this, function () {
         if (domClass.contains(this.minimizeRestoreButton, "mdlrChartsHeaderIconMinimize")) {
           domStyle.set(this.domNode, "width", this.domNode.clientWidth + "px");
           coreFx.wipeOut({
             node: this.mdlrCharts,
             onEnd: lang.hitch(this, function () {
               domClass.replace(this.minimizeRestoreButton, "mdlrChartsHeaderIconRestore", "mdlrChartsHeaderIconMinimize");
               domAttr.set(this.minimizeRestoreButton, "title", i18n.dashboard.restore);
             })
           }).play();
         }
         if (domClass.contains(this.minimizeRestoreButton, "mdlrChartsHeaderIconRestore")) {
           coreFx.wipeIn ({
             node: this.mdlrCharts,
             onEnd: lang.hitch(this, function () {
               domClass.replace(this.minimizeRestoreButton, "mdlrChartsHeaderIconMinimize", "mdlrChartsHeaderIconRestore");
               domStyle.set(this.domNode, "width", "auto");
               domAttr.set(this.minimizeRestoreButton, "title", i18n.dashboard.minimize);
             })
           }).play();
         }
       }));
       this.own(on(this.collapseButton, "click", lang.hitch(this, function () {
         arrayUtil.forEach(this._histogramCharts.charts, function (chart) {
           var chartLiNode = chart.domNode.parentNode;
           chart.destroy();
           chartLiNode.parentNode.removeChild(chartLiNode);
         });
         this._histogramCharts.charts = [];
         arrayUtil.forEach(this._defaultCharts, function (chart) {
           domClass.remove(chart.domNode.parentNode, "rootLevelChart lastChart");
         });

        // reset the li height to auto
         var chartLiContainers = queryUtil(".mdlrCharts li");
         chartLiContainers.forEach(lang.hitch(this, function (li) {
           domStyle.set(li, "height", "auto");
         }));

         this.reposition();
        // hide "close histogram charts icon"
         domStyle.set(this.collapseButton, "display", "none");
       })));
     },

     reposition: function () {
       fx.animateProperty({
         node: this.domNode,
         properties: {
           marginLeft: { end: -this.domNode.clientWidth / 2, units: "px" }
         }
       }).play();
     },

     _getFillColors: function (targetFieldArray) {
       var c = {};
       arrayUtil.forEach(this.fPolygonLayer.renderer.infos, lang.hitch(this, function (render) {
         var svalue = render.value;
         var sindex = dojo.indexOf(targetFieldArray, svalue);
         if (sindex > -1) {
           c[svalue] = render.symbol.color.toHex();
         }
       }));
       return c;
     },

     _getFieldNameValues: function(){
       var fieldValues = [];
       arrayUtil.forEach(this.fPolygonLayer.graphics, lang.hitch(this, function (graphic) {
         var value = graphic.attributes[this.selectedFieldName];
         var index = dojo.indexOf(fieldValues, value);
         if (index < 0) {
           if(value){
             fieldValues.push(value);
           }
         }
       }));
       return fieldValues;
     },

     _getTotalArea: function (features, callback) {
       var areasAndLengthParams = new AreasAndLengthsParameters();
       // TODO: get units from config
       areasAndLengthParams.lengthUnit = GeometryService.UNIT_KILOMETER;
       areasAndLengthParams.areaUnit = GeometryService.UNIT_ACRES;
       areasAndLengthParams.calculationType = 'preserveShape';
       var geometries = [];
       arrayUtil.forEach(features, function (feature /*, index*/) {
         geometries.push(feature.geometry);
       });

       this._geometryService.simplify(geometries, lang.hitch(this, function (simplifiedGeometries) {
         areasAndLengthParams.polygons = simplifiedGeometries;
         this._geometryService.areasAndLengths(areasAndLengthParams, function (result) {
           dojo.forEach(result.areas, function (a, index) {
             features[index].area = a;
           });
           if (callback) {
             callback(features);
           }
         }, function (error) {
           console.out("Error: ", error);
         });
       }));

     },

     _createData: function (callback) {
      // get current map extent
      var mapExtent;
      if (this.fPolygonLayer && this.fPolygonLayer._map) {
        mapExtent = this.fPolygonLayer._map.extent;
      }
       this.dataset = arrayUtil.map(this.selectedFieldNameValues, lang.hitch(this, function (type) {
         return { name: type, value: 0 };
       }));
       // object that stores geometries by field namne
       var allFeatures = [];
       //get colors for the selected types
       this.colors = this._getFillColors(this.selectedFieldNameValues);

       // query data
       var mapHasGraphics = false; // whether map has graphics
       if (this.fPolygonLayer.visible && this.dataset.length > 0) {
         arrayUtil.forEach(this.fPolygonLayer.graphics, lang.hitch(this, function (graphic) {
           var value = graphic.attributes[this.selectedFieldName];
           var index = dojo.indexOf(this.selectedFieldNameValues, value);
           if (index > -1) {
            // filter to features w/in current extent
            if(mapExtent && mapExtent.contains(graphic.geometry.getExtent())) {
               allFeatures.push({ name: value, geometry: graphic.geometry, area: 0 });
               if (!mapHasGraphics) {
                 mapHasGraphics = !mapHasGraphics;
               }
            }
           }
         }));
         this._getTotalArea(allFeatures, lang.hitch(this, function () {
           // console.log(allFeatures.length);
           // sanity check on input/output of simplified?
           arrayUtil.forEach(allFeatures, lang.hitch(this, function (feature) {
             var name = feature.name;
             arrayUtil.forEach(this.dataset, function (obj) {
               if (obj.name === name) {
                 obj.value += feature.area;
               }
             });
           }));
           if (mapHasGraphics) {
             callback({
               colors: this.colors,
               dataset: this.dataset
             });
           } else {
             callback(
              null
            );
           }
         }));
       } else {
         callback(
          null
        );
       }
       this.featureCountNode.innerHTML = allFeatures.length;
     },

     createChart: function (params, data) {
      var _this = this;
       var chartLi = domConstruct.create("li", null, this.mdlrCharts);
       var chartDiv = domConstruct.create("div", null, chartLi);
       var chart = new Chart({
         type: params.type,
         header: params.header,
         keyType: params.keyType ? params.keyType : null,
         data: data,
         dataType: params.dataType,
         fPolygonLayer: params.fPolygonLayer,
                    selectedFieldName: params.selectedFieldName
       }, chartDiv);
        this.reposition();
       this.own(chart.on("type-select", function(args) {
        topic.publish(_this.config.topics.CHART_FEATURETYPE_SELECTED, _this, args);
       }));
       return chart;
     },

     refresh: function () {
       if (this.isVisible) {
         // console.log("dashboard refreshed");
         var oldFieldNameValues = this.selectedFieldNameValues;
         this.selectedFieldNameValues = this._getFieldNameValues();
         // find fields that are no longer available
         var removedFieldvalues = [];
         arrayUtil.forEach(oldFieldNameValues, lang.hitch(this, function (oldValue) {
           var index = dojo.indexOf(this.selectedFieldNameValues, oldValue);
           if (index < 0) {
             removedFieldvalues.push(oldValue);
           }
         }));

         this._createData(lang.hitch(this, function (data) {
           topic.publish('/charts/area/Refreshed', this, {
             removedFieldValues: removedFieldvalues,
             data: data
           });
         }));

        // update histogram charts
         if (this._histogramCharts.charts.length > 0) {
           var geometries = [];
           var fPolygonLayer = this.fPolygonLayer;
           var selectedType = this._histogramCharts.selectedType;
           arrayUtil.forEach(fPolygonLayer.graphics, lang.hitch(this, function (graphic) {
             if (graphic.attributes[this.selectedFieldName] === selectedType) {
               geometries.push(graphic.geometry);
             }
           }));
           topic.publish(this.config.topics.CHART_FEATURETYPE_SELECTED, this, {
             type: selectedType,
             geometries: geometries
           });
         }
        }
     },

     show: function () {
       this.isVisible = true;
       domStyle.set(this.domNode, "display", "");
       fx.fadeIn({
         node: this.domNode
       }).play();
     }
  });
});
