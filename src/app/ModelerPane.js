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
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/on",
  "dojo/Evented",
  "dojo/topic",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/dom-attr",
  "dojo/Deferred",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/form/Button",

  "esri/layers/ArcGISImageServiceLayer",
  "esri/geometry/Extent",
  "esri/tasks/GeometryService",
  "esri/tasks/ProjectParameters",
  "esri/domUtils",

  "modeler/WeightedOverlayService",
  "modeler/widget/WeightedOverlayLayersSelector",
  "modeler/widget/WeightedOverlayModelDesigner",

  "./geometryUtils",
  "./portal/PortalControls",
  "./reports/chartUtils",

  "dojo/text!./templates/ModelerPane.html",
  "dojo/i18n!./nls/resources",

  "dijit/form/Button"
],
function (
  declare, lang, array, on, Evented, topic, dom, domConstruct, domAttr, Deferred,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Button,
  ArcGISImageServiceLayer, Extent, GeometryService, ProjectParameters, domUtils,
  WeightedOverlayService, WeightedOverlayLayersSelector, WeightedOverlayModelDesigner,
  geometryUtils,
  PortalControls, chartUtils,
  template, i18n
) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    templateString: template,
    i18n: i18n,
    baseClass: "mdlrAppPane",

    _setPortalUserAttr: function(newPortalUser) {
      this.portalUser = newPortalUser;
      // show logged in user name
      this.userNameNode.innerHTML = this.portalUser.fullName;
      // reset portal controls?
      if (this.portalControls && this.portal.set) {
        this.portalControls.set("portal", this.portalUser.portal);
      }
    },

    // read config to set the app/page title, help link
    // and initialize the geometry service
    postCreate: function() {
      this.inherited(arguments);
      this.appTitleNode.innerHTML = this.config.appTitle;
      document.title = this.config.appTitle;
      domAttr.set(this.helpLink, "href", this.config.helpUrl);
      this._geometryService = new GeometryService(this.config.geometryServiceUrl);
    },

    // cretate weighted overlay image service
    // get raster info from service
    // then initialize remaining widgets
    startup: function() {
      this.inherited(arguments);
      var _this = this;
      this.weightedOverlayService = new WeightedOverlayService(
        new ArcGISImageServiceLayer(this.config.weightedOverlayService.url),
        this.config.weightedOverlayService.options);
      this.own(this.weightedOverlayService.imageServiceLayer.on("load", function(loadResults) {
        _this.weightedOverlayServiceSR = loadResults.layer.spatialReference;
      }));
      this.weightedOverlayModel = this.weightedOverlayService.createNewModel();
      this.weightedOverlayService.initRasterLayers().then(function(/*rasterLayers*/){
        _this._init();
      });
    },

    // init widgets and wire up events/topics
    _init: function() {
      var _this = this;

      // init portal controls
      this.portalControls = new PortalControls(lang.mixin(this.config.portalOptions, {
        map: this.map,
        portal: this.portalUser.portal,
        weightedOverlayService: this.weightedOverlayService
      }), this.portalControlsNode);
      this.portalControls.startup();
      this.portalControls.on("item-loaded", function(loadedItem) {
        _this.modelItemLoaded(loadedItem);
      });
      this.portalControls.startup();

      // init select layers view
      this.selectLayersView = new WeightedOverlayLayersSelector({
        model: this.weightedOverlayModel,
        weightedOverlayService: this.weightedOverlayService,
        map: this.map,
        previewLayerOptions: {
          id: "preview",
          visible: false
        }
      }, this.selectLayersNode);
      this.selectLayersView.startup();

      // init design model view
      this.designModelView = new WeightedOverlayModelDesigner({
         model: this.weightedOverlayModel,
         weightedOverlayService: this.weightedOverlayService
      }, this.designModelNode);
      this.designModelView.startup();

      // when a model is run
        // enable saving
        // hide the preview layer
        // notify the rest of the app
      this.own(on(this.designModelView, "model-run", function(model) {
        _this.weightedOverlayModel = model;
        _this.portalControls.set("model", model);
        _this.selectLayersView.hidePreviewLayer();
        topic.publish(_this.config.topics.MODELER_MODEL_UPDATED, _this, {
          model: model
        });
      }));

      // when a model is cleared
        // disable saving of model
        // clear model title/description
        // update selected layers
        // notify the rest of the app
      this.own(on(this.designModelView, "model-clear", function(model) {
        var modelItem;
        _this.weightedOverlayModel = model;
        if (_this.portalControls) {
          _this.portalControls.set("model", null);
          modelItem = _this.portalControls.modelItem;
          if (modelItem) {
            modelItem.title = "";
            modelItem.description = "";
            _this.portalControls.set("modelItem", modelItem);
          }
        }
        _this.selectLayersView.set("model", model);
        topic.publish(_this.config.topics.MODELER_MODEL_UPDATED, _this, {
          model: model
        });
      }));

      // adding model layer to the map
      this.map.addLayer(this.weightedOverlayService.imageServiceLayer);

      // respond to topics
      topic.subscribe(this.config.topics.CHART_FEATURETYPE_SELECTED, function (sender, args) {
        var data = {
          type: args.type,
          currentModelName: _this.portalControls ? _this.portalControls.getTitle() : ""
        };
        if (args.geometries.length > 0) {
          _this.getChartData(args.geometries).then(function(chartData) {
            data.dataset = chartData.dataset;
            data.colors = chartData.colors;
            sender.showModelCharts(data);
          });
        }
      });

      // finally, load default model if any
      if (this.config.modelItemId) {
        this.portalControls.loadModelItem(this.config.modelItemId);
      }
    },

    // hide model design view and
    // show select layers view
    showSelectOverlayLayersView: function() {
      domUtils.hide(this.designModelViewNode);
      domUtils.show(this.selectLayersViewNode);
    },

    // hide model design view and
    // show select layers view
    showDesignModelView: function() {
      // update design view's model
      this.designModelView.set("model", this.weightedOverlayModel);
      domUtils.hide(this.selectLayersViewNode);
      domUtils.show(this.designModelViewNode);
    },
    // whenever an item is loaded from portal:
      // get the model from the item data
      // update the select model layers view
      // update the design model view
      // show the design model tab
      // run the model
    modelItemLoaded: function(loadedItem) {
      var itemData = loadedItem.itemData;
      if (itemData) {
        if (itemData.operationalLayers) {
          // loading a web map
          // parse model properties out of rendering rule
          // TODO: this.set("weightedOverlayModel")
          this.weightedOverlayModel = this.weightedOverlayService.operationalLayersToModel(itemData.operationalLayers);
          if (itemData.mapOptions && itemData.mapOptions.extent) {
            // set map extent
            this.map.setExtent(new Extent(itemData.mapOptions.extent));
          }
          // LATER: model layer basemap?
        } else {
          // loading an image service layer
          this.weightedOverlayModel = this.weightedOverlayService.imageServiceLayerToModel(itemData);
        }
        // LATER: model layer opacity?
        // update model designer controls w/ new web map
        this.selectLayersView.set("model", this.weightedOverlayModel);
        this.showDesignModelView();
        // run model
        this.designModelView.runModel();
      }
    },

    // get breakdown of model data (histogram)
    // when the user selects a specific type of feature
    getChartData: function(geometries) {
      var _this = this;
      return this.getModelPixelSize({forceSquare: true}).then(function(modelPixelSize) {
        var polygon = geometryUtils.createMergedPolygon(geometries, geometries[0].spatialReference);
        return _this.weightedOverlayService.getHistogram(_this.weightedOverlayModel, polygon, {
          pixelSize: modelPixelSize
        }).then(function(histogram) {
          // convert histogram pixels to area units using pixel size
          var conversionFactor;
          if (_this.config && _this.config.areaUnit && _this.config.areaUnit.conversionFactor > 0) {
            conversionFactor = _this.config.areaUnit.conversionFactor;
          } else {
            conversionFactor = 1;
          }
          histogram.counts = array.map(histogram.counts, function(count) {
            return count * modelPixelSize.x * modelPixelSize.y * conversionFactor;
          });
          return chartUtils.getChartData(_this.weightedOverlayModel.colormapDefinition, histogram);
        });
      });
    },

    getModelPixelSize: function(options) {
      var _this = this;
      var params;
      var def;
      var opts;
      if (this.weightedOverlayService && this.weightedOverlayService.imageServiceLayer && this.weightedOverlayService.imageServiceLayer.spatialReference && this.map && this.map.extent) {
        opts = lang.mixin(options, {
          width: _this.map.width,
          height: _this.map.height
        });
        if (this.map.extent.spatialReference.wkid !== this.weightedOverlayService.imageServiceLayer.spatialReference.wkid) {
          // reproject extent to image service SRID
          params = new ProjectParameters();
          params.geometries = [this.map.extent];
          params.outSR = this.weightedOverlayService.imageServiceLayer.spatialReference;
          return this._geometryService.project(params).then(function(projectedGeometries) {
            return _this.weightedOverlayService.getModelPixelSize(projectedGeometries[0], opts);
          });
        } else {
          // same ref as weighted overlay service
          // no need to reproject
          def = new Deferred();
          def.resolve(this.weightedOverlayService.getModelPixelSize(this.map.extent, opts));
          return def;
        }

      } else {
        def = new Deferred();
        def.reject('Map or image service not initialized');
        return def;
      }
    },

    _onDesignModelButtonClick: function(/*e*/) {
      this.showDesignModelView();
    },

    _onSelectLayersButtonClick: function(/*e*/) {
      this.showSelectOverlayLayersView();
    },

    _onLogOutClick: function(e) {
      e.preventDefault();
      topic.publish(this.config.topics.MODELER_SIGNOUT);
    }
  });
});
