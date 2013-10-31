/*!
 *  landscape-modeler-js
 *  @version 0.0.1
 *  @author Tom Wayson <twayson@esri.com> (http://tomwayson.com)
 *
 *  A JavaScript web application for designing, running, and saving weighted overlay models using the Esri ArcGIS API for JavaScript and ArcGIS Server image services.
 */
define([],function(){return{removeChildren:function(a){var b;if(a&&a.getChildren&&a.removeChild){b=a.getChildren().length;for(var c=b-1;c>=0;c--)a.removeChild(c)}}}});