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
define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/on",
        "dojo/_base/Color",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/text!./templates/Colormap.html",
        "dojo/i18n!./nls/resources"],
function(declare, lang, array, on, Color, domConstruct, domStyle,
         _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
         template, i18n) {

  var oThisClass = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

    definition: null,
    showLabels: true,
    i18n: i18n,
    templateString: template,
    _setDefinitionAttr: function(newDefinition) {
      this.definition = newDefinition;
      var parentNode = this.__colorsNode;
      parentNode.innerHTML = "";
      if (this.definition.colors) {
        array.forEach(this.definition.colors,lang.hitch(this,function(colorDef){
          this._addColor(parentNode,colorDef);
        }));
      }
    },

    postCreate: function() {
      this.inherited(arguments);
      if (!this.showLabels) {
        this.__lowNode.style.display = "none";
        this.__highNode.style.display = "none";
      }
    },

    _addColor: function(parentNode,colorDef) {
      var sTip = null, s1 = colorDef.label, s2 = colorDef.value;
      if (s1) {
        s1 = s1.trim();
      }
      if (s2) {
        s2 = (""+s2).trim();
      }
      if (s1 && (s1.length > 0) && s2 && (s2.length > 0)) {
        var s = this.i18n.colorRamp.tipPattern;
        s = s.replace("{label}",s1);
        s = s.replace("{value}",s2);
        sTip = s;
      } else if (s1 && (s1.length > 0)) {
        sTip = s1;
      } else if (s2 && (s2.length > 0)) {
        sTip = s2;
      }

      var c = new Color(colorDef.rgb);
      var el = domConstruct.create("span",{className: "modeler-color-ramp-color"});
      domStyle.set(el,"backgroundColor",c.toCss());
      if (sTip && (sTip.length > 0)) {
        el.title = sTip;
      }
      parentNode.appendChild(el);
    }
  });
  return oThisClass;
});