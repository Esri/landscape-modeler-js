define([
], function(
) {
  return {

    // weighted overlay modeler
    weightedOverlayService: {
      // image service that publishes all available raster layers
      // and the raster functions that operate on them
      // url: "http://ec2-54-243-84-65.compute-1.amazonaws.com/arcgis/rest/services/landscapeModeler/weightedOverlay/ImageServer",
      url: "/arcgis/rest/services/landscapeModeler/weightedOverlay/ImageServer",
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
          }
        ],

        // NOTE: these are for tests where we don't want to do async call to server to get raster layers
        rasterLayers: [
          {
            name: "critHab",
            title: "Critical Habitat",
            id: 1,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Critical_Habitat/ImageServer",
            remapRanges: [
              {
                label: "Non Critical",
                inputMin: 0,
                inputMax: 0,
                outputValue: 1
              },
              {
                label: "Threatened",
                inputMin: 5,
                inputMax: 5,
                outputValue: 5
              },
              {
                label: "Endangered",
                inputMin: 10,
                inputMax: 10,
                outputValue: 9
              }
            ]
          }, {
            name: "devRisk",
            title: "Development Risk",
            id: 2,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Development_Risk/ImageServer",
            remapRanges: [
              {
                label: "None",
                inputMin: 0,
                inputMax: 0,
                outputValue: 0
              },
              {
                label: "Low",
                inputMin: 1,
                inputMax: 1,
                outputValue: 1
              },
              {
                label: "Moderate",
                inputMin: 2,
                inputMax: 2,
                outputValue: 5
              },
              {
                label: "High",
                inputMin: 3,
                inputMax: 3,
                outputValue: 8
              },
              {
                label: "Very High",
                inputMin: 4,
                inputMax: 4,
                outputValue: 9
              }
            ]
          }, {
            name: "forestFrag",
            title: "Forest Fragmentation",
            id: 3,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Forest_Fragmentation/ImageServer",
            remapRanges: [
              {
                label: "None (Water)",
                inputMin: 0,
                inputMax: 0,
                outputValue: 1
              },
              {
                label: "Very Low (Edge)",
                inputMin: 1,
                inputMax: 1,
                outputValue: 2
              },
              {
                label: "None (Undetermined)",
                inputMin: 2,
                inputMax: 2,
                outputValue: 1
              },
              {
                label: "Low (Perforated)",
                inputMin: 3,
                inputMax: 3,
                outputValue: 3
              },
              {
                label: "None (Interior)",
                inputMin: 4,
                inputMax: 4,
                outputValue: 1
              },
              {
                label: "High (Patch)",
                inputMin: 5,
                inputMax: 5,
                outputValue: 9
              },
              {
                label: "Medium (Transitional)",
                inputMin: 6,
                inputMax: 6,
                outputValue: 6
              },
              {
                label: "None (Unlabeled)",
                inputMin: 7,
                inputMax: 7,
                outputValue: 1
              }
            ]
          }, {
            name: "insdisRisk",
            title: "Insect and Disease Risk",
            id: 4,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Insect_and_Disease_Risk/ImageServer",
            remapRanges: [
              {
                label: "Low",
                inputMin: 0,
                inputMax: 35,
                outputValue: 1
              },
              {
                label: "High",
                inputMin: 35,
                inputMax: 66,
                outputValue: 9
              },
              {
                label: "Medium",
                inputMin: 65,
                inputMax: 101,
                outputValue: 5
              }
            ]
          }, {
            name: "woodyBio",
            title: "Woody Biomass",
            id: 5,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Woody_Biomass/ImageServer",
            remapRanges: [
              {
                label: "Low",
                inputMin: 0,
                inputMax: 66,
                outputValue: 1
              },
              {
                label: "Medium",
                inputMin: 66,
                inputMax: 133,
                outputValue: 5
              },
              {
                label: "High",
                inputMin: 133,
                inputMax: 256,
                outputValue: 9
              }
            ]
          }, {
            name: "wildUrbanInterface",
            title: "Wildland-Urban Interface",
            id: 6,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Wildland_Urban_Interface/ImageServer",
            remapRanges: [
              {
                label: "Non-Interface",
                inputMin: 0,
                inputMax: 0,
                outputValue: 1
              },
              {
                label: "Interface",
                inputMin: 1,
                inputMax: 1,
                outputValue: 9
              }
            ]
          }, {
            name: "firePot",
            title: "Wildland Fire Potential",
            id: 7,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Wildfire_Potential/ImageServer",
            remapRanges: [
              {
                label: "None",
                inputMin: 0,
                inputMax: 0,
                outputValue: 1
              },
              {
                label: "Very Low",
                inputMin: 1,
                inputMax: 1,
                outputValue: 2
              },
              {
                label: "Low",
                inputMin: 2,
                inputMax: 2,
                outputValue: 3
              },
              {
                label: "Moderate",
                inputMin: 3,
                inputMax: 3,
                outputValue: 5
              },
              {
                label: "High",
                inputMin: 4,
                inputMax: 4,
                outputValue: 8
              },
              {
                label: "Very High",
                inputMin: 5,
                inputMax: 5,
                outputValue: 9
              },
              {
                label: "None (Non-vegetation)",
                inputMin: 6,
                inputMax: 6,
                outputValue: 1
              },
              {
                label: "None (Agriculture)",
                inputMin: 7,
                inputMax: 7,
                outputValue: 1
              },
              {
                label: "None (Urban/development/ag)",
                inputMin: 8,
                inputMax: 8,
                outputValue: 1
              },
              {
                label: "None (Water)",
                inputMin: 9,
                inputMax: 9,
                outputValue: 1
              }
            ]
          },{
            name: "rainfall",
            title: "Average Rainfall Inches",
            id: 12,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Average_Rainfall_Inches/ImageServer",
            remapRanges: [
              {
                label: "Very Low",
                inputMin: 2,
                inputMax: 10,
                outputValue: 1
              },
              {
                label: "Low",
                inputMin: 10,
                inputMax: 20,
                outputValue: 2
              },
              {
                label: "Medium",
                inputMin: 20,
                inputMax: 40,
                outputValue: 3
              },
              {
                label: "High",
                inputMin: 40,
                inputMax: 75,
                outputValue: 4
              },
              {
                label: "Very High",
                inputMin: 75,
                inputMax: 283,
                outputValue: 5
              }
            ]
          }, {
            name: "temperature",
            title: "Mean Annual Temperature",
            id: 13,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Mean_Annual_Temperature/ImageServer",
            remapRanges: [
              {
                label: "Very Low",
                inputMin: -9,
                inputMax: 0,
                outputValue: 1
              },
              {
                label: "Low",
                inputMin: 0,
                inputMax: 5,
                outputValue: 2
              },
              {
                label: "Medium",
                inputMin: 5,
                inputMax: 12,
                outputValue: 3
              },
              {
                label: "High",
                inputMin: 12,
                inputMax: 20,
                outputValue: 4
              },
              {
                label: "Very High",
                inputMin: 20,
                inputMax: 26,
                outputValue: 5
              }
            ]
          }, {
            name: "roads",
            title: "Road Density",
            id: 14,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Road_Density/ImageServer",
            remapRanges: [
              {
                label: "Very Low",
                inputMin: 0,
                inputMax: 1,
                outputValue: 9
              },
              {
                label: "Low",
                inputMin: 1,
                inputMax: 3,
                outputValue: 7
              },
              {
                label: "Medium",
                inputMin: 3,
                inputMax: 5,
                outputValue: 5
              },
              {
                label: "High",
                inputMin: 5,
                inputMax: 10,
                outputValue: 3
              },
              {
                label: "Very High",
                inputMin: 10,
                inputMax: 45,
                outputValue: 1
              }
            ]
          }, {
            name: "elevation",
            title: "Elevation",
            id: 20,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Elevation/ImageServer",
            remapRanges: [
              {
                label: "Very Low",
                inputMin: -96,
                inputMax: 100,
                outputValue: 1
              },
              {
                label: "Low",
                inputMin: 100,
                inputMax: 300,
                outputValue: 2
              },
              {
                label: "Medium",
                inputMin: 300,
                inputMax: 800,
                outputValue: 3
              },
              {
                label: "High",
                inputMin: 800,
                inputMax: 2000,
                outputValue: 4
              },
              {
                label: "Very High",
                inputMin: 2000,
                inputMax: 4412,
                outputValue: 5
              }
            ]
          }, {
            name: "slope",
            title: "Slope",
            id: 21,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Slope/ImageServer",
            remapRanges: [
              {
                label: "Very Low",
                inputMin: 0,
                inputMax: 3,
                outputValue: 1
              },
              {
                label: "Low",
                inputMin: 3,
                inputMax: 8,
                outputValue: 2
              },
              {
                label: "Medium",
                inputMin: 8,
                inputMax: 16,
                outputValue: 3
              },
              {
                label: "High",
                inputMin: 16,
                inputMax: 26,
                outputValue: 4
              },
              {
                label: "Very High",
                inputMin: 26,
                inputMax: 82,
                outputValue: 5
              }
            ]
          }, {
            name: "aspect",
            title: "Aspect",
            id: 19,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Aspect/ImageServer",
            remapRanges: [
              {
                label: "Flat",
                inputMin: -1,
                inputMax: 0,
                outputValue: 1
              },
              {
                label: "NNE",
                inputMin: 0,
                inputMax: 22.5,
                outputValue: 2
              },
              {
                label: "NE",
                inputMin: 22.5,
                inputMax: 67.5,
                outputValue: 3
              },
              {
                label: "E",
                inputMin: 67.5,
                inputMax: 112.5,
                outputValue: 4
              },
              {
                label: "SE",
                inputMin: 112.5,
                inputMax: 157.5,
                outputValue: 5
              },
              {
                label: "S",
                inputMin: 157.5,
                inputMax: 202.5,
                outputValue: 6
              },
              {
                label: "SW",
                inputMin: 202.5,
                inputMax: 247.5,
                outputValue: 7
              },
              {
                label: "W",
                inputMin: 247.5,
                inputMax: 292.5,
                outputValue: 8
              },
              {
                label: "NW",
                inputMin: 292.5,
                inputMax: 337.5,
                outputValue: 9
              },
              {
                label: "NNW",
                inputMin: 337.5,
                inputMax: 360.5,
                outputValue: 2
              }
            ]
          }, {
            name: "nlcd",
            title: "Land Cover",
            id: 32,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/NLCD_landcover/ImageServer",
            remapRanges: [
              {
                label: "Water",
                inputMin: 11,
                inputMax: 12,
                outputValue: 0
              },
              {
                label: "Ice",
                inputMin: 12,
                inputMax: 13,
                outputValue: 0
              },
              {
                label: "Development",
                inputMin: 21,
                inputMax: 25,
                outputValue: 1
              },
              {
                label: "Barren",
                inputMin: 31,
                inputMax: 32,
                outputValue: 1
              },
              {
                label: "Forest",
                inputMin: 41,
                inputMax: 44,
                outputValue: 9
              },
              {
                label: "Shrub/Scrub/Grassland",
                inputMin: 52,
                inputMax: 72,
                outputValue: 7
              },
              {
                label: "Agriculture",
                inputMin: 81,
                inputMax: 83,
                outputValue: 3
              },
              {
                label: "Wetland",
                inputMin: 90,
                inputMax: 96,
                outputValue: 5
              }
            ]
          }, {
            name: "federalLand",
            title: "Federal Land",
            id: 37,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Federal_Land/ImageServer",
            remapRanges: [
              {
                label: "Non-Federal Land",
                inputMin: 0,
                inputMax: 0,
                outputValue: 0
              },
              {
                label: "Federal Land",
                inputMin: 1,
                inputMax: 1,
                outputValue: 9
              }
            ]
          }, {
            name: "usfsLand",
            title: "US Forest Service Land",
            id: 38,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/USFS_Land/ImageServer",
            remapRanges: [
              {
                label: "Non-USFS Land",
                inputMin: 0,
                inputMax: 0,
                outputValue: 0
              },
              {
                label: "USFS Land",
                inputMin: 1,
                inputMax: 1,
                outputValue: 9
              }
            ]
          }, {
            name: "wildernessAreas",
            title: "Wilderness Areas",
            id: 39,
            url: "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Wilderness_Areas/ImageServer",
            remapRanges: [
              {
                label: "Non-Wilderness",
                inputMin: 0,
                inputMax: 0,
                outputValue: 0
              },
              {
                label: "Wilderness",
                inputMin: 1,
                inputMax: 1,
                outputValue: 9
              }
            ]
          }, {
            name: "USA_Land_Surface_Forms",
            title: "Land Surface Forms",
            id: 46,
            url: "https://landscape2.arcgis.com/arcgis/rest/services/USA_Land_Surface_Forms/ImageServer",
            remapRanges: [
              {
                label: "Plains",
                inputMin: 1,
                inputMax: 4,
                outputValue: 1
              }, {
                label: "Escarpments",
                inputMin: 4,
                inputMax: 4,
                outputValue: 3
              }, {
                label: "Hills",
                inputMin: 5,
                inputMax: 8,
                outputValue: 5
              }, {
                label: "Mountains/Canyons",
                inputMin: 8,
                inputMax: 10,
                outputValue: 7
              }, {
                label: "Drainage Channels",
                inputMin: 10,
                inputMax: 10,
                outputValue: 9
              }
            ]
          }
        ]
      }
    }
  };
});
