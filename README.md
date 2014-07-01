# Esri Landscape Modeler

Landscape Modeler is a JavaScript web application that allows users to perform fast weighted overlay analysis. This is ideal when a user wants to test ideas about a suitability or risk analysis model at multiple scales or over a large area.

![Landscape Modeler Screenshot](http://resources.arcgis.com/en/help/landscape-modeler/guide/0321/GUID-D9C6C1DC-4597-4997-B72A-C303D49D3423-web.png)

[View it live](http://landscapemodeler.arcgis.com/)

Landscape Modeler is built on top of the [ArcGIS API for JavaScript](https://developers.arcgis.com/en/javascript/) and ArcGIS Server image services. By default it is configured to use the [ready-to-use landscape layers on ArcGIS Online](http://esri.maps.arcgis.com/home/group.html?owner=esri&title=Landscape%20Layers). However, the [application can be configured](#configuring-the-application) to use other data that is exposed as an image service published with a weighted overlay raster function.

<!-- TODO: add app screenshot -->
<!--![App](https://raw.github.com/Esri/dojo-bootstrap-ui-for-maps-js/master/dojo-bootstrap-ui-for-maps-js.png)-->

**Currently Esri Landscape Modeler is in development but is open to contributions. It should be thought of as a beta or preview.**

## Features

Landscape Modeler allows any user with a valid [ArcGIS Online](http://www.arcgis.com/) organizational account to:
* Design weighted overlay models using the [ready-to-use landscape layers on ArcGIS Online](http://esri.maps.arcgis.com/home/group.html?owner=esri&title=Landscape%20Layers).
* Run those models in real time at a variety of scales and extents.
* Save models as ArcGIS Online web maps that can be loaded into other applications or ArcGIS for Desktop.
* Load and view models that have been saved and shared by others.
* Overlay the model with a feature service and see graphs of model results by feature type.

## Development Instructions

1. `git clone https://github.com/Esri/landscape-modeler-js`
2. `cd landscape-modeler-js`
3. `npm install` for Grunt/Karma
4. Configure image service parameters in app/config.js (optional [see below](#configuring-the-application)).

### Configuring the Application

If you wish to deploy the application and configure it to use a different weighted overlay image service, you will first have to follow these steps:

1. [Prepare the data and publishing an image service](http://resources.arcgis.com/en/help/landscape-modeler/prepare-data/)
2. [Create an item in your portal for the application and register the application to get an app ID](http://doc.arcgis.com/en/arcgis-online/share-maps/add-items.htm#ESRI_SECTION1_55703F1EE9C845C3B07BBD85221FB074)

Once you have an image service that exposes the weighted overlay functions, and an app ID, you will have to change the following values in `src/app/config.js`:

|Section|Variable|Description|
|-------|--------|-----------|
|`oauthOptions`|`portal`|Url to the portal (ArcGIS Online, Organization, etc) where the application is registered|
|`oauthOptions`|`appId`|App ID created in step 2 above|
|`portalOptions`|`typeKeyword`|This is used to filter model items saved by this application. This *must* be set to something other than 'Landscape Modeler' if you are using a different weighted overlay image service.|
|`weightedOverlayService`|`url`|URL to the image service that exposes the mosaic data and raster functions|
|`weightedOverlayService`|`rasterFunctionName`|Name of raster function that perfoms weighted overlay calculation|
|`weightedOverlayService`|`histogramRasterFunctionName`|Name of raster function that perfoms weighted overlay calculation on histograms for charts|
|`weightedOverlayService`|`rastersInFunction`|The maximum number of rasters the raster functions can operate on|
|`weightedOverlayService`|`dummyRasterId`|This should be the OBJECT ID of a raster that is continuous for the entire extent you data set (i.e. does not have any NoData cells)|
|`weightedOverlayService`|`queryParameters.where`|An expression to limit the rasters that are exposed to the app|
|`weightedOverlayService`|`queryParameters.outFields`|An array of mosaic attribute table field names that are exposed to the app. Must either be set to `['*']` or at least include the [required fields](http://resources.arcgis.com/en/help/landscape-modeler/prepare-data/index.html#//03sm00000003000000#ESRI_SECTION1_01C8A5D037FD448C80E4467D3EB6B5CA)|

You will likely also need to configure the application title, map center/zoom and area units, and/or colormap definitions to match your data. You may also need to configure the URLs to the proxy page, geometry service, etc to match your environment.

## Requirements

* Must be configured to point to an image service that exposes a weighted overlay raster function
* If you plan to host the weighed overlay image service, it must be running on ArcGIS Server v10.2 or greater

### Dependencies

#### Runtime

* [ArcGIS for JavaScript API](https://developers.arcgis.com/en/javascript/) v3.3 or later

#### Development (optional)

* [Karma](http://karma-runner.github.io) (for running tests)
* [Grunt](http://gruntjs.com) (for builds)

## Resources

* [Landscape Modeler Help](http://resources.arcgis.com/en/help/landscape-modeler/)
* [ArcGIS for JavaScript API](https://developers.arcgis.com/en/javascript/)
* [ArcGIS REST Services](http://resources.arcgis.com/en/help/arcgis-rest-api/)
* [@esri](http://twitter.com/esri)

## Issues

Find a bug or want to request a new feature?  Please let us know by [submitting an issue](https://github.com/Esri/landscape-modeler-js/issues).

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

## Credit

Landscape Modeler was developed along with [GeoPlanner for ArcGIS](http://www.esri.com/software/geoplanner-for-arcgis) by a team comprised of members from both the [ArcGIS Content](http://www.esri.com/data/find-data) and [Professional Services](http://www.esri.com/services/professional-services) divisions at Esri.

Landscape Modeler is based on work done by the [Esri Application Prototypes Lab](https://maps.esri.com/demo/) and the [Esri Imagery Team](http://resources.arcgis.com/en/communities/imagery/) to create applications that perform fast weighted overlay analysis by leveraging ArcGIS Server image service raster functions.

## Licensing
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

A copy of the license is available in the repository's [license.txt]( https://raw.github.com/Esri/esri-leaflet/master/license.txt) file.

[](Esri Tags: ArcGIS Web landscape Weighted-overlay raster analysis)
[](Esri Language: JavaScript)
