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
                    this.extend(clone, extendingObject);
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
                //Clone object literals, otherwise the copy would reference the original
                for(var i in object){
                    if(typeof object[i] === 'object' && object.hasOwnProperty(i)){
                        var methods = {};
                        copy[i] = this.clone(copy[i])
                    }
                }
                return copy;
            },
            clone : function(object){
                var _self = this,
                    _methods = {};
                return JSON.parse(JSON.stringify(object, function(key, value){
                    if(typeof value === 'function'){
                        _methods[key] = value;
                        return '__FUNCTION__';
                    }
                    return value;
                }), function(key, value){
                    if(value === '__FUNCTION__' && typeof _methods[key] === 'function'){
                        return _methods[key];
                    }
                    return value;
                });
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
    
    jj.set =  function(name, object, global){
        var instance = global ? jj : this;
        instance.registry[name] = object;
        return this;
    };
    
    jj.push = function(name, object, global){
        var instance = global ? jj : this;
        if(jj.getType(instance.registry[name]) !== 'array'){
            instance.registry[name] = [];
        }
        instance.registry[name].push(object);
        return this;
    };
    
    jj.get = function(name){
        return this.registry[name];
    };
    
    jj.on = function(events, func, action, global){
        var action = action || 'push',
            self = this,
            q = this.get('eventqueue');
        if(typeof func === 'function'){
            this.obj(events).execute(function(){
                self[action](this, func, global);
            });
            //Execute callbacks which have been triggered before for this eventyy
            this.obj(events).execute(function(){
                self.execQueue(q, this);
            })
        }
        return this;
    };
    
    jj.execQueue =  function(q, e){
        var self = this;
        self.obj(q).execute(function(){
            if(this._e === e.toString()){
                var funcs = self.registry[e],
                    trigger = this;
                self.obj(funcs).execute(function(){
                    if(typeof this === 'function'){
                        q.splice(q.indexOf(trigger), 1);
                        this.apply(self, trigger._a);
                    }
                });
            }
        });
        return this;
    };
    
    jj.trigger = function(){
        var self = this,
            event = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            funcs = self.registry[event];
        if(typeof funcs !== 'undefined'){
            this.obj(funcs).execute(function(){
                this.apply(self, args);                
            });
        }
        else {
            //Put event into the queue if there is no callback so far
            var q = this.get('eventqueue');
            q.push({_e : event, _a : args});      
        }        
        return self;
    };

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
                    
            copy: function(){
                this.setObject(_jj.utilies.copy(this.getObject()));
                return this; 
            },
            
            extend: function(extendingObject){
                this.setObject(_jj.utilies.extend(this.getObject(), extendingObject));
                return this;                
            }
        }
    }();
    
    //Class to type, adapted from jQuery
    _jj.class2type = new Array();
    ("Boolean NodeList Number String Function Array Date RegExp Object").split(" ").forEach(function(entry){
        _jj.class2type[ "[object " + entry + "]" ] = entry.toLowerCase();
    });
    
    jj.getType = function(obj){
    return obj == null ?
            String( obj ) :
            _jj.class2type[ Object.prototype.toString.call(obj)  ] || "object";    
    }

    //Execute something with an object;
    _jj.execute = {
            init: function(callback){
                //Check if object is numerable
                var object = this.get('object');
                if(typeof object === 'undefined' || object === null)
                    return this;
               (this['handle' + this.getType(object)] || this['handledefault']).
                    call(this, object, callback);
                return this;
            },
                    
            iterate: function(object, callback){
                for(var i = 0; i < object.length; i++){
                    callback.call(object[i], this);
                }        
            },
                    
            handlestring: function(object, callback){
                callback.call(object, this);
            },
            
            handledefault: function(object, callback){
                return typeof object.length !== 'undefined' ? 
                    this.iterate(object, callback) : callback.call(object, this);
            }              
    };
             

    
    //Special method, for setting plugins with abilities of jj
    jj.setPlugin = function(name, object, extendingObject){
        
        if(!name || !object){
            return this;
        }
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
            _plugin.registry = _jj.utilies.create(this.registry, {
                eventqueue : []
            });
            
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

   
  /* MODULE EXPORT */
 
  if(typeof process !== 'undefined'){
        //Script is executed via command line - check, if it's the build process of requirejs
        global.define = function(){
            var b;
            process.argv.forEach(function(val){
                b = val.indexOf('requirejs') || b ? true : false;
            });
            return b;
        }();
  }
  
  if (global.define && define.amd) {
    // Publish as AMD module
    return define(function() {return jj;});
  }
  
  if (typeof(module) !== 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = jj;
    return;
  } 
  // Publish as global (in browsers)
  global["jj"] = jj;
  
}());
