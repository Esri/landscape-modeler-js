/*!
 *  landscape-modeler-js
 *  @version 0.0.1
 *  @author Tom Wayson <twayson@esri.com> (http://tomwayson.com)
 *
 *  A JavaScript web application for designing, running, and saving weighted overlay models using the Esri ArcGIS API for JavaScript and ArcGIS Server image services.
 */
define(["dojo/_base/array","esri/geometry/Polygon"],function(a,b){return{createMergedPolygon:function(c,d){var e,f=new b(d);return a.forEach(c,function(b){e=b.geometry||b,a.forEach(e.rings,function(a){f.addRing(a)})}),f}}});