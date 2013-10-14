//Poloyfill for Object.create
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}
//Polyfill for Array.forEach
if ( !Array.prototype.forEach ) {
    Array.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope, this[i], i, this);
        }
    }
}

(function() {
    
    /* ENVIROMENT */
    var global = this;
    if(typeof global.window !== 'undefined'){
        global.isBrowser = true;
    }
    else {
        global.isBrowser = false;
    }
        
    //Private object for holding the plugins and basic functions
    var _jj = {
        isBrowser : global.isBrowser,
        plugins: {},
        utilies : {
            create : function(object, extendingObject){
                var extendingObject = extendingObject || {};
                 //Check, if Element is a DOM Node - in this case, we don't create a new object
                if(global.isBrowser && object instanceof (typeof HTMLElement !== "undefined" ? HTMLElement : Element)){
                    var clone = object;
                }
                else {
                    var clone = Object.create(object);
                }
                                
                var protoAccess = (Object.getPrototypeOf) ? (Object.getPrototypeOf({ __proto__: null }) === null) : (false);
        
                if(!protoAccess || (global.isBrowser && clone instanceof HTMLElement)){
                    this.enrich(clone, extendingObject);
                    return clone;
                }
                else {
                    extendingObject.__proto__ = clone;
                    return extendingObject;
                }
            },
            /* "Classical" way to create an object - iterating though the original object and modify it*/
            extend : function(object, extendingObject){
                for (var key in extendingObject){
                    object[key] = extendingObject[key];
                }
            },
            copy : function(object){
                var copy = this.create(object);
                //Replace object literals, otherwise the copy would reference the original
                for(var i in object){
                    if(typeof object[i] === 'object' && object.hasOwnProperty(i)){
                        copy[i] = JSON.parse(JSON.stringify(object[i]));
                    }
                }
                return copy;
            }
        }
    };
    
    //The JJ function wich executes the obj plugin
    var jj = function(){
       if(arguments.length > 0){ 
            return jj.obj(arguments[0]);
       }
    };
    
    
    /* ::::::::::::::::::::::::::::::: 
     * ::::::::: REGISTRY ::::::::::::
     * ::::::::::::::::::::::::::::::: */
    
    jj.registry = new Array();
    
    jj.set =  function(name, object, local){
        if(local){
            jj.registry[name] = object;
        }
        else {
            this.registry[name] = object;
        }
        return this;
    };
    
    jj.push = function(name, object){
        if(jj.getType(this.registry[name]) !== 'array'){
            this.registry[name] = new Array();
        }
        this.registry[name].push(object);
    };
    
    jj.get = function(name){
        return this.registry[name];
    }

    //utilies for working with objects
    _jj.obj = function(){
        
        return {
            init: function(){
                return this.setObject(arguments[0]);       
            },
            setObject : function(value){
                if(typeof value !== 'undefined'){
                    this.set('object', value, false);
                }
                return this;
            },
            
            getObject : function(){
                return this.get('object');  
            },
            
            toAbstract : function(){

                //Create an object, which uses the original object as prototype
                //Override all methods so that they become abstract methodes

                var abstractObject = this.getObject();

                for (var key in abstractObject){
                    if(typeof abstractObject[key] === 'function'){
                        abstractObject[key] = function(){
                            throw new Error(key + ' is a abstract method. You need to override it.');
                        }
                    }
                }
                return this;
            },
            
            create: function(extendingObject){
                this.setObject(_jj.utilies.create(this.getObject(), extendingObject));
                return this; 
            },
            
            extend: function(extendingObject){
                this.setObject(_jj.utilies.extend(this.getObject(), extendingObject));
                return this;                
            }
        }
    }();
    

    //Execute something with an object;
    _jj.execute = {
            init: function(callback){
                //Check if object is numerable
                var object = this.get('object');
                if(typeof object === 'undefined' || object === null)
                    return this;
                
                if(typeof object.length !== 'undefined'){
                    for(var i = 0; i < object.length; i++){
                        callback.call(object[i], this);
                    }
                }
                else {
                    callback.call(object, this);
                }
                return this;
            }
        
    };
             

    
    //Special method, for setting plugins with abilities of jj
    jj.setPlugin = function(name, object, extendingObject){
 
        if(object.constructor !== Object || typeof object.prototype !== 'undefined'){
            //Given Object must be called as a constructor function
            //Create method for creating a new instance
            var args = arguments;
            function F() {
                return object.apply(this, args);
            }
            F.prototype = object.prototype;
            var plugin = {
                init: function(){
                    try{var instance = new F();}
                    catch(e){var instance = new object();}
                    
                    if(typeof extendingObject === 'object'){
                        for(var i in extendingObject){
                            instance[i] = extendingObject[i];
                        }
                    }
                    return instance;
                }
            };
        }
        else {
            var object = (typeof extendingObject !== 'undefined') ? _jj.utilies.create(object, extendingObject) : object;
            var plugin = _jj.utilies.create(jj, object);
        }
        
        _jj.plugins[name] = plugin;

        //Create method for creating a new object with plugin prototype
        this[name] = function(initObject){
            //Create an copy of the plugin object
            var _plugin = _jj.utilies.copy(_jj.plugins[name]);

            //Set current registry to the registry of the plugin
            _plugin.registry = Object.create(this.registry);

            //Check if plugin has an init function and execute it
            if(typeof _plugin.init === 'function'){
                return (arguments.length > 0) ? _plugin.init.apply(_plugin, arguments) : _plugin.init();

            }
            else {
                return _plugin;
            }
        };

        return this;
        
    };
    
    //Special function for requireJS
    jj.load = function (name, parentRequire, onload, config){
        
        //Check plugins, which are not specified in an external script
        if(config.jj.plugins && !config.jj.plugins.loaded){
            for(var pluginName in config.jj.plugins){
                jj.setPlugin(pluginName, config.jj.plugins[pluginName]);
            }
            config.jj.plugins.loaded = true;
        }
        
        //Don't set a plugin twice
        if(_jj.plugins[name]){
            onload();
            return false;
        }
        
        parentRequire([name], function (value) {
            jj.setPlugin(name, value);
            onload(value);
        });
    };
    
    //Set standard plugins
    jj.
        setPlugin('obj', _jj.obj).
        setPlugin('execute', _jj.execute);
    
    // ::: UTILY FUNCTIONS ::: //

    //Class to type, adapted from jQuery
    _jj.class2type = new Array();
    jj.obj(("Boolean NodeList Number String Function Array Date RegExp Object").split(" ")).execute(function(){
        _jj.class2type[ "[object " + this + "]" ] = this.toLowerCase();
    });
    
    jj.getType = function(obj){
    return obj == null ?
            String( obj ) :
            _jj.class2type[ String(obj) ] || "object";    
    }
    

  /* MODULE EXPORT */
  if (global.define && define.amd) {
    // Publish as AMD module
    define(function() {return jj;});
  } 
  else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = jj;
  } 
  else {
    // Publish as global (in browsers)
    global["jj"] = jj;
  }
  
}());
