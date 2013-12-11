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

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/TooltipDialog",
  "dijit/popup",

  "esri/IdentityManager",
  "esri/request",
  "esri/layers/ArcGISImageServiceLayer",

  "./containerUtils",

  "dojo/text!./templates/WeightedOverlayLayerSelector.html",

  "dijit/form/HorizontalSlider",
  "dijit/form/Button"
],
function(declare, lang, array, on, Evented,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container, TooltipDialog, popup,
  IdentityManager, esriRequest, ArcGISImageServiceLayer,
  containerUtils,
  template,
  HorizontalSlider
) {

  // static counter
  var uniqueIndex = 0;

  // private helper methods
  var setUrl = function(map, url, options) {
    var layer = map.getLayer(options.id);
    if (layer){
      if (layer.url === url) {
        return layer;
      }
      map.removeLayer(layer);
    }
    var imageServiceLayer = new ArcGISImageServiceLayer(url, options);
    return map.addLayer(imageServiceLayer);
  };

  var getItemInfo = function(serviceUrl) {
    var url = serviceUrl + "/info/iteminfo";
    return esriRequest({
      url: url,
      content: { f: "json" },
      handleAs: "json",
      callbackParamName: "callback"
    });
  };

  // private child layer selector widget
  var WeightedOverlayLayerSelector = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    templateString: template,
    baseClass: "weighted-overlay-layer-selector",

    // update controls to work w/ new layer
    _setRasterLayerAttr: function(newRasterLayer) {
      this.chkModelLayer.setAttribute("value", newRasterLayer.id.toString());
      this.chkModelLayer.setAttribute("title", newRasterLayer.title);
      this.txtLabel.innerHTML = newRasterLayer.title;
    },
    _setTooltipDialogAttr: function(newTooltipDialog) {
      var _this = this;
      this.tooltipDialog = newTooltipDialog;
      this.own(on(newTooltipDialog,"MouseLeave", function() {
        popup.close(_this.tooltipDialog);
      }));
    },
    // wire up:
      // label to checkbox
      // tooltip to button
      // all events
    postCreate: function() {
      var _this = this;
      var checkbox = this.chkModelLayer;
      var btnInfo = this.btnInfo;

      // get unique id for checkbox and label
      checkbox.id = checkbox.name + "_" + uniqueIndex++;
      this.txtLabel.setAttribute("for", checkbox.id);

      // Preview
      if (this.showPreview && this.rasterLayer.url) {
        this.own(on(this.btnPreview, "click", function(/*e*/) {
          _this.emit("PreviewClick", _this.rasterLayer.url,_this.btnPreview);
        }));
      } else {
        if (!this.btnPreview.style) {
          this.btnPreview.style = {};
        }
        this.btnPreview.set("style", {display: "none"});
      }

      // Info
      if (this.showInfo && this.rasterLayer.url) {
        this.own(on(btnInfo, "click", function(/*e*/) {
          _this.showInfoTooltip();
        }));
      } else {
        this.btnInfo.set("style", {display: "none"});
      }
    },

    showInfoTooltip: function() {
      var _this = this;
      if (this.rasterLayer && this.rasterLayer.infoText) {
        this._showInfoTooltip(this.rasterLayer.infoText);
      } else {
        if (this.rasterLayer.url) {
          getItemInfo(this.rasterLayer.url).then(function(response) {
            _this.rasterLayer.infoText = response.snippet || response.summary || response.description;
            _this._showInfoTooltip(_this.rasterLayer.infoText);
          });
        }
      }
    },

    _showInfoTooltip: function(content) {
      var url,
        credential;
      if (this.tooltipDialog) {
        popup.close(this.tooltipDialog);

        // adding url here as cannot access the REST URL within the getItemInfo in above function
        // check for token and append if any
        url = this.rasterLayer.url;
        credential = IdentityManager.findCredential(url);
        if (credential && credential.token) {
          url += (url.indexOf("?") > -1 ? "&" : "?") + "token=" + credential.token;
        }
        content += " <a href=" + url + " target='_blank'>Read More</a>";

        this.tooltipDialog.set("content", content);
        popup.open({
          popup: this.tooltipDialog,
          around: this.btnInfo.domNode,
          orient: ["after-centered","after"]
        });
      }
    },

    setSelected: function(selected) {
      this.chkModelLayer.checked = selected;
    }
  });

  // public container widget to manage multiple
  // layer selector widgets
  return declare([_WidgetBase, _Container, Evented], {

    // properties
    showPreview: true,
    showInfo: true,

    // property setters
    _setWeightedOverlayServiceAttr: function(newWeightedOverlayService) {
      this.setWeightedOverlayService(newWeightedOverlayService);
    },

    _setModelAttr: function(newModel) {
      this.setModel(newModel);
    },

    // add a slider for preview layer transparency
    // add a tooltip dialog for overlay layer info
    buildRendering: function() {
      this.inherited(arguments);
      var previewSliderNode = document.createElement("div");
      var labelNode = document.createElement("label");
      labelNode.innerHTML = "Transparency:";
      previewSliderNode.appendChild(labelNode);
      this.domNode.appendChild(previewSliderNode);
      this.previewSlider = new HorizontalSlider({
        minimum: 0,
        maximum:1,
        value: 0.2,
        intermediateChanges:true,
        showButtons:false,
        "class": "modeler-transparency-slider"
      });
      this.previewSlider.placeAt(previewSliderNode, "last");
      // create discrete container node for child widgets
      // (otherwise it will be the domNode)
      this.containerNode = document.createElement("div");
      this.containerNode.setAttribute("class", "modeler-scroll-panel");
      this.domNode.appendChild(this.containerNode);
      this.tooltipDialog = new TooltipDialog({
        style: "width: 300px;"
      });
    },

    // wire up events
    postCreate: function() {
      var _this = this;
      this.own(on(this.containerNode, "change", function(e) {
        _this._onContainerNodeChange(e);
      }));
      this.own(on(this.previewSlider, "change", function (/*e*/){
        _this.updatePreviewOpacity();
      }));
    },

    // add/remove layers from model on check toggle
    _onContainerNodeChange: function(e) {
      var target = e.target;
      var id, overlayLayer;
      // TODO: test for name instead?
      if (target.type === "checkbox") {
        id = this._getLayerIdFromCheckbox(target);
        if (target.checked) {
          overlayLayer = this.getOverlayLayer(id);
          try {
            this.addOverlayLayer(overlayLayer || {
              id: id,
              weight: 0
            });
          } catch(ex) {
            // show error and uncheck the checkbox
            this._showError(ex);
            e.target.checked = false;
          }
        } else {
          this.removeOverlayLayer(id);
        }
      }
    },

    // parse layer id from checkbox value
    _getLayerIdFromCheckbox: function(checkbox) {
      var id;
      try {
        id = parseInt(checkbox.value, 10);
      } catch(ex) {
        id = checkbox.value;
      }
      return id;
    },

    // show error message
    _showError: function(error) {
      // TODO: add error message UI
      window.alert(error);
    },

    // remove existing layer nodes
    // add new nodes for each raster in the service
    // select the ones that are in the model
    setWeightedOverlayService: function(newWeightedOverlayService) {
      var _this = this;
      this.weightedOverlayService = newWeightedOverlayService;
      containerUtils.removeChildren(this);
      array.forEach(this.weightedOverlayService.rasterLayers, function(rasterLayer) {
        // get overlay from model
        var overlayLayer = _this.getOverlayLayer(rasterLayer.id);
        var widget = new WeightedOverlayLayerSelector({
          rasterLayer: rasterLayer,
          tooltipDialog: _this.tooltipDialog,
          showPreview: _this.showPreview,
          showInfo: _this.showInfo
        });
        widget.setSelected(overlayLayer ? true : false);
        widget.startup();
        // TODO: use event delegation and move to postCreate
        this.own(on(widget, "PreviewClick", function(url,btnPreview) {
          _this._OnPreviewClick(url, btnPreview);
        }));
        _this.addChild(widget);
      }, this);
    },

    // clear previously selected layers
    // select layers in this model
    setModel: function(newModel) {
      this.model = newModel;
      var checkboxes = this.containerNode.querySelectorAll('input[name="selectedLayers"]');
      array.forEach(checkboxes, function(checkbox) {
        var id = this._getLayerIdFromCheckbox(checkbox);
        checkbox.checked = array.some(this.model.overlayLayers, function(overlayLayer) {
          return overlayLayer.id === id;
        });
      }, this);
    },

    _OnPreviewClick: function(url, btnPreview) {
      var _this = this;
      if (url) {
        if (this._selectedPreviewNode &&_this._previewLayer && (_this._previewLayer.url === url)) {
          // button toggled - hide the layer
          _this.hidePreviewLayer();
        } else {
          // some other button was clicked
          // update and show the preview layer
          _this._setPreviewLayer(url);
          // set the selected button
          _this._setSelectedPreviewNode(btnPreview);
        }
      }
    },

    // hide the preview layer and update selected button
    hidePreviewLayer: function() {
      if (this._previewLayer) {
        this._previewLayer.hide();
      }
      if (this._selectedPreviewNode) {
        this._selectedPreviewNode.set("iconClass", "icon-globe");
        this._selectedPreviewNode = null;
      }
    },

    // set preview layer url,
    // update opacity based on slide
    // and show the layer
    _setPreviewLayer: function(url) {
      var opts = lang.mixin({
        id: "preview"
      }, this.previewLayerOptions);
      this._previewLayer = setUrl(this.map, url, opts);
      this.updatePreviewOpacity();
      this._previewLayer.show();
    },

    // set opacity of preview layer based on slider
    updatePreviewOpacity: function() {
      if (this._previewLayer) {
        this._previewLayer.setOpacity(1 - this.previewSlider.value);
      }
    },

    // show the preview layer
    showPreviewLayer: function() {
      if (this._previewLayer) {
        this._previewLayer.show();
      }
    },

    // and update the selected button
    _setSelectedPreviewNode: function(selectedNode) {
      if (this._selectedPreviewNode) {
        this._selectedPreviewNode.set("iconClass","icon-globe");
      }
      this._selectedPreviewNode = selectedNode;
      selectedNode.set("iconClass", "icon-globe icon-white");
    },

    // verify that model is not at max number of layers
    // verify that layer exists in serivce and
    // get layer raster id/url from service
    // remove layer if aleardy in model
    // add updated layer to model
    addOverlayLayer: function(layer) {
      var maxLayers,
        rasterLayer;
      if (this.weightedOverlayService) {
        maxLayers = this.weightedOverlayService.rastersInFunction;
        if (this.model.overlayLayers.length < maxLayers || !maxLayers) {
          rasterLayer = this.weightedOverlayService.getRasterLayer(layer.id);
          if (rasterLayer) {
            layer.name = rasterLayer.name;
            layer.url = rasterLayer.url;
            layer.title = rasterLayer.title;
            if(!layer.remapRanges) {
              layer.remapRanges = rasterLayer.remapRanges;
            }
            this.removeOverlayLayer(layer.id);
            this.model.overlayLayers.push(layer);
          } else {
            throw "Layer " + layer.id + " not found in weighted overlay service";
          }
        } else {
          throw "Maximum of " + maxLayers + " layers allowed by service, you must first remove a layer before adding a new one.";
        }
      } else {
        throw "No weighted overlay service defined for model.";
      }
    },

    // get an overlay layer from the model by id
    getOverlayLayer: function(id) {
      var overlayLayer;
      array.some(this.model.overlayLayers, function(layer) {
        if (layer.id === id) {
          overlayLayer = layer;
          return false;
        }
      });
      return overlayLayer;
    },

    // remove an overlay layer (if exists) from the model by id
    removeOverlayLayer: function(id) {
      var overlayLayers = this.model.overlayLayers;
      var len = overlayLayers.length;
      for (var i = 0; i < len ; i++) {
        if (overlayLayers[i].id === id) {
          overlayLayers.splice(i, 1);
          break;
        }
      }
    }
  });
});
