define([],
function() {
  return {

    // remove all children from a container widget
    removeChildren: function(container) {
      var childCount;
      if (container && container.getChildren && container.removeChild) {
        childCount = container.getChildren().length;
        for (var i = childCount - 1; i >= 0; i--) {
          container.removeChild(i);
        }
      }
    }
  };
});