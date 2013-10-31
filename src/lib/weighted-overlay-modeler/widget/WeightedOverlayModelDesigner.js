define([
  "dojo/_base/declare",
  "dojo/_base/array",
  "dojo/on",
  "dojo/Evented",
  "dojo/dom-class",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/form/DropDownButton",
  "dijit/DropDownMenu",
  "dijit/MenuItem",

  "esri/layers/RasterFunction",

  "./containerUtils",
  "./WeightedOverlayLayerEditor",
  "./Colormap",

  "dojo/text!./templates/WeightedOverlayModelDesigner.html",

  "dijit/form/Button",
  "dijit/form/HorizontalSlider",
  "dijit/form/CheckBox"
],

function(
  declare, array, on, Evented, domClass,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container, DropDownButton, DropDownMenu, MenuItem,
  RasterFunction,
  containerUtils, WeightedOverlayLayerEditor, Colormap,
  template
) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container, Evented], {

    // properties
    templateString: template,
    baseClass: "weighted-overlay-model-designer",
    _isValid: false,

    // init widgets
    buildRendering: function() {
      this.inherited(arguments);
      this.colormap = new Colormap({}, this.colorMapNode);
      this.ColormapSelector = new DropDownButton({
        label: "Color Ramp"
      }, this.colormapSelectorNode);
    },

    // init controls for model layer visibility
    postCreate: function() {
      var _this = this;
      var horizontalSlider = this.sliderNode;
      on(horizontalSlider, "change", function (/*e*/){
        if (_this.weightedOverlayService && _this.weightedOverlayService.imageServiceLayer) {
          _this.weightedOverlayService.imageServiceLayer.setOpacity(1 - horizontalSlider.value);
        }
      });
      var chkModelVisible = this.visibleModelNode;
      on(chkModelVisible, "Change", function (/*e*/) {
        if (_this.weightedOverlayService && _this.weightedOverlayService.imageServiceLayer) {
          _this.weightedOverlayService.imageServiceLayer.setVisibility(chkModelVisible.checked);
        }
        //set slider to enable only if chkModelVisible is checked on
        horizontalSlider.disabled = !chkModelVisible.checked;
      });
      //set initial visibilty transparency
      horizontalSlider.set("value", 0);
      chkModelVisible.set('checked', false);
    },

    // property setters
    _setModelAttr: function(newModel) {
      this.setModel(newModel);
    },

    _setWeightedOverlayServiceAttr: function(newWeightedOverlayService) {
      this.setWeightedOverlayService(newWeightedOverlayService);
    },

    // validate model on start up
    startup: function() {
      this.inherited(arguments);
      this.validate();
    },

    // set weighted overlay service
    // and set color map selector options
    setWeightedOverlayService: function(newWeightedOverlayService) {
      var _this = this;
      this.weightedOverlayService = newWeightedOverlayService;
      var menu = new DropDownMenu({style: "display: none;"});
      array.forEach(this.weightedOverlayService.colormapDefinitions, function(colormapDefinition) {
        var menuItem = new MenuItem();
        new Colormap({
          definition: colormapDefinition
        }).placeAt(menuItem.containerNode);
        _this.own(on(menuItem, "Click", function() {
          if (_this.colormap && _this.colormap.definition !== colormapDefinition) {
            _this.colormap.set("definition", colormapDefinition);
          }
          _this.model.colormapDefinition = colormapDefinition;
          _this.runModel();
        }));
        menu.addChild(menuItem);
      });
      this.ColormapSelector.set("dropDown", menu);
    },

    // validate then emit event w/ raster function
    _onRunClick: function() {
      this.runModel();
    },

    // replace existing layer editors with
    // new ones for the each layer
    // update colormap definition
    setModel: function(newModel) {
      var _this = this;
      this.model = newModel;
      containerUtils.removeChildren(this);
      array.forEach(this.model.overlayLayers, function(layer) {
        var layerEditor = new WeightedOverlayLayerEditor({
          overlayLayer: layer
        });
        _this.own(on(layerEditor, "WeightChange", function() {
          _this.validate();
        }));
        layerEditor.startup();
        _this.addChild(layerEditor);
      });
      this.validate();
      this.colormap.set("definition", this.model.colormapDefinition);
    },

    // sum up raster weights and show total
    // if total is not 100% set state to invalid
    // don't let user run model
    validate: function() {
      var totalWeight = 0;
      if (this.model && this.model.overlayLayers) {
        array.forEach(this.model.overlayLayers, function(layer) {
          totalWeight += layer.weight;
        });
      }
      this.weightTotalNode.innerHTML = totalWeight;
      if (totalWeight === 100) {
        this._isValid = true;
        domClass.remove(this.weightTotalWrapper, "validation-error");
      } else {
        this._isValid = false;
        domClass.add(this.weightTotalWrapper, "validation-error");
      }
      this.runModelButton.set("disabled", !this._isValid);
    },

    // validate the form
    // run the model
    runModel: function(model) {
      // validate the model
      this.validate();
      if (this._isValid) {
        // TODO: IMPORTANT! wrap in try catch, show model validation errors if any
        this.weightedOverlayService.runModel(this.model);
        this.showModelLayer();
        this.emit("model-run", this.model);
      }
    },

    // check visible checkbox and show layer
    showModelLayer: function() {
      this.visibleModelNode.set('checked', true);
    }
  });
});
