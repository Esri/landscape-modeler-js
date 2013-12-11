define([
  "dojo/_base/declare",
  'dojo/_base/lang',
  "dojo/_base/array",
  'dojo/string',
  'dojo/number',

  "esri/request",
  "esri/layers/RasterFunction"
],
function(
  declare, lang, array, string, number,
  esriRequest, RasterFunction
) {

  // are 2 arrays exactly the same?
  var compareArrays = function (a1, a2) {
    var len;
    // if the other array is a falsy value, return
    if (!a1 || !a2) {
      return false;
    }
    // compare lengths - can save a lot of time
    len = a1.length;
    if (len !== a2.length) {
      return false;
    }
    for (var i = 0; i < len; i++) {
        // Check if we have nested arrays
        if (a1[i] instanceof Array && a2[i] instanceof Array) {
            // recurse into the nested arrays
            if (!a1[i].compare(a2[i])) {
              return false;
            }
        }
        else if (a1[i] !== a2[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
  };

  // parse a raster layer object out of feature attributes
  var featureToRasterLayer = function(feature) {
    var attr = feature.attributes,
      inputRanges,
      outputValues,
      noDataRanges,
      labels,
      noDataLabels,
      rasterLayer;
    if (attr) {
      rasterLayer = {
        id: attr.OBJECTID,
        name: attr.Name,
        title: attr.Title,
        url: attr.Url
      };
      if (attr.InputRanges && attr.InputRanges.split && attr.OutputValues && attr.OutputValues.split) {
        // set remap ranges
        inputRanges = array.map(attr.InputRanges.split(','), function(val) {
          return parseInt(val.trim(), 10);
        });
        outputValues = array.map(attr.OutputValues.split(','), function(val) {
          return parseInt(val.trim(), 10);
        });
        if (attr.RangeLabels && attr.RangeLabels.split) {
          labels = array.map(attr.RangeLabels.split(','), function(val) {
            return val.trim();
          });
        }
      }
      if (attr.NoDataRanges && attr.NoDataRanges.split) {
        noDataRanges = array.map(attr.NoDataRanges.split(','), function(val) {
          return parseInt(val.trim(), 10);
        });
        if (attr.NoDataRangeLabels && attr.NoDataRangeLabels.split) {
          noDataLabels = array.map(attr.NoDataRangeLabels.split(','), function(val) {
            return val.trim();
          });
        }
      }
      rasterLayer.remapRanges = remapRangeUtils.createRemapRanges(inputRanges, outputValues, noDataRanges, {
        labels: labels,
        noDataLabels: noDataLabels
      });
    }
    return rasterLayer;
  };

  // get a colormap (nested array)
  // from a colormap definition object
  var colormapDefinitionToColormap = function(colormapDefinition) {
    return array.map(colormapDefinition.colors, function(color) {
      return [color.value].concat(color.rgb);
    });
  };

  // validate a model and
  // return an array of errors (if any)
  var getModelValidationErrors = function(model) {
    var errs = [];
    var totalWeight = 0;
    if (model && model.overlayLayers && model.overlayLayers.push) {
      if (model.overlayLayers.length > 0) {
        array.forEach(model.overlayLayers, function(overlayLayer, index) {
          totalWeight += overlayLayer.weight;
          if (overlayLayer.remapRanges && overlayLayer.remapRanges.push && overlayLayer.remapRanges.length > 0) {
            array.forEach(overlayLayer.remapRanges, function(remapRange, index2) {
              if (isNaN(remapRange.outputValue) || remapRange.outputValue === null) {
                errs.push("Overlay layer [" + index + "] remap ranges [" + index2 + "] output value missing or invalid");
              }
              if (isNaN(remapRange.inputMin) || remapRange.inputMin === null || isNaN(remapRange.inputMax) || remapRange.inputMax === null || remapRange.inputMin > remapRange.inputMax) {
                errs.push("Overlay layer [" + index + "] remap ranges [" + index2 + "] input min/max missing or invalid");
              }
            });
          } else {
            errs.push("Overlay layer [" + index + "] missing remap ranges");
          }
        });
        if (totalWeight !== 100) {
          errs.push("Overlay layer weights must add up to 100");
        }
      } else {
        errs.push("At least one overlay layer is required");
      }
    } else {
      errs.push("Overlay layers is not defined");
    }
    return errs;
  };

  // call image service compute histograms method
  var computeHistograms = function(serviceUrl, geometry, options) {
    // TODO: check geom for type
    // >>> geometry.type
    // "polygon"
    // >>> geometry.getExtent().type
    // "extent"
    var url = serviceUrl + "/computeHistograms";
    var content = {
      // TODO: base on the type of the geometry arg
      geometryType: "esriGeometryPolygon",
      f: "json"
    };
    content.geometry = JSON.stringify(geometry);
    if (options) {
      // serialize options
      if (options.renderingRule) {
        content.renderingRule = JSON.stringify(options.renderingRule);
      }
      if (options.pixelSize) {
        content.pixelSize = JSON.stringify(options.pixelSize);
      }
    }
    return esriRequest({
      url: url,
      content: content,
      handleAs: "json",
      callbackParamName: "callback"
    });
  };

  // NOTE: move this to it's own file/module
  // once it's possible to do a dojo build
  // and/or it is needed by other classes
  var remapRangeUtils = {

    // parse array of remap range objects out of raster function arguments
    rasterFunctionArgumentsToRemapRanges: function(rasterFunctionArguments, options) {
      var remapRanges,
        opts,
        inputRanges,
        outputValues,
        noDataRanges,
        labels,
        noDataLabels;
      if (rasterFunctionArguments) {
        opts = lang.mixin({
          inputRangesArgumentName: 'InputRanges',
          outputValuesArgumentName: 'OutputValues',
          noDataRangesArgumentName: 'NoDataRanges',
          labelsArgumentName: 'Labels',
          noDataLabelsArgumentName: 'NoDataLabels'
        }, options);
        inputRanges = rasterFunctionArguments[opts.inputRangesArgumentName];
        outputValues = rasterFunctionArguments[opts.outputValuesArgumentName];
        noDataRanges = rasterFunctionArguments[opts.noDataRangesArgumentName];
        labels = rasterFunctionArguments[opts.labelsArgumentName];
        noDataLabels = rasterFunctionArguments[opts.noDataLabelsArgumentName];
        remapRanges = this.createRemapRanges(inputRanges, outputValues, noDataRanges, {
          labels: labels,
          noDataLabels: noDataLabels
        });
      }
      return remapRanges;
    },

    // combine arrays of remap range arguments
    // into a single array of remap range objects
    createRemapRanges: function(inputRanges, outputValues, noDataRanges, options) {
      var remapRanges = [],
        hasValidLabels = false,
        labels, noDataLabels;
      if (options) {
        labels = options.labels;
        noDataLabels = options.noDataLabels;
      }
      // check for and add input ranges and output values
      if (inputRanges && inputRanges.push && outputValues && outputValues.push && inputRanges.length === outputValues.length * 2) {
        hasValidLabels = (labels && labels.push && labels.length === outputValues.length);
        array.forEach(outputValues, function(outputValue, index) {
          var inputRangeMinIndex = index * 2;
          var range = {
            inputMin: inputRanges[inputRangeMinIndex],
            inputMax: inputRanges[inputRangeMinIndex + 1],
            outputValue: outputValue
          };
          range.label = (hasValidLabels ? labels[index] : this.getRangeString(range.inputMin, range.inputMax));
          remapRanges.push(range);
        }, this);
      }
      // check for and add no data ranges
      if (noDataRanges && noDataRanges.push && noDataRanges.length > 0) {
        hasValidLabels = (noDataLabels && noDataLabels.push && noDataLabels.length === noDataRanges.length / 2);
        array.forEach(noDataRanges, function(noDataRangeBound, index) {
          // even numbered elements represent range min
          if (index % 2 === 0) {
            var range = {
              inputMin: noDataRangeBound,
              inputMax: noDataRanges[index + 1],
              // NOTE: using 0 for no data range values
              outputValue: 0
            };
            range.label = (hasValidLabels ? noDataLabels[index] : this.getRangeString(range.inputMin, range.inputMax));
            remapRanges.push(range);
          }
        }, this);
      }
      if (remapRanges.length > 0) {
        return remapRanges;
      } else {
        return undefined;
      }
    },

    // string that reperents the range min/max
    getRangeString: function(min, max) {
      if (min === max) {
        return min + '';
      } else {
        return min + ' - ' + max;
      }
    },

    // build raster function arguments from remap ranges
    remapRangesToRasterFunctionArguments: function(remapRanges, options) {
      var rasterFunctionArguments,
        opts,
        inputRanges,
        outputValues,
        noDataRanges,
        labels,
        noDataLabels;
      if (remapRanges) {
        rasterFunctionArguments = {};
        opts = lang.mixin({
          includeLabels: true,
          inputRangesArgumentName: 'InputRanges',
          outputValuesArgumentName: 'OutputValues',
          noDataRangesArgumentName: 'NoDataRanges',
          labelsArgumentName: 'Labels',
          noDataLabelsArgumentName: 'NoDataLabels'
        }, options);
        inputRanges = [];
        outputValues = [];
        noDataRanges = [];
        labels = [];
        noDataLabels = [];
        array.forEach(remapRanges, function(remapRange) {
          var label = remapRange.label || this.getRangeString(remapRange.inputMin, remapRange.inputMax);
          if (remapRange.outputValue) {
            inputRanges.push(remapRange.inputMin);
            inputRanges.push(remapRange.inputMax);
            outputValues.push(remapRange.outputValue);
            labels.push(label);
          } else {
            noDataRanges.push(remapRange.inputMin);
            noDataRanges.push(remapRange.inputMax);
            noDataLabels.push(label);
          }
        }, this);
        if (outputValues.length > 0) {
          rasterFunctionArguments[opts.inputRangesArgumentName] = inputRanges;
          rasterFunctionArguments[opts.outputValuesArgumentName] = outputValues;
          if (opts.includeLabels) {
            rasterFunctionArguments[opts.labelsArgumentName] = labels;
          }
        }
        if (noDataRanges.length > 0) {
          rasterFunctionArguments[opts.noDataRangesArgumentName] = noDataRanges;
          if (opts.includeLabels) {
            rasterFunctionArguments[opts.noDataLabelsArgumentName] = noDataLabels;
          }
        }
      }
      return rasterFunctionArguments;
    },

    // find the remap range that contains a value
    getRemapRangeByValue: function(remapRanges, inputValue) {
      var range;
      if (inputValue || inputValue === 0) {
        array.some(remapRanges, function(remapRange) {
          // NOTE: range min is inclusive but range max is EXclusive, see:
          // http://resources.arcgis.com/en/help/main/10.2/index.html#//009t000001zv000000
          // however, it's also valid to specify a single value range (i.e 3,3)
          if ((inputValue === remapRange.inputMin && inputValue === remapRange.inputMax) ||
            (inputValue >= remapRange.inputMin && inputValue < remapRange.inputMax)) {
            range = remapRange;
            return true;
          } else {
            return false;
          }
        });
      }
      return range;
    }
  };

  // begin class
  return declare([], {

    // set reference to image service layer
    // set default object/array and property values
    constructor: function(imageServiceLayer, options) {
      var opts = options || {};
      this.imageServiceLayer = imageServiceLayer;
      this.rasterFunctionName = opts.rasterFunctionName || "";
      this.histogramRasterFunctionName = opts.histogramRasterFunctionName || "";
      this.rastersInFunction = opts.rastersInFunction || 0;
      this.variableName = opts.variableName || "Raster";
      this.colorMapArgName = opts.colorMapArgName || "Colormap";
      this.dummyRasterId = opts.dummyRasterId || 1;
      this.colormapDefinitions = opts.colormapDefinitions || [];
      this.argumentNamePrefixes = lang.mixin({
        id: "Raster",
        weight: "Weight_Raster",
        inputRanges: "InputRanges_Raster",
        outputValues: "OutputValues_Raster",
        noDataRanges: "NoDataRanges_Raster",
        labels: "Labels_Raster",
        noDataLabels: 'NoDataLabels'
      }, opts.argumentNamePrefixes);
      this.queryParameters = lang.mixin({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: false
      }, opts.queryParameters);
      this.rasterLayers = opts.rasterLayers || [];
    },

    // query rasters from image service
    // sort them (default to title ascending)
    // for each result, create a raster layer object
    initRasterLayers: function(options) {
      var _this = this;
      return this.queryRasters().then(function(queryResults) {
        return _this._initRasterLayers(queryResults.features, options);
      });
    },

    // query rasters in mosaic using specified parameters
    queryRasters: function(queryParameters) {
      var url = this.imageServiceLayer.url + "/query";
      var content = lang.mixin(this.queryParameters, queryParameters, {
        f: "json"
      });
      if (content.outFields && content.outFields.join) {
        content.outFields = content.outFields.join(",");
      }
      return esriRequest({
        url: url,
        content: content,
        handleAs: "json",
        callbackParamName: "callback"
      });
    },

    // check array of features, if valid then
    // clear current array of raster layers
    // sort features and create a raster for each feature
    _initRasterLayers: function (features, options) {
      var _this = this;
      var rasterLayer;
      var opts = options || {};
      var compareFunc = opts.featureCompareFunc || function(a,b) {
        if (a.attributes.Title < b.attributes.Title) {
          return -1;
        } else if (a.attributes.Title > b.attributes.Title) {
          return 1;
        } else {
          return 0;
        }
      };

      if (features && features.length && features.length > 0 && features[0].attributes) {
        // clear current raster layers if any
        if (_this.rasterLayers && _this.rasterLayers.push) {
          _this.rasterLayers.length = 0;
        } else {
          _this.rasterLayers = [];
        }
        if (compareFunc) {
          // sort the features
          features.sort(compareFunc);
        }
        // get raster layer from each feature
        array.forEach(features, function(feature) {
          rasterLayer = featureToRasterLayer(feature);
          if (rasterLayer) {
            _this.rasterLayers.push(rasterLayer);
          }
        });

      }
      return _this.rasterLayers;
    },

    // create a new model with the default colormap
    createNewModel: function() {
      var model = {
        overlayLayers: []
      };
      if (this.colormapDefinitions && this.colormapDefinitions instanceof Array && this.colormapDefinitions.length > 0) {
        model.colormapDefinition = this.colormapDefinitions[0];
      }
      return model;
    },

    // get a raster layer by id
    getRasterLayer: function(id) {
      var rasterLayer;
      array.some(this.rasterLayers, function(layer) {
        if (layer.id === id) {
          rasterLayer = layer;
          return false;
        }
      });
      return rasterLayer;
    },

    // extract a model out of an array of
    // opertaional layers (i.e. from a web map)
    operationalLayersToModel: function(operationalLayers) {
      var modelLayer;
      if (this.rasterFunctionName) {
        // get the layer w/ the raster function
        array.some(operationalLayers, function(operationalLayer) {
          if(operationalLayer.renderingRule && operationalLayer.renderingRule && operationalLayer.renderingRule.rasterFunction === this.rasterFunctionName) {
            modelLayer = operationalLayer;
            return true;
          } else {
            return false;
          }
        }, this);
      }
      return this.imageServiceLayerToModel(modelLayer);
    },

    // create a model from image server layer JSON
    imageServiceLayerToModel: function(modelLayer) {
      // init model
      var model;
      var overlayLayer;
      var idArgNameRegExp;
      var rasterFunctionArguments;
      var rasterArgIndex;
      if (modelLayer) {
        model = {
          overlayLayers: []
        };
        // parse raster function arguments from layer JSON
        idArgNameRegExp = new RegExp('^' + this.argumentNamePrefixes.id + '[1-9]+$');
        rasterFunctionArguments = modelLayer.renderingRule.rasterFunctionArguments;
        // mixin the labels if any
        if (modelLayer.remapRangeLabels) {
          lang.mixin(rasterFunctionArguments, modelLayer.remapRangeLabels);
        }
        if (modelLayer.noDataRangeLabels) {
          lang.mixin(rasterFunctionArguments, modelLayer.noDataRangeLabels);
        }
        for(var arg in rasterFunctionArguments) {
          // check if this is an id argument
          if (arg.match(idArgNameRegExp)) {
            rasterArgIndex = arg.replace(this.argumentNamePrefixes.id, '');
            overlayLayer = {
              id: parseInt(rasterFunctionArguments[arg].replace('$', ''), 10)
            };
            // get weight
            overlayLayer.weight = rasterFunctionArguments[this.argumentNamePrefixes.weight + rasterArgIndex];
            if (overlayLayer.weight && overlayLayer.weight > 0) {
              // convert from decimal weight to percent
              overlayLayer.weight = overlayLayer.weight * 100;
              // look up raster in this service by id
              // and get the url, title, name, etc
              overlayLayer = lang.mixin(this.getRasterLayer(overlayLayer.id) || {}, overlayLayer);
              // get remap ranges
              overlayLayer.remapRanges = remapRangeUtils.rasterFunctionArgumentsToRemapRanges(rasterFunctionArguments, {
                inputRangesArgumentName: this.argumentNamePrefixes.inputRanges + rasterArgIndex,
                outputValuesArgumentName: this.argumentNamePrefixes.outputValues + rasterArgIndex,
                noDataRangesArgumentName: this.argumentNamePrefixes.noDataRanges + rasterArgIndex,
                labelsArgumentName: this.argumentNamePrefixes.labels + rasterArgIndex,
                noDataLabelsArgumentName: this.argumentNamePrefixes.noDataLabels + rasterArgIndex
              });
              model.overlayLayers.push(overlayLayer);
            }
          } else if(arg === this.colorMapArgName) {
            model.colormapDefinition = this.findColormapDefinition(rasterFunctionArguments[arg]);
          }
        }
      }
      return model;
    },

    // find a colormap definiton that matches the colormap
    findColormapDefinition: function(colormap) {
      var colormapDefinition;
      array.some(this.colormapDefinitions, function(def) {
        var match = false;
        match = array.every(def.colors, function(color, index) {
          return compareArrays([color.value].concat(color.rgb), colormap[index]);
        });
        if (match) {
          colormapDefinition = def;
          return true;
        } else {
          return false;
        }
      });
      return colormapDefinition;
    },

    // create an array of operational layers
    // (i.e. for a web map) from a model
    modelToOperationalLayers: function(model, options) {
      // create operational layer for the model
      var modelLayer = this.modelToImageServiceLayer(model, options);
      // TODO: if (options.includeOverlayLayers)
        // add a layer for each individual overlay layer
        // in addition to the model layer
      return [
          modelLayer
        ];
    },

    // create image service layer JSON
    // (i.e. for a web map) from a model
    modelToImageServiceLayer: function(model, options) {
      var modelLayer = {
        id: this.imageServiceLayer.id,
        url: this.imageServiceLayer.url,
        opacity: this.imageServiceLayer.opacity,
        title: "Weighted Overlay Model"
      };
      // get raster function
      var rasterFunction = this.getRasterFunction(model.overlayLayers, model.colormapDefinition, {
        includeLabels: true
      });
      // generating range labels in raster function arguments,
      // then adding them to an array of labels to be injected into
      // the layer's JSON and then removing them from the arguments
      var remapRangeLabels = {},
        noDataRangeLabels = {};
      for (var arg in rasterFunction["arguments"]) {
        if (arg.indexOf(this.argumentNamePrefixes.labels) === 0) {
          remapRangeLabels[arg] = rasterFunction["arguments"][arg];
          delete rasterFunction["arguments"][arg];
        } else if (arg.indexOf(this.argumentNamePrefixes.noDataLabels) === 0) {
          noDataRangeLabels[arg] = rasterFunction["arguments"][arg];
          delete rasterFunction["arguments"][arg];
        }
      }
      modelLayer.renderingRule = rasterFunction.toJson();
      // now inject range labels into the layer's JSON
      // NOTE: this is a hack and not supported by web map spec:
      // http://resources.arcgis.com/en/help/main/10.2/index.html#//0154000004w8000000
      modelLayer.remapRangeLabels = remapRangeLabels;
      modelLayer.noDataRangeLabels = noDataRangeLabels;
      if (options && options.modelTitle) {
        modelLayer.title = options.modelTitle;
      }
      return modelLayer;
    },

    // create a raster function from a model's layers and clormap defintion
    getRasterFunction: function(overlayLayers, colormapDefinition, options) {
      var rasterFunction = new RasterFunction();
      var layerCount = overlayLayers.length;
      var args = {};
      var opts = lang.mixin({
        rasterFunctionName: this.rasterFunctionName,
        rastersInFunction: this.rastersInFunction,
        argumentNamePrefixes: this.argumentNamePrefixes,
        variableName: this.variableName,
        dummyRasterId: this.dummyRasterId,
        includeLabels: false
      }, options);
      var remapRangeArgs;
      var layer;
      var colorMap;
      rasterFunction.functionName = opts.rasterFunctionName;
      if (opts.variableName) {
        rasterFunction.variableName = opts.variableName;
      }
      // NOTE: when more model layers than rasters in function
      // only the first X model layers will be added
      // and weights may not add up to 100
      for (var i = 1; i <= opts.rastersInFunction; i++) {
        if (i <= layerCount) {
          layer = overlayLayers[i - 1];
        } else {
          layer = {id: opts.dummyRasterId, weight: 0};
        }
        args[opts.argumentNamePrefixes.id + i] = '$' + layer.id;
        args[opts.argumentNamePrefixes.weight + i] = number.round(layer.weight / 100, 2);
        if (layer.weight > 0 && layer.remapRanges) {
          remapRangeArgs = remapRangeUtils.remapRangesToRasterFunctionArguments(layer.remapRanges, {
            includeLabels: opts.includeLabels,
            inputRangesArgumentName: opts.argumentNamePrefixes.inputRanges + i,
            outputValuesArgumentName: opts.argumentNamePrefixes.outputValues + i,
            noDataRangesArgumentName: opts.argumentNamePrefixes.noDataRanges + i,
            labelsArgumentName: opts.argumentNamePrefixes.labels + i,
            noDataLabelsArgumentName: opts.argumentNamePrefixes.noDataLabels + i
          });
          lang.mixin(args, remapRangeArgs);
        }
      }
      if (this.colorMapArgName) {
        if (colormapDefinition) {
          colorMap = colormapDefinitionToColormap(colormapDefinition);
        }
        if (!colorMap) {
          throw "This raster function requires a colormap, but the model does not have a valid colormap definition";
        }
        args[this.colorMapArgName] = colorMap;
      }
      rasterFunction["arguments"] = args;
      return rasterFunction;
    },

    // validate a model against this service
    validateModel: function(model) {
      var errs = getModelValidationErrors(model);
      return {
        isValid: errs.length < 1,
        modelErrors: errs
      };
    },

    // validate a model then generate and apply
    // a raster function to the service
    // based on model parameters
    runModel: function(model) {
      var errs;
      if (this.imageServiceLayer) {
        errs = getModelValidationErrors(model);
        if (errs.length < 1) {
          this.imageServiceLayer.setRenderingRule(this.getRasterFunction(model.overlayLayers, model.colormapDefinition));
        } else {
          throw("Model is not valid:\n\n"+errs.join("\n"));
        }
      } else {
        throw ("Image service layer is not defined");
      }
    },

    // generate a raster function from model parameters
    // and then apply it to a histogram of pixels
    // within a geometry
    getHistogram: function(model, geometry, options) {
      var errs;
      var opts = lang.mixin({}, options);
      if (this.histogramRasterFunctionName) {
        if (this.imageServiceLayer) {
          errs = getModelValidationErrors(model);
          if (errs.length < 1) {
            opts.renderingRule = this.getRasterFunction(model.overlayLayers, model.colormapDefinition, { rasterFunctionName: this.histogramRasterFunctionName }).toJson();
            return computeHistograms(this.imageServiceLayer.url, geometry, opts).then(function(response) {
              return response.histograms[0];
            });
          } else {
            throw("Model is not valid:\n\n"+errs.join("\n"));
          }
        } else {
          throw ("Image service layer is not defined");
        }
      } else {
        throw "No weighted overlay histogram function defined.";
      }
    },

    // get the pixel size for a model at a given extent
    getModelPixelSize: function(extent, options) {
      var imgLayer = this.imageServiceLayer;
      var opts = lang.mixin({
        width: imgLayer.maxImageWidth,
        height: imgLayer.maxImageHeight
      }, options);
      var minPixelSizeX = Math.max(imgLayer.pixelSizeX, Math.ceil(extent.getWidth() / opts.width));
      var minPixelSizeY = Math.max(imgLayer.pixelSizeY, Math.ceil(extent.getHeight() / opts.height));
      var pixelSize;
      if (opts.forceSquare) {
        // return a square pixel
        pixelSize = {
          x: Math.max(minPixelSizeX, minPixelSizeY)
        };
        pixelSize.y = pixelSize.x;
      } else {
        // return min x and y
        pixelSize = {
          x: minPixelSizeX,
          y: minPixelSizeY
        };
      }
      return pixelSize;
    },

    // get a colormap definition by id
    getColormapDefinition: function(id) {
      var colormapDefinition;
      array.some(this.colormapDefinitions, function(definition) {
        if (definition.id === id) {
          colormapDefinition = definition;
          return false;
        }
      });
      return colormapDefinition;
    }
  });
});
