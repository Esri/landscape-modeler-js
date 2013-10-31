define([
  "dojo/_base/declare",
  "dojo/_base/array",

  "dojo/Evented",

  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",

  "dojo/text!./templates/ModelItemEditor.html",

  "dijit/form/Form",
  "dijit/form/ValidationTextBox",
  "dijit/form/SimpleTextarea",
  "dijit/form/Button",
  "dijit/form/Select"
],
function(
  declare, array, Evented,
  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  template
) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    templateString: template,
    baseClass: "mdlrModelItemEditor",
    _setItemInfoAttr: function(newItemInfo) {
      this.itemInfo = newItemInfo;
      this.titleNode.set("value", this.itemInfo.title);
      this.descriptionNode.set("value", this.itemInfo.description);
      this.setSelectedCategory(this.itemInfo.tags);
    },
    getItemInfo: function() {
      return this.itemInfo;
    },
    isValid: function() {
      return this.formNode.isValid();
    },
    populateCategories: function(options) {
      this.categoryNode.set("options", options);
      if (this.categoryNode.options.length) {
        this.categoryNode.set("value", this.categoryNode.options[0].value);
      }
    },
    setSelectedCategory: function(tags) {
      array.some(tags, function(tag) {
        var inCategories = array.some(this.categoryNode.options, function(option) {
          return option.value === tag;
        });
        if (inCategories) {
          this.categoryNode.set("value", tag);
        }
        return inCategories;
      }, this);
    },
    _onTitleChange: function() {
      this.itemInfo.title =  this.titleNode.value;
    },
    _onDescriptionChange: function() {
      this.itemInfo.description =  this.descriptionNode.value;
    },
    _onCategoryChange: function() {
      this.itemInfo.tags = [this.categoryNode.value];
    },
    _onSaveClick: function(/*e*/) {
      if (this.formNode.validate()) {
        this.emit("Save", this.getItemInfo());
      }
    },
    _onCancelClick: function() {
      this.emit("Cancel");
    }
  });
});
