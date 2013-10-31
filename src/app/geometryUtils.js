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