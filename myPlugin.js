/* If you are using a plugin on the server, please use the Node plugin "amdefine" and this line of code*/
if (typeof define !== 'function' && typeof require === 'function') { var define = require('amdefine')(module) }

define([], function () {
    
    var plugin = {
        trigger : function(){},
        
        setTrigger : function(func){
            trigger = func;
        },
        
        count : function(){
            var count = this.get('counter')+1;
            this.set('counter', count);
            trigger.call(this);
            return this;
        },
        
        write : function(){
            document.getElementById('counter').innerHTML = this.get('counter');
            return this;
        }
    };
    return plugin;
});