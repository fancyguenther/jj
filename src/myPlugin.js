define('myPlugin', [], function () {
    
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