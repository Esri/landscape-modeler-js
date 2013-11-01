/*!
 *  landscape-modeler-js
 *  @version 0.1.0
 *  @author Tom Wayson <twayson@esri.com> (http://tomwayson.com)
 *
 *  A web application for designing, running, and saving weighted overlay models using the Esri ArcGIS API for JavaScript and ArcGIS Server image services.
 */
define(["dojo/_base/lang","dojo/_base/array"],function(a,b){return{getChartData:function(c,d){var e={},f=[],g=a.clone(c.colors),h=Math.round(d.min),i=Math.round(d.max)-1;return g.sort(function(a,b){return a.value-b.value}),0!==g[0].value&&g.unshift({label:"No Data",value:0,rgb:[128,128,128]}),b.forEach(g,function(a){var b;e[a.label]=a.rgb,b=a.value<h||a.value>i?0:d.counts[a.value-h],f.push({name:a.label,value:b})}),{dataset:f,colors:e}}}});