# Esri Landscape Modeler

[![Build Status](https://travis-ci.org/Esri/landscape-modeler-js.svg)](https://travis-ci.org/Esri/landscape-modeler-js)


Landscape Modeler is a sample JavaScript web application that demonstrates how to perform site suitablility analysis by leveraging the landscape data hosted on ArcGIS Online and the speed of image service raster functions. This is ideal when a users want to test and share their ideas about suitability or risk analysis models at multiple scales or over a large area.

![Landscape Modeler Screenshot](http://resources.arcgis.com/en/help/landscape-modeler/guide/0321/GUID-D9C6C1DC-4597-4997-B72A-C303D49D3423-web.png)

[View it live](http://landscapemodeler.arcgis.com/)

Landscape Modeler is built on top of the [ArcGIS API for JavaScript](https://developers.arcgis.com/en/javascript/) and ArcGIS Server image services. By default it is configured to use the
 [ready-to-use landscape layers on ArcGIS Online](http://esri.maps.arcgis.com/home/group.html?owner=esri&title=Landscape%20Layers). However, the [application can be configured](https://github.com/Esri/landscape-modeler-js/wiki/Configuring-the-Application-to-Work-with-Other-Data) to use other data that is exposed as an image service published with a weighted overlay raster function.

## Features

Landscape Modeler allows any user with a valid [ArcGIS Online](http://www.arcgis.com/) organizational account to:
* Design weighted overlay models using the [ready-to-use landscape layers on ArcGIS Online](http://esri.maps.arcgis.com/home/group.html?owner=esri&title=Landscape%20Layers).
* Run those models in real time at a variety of scales and extents.
* Save models as ArcGIS Online web maps that can be loaded into other applications or ArcGIS for Desktop.
* Load and view models that have been saved and shared by others.
* Overlay the model with a feature service and see graphs of model results by feature type.

## Instructions

### Using the Application

See the [Landscape Modeler Help](http://resources.arcgis.com/en/help/landscape-modeler/guide/) for instructions on how to use the application.

### Development Instructions

1. Fork and clone the repository
2. `cd landscape-modeler-js`
3. `npm install` for Grunt/Karma

[See the wiki](https://github.com/Esri/landscape-modeler-js/wiki) for instructions on configuring and deploying the application.

### Configuring the Application

If you wish to configure the application to use a different weighted overlay image service (i.e. your own data), [see the Configuring the Application to Work with Other Data page of the wiki](https://github.com/Esri/landscape-modeler-js/wiki/Configuring-the-Application-to-Work-with-Other-Data).

## Requirements

* Must be configured to point to an image service that exposes weighted overlay raster functions
* If you plan to host the weighed overlay image service, it must be running on ArcGIS Server v10.2 or greater

### Dependencies

#### Runtime

* [ArcGIS for JavaScript API](https://developers.arcgis.com/en/javascript/) v3.5 or later

#### Development (optional)

* [Karma](http://karma-runner.github.io) (for running tests)
* [Grunt](http://gruntjs.com) (for builds)

## Resources

* [Landscape Modeler Help](http://resources.arcgis.com/en/help/landscape-modeler/guide/)
* [Landscape Modeler Wiki](https://github.com/Esri/landscape-modeler-js/wiki)
* [GeoNet Forum](https://geonet.esri.com/community/gis/applications/geoplanner-for-arcgis)
* [ArcGIS for JavaScript API](https://developers.arcgis.com/en/javascript/)
* [ArcGIS REST Services](http://resources.arcgis.com/en/help/arcgis-rest-api/)
* [@esri](http://twitter.com/esri)

## Support

If you experience problems configuring the application, carefully review all documentation including the [Landscape Modeler help](http://resources.arcgis.com/en/help/landscape-modeler/guide/) and the [Wiki](https://github.com/Esri/landscape-modeler-js/wiki).

If you still need help, please post questions or comments to the [GeoPlanner for ArcGIS forum](https://geonet.esri.com/community/gis/applications/geoplanner-for-arcgis).

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
