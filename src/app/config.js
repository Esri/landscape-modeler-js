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
define([],
function() {
  // environment variables to be changed by the deployment script
  var portalUrl = "https://www.arcgis.com";
  var weightedOverlayServiceUrl = "https://landscape3.arcgis.com/arcgis/rest/services/Landscape_Modeler/USA_Weighted_Overlay/ImageServer";

  return {
    // app title
    appTitle: "Landscape Modeler",

    // oAuth
    oauthOptions: {
      appId: "landscapemodeler",
      portal: portalUrl,
      expiration: (14 * 24 * 60), // 2 weeks, in minutes
      popup:      false
    },

    // portal
    // NOTE: portal URL comes from oAuth options above
    portalOptions: {
      // item defaults for the model
      modelItem: {
        title: "New Model"
      },
      typeKeyword: "Landscape Modeler",
      categoryTags: ['Earth & Atmosphere', 'Boundaries', 'Resources & Infrastructure',
                'Plants & Animals', 'People & Places', 'Environmental Threats  & Hazards']
    },

    // add the item id of a model to load that model at start up
    // modelItemId: "b00900b62cbd4e65a528c388bc0c7866",

    // map
    mapOptions: {
      basemap: "topo",
      center:[-122.45,37.75],
      zoom:6
    },

    // areaUint: Area unit that carts will use in reporting
    // and the conversion factor from the area unit of the image service
    areaUnit: {
      name: "Acres",
      conversionFactor: 0.000247105 // = 1 sq meter
    },

    // weighted overlay modeler
    weightedOverlayService: {
      // image service that publishes all available raster layers
      // and the raster functions that operate on them
      url: weightedOverlayServiceUrl,
      // options for initializing the model service
      options: {
        rasterFunctionName: "WeightedOverlay_7_1_9_colormap",
        histogramRasterFunctionName: "WeightedOverlay_7_0_9_histogram",
        rastersInFunction: 7,
        dummyRasterId: 53,
        queryParameters: {
          // NOTE: exclude Forest Fagmentation until data issue is corrected
          where: "OBJECTID <> 49",
          outFields: ["OBJECTID","Name","Title","Url","InputRanges","OutputValues","NoDataRanges","RangeLabels","NoDataRangeLabels"]
        },
        colorMapArgName: "Colormap",
        // TODO: set these somewhere else?
        colormapDefinitions: [
          {
            name: "1_9_green_yellow_red",
            label: "Green Yellow Red",
            colors: [
              {label: "Extremely Low", value: 1, rgb: [38,115,0]},
              {label: "Very Low", value: 2, rgb: [86,148,0]},
              {label: "Low", value: 3, rgb: [39,181,0]},
              {label: "Low Medium", value: 4, rgb: [197,219,0]},
              {label: "Medium", value: 5, rgb: [255,255,0]},
              {label: "High Medium", value: 6, rgb: [255,195,0]},
              {label: "High", value: 7, rgb: [250,142,0]},
              {label: "Very High", value: 8, rgb: [242,85,0]},
              {label: "Extremely High", value: 9, rgb: [230,0,0]}
            ]
          }, {
            name: "1_9_red_yellow_green",
            label: "Red Yellow Green",
            colors: [
              {label: "Extremely Low", value: 1, rgb: [230,0,0]},
              {label: "Very Low", value: 2, rgb: [242,85,0]},
              {label: "Low", value: 3, rgb: [250,142,0]},
              {label: "Low Medium", value: 4, rgb: [255,195,0]},
              {label: "Medium", value: 5, rgb: [255,255,0]},
              {label: "High Medium", value: 6, rgb: [197,219,0]},
              {label: "High", value: 7, rgb: [39,181,0]},
              {label: "Very High", value: 8, rgb: [86,148,0]},
              {label: "Extremely High", value: 9, rgb: [38,115,0]}
            ]
          }, {
            name: "1_9_yellow_to_dark_red",
            label: "Yellow to Dark Red",
            colors: [
              {label: "Extremely Low", value:1, rgb:[255,255,128]},
              {label: "Very Low", value:2, rgb:[252,233,106]},
              {label: "Low", value:3, rgb:[250,209,85]},
              {label: "Low Medium", value:4, rgb:[247,190,67]},
              {label: "Medium", value:5, rgb:[242,167,46]},
              {label: "High Medium", value:6, rgb:[207,122,31]},
              {label: "High", value:7, rgb:[173,83,19]},
              {label: "Very High", value:8, rgb:[138,46,10]},
              {label: "Extremely High", value:9, rgb:[107,0,0]}
            ]
          }, {
            name: "1_9_dark_red_to_yellow",
            label: "Dark Red to Yellow",
            colors: [
              {label: "Extremely Low", value:1, rgb:[107,0,0]},
              {label: "Very Low", value:2, rgb:[138,46,10]},
              {label: "Low", value:3, rgb:[173,83,19]},
              {label: "Low Medium", value:4, rgb:[207,122,31]},
              {label: "Medium", value:5, rgb:[242,167,46]},
              {label: "High Medium", value:6, rgb:[247,190,67]},
              {label: "High", value:7, rgb:[250,209,85]},
              {label: "Very High", value:8, rgb:[252,233,106]},
              {label: "Extremely High", value:9, rgb:[255,255,128]}
            ]
          }, {
            name: "1_9_light_gray_to_dark_gray",
            label: "Light Gray to Dark Gray",
            colors: [
              {label: "Extremely Low", value:1, rgb:[219,219,219]},
              {label: "Very Low", value:2, rgb:[196,196,196]},
              {label: "Low", value:3, rgb:[176,176,176]},
              {label: "Low Medium", value:4, rgb:[156,156,156]},
              {label: "Medium", value:5, rgb:[135,135,135]},
              {label: "High Medium", value:6, rgb:[117,117,117]},
              {label: "High", value:7, rgb:[99,99,99]},
              {label: "Very High", value:8, rgb:[84,84,84]},
              {label: "Extremely High", value:9, rgb:[69,69,69]}
            ]
          }, {
            name: "1_9_dark_gray_to_light_gray",
            label: "Dark Gray to Light Gray",
            colors: [
              {label: "Extremely Low", value:1, rgb:[69,69,69]},
              {label: "Very Low", value:2, rgb:[84,84,84]},
              {label: "Low", value:3, rgb:[99,99,99]},
              {label: "Low Medium", value:4, rgb:[117,117,117]},
              {label: "Medium", value:5, rgb:[135,135,135]},
              {label: "High Medium", value:6, rgb:[156,156,156]},
              {label: "High", value:7, rgb:[176,176,176]},
              {label: "Very High", value:8, rgb:[196,196,196]},
              {label: "Extremely High", value:9, rgb:[219,219,219]}
            ]
          }, {
            name: "1_9_light_brown_to_dark_brown",
            label: "Light Brown to Dark Brown",
            colors: [
              {label: "Extremely Low", value:1, rgb:[250,233,212]},
              {label: "Very Low", value:2, rgb:[242,208,184]},
              {label: "Low", value:3, rgb:[235,187,160]},
              {label: "Low Medium", value:4, rgb:[224,163,135]},
              {label: "Medium", value:5, rgb:[217,144,113]},
              {label: "High Medium", value:6, rgb:[207,124,91]},
              {label: "High", value:7, rgb:[194,103,70]},
              {label: "Very High", value:8, rgb:[184,84,53]},
              {label: "Extremely High", value:9, rgb:[171,65,36]}
            ]
          }, {
            name: "1_9_dark_brown_to_light_brown",
            label: "Dark Brown to Light Brown",
            colors: [
              {label: "Extremely Low", value:1, rgb:[171,65,36]},
              {label: "Very Low", value:2, rgb:[184,84,53]},
              {label: "Low", value:3, rgb:[194,103,70]},
              {label: "Low Medium", value:4, rgb:[207,124,91]},
              {label: "Medium", value:5, rgb:[217,144,113]},
              {label: "High Medium", value:6, rgb:[224,163,135]},
              {label: "High", value:7, rgb:[235,187,160]},
              {label: "Very High", value:8, rgb:[242,208,184]},
              {label: "Extremely High", value:9, rgb:[250,233,212]}
            ]
          }, {
            name: "1_9_full_spectrum_bright_red_to_blue",
            label: "Full Spectrum - Bright Red to Blue",
            colors: [
              {label: "Extremely Low", value:1, rgb:[255,0,0]},
              {label: "Very Low", value:2, rgb:[255,119,0]},
              {label: "Low", value:3, rgb:[255,200,0]},
              {label: "Low Medium", value:4, rgb:[238,255,56]},
              {label: "Medium", value:5, rgb:[182,255,143]},
              {label: "High Medium", value:6, rgb:[89,255,225]},
              {label: "High", value:7, rgb:[51,194,255]},
              {label: "Very High", value:8, rgb:[56,106,255]},
              {label: "Extremely High", value:9, rgb:[0,0,255]}
            ]
          }, {
            name: "1_9_full_spectrum_bright_blue_to_red",
            label: "Full Spectrum - Bright Blue to Red",
            colors: [
              {label: "Extremely Low", value:1, rgb:[0,0,255]},
              {label: "Very Low", value:2, rgb:[56,106,255]},
              {label: "Low", value:3, rgb:[51,194,255]},
              {label: "Low Medium", value:4, rgb:[89,255,225]},
              {label: "Medium", value:5, rgb:[182,255,143]},
              {label: "High Medium", value:6, rgb:[238,255,56]},
              {label: "High", value:7, rgb:[255,200,0]},
              {label: "Very High", value:8, rgb:[255,119,0]},
              {label: "Extremely High", value:9, rgb:[255,0,0]}
            ]
          }, {
            name: "1_9_partial_spectrum_yellow_to_blue",
            label: "Partial Spectrum - Yellow to Blue",
            colors: [
              {label: "Extremely Low", value:1, rgb:[242,241,162]},
              {label: "Very Low", value:2, rgb:[252,250,98]},
              {label: "Low", value:3, rgb:[255,255,0]},
              {label: "Low Medium", value:4, rgb:[255,149,0]},
              {label: "Medium", value:5, rgb:[255,0,0]},
              {label: "High Medium", value:6, rgb:[245,5,189]},
              {label: "High", value:7, rgb:[176,7,237]},
              {label: "Very High", value:8, rgb:[99,24,204]},
              {label: "Extremely High", value:9, rgb:[7,29,173]}
            ]
          }, {
            name: "1_9_partial_spectrum_blue_to_yellow",
            label: "Partial Spectrum - Blue to Yellow",
            colors: [
              {label: "Extremely Low", value:1, rgb:[7,29,173]},
              {label: "Very Low", value:2, rgb:[99,24,204]},
              {label: "Low", value:3, rgb:[176,7,237]},
              {label: "Low Medium", value:4, rgb:[245,5,189]},
              {label: "Medium", value:5, rgb:[255,0,0]},
              {label: "High Medium", value:6, rgb:[255,149,0]},
              {label: "High", value:7, rgb:[255,255,0]},
              {label: "Very High", value:8, rgb:[252,250,98]},
              {label: "Extremely High", value:9, rgb:[242,241,162]}
            ]
          }, {
            name: "1_9_yellow_green_to_dark_blue",
            label: "Yellow-Green to Dark Blue",
            colors: [
              {label: "Extremely Low", value:1, rgb:[255,255,128]},
              {label: "Very Low", value:2, rgb:[182,245,88]},
              {label: "Low", value:3, rgb:[113,235,47]},
              {label: "Low Medium", value:4, rgb:[59,214,45]},
              {label: "Medium", value:5, rgb:[61,184,104]},
              {label: "High Medium", value:6, rgb:[42,156,154]},
              {label: "High", value:7, rgb:[33,110,158]},
              {label: "Very High", value:8, rgb:[31,62,140]},
              {label: "Extremely High", value:9, rgb:[12,16,120]}            ]
          }, {
            name: "1_9_dark_blue_to_yellow_green",
            label: "Dark Blue to Yellow-Green",
            colors: [
              {label: "Extremely Low", value:1, rgb:[12,16,120]},
              {label: "Very Low", value:2, rgb:[31,62,140]},
              {label: "Low", value:3, rgb:[33,110,158]},
              {label: "Low Medium", value:4, rgb:[42,156,154]},
              {label: "Medium", value:5, rgb:[61,184,104]},
              {label: "High Medium", value:6, rgb:[59,214,45]},
              {label: "High", value:7, rgb:[113,235,47]},
              {label: "Very High", value:8, rgb:[182,245,88]},
              {label: "Extremely High", value:9, rgb:[255,255,128]}
            ]
          }, {
            name: "1_9_cold_to_hot_diverging",
            label: "Cold to Hot Diverging",
            colors: [
              {label: "Extremely Low", value:1, rgb:[40,146,199]},
              {label: "Very Low", value:2, rgb:[109,169,179]},
              {label: "Low", value:3, rgb:[160,194,155]},
              {label: "Low Medium", value:4, rgb:[206,222,129]},
              {label: "Medium", value:5, rgb:[250,250,100]},
              {label: "High Medium", value:6, rgb:[252,196,76]},
              {label: "High", value:7, rgb:[250,141,52]},
              {label: "Very High", value:8, rgb:[242,89,34]},
              {label: "Extremely High", value:9, rgb:[232,16,20]}
            ]
          }, {
            name: "1_9_hot_to_cold_diverging",
            label: "Hot to Cold Diverging",
            colors: [
              {label: "Extremely Low", value:1, rgb:[232,16,20]},
              {label: "Very Low", value:2, rgb:[242,89,34]},
              {label: "Low", value:3, rgb:[250,141,52]},
              {label: "Low Medium", value:4, rgb:[252,196,76]},
              {label: "Medium", value:5, rgb:[250,250,100]},
              {label: "High Medium", value:6, rgb:[206,222,129]},
              {label: "High", value:7, rgb:[160,194,155]},
              {label: "Very High", value:8, rgb:[109,169,179]},
              {label: "Extremely High", value:9, rgb:[40,146,199]}
            ]
          }, {
            name: "1_9_surface_low_to_high",
            label: "Surface - Low to High",
            colors: [
              {label: "Extremely Low", value:1, rgb:[112,153,89]},
              {label: "Very Low", value:2, rgb:[176,196,124]},
              {label: "Low", value:3, rgb:[242,238,162]},
              {label: "Low Medium", value:4, rgb:[242,224,150]},
              {label: "Medium", value:5, rgb:[242,206,133]},
              {label: "High Medium", value:6, rgb:[217,169,130]},
              {label: "High", value:7, rgb:[194,140,124]},
              {label: "Very High", value:8, rgb:[255,184,193]},
              {label: "Extremely High", value:9, rgb:[255,242,255]}
            ]
          }, {
            name: "1_9_surface_high_to_low",
            label: "Surface - High to Low",
            colors: [
              {label: "Extremely Low", value:1, rgb:[255,242,255]},
              {label: "Very Low", value:2, rgb:[255,184,193]},
              {label: "Low", value:3, rgb:[194,140,124]},
              {label: "Low Medium", value:4, rgb:[217,169,130]},
              {label: "Medium", value:5, rgb:[242,206,133]},
              {label: "High Medium", value:6, rgb:[242,224,150]},
              {label: "High", value:7, rgb:[242,238,162]},
              {label: "Very High", value:8, rgb:[176,196,124]},
              {label: "Extremely High", value:9, rgb:[112,153,89]}
            ]
          }
        ]
      }
    },

    // app topics
    topics: {
      MODELER_MODEL_RUN: "/modeler/model/run",
      MODELER_SIGNOUT: "/modeler/signOut",
      CHART_FEATURETYPE_SELECTED: "/chart/featureType/selected"
    },

    // help link
    helpUrl: "http://resources.arcgis.com/en/help/landscape-modeler/",

    // proxy and utility urls
    proxyUrl: "./proxy.ashx",
    geometryServiceUrl: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer"
  };
});
