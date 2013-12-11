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
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/number",
  "dojo/string",
  "dojo/Evented",
  "dojo/_base/fx",
  "dojo/fx",


  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",

  "./containerUtils",

  "dojo/text!./templates/RemapRangeEditor.html",
  "dojo/text!./templates/WeightedOverlayLayerEditor.html",

  "dijit/form/Button",
  "dijit/form/NumberTextBox",
  "dijit/form/HorizontalSlider"
],
function(
  declare, lang, array, on, domStyle, domClass, number, string, Evented, fx, coreFx,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container,
  containerUtils,
  remapRangeEditorTemplate, template,
  Button, NumberTextBox, HorizontalSlider
) {

  var getRangeMinMaxString = function(remapRange) {
    var rangeString;
    if (remapRange.inputMin === remapRange.inputMax) {
      rangeString = remapRange.inputMin + "";
    } else {
      rangeString = remapRange.inputMin + " - " + remapRange.inputMax;
    }
    return rangeString;
  };

  // private widget for editing an individual range
  var RemapRangeEditor =  declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    // properties
    templateString: remapRangeEditorTemplate,
    baseClass: "reclass-range-editor",

    // custom setters
    _setRemapRangeAttr: function(remapRange) {
      var inputMinMax =  " (" + getRangeMinMaxString(remapRange) + ")";
      this.labelNode.innerHTML = remapRange.label.substr(0,14)+(remapRange.label.length>15?'&hellip;':'') + inputMinMax;
      this.labelNode.title = remapRange.label + inputMinMax;
      this.outputValueNode.set("value", remapRange.outputValue);
    },

    // init number text box and slider and wire up events
    postCreate: function() {
      var _this = this;
      this.inherited(arguments);
      this.outputValueNode.set("constraints", {round:0});
      this.sliderObject = new HorizontalSlider({
        name: "slider",
        value: this.outputValueNode.value,
        // TODO: get these defaults from properties and/or config
        minimum: 0,
        maximum: 9,
        intermediateChanges: true,
        discreteValues: 10,
        style: "width: 100px;"
      }, this.slider);
      this.sliderObject.startup();
      this.own(on(this.sliderObject, "Change", function(value) {
        _this.outputValueNode.set("value", value);
      }));
      this.own(on(this.outputValueNode, "Change", function(value) {
        _this.remapRange.outputValue = value;
        _this.sliderObject.set("value", value);
      }));
    },

    // set the valid range for output values
    setOutputRange: function(min, max) {
      var numTextBox = this.outputValueNode;
      var rangeMessage = string.substitute("Value must be between ${0} and ${1}", [min, max]);
      numTextBox.set("constraints", {min: min, max: max});
      numTextBox.set("rangeMessage", rangeMessage);
      this.sliderObject.set({minimum: min, maximum: max});
    }
  });

  // private container widget for editing a set of ranges
  var RemapRangesEditor = declare([_WidgetBase, _TemplatedMixin, _Container, Evented], {

    // properties
    templateString: '<div><table class="${baseClass}-table"><tbody data-dojo-attach-point="containerNode"></tbody></table></div>',
    minOutputValue: 0,
    maxOutputValue: 0,
    baseClass: "remap-ranges-editor",

    // custom setters
    // refresh child editor nodes based on ranges
    _setRemapRangesAttr: function(newRemapRanges) {
      var _this = this;
      var editor;
      containerUtils.removeChildren(this);
      array.forEach(newRemapRanges, function(remapRange) {
        // set label to "min - max" if not alerady set
        // TODO: should this be set in model?
        if (!remapRange.label) {
          remapRange.label = remapRange.inputMin + " - " + remapRange.inputMax;
        }
        editor = new RemapRangeEditor({remapRange: remapRange});
        // TODO: pass as properties to constructor once refactored
        editor.setOutputRange(_this.minOutputValue, _this.maxOutputValue);
        _this.addChild(editor);
      });
    },

    // get remap ranges from editor nodes
    getRemapRanges: function() {
      var remapRanges = [];
      array.forEach(this.getChildren(), function(editorWidget) {
        remapRanges.push(editorWidget.getRemapRange());
      });
      return remapRanges;
    }
  });

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container, Evented], {

    // properties
    templateString: template,
    baseClass: "weighted-overlay-layer-editor",

    // custom setters
    _setOverlayLayerAttr: function(newOverlayLayer) {
      var _this = this;
      this.weightNode.set("value", newOverlayLayer.weight);
      this.labelNode.innerHTML = newOverlayLayer.title;
      this.remapRangesEditor = new RemapRangesEditor({
        // TODO: get min/max from colormap or config
        minOutputValue: 0,
        maxOutputValue: 9,
        remapRanges: newOverlayLayer.remapRanges
      }, _this.remapRangesEditorContainer);

    },

    postCreate: function() {
      this.inherited(arguments);
      this.attachWeightingToggle();
    },

    // drop down to show remap ranges
    attachWeightingToggle: function() {
      domStyle.set(this.remapRangesEditorWrapper, "display", "none");
      this.own(on(this.layerNode, "click", lang.hitch(this, function () {
        if (domClass.contains(this.iconNode, "icon-chevron-right")) {
          coreFx.wipeIn({
            node: this.remapRangesEditorWrapper,
            onEnd: lang.hitch(this, function () {
              domClass.replace(this.iconNode, "icon-chevron-down", "icon-chevron-right");
            })
          }).play();
        } else {
          coreFx.wipeOut ({
            node: this.remapRangesEditorWrapper,
            onEnd: lang.hitch(this, function () {
              domClass.replace(this.iconNode, "icon-chevron-right", "icon-chevron-down");
            })
          }).play();
        }
      })));
    },

    // are the layer parameters valid
    isValid: function() {
      // TODO: what about remap ranges being valid
      return this.weightNode.isValid();
    },

    // attach events
    _onWeightChange: function() {
      var value = parseInt(this.weightNode.valueNode.value, 10);
      value = (isNaN(value)) ? 0 : value;
      // TODO: make sure it's valid befor setting layer weight?
      this.overlayLayer.weight = value;
      this.emit("WeightChange", value);
    },
    _onFocus: function() {
      this.weightNode.focusNode.select();
    },
    _onBlur: function() {
      var value = parseInt(this.weightNode.valueNode.value, 10);
      if (isNaN(value)) {
        this.weightNode.value = 0;
        this.emit("WeightChange", value);
      }
    }
  });
});
