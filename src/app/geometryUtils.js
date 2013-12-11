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

  "esri/geometry/Polygon"
],
function(
  array,
  Polygon
) {
  return {
    createMergedPolygon: function(featuresOrGeometries, spatialReference) {
      var polygon = new Polygon(spatialReference);
      var geometry;
      array.forEach(featuresOrGeometries, function(featureOrGeometry) {
        geometry = featureOrGeometry.geometry || featureOrGeometry;
        array.forEach(geometry.rings, function(ring) {
          polygon.addRing(ring);
        });
      });
      return polygon;
    }
  };
});