define([
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/number',

  'esri/layers/ArcGISImageServiceLayer',
  'esri/geometry/Extent',
  'esri/request',

  'weighted-overlay-modeler/WeightedOverlayService',

  'spec/config'
], function(
  lang, array, number,
  ArcGISImageServiceLayer, Extent, esriRequest,
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
          expect(val).to.not.be["undefined"];
          if (defaultOptions[setting]) {
            expect(val).to.deep.equal(lang.mixin(defaultOptions[setting], configSettings.options[setting]));
          } else {
            expect(val).to.deep.equal(configSettings.options[setting]);
          }
        }
      });
    });
  });

  describe("when importing a model from a valid web map", function() {
    var model;
    // set up:
    before(function(done) {
      // init WO image service and import web map JSONs
      weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(config.weightedOverlayService), config.weightedOverlayService.options);
      esriRequest({
        url: "/base/test/data/webmap.json"
      }).then(function(response) {
        model = weightedOverlayService.operationalLayersToModel(response.operationalLayers);
        done();
      });
    });
    it('should return a model', function() {
      // waitsFor(function() {
      //   return model;
      // }, "Loaded web map JSON", 2000);
      // runs(function() {
        expect(model).to.not.be["undefined"];
      // });
    });
    it('should have 1 model layer for each raster', function() {
      expect(model.overlayLayers).to.not.be["undefined"];
      expect(model.overlayLayers.length).to.equal(4); // WARNING: magic value
    });
    it('model layer ids should match raster ids', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        expect(overlayLayer.id).to.not.be["undefined"];
        expect(overlayLayer.id).to.be.above(0);
      });
    });
    it('model layer weights should match raster weights', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        expect(overlayLayer.weight).to.not.be["undefined"];
        // WARNING: expects that all weights are the same
        expect(overlayLayer.weight).to.equal(25);
      });
    });
    it('model layer remap ranges should match raster input ranges / output values', function() {
      var remapRange;
      array.forEach(model.overlayLayers, function(overlayLayer) {
        expect(overlayLayer.remapRanges).to.not.be["undefined"];
        // test one layer
        if (overlayLayer.id === 1) {
          // "Raster1": "$1",
          // "Weight_Raster1": 0.25,
          // "InputRanges_Raster1": [0, 0, 5, 5, 10, 10],
          // "OutputValues_Raster1": [1, 9, 9],
          remapRange = overlayLayer.remapRanges[0];
          expect(remapRange.inputMin).to.equal(0);
          expect(remapRange.inputMax).to.equal(0);
          expect(remapRange.outputValue).to.equal(1);
          expect(remapRange.label).to.equal('Non Critical');
          remapRange = overlayLayer.remapRanges[1];
          expect(remapRange.inputMin).to.equal(5);
          expect(remapRange.inputMax).to.equal(5);
          expect(remapRange.outputValue).to.equal(9);
          expect(remapRange.label).to.equal('Threatened');
          remapRange = overlayLayer.remapRanges[2];
          expect(remapRange.inputMin).to.equal(10);
          expect(remapRange.inputMax).to.equal(10);
          expect(remapRange.outputValue).to.equal(9);
          expect(remapRange.label).to.equal('Endangered');
        } else if (overlayLayer.id === 14) {
          // "Raster4": "$14",
          // "Weight_Raster4": 0.25,
          // "InputRanges_Raster4": [0, 1, 1, 3, 3, 5, 5, 10, 10, 45],
          // "OutputValues_Raster4": [9, 7, 5, 3, 1],
          remapRange = overlayLayer.remapRanges[0];
          expect(remapRange.inputMin).to.equal(0);
          expect(remapRange.inputMax).to.equal(1);
          expect(remapRange.outputValue).to.equal(9);
          expect(remapRange.label).to.equal('0 - 1');
          remapRange = overlayLayer.remapRanges[4];
          expect(remapRange.inputMin).to.equal(10);
          expect(remapRange.inputMax).to.equal(45);
          expect(remapRange.outputValue).to.equal(1);
          expect(remapRange.label).to.equal('10 - 45');
        }
      });
    });
    it('model layer urls should match service layer urls', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        var rasterLayer = weightedOverlayService.getRasterLayer(overlayLayer.id);
        console.log(rasterLayer.url);
        expect(rasterLayer).to.not.be["undefined"];
        expect(overlayLayer.url).to.equal(rasterLayer.url);
      });
    });
    it('model layer titles should match layer titles', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        var rasterLayer = weightedOverlayService.getRasterLayer(overlayLayer.id);
        expect(rasterLayer).to.not.be["undefined"];
        expect(overlayLayer.title).to.equal(rasterLayer.title);
      });
    });
    it('model layer names should match layer names', function() {
      array.forEach(model.overlayLayers, function(overlayLayer) {
        var rasterLayer = weightedOverlayService.getRasterLayer(overlayLayer.id);
        expect(rasterLayer).to.not.be["undefined"];
        expect(overlayLayer.name).to.equal(rasterLayer.name);
      });
    });
    it('model colormap definition should match raster function colormap arg', function() {
      expect(model.colormapDefinition).to.not.be["undefined"];
      expect(model.colormapDefinition).to.deep.equal({
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
      expect(modelLayer).to.not.be["undefined"];
      expect(modelLayer.url).to.not.be["undefined"];
      expect(modelLayer.url).to.equal(weightedOverlayService.imageServiceLayer.url);
      expect(modelLayer.id).to.not.be["undefined"];
      expect(modelLayer.id).to.equal(weightedOverlayService.imageServiceLayer.id);
      expect(modelLayer.opacity).to.not.be["undefined"];
      expect(modelLayer.opacity).to.equal(weightedOverlayService.imageServiceLayer.opacity);
      expect(modelLayer.title).to.not.be["undefined"];
      expect(modelLayer.title).to.equal(exportOptions.modelTitle);
    });
    it('should create a raster function with id, weight, and remap parameters for each model layer', function() {
      var args;
      expect(modelLayer).to.not.be["undefined"];
      expect(modelLayer.renderingRule).to.not.be["undefined"];
      expect(modelLayer.renderingRule.rasterFunctionArguments).to.not.be["undefined"];
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
        expect(args[weightedOverlayService.argumentNamePrefixes.id + argIndex]).to.equal('$' + overlayLayer.id);
        expect(args[weightedOverlayService.argumentNamePrefixes.weight + argIndex]).to.equal(number.round(overlayLayer.weight / 100, 2));
        if (outputValues.length > 0) {
          expect(args[weightedOverlayService.argumentNamePrefixes.inputRanges + argIndex]).to.deep.equal(inputRanges);
          expect(args[weightedOverlayService.argumentNamePrefixes.outputValues + argIndex]).to.deep.equal(outputValues);
          expect(modelLayer.remapRangeLabels).to.not.be["undefined"];
          expect(modelLayer.remapRangeLabels[weightedOverlayService.argumentNamePrefixes.labels + argIndex]).to.deep.equal(labels);
        }
        if (noDataRanges.length > 0) {
          expect(args[weightedOverlayService.argumentNamePrefixes.noDataRanges + argIndex]).to.deep.equal(noDataRanges);
          expect(modelLayer.noDataRangeLabels).to.not.be["undefined"];
          expect(modelLayer.noDataRangeLabels[weightedOverlayService.argumentNamePrefixes.noDataLabels + argIndex]).to.deep.equal(noDataLabels);
        }
        expect(args[weightedOverlayService.argumentNamePrefixes.labels + argIndex]).to.be["undefined"];
        expect(args[weightedOverlayService.argumentNamePrefixes.noDataLabels + argIndex]).to.be["undefined"];
      });
    });
    it('should have the same colormap as the model', function() {
      var colormap;
      expect(modelLayer).to.not.be["undefined"];
      expect(modelLayer.renderingRule).to.not.be["undefined"];
      expect(modelLayer.renderingRule.rasterFunctionArguments).to.not.be["undefined"];
      expect(modelLayer.renderingRule.rasterFunctionArguments).to.not.be["undefined"];
      colormap = modelLayer.renderingRule.rasterFunctionArguments[weightedOverlayService.colorMapArgName];
      // test ids and weights of each layer
      // WARNING: assumes that raster function args are created in order
      expect(colormap).to.not.be["undefined"];
      array.forEach(exportModel.colormapDefinition.colors, function(color, index) {
        expect(colormap[index]).to.deep.equal([color.value].concat(color.rgb));
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
      expect(weightedOverlayService.validateModel(validModel).isValid).to.be.ok;
    });
    it("should be invalid if overlay layers is not an array", function() {
      var res = weightedOverlayService.validateModel();
      expect(res.isValid).to.not.be.ok;
      expect(res.modelErrors).to.contain("Overlay layers is not defined");
    });
    it("should be invalid if less than one overlay layers", function() {
      var res = weightedOverlayService.validateModel({
        overlayLayers: []
      });
      expect(res.isValid).to.not.be.ok;
      expect(res.modelErrors).to.contain("At least one overlay layer is required");
    });
    it("should be invalid if weights don't add up to 100", function() {
      var res = weightedOverlayService.validateModel({
        overlayLayers: [{}, { weight: 50}]
      });
      expect(res.isValid).to.not.be.ok;
      expect(res.modelErrors).to.contain("Overlay layer weights must add up to 100");
      res = weightedOverlayService.validateModel({
        overlayLayers: [{weight: 51}, { weight: 50}]
      });
      expect(res.isValid).to.not.be.ok;
      expect(res.modelErrors).to.contain("Overlay layer weights must add up to 100");
    });
    it("should be invalid if one or more layers is missing remap ranges", function() {
      var res = weightedOverlayService.validateModel({
        overlayLayers: [{ weight: 50, remapRanges: []}, { weight: 50}]
      });
      expect(res.isValid).to.not.be.ok;
      expect(res.modelErrors).to.contain("Overlay layer [0] missing remap ranges");
      expect(res.modelErrors).to.contain("Overlay layer [1] missing remap ranges");
    });
    it("should be invalid if one or more remap ranges is missing an output value", function() {
      // modify an otherwise valid model
      delete validModel.overlayLayers[0].remapRanges[0].outputValue;
      validModel.overlayLayers[1].remapRanges[1].outputValue = null;
      validModel.overlayLayers[2].remapRanges[2].outputValue = "not a number";
      validModel.overlayLayers[3].remapRanges[3].outputValue = {};
      var res = weightedOverlayService.validateModel(validModel);
      expect(res.isValid).to.not.be.ok;
      expect(res.modelErrors).to.contain("Overlay layer [0] remap ranges [0] output value missing or invalid");
      expect(res.modelErrors).to.contain("Overlay layer [1] remap ranges [1] output value missing or invalid");
      expect(res.modelErrors).to.contain("Overlay layer [2] remap ranges [2] output value missing or invalid");
      expect(res.modelErrors).to.contain("Overlay layer [3] remap ranges [3] output value missing or invalid");
    });
    it("should be invalid if one or more remap ranges does not have a input range w/ min <= max", function() {
      delete validModel.overlayLayers[0].remapRanges[0].inputMin;
      validModel.overlayLayers[1].remapRanges[1].inputMax = null;
      validModel.overlayLayers[1].remapRanges[1].inputMin = null;
      validModel.overlayLayers[2].remapRanges[2].inputMin = validModel.overlayLayers[2].remapRanges[2].inputMax + 1;
      var res = weightedOverlayService.validateModel(validModel);
      expect(res.isValid).to.not.be.ok;
      expect(res.modelErrors).to.contain("Overlay layer [0] remap ranges [0] input min/max missing or invalid");
      expect(res.modelErrors).to.contain("Overlay layer [1] remap ranges [1] input min/max missing or invalid");
      expect(res.modelErrors).to.contain("Overlay layer [2] remap ranges [2] input min/max missing or invalid");
    });
  });

  describe("when getting a new empty model", function() {
    var newModel;
    beforeEach(function() {
      weightedOverlayService = new WeightedOverlayService(getImageServiceLayer(config.weightedOverlayService), config.weightedOverlayService.options);
      newModel = weightedOverlayService.createNewModel();
    });
    it("should have an empty arry of overlay layers", function() {
      expect(newModel.overlayLayers).to.deep.equal([]);
    });
    it("should have the default colormap definition", function() {
      expect(newModel.colormapDefinition).to.deep.equal(weightedOverlayService.colormapDefinitions[0]);
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
          expect(rasterLayer.id).to.not.be["undefined"];
          expect(rasterLayer.remapRanges).to.not.be["undefined"];
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
        expect(pixelSize.x).to.be.above(weightedOverlayService.pixelSizeX);
        expect(pixelSize.y).to.be.above(weightedOverlayService.pixelSizeY);
        pixelSize = weightedOverlayService.getModelPixelSize(zoomedIn);
        expect(pixelSize.x).to.equal(weightedOverlayService.pixelSizeX);
        expect(pixelSize.y).to.equal(weightedOverlayService.pixelSizeY);
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
  //     expect(weightedOverlayService.rasterLayers).to.not.be["undefined"];
  //     expect(weightedOverlayService.rasterLayers.length).to.equal(features.length);
  //   });
  //   it('should have raster layers with the same attributes as the features', function() {
  //     expect(weightedOverlayService.rasterLayers).to.not.be["undefined"];
  //     array.forEach(weightedOverlayService.rasterLayers, function(rasterLayer, index) {
  //       expect(rasterLayer.id).to.not.be["undefined"];
  //       expect(rasterLayer.id).to.equal(features[index].attributes.OBJECTID);
  //       expect(rasterLayer.name).to.equal(features[index].attributes.Name);
  //       expect(rasterLayer.title).to.equal(features[index].attributes.Title);
  //       expect(rasterLayer.url).to.equal(features[index].attributes.Url);
  //     });
  //   });
  //   it('should have raster layers with remap ranges defined from feature attributes', function() {
  //     expect(weightedOverlayService.rasterLayers).to.not.be["undefined"];
  //     array.forEach(weightedOverlayService.rasterLayers, function(rasterLayer, index) {
  //       var attr = features[index].attributes,
  //         inputRanges,
  //         outputValues,
  //         labels;
  //       if (attr.InputRanges && attr.OutputValues) {
  //         expect(rasterLayer.remapRanges).to.not.be["undefined"];
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
  //         expect(rasterLayer.remapRanges.length).to.equal(outputValues.length);
  //         array.forEach(rasterLayer.remapRanges, function(remapRange, index2) {
  //           expect(remapRange).to.not.be["undefined"];
  //           expect(remapRange.outputValue).to.equal(outputValues[index2]);
  //           expect(remapRange.inputMin).to.equal(inputRanges[index2 * 2]);
  //           expect(remapRange.inputMax).to.equal(inputRanges[(index2 * 2) + 1]);
  //           expect(remapRange.label).to.equal(labels[index2] || remapRange.inputMin + ' - ' + remapRange.inputMax);
  //           // expect(1).to.equal(2);
  //         });
  //       }
  //     });
  //   });

  // });

  // TODO: async tests for:
    // runModel
    // getHistogram
});
