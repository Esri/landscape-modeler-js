define(["dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/on",
    "dojo/string", "dojo/Evented", "dijit/_WidgetBase",
    "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/ModelItemList.html",
    "dojo/io-query", "dojo/io/script",
    "dojo/store/Memory", "dgrid/OnDemandGrid", "dgrid/Selection",
    "dijit/form/Select"
    ],
function(declare, array, dom, on,
string, Evented, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template,
 ioQuery, script, Memory, OnDemandGrid, Selection) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
        templateString : template,
        baseClass : "landscape-model-info",
        result : "",
        postCreate: function() {
          this.inherited(arguments);
          this.loadButton.set("disabled",true);
        },
        populateGrid: function (result) {
            //to get access to widget controls in the grid event handlers
            var _this = this;

            var columns = [{
                field : "title",
                label : "Name"
            }, {
                field : "description",
                label : "Description"
            }, {
                field : "modified",
                label : "Modified"
            }, {
                field : "owner",
                label : "Author"
            }, {
                field : "id",
                label : "id"
            }, {
                field : "tags",
                label : "tags"
            }];

            var modelStore = this.formatGridData(result);

            // need custom grid to have selection functionality
            var CustomGrid = declare([ OnDemandGrid, Selection ]);

            this.grid = new CustomGrid({
                store : modelStore,
                columns : columns,
                selectionMode : "single",
                loadingMessage : "Loading data...",
                noDataMessage : "No results found."
            }, this.gridNode);

            this.grid.on("dgrid-select", function(/*e*/) {
                 _this.loadButton.set("disabled",false);
            });

            this.grid.on("dgrid-deselect", function(/*e*/) {
                _this.loadButton.set("disabled",true);
            });

            this.grid.startup();

        },
        resizeGrid : function(){
            this.grid.resize();
        },
        formatGridData: function(result) {
             //format data to be array of objects - so dgrid can read it
            var storeArray = [];
            for(var i = 0; i < result.results.length; i++) {

                var dt = new Date(result.results[i].modified).toLocaleDateString();
                var obj = {
                    "title" : result.results[i].title,
                    "description" : result.results[i].description,
                    "modified" : dt,
                    "owner" : result.results[i].owner,
                    "id" : result.results[i].id,
                    "category" : this.getModelCategory(result.results[i].tags)
                };

                storeArray.push(obj);
            }

            var modelStore = new Memory({
                data : storeArray,
                idProperty : "id"
            });
            return modelStore;
        },
        getModelCategory: function(tags) {
            var modelCategory;
            array.some(tags, function(tag) {
                var inCategories = array.some(this.categoryNode.options, function(option) {
                    return option.value === tag;
                });
                if (inCategories) {
                    modelCategory = tag;
                }
                return inCategories;
            }, this);
            return modelCategory;
        },
        refreshGrid: function(result) {
            var store = this.formatGridData(result);
            this.grid.set('store',store);
        },
        refreshCategories: function() {
            this.categoryNode.reset();
        },
        startup : function() {
            this.inherited(arguments);
        },
        populateCategories: function(options) {
          this.categoryNode.set("options", options);
          this.categoryNode.options.splice(0, 0, { value: "*", label: "All Categories"});
        },
        _onCategoryChange : function(/*e*/){
            if (this.categoryNode.value === "*"){
                this.grid.setQuery({}); //reset query
              }else{
                this.grid.setQuery({category: this.categoryNode.value});
              }
        },
        _onLoadClick: function(/*e*/) {
            //get selected row's id (which is agol item id)
            var itemID = "";
            for(var id in this.grid.selection){
                itemID = id;
            }
            this.emit("LoadSelectedModel", itemID);
        },
        _onCancelClick: function(/*e*/) {
            this.emit("Cancel");
        }
        });

});