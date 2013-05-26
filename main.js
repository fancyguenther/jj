if(typeof window !== 'undefined' && typeof global === 'undefined'){
    global = window;
    global.isBrowser = true;
}
else {
    global.isBrowser = false;
}

// // "DEFINE"-FUNCTION
// If you don't use a define function (for instance with require.js),
// we'll declare a define funtion, which puts the object in the global namespace
// We recommond, to avoid this!

if(typeof define !== 'function'){
    
    if (typeof require === 'function') { 
        global.define = require('amdefine')(module) 
    }
    else {
        //Fallback for define function, if you are not using AMD
        global.define = function(name, deps, object){
            if(typeof jj === 'undefined' && name === 'jj'){
                global['jj'] = object();
            }
            else {
                jj.setPlugin(name, object());
            }
        };
    }
}

define([], function () {
    
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
        
    //Private object for holding the plugins and basic functions
    var _jj = {
        plugins: {},
        utilies : {
            extend : function(object, extendingObject){
                //Check, if Element is a DOM Node - in this case, we don't create a new object
                if(global.isBrowser && object instanceof (typeof HTMLElement !== "undefined" ? HTMLElement : Element)){
                    var clone = object;
                }
                else {
                    var clone = Object.create(object);
                }
                
                var protoAccess = (Object.getPrototypeOf) ? (Object.getPrototypeOf({ __proto__: null }) === null) : (false);
        
                if(!protoAccess || (global.isBrowser && clone instanceof HTMLElement)){
                    for (var key in extendingObject){
                        clone[key] = extendingObject[key];
                    }
                    return clone;
                }
                else {
                    extendingObject.__proto__ = clone;
                    return extendingObject;
                }
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
    
    jj.set =  function(name, object){
        this.registry[name] = object;
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
            object: {},
            init: function(){
                return this.setObject(arguments[0]);
       
            },
            setObject : function(value){
                if(typeof value !== 'undefined'){
                    this.set('object', value);
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
                            throw new Error(key + ' is a abstract method of ' + this.getObject() + '. You need to override it.');
                        }
                    }
                }
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
    jj.setPlugin = function(name, object){

        if(object.constructor !== Object || typeof object.prototype !== 'undefined'){
            //Given Object must be called as a constructor function
            //Create method for creating a new instance
           if (Function.prototype.bind) {
                this[name] = function(){
                     return new (Function.prototype.bind.apply(object, arguments)); 
                }
           }
           else {
               this[name] = function(){
                   return new object();
               }
           }

        }
        else {
            var plugin = _jj.utilies.extend(jj, object);
            _jj.plugins[name] = plugin;

            //Create method for creating a new object with plugin prototype
            this[name] = function(initObject){
                

                //Create an empty object with the plugin als prototype
                var plugin = Object.create(_jj.plugins[name]);
                
                //Set current registry to the registry of the plugin
                plugin.registry = this.registry;
                
                /*
                plugin.registry = new Array();
                for (var index in this.registry){
                    plugin.registry[index] = (index === 'object' && name === 'obj') ? false : (this.registry[index]);
                };
                */
                               
                //Check if plugin has an init function and execute it
                if(typeof plugin.init === 'function'){
                    return (arguments.length > 0) ? plugin.init.apply(plugin, arguments) : plugin.init();

                }
                else {
                    return plugin;
                }
            };
        }

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
            _jj.class2type[ toString.call(obj) ] || "object";    
    }
    
    return jj;
    
});