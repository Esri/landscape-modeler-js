/*!
 *  landscape-modeler-js
 *  @version 0.0.1
 *  @author Tom Wayson <twayson@esri.com> (http://tomwayson.com)
 *
 *  A JavaScript web application for designing, running, and saving weighted overlay models using the Esri ArcGIS API for JavaScript and ArcGIS Server image services.
 */
define(["dojo/_base/array","dojo/io-query","esri/request","esri/geometry/webMercatorUtils","esri/arcgis/utils"],function(a,b,c,d,e){return{addItem:function(a,d){var e={f:"json",token:a.credential.token},f=a.portal.portalUrl+"content/users/"+a.username+"/addItem";return f+="?"+b.objectToQuery(e),c({url:f,content:d,handleAs:"json"},{usePost:!0})},getItem:function(a,b){return e.arcgisUrl=a.url+"/sharing/content/items",e.getItem(b)},createWebMapItemData:function(b){var c={operationalLayers:[],version:"1.9"},d=b.basemapLayerIds,e=[];return a.forEach(b.layerIds,function(f){var g=b.getLayer(f),h={url:g.url,id:g.id,visibility:g.visible,opacity:g.opacity};d&&a.some(d,function(a){return a===f})?e.push(h):(h.title=g.description,g.renderingRule&&g.renderingRule.toJson&&(h.renderingRule=g.renderingRule.toJson()),c.operationalLayers.push(h))}),e.length>0&&(c.baseMap={title:"Basemap",baseMapLayers:e}),c.mapOptions={extent:b.extent.toJson()},c},webMercatorExtentToItemExtent:function(a){var b=d.webMercatorToGeographic(a);return b.xmin+", "+b.ymin+", "+b.xmax+", "+b.ymax}}});