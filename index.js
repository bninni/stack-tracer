//The map of Tracer properties and the corresponding CallSite Accessor Names
var TracerProperties = {
		this : 'getThis',
		typeName : 'getTypeName',
		function : 'getFunction',
		functionName : 'getFunctionName',
		methodName : 'getMethodName',
		fileName : 'getFileName',
		line : 'getLineNumber',
		column : 'getColumnNumber',
		evalOrigin : 'getEvalOrigin',
		isToplevel : 'isToplevel',
		isEval : 'isEval',
		isNative : 'isNative',
		isConstructor : 'isConstructor',
	};

//To get a new Stack of Call Sites
function getTrace( index ) {
	var limit = Error.stackTraceLimit,
		prepare = Error.prepareStackTrace,
		obj = {},
		stack;
	
	index = (typeof index === 'number' && index > 0 && index < Infinity) ? index : 0;
	
	Error.stackTraceLimit = Infinity;
	Error.prepareStackTrace = function(obj, stack) {
		return stack;
	};
	
	Error.captureStackTrace(obj, getTrace);
    
	stack = obj.stack;
  
	Error.prepareStackTrace = prepare;
	Error.stackTraceLimit = limit;
	
	return new Tracer( stack, index );
}

//To add the given Tracer Property from the given CallSite to the given Tracer
function addTracerProperty( tracer, callSite, propName ){
	var accessorName = TracerProperties[propName];
	
	Object.defineProperty( tracer, propName, {
		value : callSite[ accessorName ](),
		enumerable : true
	})
}

//To add all of Tracer Properties from the given CallSite to the given Tracer
function addTracerProperties( tracer, callSite ){
	var propName;
	
	for( propName in TracerProperties ) addTracerProperty( tracer, callSite, propName );
}

//Object which takes the Call Site at the given Index in the given Stack and returns the results of calling all it's accessors
//Also contains access to the caller Call Site object
function Tracer( stack, index, callee, caller ){
	
	var callSite = stack[index];
		
	Object.defineProperties( this, {
		caller : {
			get : function(){
				if( caller ) return caller;
				if( index + 1 < stack.length ) return caller = new Tracer( stack, index+1, this );
				return null;
			},
			enumerable : true
		},
		callee : {
			get : function(){
				if( callee ) return callee;
				if( index ) return callee = new Tracer( stack, index-1, null, this );
				return null;
			},
			enumerable : true
		},
		callSite : {
			value : callSite,
			enumerable : true
		},
		stack : {
			value : stack.slice(index),
			enumerable : true
		},
		trace : {
			value : this,
			enumerable : true
		}
	});
	
	addTracerProperties( this, callSite );
}

//To add the given Property Name to the Global object
function addGlobalProperty(propName ){	
	Object.defineProperty( global, '__' + propName, {
		get : function(){
			return getTrace(1)[propName];
		},
		enumerable : true
	});
}

function addGlobalProperties(){
	var propName;
	
	Object.defineProperties(global, {
		__stack : {
			get : function(){
				return getTrace(1).stack;
			},
			enumerable : true
		},
		__trace : {
			get : getTrace,
			enumerable : true
		},
		__callee : {
			value : null
		},
		__callSite : {
			get : function(){
				return getTrace(1).callSite;
			},
			enumerable : true
		},
		__caller : {
			get : function(){
				return getTrace(1).caller;
			},
			enumerable : true
		}
	});
	
	for(propName in TracerProperties) addGlobalProperty(propName);
}

addGlobalProperties();

module.exports = getTrace;