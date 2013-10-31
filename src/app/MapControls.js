define([
  "dojo/_base/declare",
  "dojo/_base/array",
  "dojo/on",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "esri/dijit/BasemapGallery",
  "esri/dijit/Geocoder",

  "dojo/text!./templates/MapControls.html",
  "dojo/i18n!./nls/resources",

  "dijit/TitlePane",
  "dijit/layout/ContentPane"
], function (
  declare, array, on,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  BasemapGallery, Geocoder,
  template, i18n
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,
    i18n: i18n,
    baseClass: "mdlrMapControls",
    // set local reference to map and
    // (re)create the basemap gallery and geocoder widgets
    _setMapAttr: function(newMap) {
      var _this = this;
      this.map = newMap;
      if (this.basemapGallery) {
        this.basemapGallery.destroy();
      }
      this.basemapGallery = new BasemapGallery({
        showArcGISBasemaps: true,
        map: this.map
      }, this.basemapGalleryNode);
      this.basemapGallery.startup();
      // close the basemap gallery after selected
      this.own(on(this.basemapGallery, "SelectionChange", function() {
        _this.updateMapBasemapInfo();
        _this.basemapGalleryTitlePane.toggle();
      }));
      if (this.geocoder) {
        this.geocoder.destroy();
      }
      this.geocoder = new Geocoder({
         map: this.map
      }, this.geocoderNode);
      this.geocoder.startup();
    },
    updateMapBasemapInfo: function() {
      var selectedBasemap = this.basemapGallery.getSelected();
      var basemapLayerIds = [];
      if (selectedBasemap) {
        array.forEach(this.map.layerIds, function(layerId) {
          var layer = this.map.getLayer(layerId);
          if (array.some(selectedBasemap.layers, function(basemapLayer) {return basemapLayer.url === layer.url;})) {
            basemapLayerIds.push(layer.id);
          }
        }, this);
        if (basemapLayerIds.length > 0) {
          this.map.basemapLayerIds = basemapLayerIds;
        }
      }
    }
  });
});
