var SS = SS || {};

function Transform() {
    if (!arguments[0].type) {
        throw new Error("type is not defined");
    }

    this.editing = arguments[0].editing;
    this.type = arguments[0].type;
    this.origin = arguments[0].origin;
    this.parameters = arguments[0].parameters;
}

Transform.prototype.editableCopy = function() {
    var copiedParameters = {};
    for (key in this.parameters) {
        copiedParameters[key] = this.parameters[key];
    }
    return new Transform({
            type: this.type,
            origin: this.origin,
            parameters: copiedParameters,
            editing: this.editing
        });
}

Transform.prototype.json = function() {
    return JSON.stringify({
                type: this.type,
                origin: this.origin,
                parameters: this.parameters
            });
}

SS.createNextGeomNodeCounter = function() {
    var count = 0;
    var closure = function() {
        ++count;
        return count;
    }
    return closure;
}

SS.nextGeomCounter = SS.createNextGeomNodeCounter();
SS.resetGeomCounter = function() {
    SS.nextGeomCounter = SS.createNextGeomNodeCounter();
}

function GeomNode() {

    var that = this;
    var updateId = function(geomNode) {
        geomNode.id = SS.nextGeomCounter() + '_' + geomNode.sha;
    };

    this.setSHA = function(sha) {
        that.sha = sha;
        updateId(that);
    }

    if (!arguments[0].type) {
        throw new Error("type is not defined");
    }

    this.editing = arguments[0].editing || false;
    this.type = arguments[0].type;
    this.sha = arguments[0].sha;
    updateId(this);

    this.origin = arguments[0].origin;
    this.contents = arguments[0].contents;
    this.parameters = SS.copyObj(arguments[0].parameters);
    this.mesh = arguments[0].mesh;
    this.children = [];

    if (arguments[0].workplane) {
        this.workplane = new SS.WorkplaneNode(arguments[0].workplane);
    } else {
        this.workplane = new SS.WorkplaneNode();
    }

    var transformDescriptions = arguments[0].transforms || [];
    this.transforms = transformDescriptions.map(function(transformDescription) {
        return new Transform(transformDescription);
    });

    if (arguments[1]) {
        if (!typeof(arguments[1]) == "object") {
            throw new Error("Children must be array");
        }

        for (var i in arguments[1]) {
            this.children.push(arguments[1][i]);
        }
    }
}

GeomNode.prototype.isPreview = function() {
    return this.sha === undefined;
}


GeomNode.prototype.editableCopy = function() {

    var copiedOrigin = null;
    if (this.origin) {
        copiedOrigin = {};
        for (key in this.origin) {
            copiedOrigin[key] = this.origin[key];
        }
    }

    var copiedWorkplane = SS.copyObj(this.workplane);
    var copiedParameters = SS.copyObj(this.parameters);
    var copiedTransforms = this.transforms.map(function(transform) {
        return transform.editableCopy();
    });
    
    var newNode = new GeomNode({type : this.type,
                                contents: this.contents,
                                origin: copiedOrigin,
                                parameters : copiedParameters,
                                workplane: copiedWorkplane,
                                transforms : copiedTransforms,
                                mesh : this.mesh,
                               }, 
                               this.children);
    return newNode;
}

// TODO: Move test for multiple prorotype transforms from doc
// into this class
    
GeomNode.prototype.toShallowJson = function() {
    // No need to do somethign special with parameters if they are not 
    // defined, as JSON.stringify simply ignores those fields
    var obj = {
        type: this.type,
        parameters: this.parameters,
        contents: this.contents,
        children: this.children.map(function(child) {
           return child.sha;
        }),
        transforms: this.transforms.map(function(tx) {
           return JSON.parse(tx.json());
        })
    };

    if (!(new SS.WorkplaneNode(this.workplane).isGlobalXY())) {
        obj.workplane = this.workplane.serializableSubset();
    }

    if (this.origin) {
        obj.origin = this.origin;
    }
    return JSON.stringify(obj);
}

GeomNode.fromDeepJson = function(json) {
    var geometry = json.geometry;
    var jsonChildren = json.geometry.children;
    if (json.geometry.children) {
        delete json.geometry.children;
    }
    geometry.sha = json.sha;
    var geomNode = new GeomNode(geometry);
    
    if (jsonChildren && (jsonChildren.length > 0)) {
        geomNode.children = jsonChildren.map(function(childJson) {
            return GeomNode.fromDeepJson(childJson);
        });
    }
    return geomNode;
}

GeomNode.prototype.isTransformEditing = function() {
    return _.pluck(this.transforms, "editing").indexOf(true) >= 0;
}

GeomNode.prototype.isEditingOrTransformEditing = function() {
    return this.editing || this.isTransformEditing();
}


