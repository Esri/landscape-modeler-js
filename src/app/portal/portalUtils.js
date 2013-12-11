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
  "dojo/_base/array",
  "dojo/io-query",

  "esri/request",
  "esri/geometry/webMercatorUtils",
  "esri/arcgis/utils"
],
function(
  array, ioQuery,
  esriRequest, webMercatorUtils, arcgisUtils
) {
  return {
    // add an item to a portal users's content
    // assumes portal user is already logged in (using identity manager)
    addItem: function (portalUser, content) {
        var requestParams = { f: "json", token: portalUser.credential.token };
        var url = portalUser.portal.portalUrl + "content/users/" + portalUser.username + "/addItem";
        url += "?" + ioQuery.objectToQuery(requestParams);
        return esriRequest({
          url: url,
          content: content,
          handleAs: "json"
        }, {
          usePost: true
        });
    },
    // get item info and item data
    // wraps arcgisUtils.getItem function to
    // make it more generic for other portals
    getItem: function(portal, itemId) {
      arcgisUtils.arcgisUrl = portal.url + "/sharing/content/items";
      return arcgisUtils.getItem(itemId);
    },
    // create web map item data (JSON) from map
    // Example:
    //   "itemData": {
    //     "operationalLayers": [{
    //         "url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/landscape/weightedOverlayAnalysis/ImageServer",
    //         "id": "weightedOverlayAnalysis_9218",
    //         "visibility": true,
    //         "opacity": 1,
    //         "title": "New Model",
    //         "itemId": "938eda16a45f405a92665e5982968903"
    //       }
    //     ],
    //     "baseMap": {
    //       "baseMapLayers": [{
    //           "id": "defaultBasemap",
    //           "opacity": 1,
    //           "visibility": true,
    //           "url": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
    //         }
    //       ],
    //       "title": "Topographic"
    //     },
          // "mapOptions" : {
          //  "extent" : {
          //   "xmin":-12933906.537,
          //   "ymin":3993856.886,
          //   "xmax":-12933371.998,
          //   "ymax":3994375.189,
          //   "spatialReference" : {
          //    "wkid" : 102100
          //   }
          //  },
          //  "scale" : 1234.5,
          //  "rotation" : -45,
          //  "spatialReference" : {
          //   "wkid" : 102100
          //  },
          //  "time" : [
          //   1199145600000,
          //   1230768000000
          //  ]
          // }
    //     "version": "1.9"
    //   }
    createWebMapItemData: function(map) {
      // TODO: how to get the current version?
      var itemData = {
        operationalLayers: [],
        "version": "1.9"
      };
      var basemapLayerIds = map.basemapLayerIds;
      var baseMapLayers = [];
      // add operational and basemap layers
      array.forEach(map.layerIds, function(layerId) {
        // check if basemap layer
        var layer = map.getLayer(layerId);
        var layerJson = {
          "url": layer.url,
          "id": layer.id,
          "visibility": layer.visible,
          "opacity": layer.opacity
        };
        if (basemapLayerIds && array.some(basemapLayerIds, function(basemapLayerId) { return basemapLayerId === layerId; })) {
          // add to basemap layers
          baseMapLayers.push(layerJson);
        } else {
          // set operational layer properties
          layerJson.title = layer.description;
          // set layer type (image/feature, etc) specific properites
          if (layer.renderingRule && layer.renderingRule.toJson) {
            layerJson.renderingRule = layer.renderingRule.toJson();
          }
          // TODO: others?
          // esri.layers.ArcGISImageServiceLayer
          //    "bandIds":[0],
          //    "format":"jpgpng",
          //    "mosaicRule":
          //    {
          //      "mosaicMethod" : "esriMosaicLockRaster",
          //      "lockRasterIds":[1,3,5,6],
          //      "ascending": true,
          //      "mosaicOperation" : "MT_FIRST",
          //      "where":"objected<7"
          //    },
          //    "layerDefinition":{"definitionExpression":"objected<7"},
          //    "popupInfo":{...}
          // add operational layer JSON to item data
          itemData.operationalLayers.push(layerJson);
        }
      });
      // add basemaps
      if (baseMapLayers.length > 0) {
        itemData.baseMap = {
          // TODO: how to get acutal title?
          // use baseMapLayers[0].description?
          title: "Basemap",
          baseMapLayers: baseMapLayers
        };
      }
      itemData.mapOptions = {
        extent: map.extent.toJson()
        // TODO: others??
        // "scale" : 1234.5,
        // "rotation" : -45,
        // "spatialReference" : {
        // "wkid" : 102100
        // },
        // "time" : [
        // 1199145600000,
        // 1230768000000
        // ]
      };
      // TODO: add bookmarks?
      // "bookmarks": [
      //   {
      //     <bookmark>
      //   },
      //   {
      //     <bookmark>
      //   }
      // ],
      return itemData;
    },
    // get an extent string in the format expected by portal
    // Syntax: extent=<xmin>, <ymin>, <xmax>, <ymax>
    // Example: extent=-110.05, 44.13, -110, 44.98
    webMercatorExtentToItemExtent: function(webMercatorExtent) {
      var geographicExtent = webMercatorUtils.webMercatorToGeographic(webMercatorExtent);
      return geographicExtent.xmin + ", " + geographicExtent.ymin + ", " + geographicExtent.xmax + ", " + geographicExtent.ymax;
    }
  };
});
