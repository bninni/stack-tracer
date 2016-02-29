# stack-tracer
[![Build Status](https://travis-ci.org/bninni/stackstack-tracerr.svg?branch=master)](https://travis-ci.org/bninni/stackstack-tracerr)

Global access to all CallSite/Stack Trace Properties and more

## Install
```
npm install stack-tracer
```
or
```
npm install -g stack-tracer
```

Then import the module into your program:

```javascript
var trace =  require('stack-tracer')
```

## Background

A **Stack** is a list of all active functions within the program in the order they were invoked

Every time a function is invoked, a corresponding **CallSite** Object is created and added to the **Stack**
  * This **CallSite** Object contains information regarding the location and context of the invocation

Whenever a function returns, the **CallSite** corresponding to the invocation is removed from the **Stack Trace**

[Wikipedia - Call Stack](https://en.wikipedia.org/wiki/Call_stack)

---

This module uses a common method of capturing the raw **Stack Trace** (an Array of **CallSite** Objects)

It then creates a **Tracer** Object containing information about a specific **CallSite**

[Read more about the V8 Stack Trace/CallSite API here](https://github.com/v8/v8/wiki/Stackstack-tracer-API)

<a name="usage"></a>
## Usage

A **Tracer** Object can be created two ways:
  * [Explicitly by invoking the module export](#explicit)
  * [Implicitly by invoking one of the **global** properties the module creates](#implicit)

<a name="explicit"></a>
### Explicit
[Back to Top](#usage)

A **Tracer** Object can be created by invoking the exported function:

**trace( _[index]_ )**

  * `index` - The index of the **CallSite** that the **Tracer** Object should be based on
    * An empty input or input of `0` will correspond to the immediate (this) invocation

It contains the following properties:

---

**callSite**
  * The corresponding **CallSite** Object

**stack**
  * The raw **Stack Trace** starting from the corresponding **CallSite** object

**trace**
  * This **Tracer** Object (self-referencing)

**fileName**
  * The name of the **file** where the invocation is defined

**isNative**
  * Does the invocation occur within **Native** V8 code?
---

**line**
  * The **line** number of the invocation within the **file**

**column**
  * The **column** number of the invocation within the **file**

```javascript
var trace =  require('stack-tracer');

var myTracer = trace(); //or trace(0);
//myTracer.line = 3
//myTracer.column = 16

function getTracer(){
  return trace();
}

myTracer = getTracer();
//myTracer.line = 8
//myTracer.column = 10
```

---

**this**
  * The `this` value in the context of the invocation

**typeName**
  * The **type** of `this` as a String
  
```javascript
var trace =  require('stack-tracer');

var myTracer = trace();
//myTracer.this = this
//myTracer.typeName = 'Object'

var myContext = [];
function getTracer(){
  return trace();
}

myTracer = getTracer.call(myContext);
//myTracer.this = myContext
//myTracer.typeName = 'Array'
```

---

**function**
  * The **function** where the invocation occurred

**functionName**
  * The name of the **function** as a String

```javascript
var trace =  require('stack-tracer');

var myTracer = trace();
//myTracer.function = <<this entire script>>
//myTracer.functionName = null

function getTracer(){
  return trace();
}

myTracer = getTracer();
//myTracer.function = getTracer
//myTracer.functionName = 'getTracer'
```

---

**methodName**
  * The name of the property within `this` which maps to the **function** where the invocation occurred

```javascript
var trace =  require('stack-tracer');

var myTracer = trace();
//myTracer.methodName = null

var myObj = {
  'get' : function(){
    return trace();
  }
}

myTracer = myObj.get();
//myTracer.this = myObj
//myTracer.function = myObj.get
//myTracer.functionName = 'myObj.get'
//myTracer.methodName = 'get'

//Function can be named:
myObj = {
  'get' : function getTracer(){
    return trace();
  }
}

myTracer = myObj.get();
//myTracer.functionName = 'getTracer'
```

---

**isTopLevel**
  * Is `this` the `global` object?

```javascript
var trace =  require('stack-tracer');

var myTracer = trace();
//myTracer.isToplevel = true

function getTracer(){
  return trace();
}

myTracer = getTracer();
//myTracer.isToplevel = true

myTracer = getTracer.call({});
//myTracer.isToplevel = false
```

---

**isEval**
  * Does the invocation occur within an **eval** statement?

**evalOrigin**
  * String representing the **CallSite** of the `eval` **function** where the invocation was defined

```javascript
var trace =  require('stack-tracer');

var myTracer = eval('trace()');
//myTracer.isEval = true

function getTracer(){
  return eval('trace()');
}

myTracer = getTracer();
//myTracer.isEval = true

eval('function evalGetTracer(){ return trace() }')
myTracer = evalGetTracer();
//myTracer.isEval = true
```

---

**isConstructor**
  * Does the invocation occur with a **function** invoked as a **constructor**?

```javascript
var trace =  require('stack-tracer');

var myTracer = trace();
//myTracer.isConstructor = false

function getTracer(){
  return trace();
}

myTracer = getTracer();
//myTracer.isConstructor = false

myTracer = new getTracer();
//myTracer.isConstructor = true
```

---
  
**caller**
  * The **Tracer** corresponding to the **CallSite** one level above this **CallSite** in the **Stack Trace**
    * *i.e. the _function_ that _called_ this _function_*
    * Will be **null** if no **caller** exists

```javascript
var trace =  require('stack-tracer');

var myTracer = trace();
//myTracer.function = <<this entire script>>
//myTracer.functionName = null

function getTracer(){
  return trace().caller; //or trace(1)
}

myTracer = getTracer();
//myTracer.function = <<this entire script>>
//myTracer.functionName = null
```

---

**callee**
  * The **Tracer** corresponding to the **CallSite** one level below this **CallSite** in the **Stack Trace**
    * *i.e. the _function_ that this _function_ _called_*
    * Will be **null** if no **callee** exists

```javascript
var trace =  require('stack-tracer');


var myTracer = trace();
//myTracer.callee = null

function getTracer(){
  return trace().caller;
}

myTracer = getTracer();
//myTracer.callee.function = getTracer
//myTracer.callee.functionName = 'getTracer'
```


<a name="implicit"></a>
### Implicit
[Back to Top](#usage)

The module also adds a number of global properties which implicitly create a **Tracer** object at that location and return the corresponding property

It is the equivalent of invoking `trace().<property>`

The properties are all of the above properties, prefixed with '**\__**':

**\__callSite**
  * The corresponding **CallSite** Object
  
**\__stack**
  * The raw **Stack Trace** starting from the corresponding **CallSite** object
  
**\__trace**
  * This **Tracer** Object (self-referencing)
  
**\__caller**
  * The **Tracer** corresponding to the **CallSite** one level above this **CallSite** in the **Stack Trace**
    * *i.e. the _function_ that _called_ this _function_*
    * Will be **null** if no **caller** exists
	
**\__callee**
  * The **Tracer** corresponding to the **CallSite** one level below this **CallSite** in the **Stack Trace**
    * *i.e. the _function_ that this _function_ _called_*
    * Will be **null** if no **callee** exists
	
**\__fileName**
  * The name of the **file** where the invocation is defined
  
**\__line**
  * The **line** number of the invocation within the **file**
  
**\__column**
  * The **column** number of the invocation within the **file**
  
**\__this**
  * The `this` value in the context of the invocation
  
**\__typeName**
  * The **type** of `this` as a String
  
**\__function**
  * The **function** where the invocation occurred
  
**\__functionName**
  * The name of the **function** as a String
  
**\__methodName**
  * The name of the property within `this` which maps to the **function** where the invocation occurred
  
**\__evalOrigin**
  * String representing the **CallSite** of the `eval` **function** where the invocation was defined
  
**\__isToplevel**
  * Is `this` the `global` object?
  
**\__isEval**
  * Does the invocation occur within an **eval** statement?
  
**\__isNative**
  * Does the invocation occur within **Native** V8 code?
  
**\__isConstructor**
  * Does the invocation occur with a **function** invoked as a **constructor**?

```javascript
var trace =  require('stack-tracer')

__line   //3, same as trace().line
__column //1, same as trace().column

function getTracer(){
  if( __isConstructor ) return __caller //same as trace().caller or trace(1)
  else return __trace //same as trace().trace or trace()
}

var myTracer = getTracer()
//myTracer.line = 8
//myTracer.column = 15

myTracer = new getTracer()
//myTracer.line = 15
//myTracer.column = 11
```

# License

## MIT