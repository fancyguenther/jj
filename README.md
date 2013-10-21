# JJ  - A flexible javascript framework ##

### Plugins ###


---------------------------------------

<a name="forEachSeries" />
<a name="eachSeries" />
### setPlugin(name, object)

Set an object. 

__Example__

```js
jj.setPlugin('myPlugin', {
  getBar : function(){
    return this.get('bar');
  },
  foo : function(){
    console.log('foo method executed');
  }
);

jj.myPlugin().foo();
//console.log = 'foo method executed';
```

If you set a constructor function, jj will create a new instance.

```js
jj.setPlugin('request', XMLHttpRequest);

var request = jj.request();
request.open('https://github.com/mellors/jj');
request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
```

jj is every plugins prototype. So, you can mix native methods with methods of your plugin.

```js
var bar = jj.
  myPlugin().
  set('moview', 'E.T.').
  getBar();
//bar = 'A new value';
```

If you set a plugin globally (via jj.setPlugin), you can use it in other plugins as well.

```js
jj.setPlugin('secondPlugin', {
  getMovie : function(){
    return this.get('movie');
  }
);

var moview = jj.
  myPlugin().
  set('moview', 'Jurassic Park').
  secondPlugin().
  myPlugin().
  getMoview();

//moview = 'Jurassic Parm';
```



---------------------------------------

<a name="forEachSeries" />
<a name="eachSeries" />
### set(name, object, local)

Via jj.set you can add an entry to the registry of jj. 


---------------------------------------
