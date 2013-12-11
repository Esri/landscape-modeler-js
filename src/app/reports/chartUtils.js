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
define([
  "dojo/_base/lang",
  "dojo/_base/array"
],
function(
  lang, array
) {
  return {
    // sort colormap colors by value
    // add no value color for 0
    // for each color in the colormap get:
      // color in chart format and
      // label/count as a chart series value
    getChartData: function(colormapDefinition, histogram) {
      var chartColors = {};
      var chartSeries = [];
      var colors = lang.clone(colormapDefinition.colors);
      var histogramMin = Math.round(histogram.min);
      var histogramMax = Math.round(histogram.max) - 1;
      colors.sort(function(a,b) {
        return a.value - b.value;
      });
      if (colors[0].value !== 0) {
        colors.unshift({label: "No Data", value: 0, rgb:[128,128,128]});
      }
      array.forEach(colors, function(color) {
        var count;
        chartColors[color.label] = color.rgb;
        // chartColors.push(chartColor);
        if (color.value < histogramMin || color.value > histogramMax) {
          count = 0;
        } else {
          count = histogram.counts[color.value - histogramMin];
        }
        chartSeries.push({
          name: color.label,
          value: count
        });
      });
      return {
        dataset: chartSeries,
        colors: chartColors
      };
    }
  };
});