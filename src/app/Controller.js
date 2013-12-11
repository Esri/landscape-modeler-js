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
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/topic",

  "esri/map",
  "esri/domUtils",
  "esri/config",

  "./MapControls",
  "./ModelerPane",
  "./FeatureLayerPane"
],
function (
  declare, lang, dom, domConstruct, topic,
  Map, domUtils, esriConfig,
  MapControls, ModelerPane, FeatureLayerPane, AreaBreakdown
) {

  return declare(null, {
    constructor: function(args) {
      declare.safeMixin(this, args);
    },
    // instanciate top level widgets
    // and wire up communication between them
    init: function(options) {
      var _this = this;

      // init loading spinner
      this.loadingNode = dom.byId(options.loadingNode);

      // init map
      esriConfig.defaults.io.proxyUrl = this.config.proxyUrl;
      this.map = new Map(options.mapNode, lang.mixin(this.config.mapOptions, {
        sliderPosition: "top-right"
      }));
      this.map.on("update-start", function(){
        _this.showLoading();
      });
      this.map.on("update-end", function(){
        _this.hideLoading();
      });
      this.map.on("layer-add-result", function(results){
        var err = results.error;
        if (err) {
          err.name = "LayerAddError";
          _this.showError(results.error);
        }
        _this.hideLoading();
      });

      // init map controls
      this.mapControls = new MapControls({
        map: this.map
      }, options.mapControlsNode);
      this.mapControls.startup();

      // init app/modeler controls
      this.modelerPane = new ModelerPane({
        map: this.map,
        portalUser: this.portalUser,
        config: this.config // TODO: just the config options relevant to the app
      }, options.modelerNode);
      this.modelerPane.startup();

      // init feature layer controls
      this.featureLayerPane = new FeatureLayerPane({
        map: this.map,
        config: this.config // TODO: just the config options relevant to the feature layer
      }, options.featurePaneNode);
      this.featureLayerPane.startup();
      this.featureLayerPane.on("layer-load-start", function(){
        _this.showLoading();
      });

      // wire up topics for communication between modules
      topic.subscribe(this.config.topics.MODELER_SIGNOUT, function() {
        _this.oAuthHelper.signOut();
      });
    },
    showLoading: function() {
      domUtils.show(this.loadingNode);
    },
    hideLoading: function() {
      domUtils.hide(this.loadingNode);
    },
    showError: function(error) {
      // TODO: replace alert w/ dialog
      window.alert(error.toString());
      console.error(error);
    }
  });
});
