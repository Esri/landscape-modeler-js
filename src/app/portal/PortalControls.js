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
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/on",
  "dojo/Evented",
  "dojo/Deferred",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "esri/arcgis/Portal",

  "./portalUtils",
  "./ModelItemEditor",
  "./ModelItemList",

  "dojo/text!./templates/PortalControls.html",
  "dojo/i18n!../nls/resources",

  "dijit/form/Button",
  "dijit/Dialog"
], function (
  declare, lang, array, on, Evented, Deferred,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  esriPortal,
  portalUtils, ModelItemEditor, ModelItemList,
  template, i18n
) {
  var supportedItemTypes = ["Web Map"]; //, "Image Service"];
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

    templateString: template,
    i18n: i18n,
    baseClass: "mdlrPortalControls",
    typeKeyword: "",
    numberOfItems: "100",

    _setModelItemAttr: function(newModelItem) {
      if (newModelItem.type === undefined) {
        newModelItem.type = supportedItemTypes[0];
      }
      if (array.some(supportedItemTypes, function(supportedType) {
        return newModelItem.type === supportedType;
      })) {
        this.modelItem = newModelItem;
        this.titleNode.innerHTML = this.modelItem.title || "";
      } else {
        throw "Expected one of these item types: " + supportedItemTypes;
      }
    },

    _setModelAttr: function(newModel) {
      this.model = newModel;
      this.saveButton.set("disabled", !this.model);
    },

    postCreate: function() {
      var _this = this;
      this.inherited(arguments);
      this.own(on(this.saveButton, "Click", function(/*e*/) {
        _this.showSaveModelDialog();
      }));
    },

    _onLoadClick: function(/*e*/) {
      this.showLoadModelDialog();
    },

    showSaveModelDialog: function() {
      var _this = this;
      // TODO: validate that the model layer has been added to the map?
      if (!this.modelItemEditor) {
        this.modelItemEditor = new ModelItemEditor({
          onSave: function(/*itemInfo*/) {
            // TODO: show loading...
            _this.modelItem = _this.modelItemEditor.itemInfo;
            _this.saveModelItem().then(function(response) {
              // TODO: hide loading...
              _this.loadModelItem(response.id);
              _this.saveDialog.hide();
            });
          },
          onCancel: function() {
            _this.saveDialog.hide();
          }
        }, this.saveModelNode);
        this.modelItemEditor.startup();
        this.modelItemEditor.populateCategories(this.getCategoryOptions());
      }
      if (!this.modelItem.description && this.model) {
        this.modelItem.description = this.createItemDescription();
      }
      this.modelItemEditor.set("itemInfo", this.modelItem);
      this.saveDialog.show();
    },

    createItemDescription: function() {
      var desc = "";
      array.forEach(this.model.overlayLayers, function(overlayLayer) {
        desc += overlayLayer.title + ": " + overlayLayer.weight + "%\n";
      });
      return desc;
    },

    showLoadModelDialog: function() {
      var _this = this;
      _this.portal.signIn().then(function(/*portalUser*/) {
        // TODO: show loading...
        _this.portal.queryItems({
          q : 'type: ("' + supportedItemTypes.join('" OR "') + '") AND typekeywords:"' + _this.typeKeyword + '"',
          num: _this.numberOfItems
        }).then(function(queryResults) {
          // TODO: hide loading...
          if (!_this.modelItemList) {
            _this.modelItemList = new ModelItemList({
              onLoadSelectedModel: function(itemId) {
                if (itemId) {
                  _this.loadModelItem(itemId);
                  _this.loadDialog.hide();
                }
              },
              onCancel: function() {
                _this.loadDialog.hide();
              }
            });
            _this.modelItemList.populateCategories(_this.getCategoryOptions());
            _this.modelItemList.populateGrid(queryResults);
            _this.modelItemList.placeAt(_this.queryResultsNode);
            _this.modelItemList.startup();
            _this.modelItemList.resizeGrid();
          } else {
            _this.modelItemList.refreshGrid(queryResults);
            _this.modelItemList.refreshCategories();
          }
        });
        _this.loadDialog.show();
      });
    },

    loadModelItem: function(id) {
      var _this = this;
      return portalUtils.getItem(_this.portal, id).then(function(getItemResponse) {
        // var itemType = getItemResponse.item.type;
        // if (itemType === "Image Service") {
          _this.set("modelItem", getItemResponse.item);
          _this.emit("item-loaded", getItemResponse);
          return getItemResponse;
        // } else {
        //   return new Deferred().reject("Expected item of type 'Image Service'");
        // }
      });
    },

    // save map as web map to portal
    saveModelItem: function() {
      var _this = this;
      var modelItem = this.modelItem;
      var queryString;
      var itemData;
      var hasTypeKeyword = false;
      if (modelItem && this.weightedOverlayService && this.weightedOverlayService.imageServiceLayer && this.model) {
        // sign in to portal
        return this.portal.signIn().then(function(portalUser) {
          // verify that item has app type keyword
          // NOTE: this overwrites any type keywords set by ArcGIS
          // which could be a problem if updating, but ok for new items
          modelItem.typeKeywords = [ _this.typeKeyword];
          // serialize tags to string for saving
          modelItem.tags = modelItem.tags.join(",");
          if (modelItem.type === "Image Service") {
            // set item URL to the weighted overlay service
            // and append unique id so portal won't complain
            queryString = "?uid=" + new Date().getTime();
            modelItem.url = _this.weightedOverlayService.imageServiceLayer.url + queryString;
            // LATER: extent should really be that of the image service layer,
            // not the map (as set below)
            itemData = _this.weightedOverlayService.modelToImageServiceLayer(_this.model, {
              modelTitle: modelItem.title
            });
          } else {
            // create a web map then
            // overwrite operational layers generated from them map
            // with ones generated from the model
            itemData = portalUtils.createWebMapItemData(_this.map);
            itemData.operationalLayers = [_this.weightedOverlayService.modelToImageServiceLayer(_this.model, {
              modelTitle: modelItem.title
            })];
          }
          // LATER: support overwiting the current item
          // for now, just add a copy by deleting id if any
          delete(modelItem.id);
          delete(modelItem.item);
          return portalUtils.addItem(portalUser, lang.mixin(modelItem, {
            "text": JSON.stringify(itemData),
            extent: portalUtils.webMercatorExtentToItemExtent(_this.map.extent)
          })).then(function(addItemResults) {
            // LATER: update the item and remove the unique key from the URL
            return addItemResults;
          });
        });
      } else {
        return new Deferred().reject("Item info, weighted overlay service, image layer, and/or model is undefined.");
      }
    },

    getCategoryOptions: function() {
      return array.map(this.categoryTags, function(tag) {
        return { value: tag, label: tag };
      });
    },

    // set portal reference
    setPortalUrl: function(newPortalUrl) {
      this.portal = new esriPortal.Portal(newPortalUrl);
    },

    signIn: function() {
      if (this.portal) {
        return this.portal.signIn();
      } else {
        throw "Portal is not initialized";
      }
    },

    getTitle: function() {
      return this.titleNode.innerHTML;
    }
  });
});
