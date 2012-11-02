define(['lib/underscore-require', 'lib/backbone-require', 'src/geometrygraphsingleton'], 
    function(_, Backbone, geometryGraph) {
    
    var Manager = function() {

        _.extend(this, Backbone.Events);
        this.selected = [];

        this.selectOnly = function(id) {
            if (geometryGraph.isEditing()) {
                return
            }

            var deselected = [];
            var found = false;
            for (var i in this.selected) {
                if (this.selected[i] === id) {
                    found = true;
                } else {
                    deselected.push(this.selected[i]);
                }
            }
            this.selected = [id];
            
            if (deselected.length > 0) {
                this.trigger('deselected', deselected, this.selected);
            }
            this.trigger('selected', [id], this.selected);

        }

        this.addToSelection = function(id) {
            if (geometryGraph.isEditing()) {
                return
            }
            
            var alreadySelected = false;
            for (var i in this.selected) {
                if (this.selected[i] == id) {
                    alreadySelected = true;
                } 
            }

            if (alreadySelected) {
                var index = this.selected.indexOf(id);
                if (index !== -1) {
                    this.selected.splice(this.selected.indexOf(id), 1);
                    this.trigger('deselected', [id], this.selected);
                }
            } else  {
                this.selected.push(id);
                this.trigger('selected', [id], this.selected);
            }
        }

        this.deselectAll = function() {
            if (this.selected.length > 0) {
                var deselected = this.selected;
                this.selected = [];
                this.trigger('deselected', deselected, this.selected);
            }
        }
    }

    return new Manager();

});