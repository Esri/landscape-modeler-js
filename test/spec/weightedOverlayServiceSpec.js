define([
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/number',

  'esri/layers/ArcGISImageServiceLayer',
  'esri/geometry/Extent',

  'weighted-overlay-modeler/WeightedOverlayService',

  'spec/config'
], function(
  lang, array, number,
  ArcGISImageServiceLayer, Extent,
  WeightedOverlayService,
  config
) {
  var weightedOverlayService;
  // utility functions
  function getImageServiceLayer(configSettings) {
    return new ArcGISImageServiceLayer(configSettings.url);
  }

  describe("when initalizing from config settings", function() {
    var configSettings = config.weightedOverlayService;
    beforeEach(function() {
      weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(configSettings), configSettings.options);
    });
    // afterEach(function() {
    //   weightedOverlayService = null;
    // });
    describe('and config settings are valid', function(){
      it('should have all properties passed to constructor', function() {
        var defaultOptions = {
          argumentNamePrefixes: {
            id: "Raster",
            weight: "Weight_Raster",
            inputRanges: "InputRanges_Raster",
            outputValues: "OutputValues_Raster",
            noDataRanges: "NoDataRanges_Raster",
            labels: "Labels_Raster",
            noDataLabels: 'NoDataLabels'
          },
          queryParameters: {
            where: "Category=1",
            outFields: ["*"],
            returnGeometry: false
          }
        };
        for(var setting in configSettings.options) {
          var val = weightedOverlayService[setting];
          expect(val).toBeDefined();
          if (defaultOptions[setting]) {
            expect(val).toEqual(lang.mixin(defaultOptions[setting], configSettings.options[setting]));
          } else {
            expect(val).toEqual(configSettings.options[setting]);
          }
        }
      });
    });
  });

  describe("when importing a model from a valid web map", function() {
    // set up:
    // init WO image service and import web map JSONs
    weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(config.weightedOverlayService), config.weightedOverlayService.options);

    var webMapJson = {
      "operationalLayers": [{
        "url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/landscape/weightedOverlayAnalysis/ImageServer",
        "id": "landscape/weightedOverlayAnalysis",
        "visibility": true,
        "opacity": 1,
        "title": "Habitat Development Risk",
        "renderingRule": {
          "rasterFunction": "WeightedOverlay_7_1_9_colormap",
          "rasterFunctionArguments": {
            "Raster1": "$1",
            "Weight_Raster1": 0.25,
            "InputRanges_Raster1": [0, 0, 5, 5, 10, 10],
            "OutputValues_Raster1": [1, 9, 9],
            "Raster2": "$2",
            "Weight_Raster2": 0.25,
            "InputRanges_Raster2": [0, 0, 1, 1, 2, 2, 3, 3, 4, 4],
            "OutputValues_Raster2": [0, 1, 5, 8, 9],
            "Raster3": "$32",
            "Weight_Raster3": 0.25,
            "InputRanges_Raster3": [11, 12, 12, 13, 21, 25, 31, 32, 41, 44, 52, 72, 81, 83, 90, 96],
            "OutputValues_Raster3": [0, 0, 1, 1, 9, 7, 3, 5],
            "Raster4": "$14",
            "Weight_Raster4": 0.25,
            "InputRanges_Raster4": [0, 1, 1, 3, 3, 5, 5, 10, 10, 45],
            "OutputValues_Raster4": [9, 7, 5, 3, 1],
            "Raster5": "$4",
            "Weight_Raster5": 0,
            "Raster6": "$4",
            "Weight_Raster6": 0,
            "Raster7": "$4",
            "Weight_Raster7": 0,
            "Colormap": [
              [1, 38, 115, 0],
              [2, 86, 148, 0],
              [3, 39, 181, 0],
              [4, 197, 219, 0],
              [5, 255, 255, 0],
              [6, 255, 195, 0],
              [7, 250, 142, 0],
              [8, 242, 85, 0],
              [9, 230, 0, 0]
            ]
          },
          "variableName": "Raster"
        },
        "remapRangeLabels": {
          "Labels_Raster1": ["Non Critical", "Threatened", "Endangered"]
        }
      }],
      "version": "1.9",
      "baseMap": {
        "baseMapLayers": [{
          "url": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer",
          "id": "layer0",
          "visibility": true,
          "opacity": 1
        }]
      }
    };
    var model = weightedOverlayService.operationalLayersToModel(webMapJson.operationalLayers);

    it('should return a model', function() {
      expect(model).toBeDefined();
    });
    it('should have 1 model layer for each raster', function() {
      expect(model.overlayLayers).toBeDefined();
      expect(model.overlayLayers.length).toEqual(4); // WARNING: magic value
    });
    it('model layer ids should match raster ids', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        expect(overlayLayer.id).toBeDefined();
        expect(overlayLayer.id).toBeGreaterThan(0);
      });
    });
    it('model layer weights should match raster weights', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        expect(overlayLayer.weight).toBeDefined();
        // WARNING: expects that all weights are the same
        expect(overlayLayer.weight).toEqual(25);
      });
    });
    it('model layer remap ranges should match raster input ranges / output values', function() {
      var remapRange;
      array.forEach(model.overlayLayers, function(overlayLayer) {
        expect(overlayLayer.remapRanges).toBeDefined();
        // test one layer
        if (overlayLayer.id === 1) {
          // "Raster1": "$1",
          // "Weight_Raster1": 0.25,
          // "InputRanges_Raster1": [0, 0, 5, 5, 10, 10],
          // "OutputValues_Raster1": [1, 9, 9],
          remapRange = overlayLayer.remapRanges[0];
          expect(remapRange.inputMin).toEqual(0);
          expect(remapRange.inputMax).toEqual(0);
          expect(remapRange.outputValue).toEqual(1);
          expect(remapRange.label).toEqual('Non Critical');
          remapRange = overlayLayer.remapRanges[1];
          expect(remapRange.inputMin).toEqual(5);
          expect(remapRange.inputMax).toEqual(5);
          expect(remapRange.outputValue).toEqual(9);
          expect(remapRange.label).toEqual('Threatened');
          remapRange = overlayLayer.remapRanges[2];
          expect(remapRange.inputMin).toEqual(10);
          expect(remapRange.inputMax).toEqual(10);
          expect(remapRange.outputValue).toEqual(9);
          expect(remapRange.label).toEqual('Endangered');
        } else if (overlayLayer.id === 14) {
          // "Raster4": "$14",
          // "Weight_Raster4": 0.25,
          // "InputRanges_Raster4": [0, 1, 1, 3, 3, 5, 5, 10, 10, 45],
          // "OutputValues_Raster4": [9, 7, 5, 3, 1],
          remapRange = overlayLayer.remapRanges[0];
          expect(remapRange.inputMin).toEqual(0);
          expect(remapRange.inputMax).toEqual(1);
          expect(remapRange.outputValue).toEqual(9);
          expect(remapRange.label).toEqual('0 - 1');
          remapRange = overlayLayer.remapRanges[4];
          expect(remapRange.inputMin).toEqual(10);
          expect(remapRange.inputMax).toEqual(45);
          expect(remapRange.outputValue).toEqual(1);
          expect(remapRange.label).toEqual('10 - 45');
        }
      });
    });
    it('model layer urls should match service layer urls', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        var rasterLayer = weightedOverlayService.getRasterLayer(overlayLayer.id);
        expect(rasterLayer).toBeDefined();
        expect(overlayLayer.url).toEqual(rasterLayer.url);
      });
    });
    it('model layer titles should match layer titles', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        var rasterLayer = weightedOverlayService.getRasterLayer(overlayLayer.id);
        expect(rasterLayer).toBeDefined();
        expect(overlayLayer.title).toEqual(rasterLayer.title);
      });
    });
    it('model layer names should match layer names', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        var rasterLayer = weightedOverlayService.getRasterLayer(overlayLayer.id);
        expect(rasterLayer).toBeDefined();
        expect(overlayLayer.name).toEqual(rasterLayer.name);
      });
    });
    it('model colormap definition should match raster function colormap arg', function() {
      expect(model.colormapDefinition).toBeDefined();
      expect(model.colormapDefinition).toEqual({
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
      });
    });
  });
  describe('when exporting a valid model to a web map', function() {
    var exportModel;
    var operationalLayers;
    var modelLayer;
    var exportOptions;
    beforeEach(function() {
      exportModel = {
        overlayLayers: [
          {
            weight: 25,
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
            weight: 25,
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
            weight: 25,
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
            weight: 25,
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
            ],
          }
        ],
        colormapDefinition: {
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
      };
      exportOptions = {
        modelTitle: 'Test Export'
      };
      operationalLayers = weightedOverlayService.modelToOperationalLayers(exportModel, exportOptions);
      array.some(operationalLayers, function(operationalLayer) {
        if (operationalLayer.renderingRule && operationalLayer.renderingRule.rasterFunction === weightedOverlayService.rasterFunctionName) {
          modelLayer = operationalLayer;
          return true;
        } else {
          return false;
        }
      });
    });
    afterEach(function() {
      exportModel = null;
      operationalLayers = null;
      modelLayer = null;
    });
    it('should create an operational layer for the model with same url, id, and title', function() {
      expect(modelLayer).toBeDefined();
      expect(modelLayer.url).toBeDefined();
      expect(modelLayer.url).toEqual(weightedOverlayService.imageServiceLayer.url);
      expect(modelLayer.id).toBeDefined();
      expect(modelLayer.id).toEqual(weightedOverlayService.imageServiceLayer.id);
      expect(modelLayer.opacity).toBeDefined();
      expect(modelLayer.opacity).toEqual(weightedOverlayService.imageServiceLayer.opacity);
      expect(modelLayer.title).toBeDefined();
      expect(modelLayer.title).toEqual(exportOptions.modelTitle);
    });
    it('should create a raster function with id, weight, and remap parameters for each model layer', function() {
      var args;
      expect(modelLayer).toBeDefined();
      expect(modelLayer.renderingRule).toBeDefined();
      expect(modelLayer.renderingRule.rasterFunctionArguments).toBeDefined();
      args = modelLayer.renderingRule.rasterFunctionArguments;
      // test ids and weights of each layer
      // WARNING: assumes that raster function args are created in order
      array.forEach(exportModel.overlayLayers, function(overlayLayer, index) {
        var argIndex = index + 1; // NOTE: 1 based
        var inputRanges = [];
        var outputValues = [];
        var noDataRanges = [];
        var labels = [];
        var noDataLabels = [];
        array.forEach(overlayLayer.remapRanges, function(remapRange) {
          if (remapRange.outputValue) {
            inputRanges.push(remapRange.inputMin);
            inputRanges.push(remapRange.inputMax);
            outputValues.push(remapRange.outputValue);
            labels.push(remapRange.label);
          } else {
            noDataRanges.push(remapRange.inputMin);
            noDataRanges.push(remapRange.inputMax);
            noDataLabels.push(remapRange.label);
          }
        });
        expect(args[weightedOverlayService.argumentNamePrefixes.id + argIndex]).toEqual('$' + overlayLayer.id);
        expect(args[weightedOverlayService.argumentNamePrefixes.weight + argIndex]).toEqual(number.round(overlayLayer.weight / 100, 2));
        if (outputValues.length > 0) {
          expect(args[weightedOverlayService.argumentNamePrefixes.inputRanges + argIndex]).toEqual(inputRanges);
          expect(args[weightedOverlayService.argumentNamePrefixes.outputValues + argIndex]).toEqual(outputValues);
          expect(modelLayer.remapRangeLabels).toBeDefined();
          expect(modelLayer.remapRangeLabels[weightedOverlayService.argumentNamePrefixes.labels + argIndex]).toEqual(labels);
        }
        if (noDataRanges.length > 0) {
          expect(args[weightedOverlayService.argumentNamePrefixes.noDataRanges + argIndex]).toEqual(noDataRanges);
          expect(modelLayer.noDataRangeLabels).toBeDefined();
          expect(modelLayer.noDataRangeLabels[weightedOverlayService.argumentNamePrefixes.noDataLabels + argIndex]).toEqual(noDataLabels);
        }
        expect(args[weightedOverlayService.argumentNamePrefixes.labels + argIndex]).toBeUndefined();
        expect(args[weightedOverlayService.argumentNamePrefixes.noDataLabels + argIndex]).toBeUndefined();
      });
    });
    it('should have the same colormap as the model', function() {
      var colormap;
      expect(modelLayer).toBeDefined();
      expect(modelLayer.renderingRule).toBeDefined();
      expect(modelLayer.renderingRule.rasterFunctionArguments).toBeDefined();
      expect(modelLayer.renderingRule.rasterFunctionArguments).toBeDefined();
      colormap = modelLayer.renderingRule.rasterFunctionArguments[weightedOverlayService.colorMapArgName];
      // test ids and weights of each layer
      // WARNING: assumes that raster function args are created in order
      expect(colormap).toBeDefined();
      array.forEach(exportModel.colormapDefinition.colors, function(color, index) {
        expect(colormap[index]).toEqual([color.value].concat(color.rgb));
      });
    });
    // TODO: model layers as individual overlay layers
  });

  describe("When validating a model", function() {
    var validModel;
    beforeEach(function() {
      validModel = {
        overlayLayers: [
          {
            weight: 25,
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
            weight: 25,
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
            weight: 25,
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
            weight: 25,
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
            ],
          }
        ],
        colormapDefinition: {
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
      };
    });
    weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(config.weightedOverlayService), config.weightedOverlayService.options);

    it("should return no error messages if model is valid", function() {
      expect(weightedOverlayService.validateModel(validModel).isValid).toBeTruthy();
    });
    it("should be invalid if overlay layers is not an array", function() {
      var res = weightedOverlayService.validateModel();
      expect(res.isValid).toBeFalsy();
      expect(res.modelErrors).toContain("Overlay layers is not defined");
    });
    it("should be invalid if less than one overlay layers", function() {
      var res = weightedOverlayService.validateModel({
        overlayLayers: []
      });
      expect(res.isValid).toBeFalsy();
      expect(res.modelErrors).toContain("At least one overlay layer is required");
    });
    it("should be invalid if weights don't add up to 100", function() {
      var res = weightedOverlayService.validateModel({
        overlayLayers: [{}, { weight: 50}]
      });
      expect(res.isValid).toBeFalsy();
      expect(res.modelErrors).toContain("Overlay layer weights must add up to 100");
      res = weightedOverlayService.validateModel({
        overlayLayers: [{weight: 51}, { weight: 50}]
      });
      expect(res.isValid).toBeFalsy();
      expect(res.modelErrors).toContain("Overlay layer weights must add up to 100");
    });
    it("should be invalid if one or more layers is missing remap ranges", function() {
      var res = weightedOverlayService.validateModel({
        overlayLayers: [{ weight: 50, remapRanges: []}, { weight: 50}]
      });
      expect(res.isValid).toBeFalsy();
      expect(res.modelErrors).toContain("Overlay layer [0] missing remap ranges");
      expect(res.modelErrors).toContain("Overlay layer [1] missing remap ranges");
    });
    it("should be invalid if one or more remap ranges is missing an output value", function() {
      // modify an otherwise valid model
      delete validModel.overlayLayers[0].remapRanges[0].outputValue;
      validModel.overlayLayers[1].remapRanges[1].outputValue = null;
      validModel.overlayLayers[2].remapRanges[2].outputValue = "not a number";
      validModel.overlayLayers[3].remapRanges[3].outputValue = {};
      var res = weightedOverlayService.validateModel(validModel);
      expect(res.isValid).toBeFalsy();
      expect(res.modelErrors).toContain("Overlay layer [0] remap ranges [0] output value missing or invalid");
      expect(res.modelErrors).toContain("Overlay layer [1] remap ranges [1] output value missing or invalid");
      expect(res.modelErrors).toContain("Overlay layer [2] remap ranges [2] output value missing or invalid");
      expect(res.modelErrors).toContain("Overlay layer [3] remap ranges [3] output value missing or invalid");
    });
    it("should be invalid if one or more remap ranges does not have a input range w/ min <= max", function() {
      delete validModel.overlayLayers[0].remapRanges[0].inputMin;
      validModel.overlayLayers[1].remapRanges[1].inputMax = null;
      validModel.overlayLayers[1].remapRanges[1].inputMin = null;
      validModel.overlayLayers[2].remapRanges[2].inputMin = validModel.overlayLayers[2].remapRanges[2].inputMax + 1;
      var res = weightedOverlayService.validateModel(validModel);
      expect(res.isValid).toBeFalsy();
      expect(res.modelErrors).toContain("Overlay layer [0] remap ranges [0] input min/max missing or invalid");
      expect(res.modelErrors).toContain("Overlay layer [1] remap ranges [1] input min/max missing or invalid");
      expect(res.modelErrors).toContain("Overlay layer [2] remap ranges [2] input min/max missing or invalid");
    });
  });

  describe("when getting a new empty model", function() {
    var newModel;
    beforeEach(function() {
      weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(config.weightedOverlayService), config.weightedOverlayService.options);
      newModel = weightedOverlayService.createNewModel();
    });
    it("should have an empty arry of overlay layers", function() {
      expect(newModel.overlayLayers).toEqual([]);
    });
    it("should have the default colormap definition", function() {
      expect(newModel.colormapDefinition).toEqual(weightedOverlayService.colormapDefinitions[0]);
    });
  });

  // async tests. gnarly!
  describe("when querying rasters from service", function() {
    var configSettings = lang.clone(config.weightedOverlayService);
    delete configSettings.options.rasterLayers;
    xit("should have rasters with ids and remapRanges", function() {
      weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(configSettings), configSettings.options);
      weightedOverlayService.initRasterLayers();
      // wait for async load of raster layers to complete
      waitsFor(function() {
        return weightedOverlayService.rasterLayers;
      });
      runs(function() {
        var prevTitle = "";
        array.forEach(weightedOverlayService.rasterLayers, function(rasterLayer) {
          expect(rasterLayer.id).toBeDefined();
          expect(rasterLayer.remapRanges).toBeDefined();
          expect(rasterLayer.title).not.toBeLessThan(prevTitle);
          prevTitle = rasterLayer.title;
        });
      });
    });
  });

  describe("when getting model pixel size", function() {
    // {"xmin":-13919697.86644086,"ymin":3940010.875079476,"xmax":-12997561.557208745,"ymax":4827903.395639843,"spatialReference":{"wkid":102100}}
    // {"x":62,"y":217}
    xit("should never be less than image service pixel size", function() {
      var configSettings = config.weightedOverlayService;
      weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(configSettings), configSettings.options);
      waitsFor(function() {
        return weightedOverlayService.imageServiceLayer.loaded;
      });
      runs(function() {
        var zoomedOut = new Extent({"xmin":-13919697.86644086,"ymin":3940010.875079476,"xmax":-12997561.557208745,"ymax":4827903.395639843,"spatialReference":{"wkid":102100}});
        var zoomedIn = new Extent({"xmin":-13042661.9077,"ymin":4042878.2515999973,"xmax":-13039929.284,"ymax":4043623.512599997,"spatialReference":{"wkid":102100}});
        var pixelSize = weightedOverlayService.getModelPixelSize(zoomedOut);
        expect(pixelSize.x).toBeGreaterThan(weightedOverlayService.pixelSizeX);
        expect(pixelSize.y).toBeGreaterThan(weightedOverlayService.pixelSizeY);
        pixelSize = weightedOverlayService.getModelPixelSize(zoomedIn);
        expect(pixelSize.x).toEqual(weightedOverlayService.pixelSizeX);
        expect(pixelSize.y).toEqual(weightedOverlayService.pixelSizeY);
      });
    });
  });

  // TODO: incorporate these tests above
  // describe('when initializing raster layers from query results', function() {
  //   var features = [
  //     // normal
  //     {
  //      "attributes": {
  //       "OBJECTID": 1,
  //       "Name": "crithab",
  //       "Title": "Critical Habitat",
  //       "Url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Critical_Habitat/ImageServer",
  //       "InputRanges": "0,0,5,5,10,10",
  //       "OutputValues": "1,5,9",
  //       "NoDataRanges": null,
  //       "RangeLabels": "Non Critical, Threatened, Endangered"
  //      }
  //     },
  //     // no title
  //     features = {
  //      "attributes": {
  //       "OBJECTID": 2,
  //       "Name": "dev",
  //       "Title": null,// "Development Risk",
  //       "Url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Development_Risk/ImageServer",
  //       "InputRanges": "0,0,1,1,2,2,3,3,4,4",
  //       "OutputValues": "0,1,5,8,9",
  //       "NoDataRanges": null,
  //       "RangeLabels": "None,Low,Moderate,High,Very High"
  //      }
  //     },
  //     {
  //      "attributes": {
  //       "OBJECTID": 3,
  //       "Name": "for_frag",
  //       "Title": "Forest Fragmentation",
  //       "Url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Forest_Fragmentation/ImageServer",
  //       "InputRanges": "0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7",
  //       "OutputValues": "1,2,1,3,1,9,6,1",
  //       "NoDataRanges": null,
  //       "RangeLabels": "None (Water),Very Low (Edge),None (Undermined),Low (Perforated),None (Interior),High (Patch),Medium (Transitional),None (Unlabeled)"
  //      }
  //     },
  //     {
  //      "attributes": {
  //       "OBJECTID": 4,
  //       "Name": "ins_dis",
  //       "Title": "Insect and Disease Risk",
  //       "Url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Insect_and_Disease_Risk/ImageServer",
  //       "InputRanges": "0,1,35,66,65,101",
  //       "OutputValues": "1,9,5",
  //       "NoDataRanges": null,
  //       "RangeLabels": "Low,High,Medium"
  //      }
  //     },
  //     // no remap range info
  //     {
  //      "attributes": {
  //       "OBJECTID": 5,
  //       "Name": "wood_bio",
  //       "Title": "Woody Biomass",
  //       "Url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Woody_Biomass/ImageServer",
  //       "InputRanges": null, // "0,66,66,133,133,256",
  //       "OutputValues": null, // "1,5,9",
  //       "NoDataRanges": null,
  //       "RangeLabels": null //"Low,Medium,High"
  //      }
  //     },
  //     {
  //      "attributes": {
  //       "OBJECTID": 6,
  //       "Name": "wui",
  //       "Title": "Wildland-Urban Interface",
  //       "Url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Wildland_Urban_Interface/ImageServer",
  //       "InputRanges": "0,0,1,1",
  //       "OutputValues": "1,9",
  //       "NoDataRanges": null,
  //       "RangeLabels": "Non-Interface,Interface"
  //      }
  //     },
  //     {
  //      "attributes": {
  //       "OBJECTID": 7,
  //       "Name": "wfp2013_cls",
  //       "Title": "Wildland Fire Potential",
  //       "Url": "http://ec2-54-243-84-56.compute-1.amazonaws.com/arcgis/rest/services/Wildfire_Potential/ImageServer",
  //       "InputRanges": "0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9",
  //       "OutputValues": "1,2,3,5,8,9,1,1,1,1",
  //       "NoDataRanges": null,
  //       "RangeLabels": "None,Very Low,Low,Moderate,High,Very High,None (Non-vegetation),None (Agriculture),None (Urban/development/ag),None (Water)"
  //      }
  //     },
  //     {
  //       "attributes": {
  //         "OBJECTID": 51,
  //         "Name": "USA_Landcover_GAP",
  //         "Title": "Landcover GAP",
  //         "Url": "https://landscape3.arcgis.com/arcgis/rest/services/USA_Landcover_GAP/ImageServer",
  //         "InputRanges": "549,551,502,507,573,577,1,204,206,208,210,210, 212,289,552,557,514,554,577,579,500,507,565,576,460,499,290,393,395,417,419,459",
  //         "OutputValues": "9,3,1,7,7,7,7,6,2,1,4,8,2,4,4,4",
  //         "NoDataRanges": null,
  //         "RangeLabels": "Ag. Veg,Aquatic Veg,Developed,Forest (1-204),Forest (206-208),Forest (210),Forest (212-289),Introduced Veg,Non/Sparse-Vascular Rock Veg,Open Water,Polar/Montane Veg,Recently Disturbed,Semi-Desert,Shrubland(290-393),Shrubland(395-417),Shrubland(419-459)"
  //       }
  //     }
  //   ];
  //   var configSettings = config.weightedOverlayService;
  //   beforeEach(function() {
  //     weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(configSettings), configSettings.options);
  //     weightedOverlayService._initRasterLayers(features);
  //     // console.log(JSON.stringify(weightedOverlayService.rasterLayers));
  //   });
  //   it('should have the same number of layers as features', function() {
  //     expect(weightedOverlayService.rasterLayers).toBeDefined();
  //     expect(weightedOverlayService.rasterLayers.length).toEqual(features.length);
  //   });
  //   it('should have raster layers with the same attributes as the features', function() {
  //     expect(weightedOverlayService.rasterLayers).toBeDefined();
  //     array.forEach(weightedOverlayService.rasterLayers, function(rasterLayer, index) {
  //       expect(rasterLayer.id).toBeDefined();
  //       expect(rasterLayer.id).toEqual(features[index].attributes.OBJECTID);
  //       expect(rasterLayer.name).toEqual(features[index].attributes.Name);
  //       expect(rasterLayer.title).toEqual(features[index].attributes.Title);
  //       expect(rasterLayer.url).toEqual(features[index].attributes.Url);
  //     });
  //   });
  //   it('should have raster layers with remap ranges defined from feature attributes', function() {
  //     expect(weightedOverlayService.rasterLayers).toBeDefined();
  //     array.forEach(weightedOverlayService.rasterLayers, function(rasterLayer, index) {
  //       var attr = features[index].attributes,
  //         inputRanges,
  //         outputValues,
  //         labels;
  //       if (attr.InputRanges && attr.OutputValues) {
  //         expect(rasterLayer.remapRanges).toBeDefined();
  //         inputRanges = array.map(attr.InputRanges.split(','), function(val) {
  //           return parseInt(val.trim(), 10);
  //         });
  //         outputValues = array.map(attr.OutputValues.split(','), function(val) {
  //           return parseInt(val.trim(), 10);
  //         });
  //         if (attr.RangeLabels) {
  //           labels = array.map(attr.RangeLabels.split(','), function(val) {
  //             return val.trim();
  //           });
  //         }
  //         expect(rasterLayer.remapRanges.length).toEqual(outputValues.length);
  //         array.forEach(rasterLayer.remapRanges, function(remapRange, index2) {
  //           expect(remapRange).toBeDefined();
  //           expect(remapRange.outputValue).toEqual(outputValues[index2]);
  //           expect(remapRange.inputMin).toEqual(inputRanges[index2 * 2]);
  //           expect(remapRange.inputMax).toEqual(inputRanges[(index2 * 2) + 1]);
  //           expect(remapRange.label).toEqual(labels[index2] || remapRange.inputMin + ' - ' + remapRange.inputMax);
  //           // expect(1).toEqual(2);
  //         });
  //       }
  //     });
  //   });

  // });

  // TODO: async tests for:
    // runModel
    // getHistogram
});
