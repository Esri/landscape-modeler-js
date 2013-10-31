define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/on",
  "dojo/Evented",
  "dojo/dom-construct",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "esri/layers/FeatureLayer",
  "esri/dijit/Legend",
  "esri/dijit/editing/Editor",
  "esri/dijit/editing/TemplatePicker",

  "./reports/AreaBreakdown",

  "dojo/text!./templates/FeatureLayerPane.html",
  "dojo/i18n!./nls/resources",

  "dijit/TitlePane",
  "dijit/Dialog",
  "dijit/form/Button",
  "dijit/form/ValidationTextBox",
  "dijit/form/HorizontalSlider",
  "dojo/parser",
  "dojox/validate/regexp"

], function (
  declare, lang, array, on, Evented, domConstruct,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  FeatureLayer, Legend, Editor, TemplatePicker,
  AreaBreakdown,
  template, i18n
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    templateString: template,
    i18n: i18n,
    baseClass: "mdlrFeatureLayerPane",
    featureLayerUrl: "",
    typeField: "",
    // many layer properties are not available
    // until the layer is added to the map,
    // so we have to handle when this layer is loaded
    // and then build the UI based on the layers capabilities
    _setMapAttr: function(newMap) {
      var _this = this;
      // set the reference to the map
      // and listen for layers added
      this.map = newMap;
      this.own(this.map.on("layer-add-result", function(results){
        if (_this.featureLayer && results.layer && results.layer.id === _this.featureLayer.id) {
          if (!results.error) {
            _this._intit();
          }
        }
      }));
    },
    postCreate: function() {
      var _this = this;
      this.inherited(arguments);
      // wire up events
      // only allow valid urls
      this.own(on(this.featureLayerUrlNode, "Change", function(/*e*/) {
        var loadButton = _this.loadButtonNode;
        loadButton.set("disabled", !_this.featureLayerUrlNode.isValid());
        loadButton.focus();
      }));
      // controls to manage layer visibility
      this.own(on(this.visibilityNode, "change", function() {
        _this.setVisibility(this.checked);
      }));
      this.own(on(this.transparencyNode, "Change", function() {
        _this.setTransparency(this.value);
      }));
    },
    setVisibility: function(visible) {
      if (this.visibilityNode.checked !== visible) {
        this.visibilityNode.checked = visible;
      }
      if (this.featureLayer) {
        if (this.visibilityNode.checked) {
          this.featureLayer.show();
        } else {
          this.featureLayer.hide();
        }
      }
    },
    setTransparency: function(transparency) {
      if (transparency >= 0 && transparency <= 1) {
        // keep value in sync
        if (this.transparencyNode.value !== transparency) {
          this.transparencyNode.set("value", transparency);
        }
        if (this.featureLayer) {
          // set feature layer opacity to invers of transparency value
          this.featureLayer.setOpacity(1 - transparency);
          if (this.legend) {
            // refresh legend
            this.legend.refresh();
          }
        }
      }
    },
    _intit: function() {
      var layer = this.featureLayer;
      if (layer) {
        // show layer
        this.setVisibility(true);
        // init layer controls
        this.nameNode.innerHTML = layer.name;
        document.querySelector(".mdlrFeatureLayerVisibility").style["display"] = "";
        // enable remove button
        this.removeFeaturesButton.set("disabled", false);
        // LATER: better check than declaredClass OR add support for class break renderers
        // layer.renderer.infos && layer.renderer.infos.length > 0 && layer.renderer.infos[0].value OR
        if (layer.geometryType === "esriGeometryPolygon" && layer.renderer.attributeField && layer.renderer.declaredClass === "esri.renderer.UniqueValueRenderer") {
          // enable charts
          this.typeField = layer.renderer.attributeField;
          this.showChartsButtonNode.set("disabled", false);
          this.showChartsButtonNode.set("title", "");
          // test for editing
          if (layer.isEditable()) {
            // configure template editor
            if (layer.types && layer.typeIdField) {
              // sort layer types
              if (layer.types.sort) {
                layer.types.sort(function(a, b) {
                  return a.name > b.name;
                });
              }
            }
            // show template picker and editor
            this._showTemplatePicker();
            this._showEditor();
          } else {
            // show legend
            this._initLegend();
          }
        } else {
          this.typeField = null;
          this.showChartsButtonNode.set("disabled", true);
          this.showChartsButtonNode.set("title", "Charts are only available for polygon feature layers with unique value renderers");
          // show legend
          this._initLegend();
        }
      }
    },
    _destroyLayerControls: function() {
      // hide visibility elements
      document.querySelector(".mdlrFeatureLayerVisibility").style["display"] = "none";
      this.nameNode.innerHTML = "";
      // destroy widgets
      if (this.legend) {
        this.legend.destroy();
        this.legend = null;
      }
      if (this.editor) {
        this.editor.destroy();
        this.editor = null;
      }
      if (this.templatePicker) {
        this.templatePicker.destroy();
        this.templatePicker = null;
      }
      if (this.chartPane) {
        this.chartPane.destroy();
        this.chartPane = null;
      }
    },
    _initLegend: function() {
      var layer = this.featureLayer;
      if (layer) {
        this.legend = new Legend({
          map: this.map,
          layerInfos: [{layer:layer, title:""}]
        }, domConstruct.create('div', null, this.legendNode, 'only'));
        this.legend.startup();
      }
    },
    _onLoadFeaturesClick: function(/*e*/) {
      // show load layer dialog
      this.loadDialog.show();
    },
    _showCharts: function(/*e*/) {
      if (this.typeField) {
        // remove if already exists
        if (this.chartPane) {
          this.chartPane.destroy();
          this.chartPane = null;
        }
        // create and show new dashboard report
        this.chartPane = new AreaBreakdown({
          config: this.config,
          fPolygonLayer: this.featureLayer,
          selectedFieldName: this.featureLayer.renderer.attributeField // this.typeField,
        }, domConstruct.create("div", null, this.chartPaneNode));
        this.chartPane.startup();
        this.chartPane.show();
      }
    },
    _onCancelClick: function(/*e*/) {
      this.loadDialog.hide();
    },
    _onLoadClick: function(/*e*/) {
      // validate:
      if (this.featureLayerUrlNode.isValid()) {
        // set the feature layer
        this.setFeatureLayerUrl(this.featureLayerUrlNode.value);
        this.loadDialog.hide();
      }
    },
    setFeatureLayerUrl: function(url) {
      var map = this.map;
      // LATER: merge w/ options from config
      // or load dialog
      var options = {
        id: "featureLayer",
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ['*'],
        visible: this.visibilityNode.checked,
        opacity: 1 - this.transparencyNode.value
      };
      // TODO: validate URL here too?
      if (url) {
        // remove current feature layer if any
        this.removeFeatureLayer();
        // add new feature service to the map
        this.emit("layer-load-start", {
          url: url,
          options: options
        });
        this.featureLayer = new FeatureLayer(url, options);
        map.addLayer(this.featureLayer);
      }
    },
    _showTemplatePicker: function() {
      var container = domConstruct.create('div', null, this.templatePickerNode, 'only');
      this.templatePicker = new TemplatePicker({
        featureLayers: [this.featureLayer],
        grouping: true,
        rows: 'auto',
        columns: 3
      }, container);
      this.templatePicker.startup();
    },
    _showEditor: function () {
      var container = domConstruct.create('div', null, this.editorNode, 'only');
      var settings = {
        map: this.map,
        templatePicker: this.templatePicker,
        layerInfos:[{featureLayer:this.featureLayer}],
        geometryService: this.config.geometryServiceUrl,
        toolbarVisible: true,
        // TODO: set freehand as default
        createOptions: {
          polylineDrawTools:[ Editor.CREATE_TOOL_FREEHAND_POLYLINE],
          polygonDrawTools: [ Editor.CREATE_TOOL_FREEHAND_POLYGON
            ]
        },
        toolbarOptions: {}
      };
      this.editor = new Editor({settings: settings}, container);
      this.editor.startup();
    },
    _onRemoveFeaturesClick: function() {
      this.removeFeatureLayer();
    },
    // remove layer from map
    // and destroy controls
    removeFeatureLayer: function() {
      var layer;
      if (this.featureLayer) {
        if (this.map) {
          layer = this.map.getLayer(this.featureLayer.id);
          if (layer) {
            this.map.removeLayer(layer);
          }
        }
        // destroy controls
        this._destroyLayerControls();
        // disable charts and remove button
        this.showChartsButtonNode.set("disabled", true);
        this.removeFeaturesButton.set("disabled", true);
        // remove the type field
        this.typeField = "";
        // remove the ref to the layer
        this.featureLayer = null;
      }
    }
  });
});
