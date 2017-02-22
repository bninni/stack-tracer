/*
Copyright Brian Ninni 2016
*/

//The map of Tracer properties and the corresponding CallSite Method Names
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
	//Store the frame limit
	var limit = Error.stackTraceLimit,
		obj = {},
		stack;
	
	//Make sure the index is a number between 0 and Infinity
	index = (typeof index === 'number' && index > 0 && index < Infinity) ? index : 0;
	
	//Get the maximum number of frames
	Error.stackTraceLimit = Infinity;
	
	Error.captureStackTrace(obj, getTrace);
	
	//Invoke the creation of the obj.__stack property
	obj.stack;

	//Restore the original frame limit
	Error.stackTraceLimit = limit;
	
	//Return null if requested index exceeds size of stack
	if( index >= obj.__stack.length ) return null;
	
	//Create a new Tracer at the given index in the stack
	return new Tracer( obj.__stack, index );
}

//To create a Tracer from an Error
getTrace.from = function( err ){
	//If it not an Error, then return null
	if( !(err instanceof Error) ) return null;
	//Invoke the creation of the err.__stack property
	err.stack;
	//Return null if the err.stack is not an Array
	if( typeof err.__stack !== "object" || err.__stack === null || err.__stack.constructor !== Array || err.__stack.length < 1 ) return null;
	//Create a new Tracer at the first index in the stack
	return new Tracer( err.__stack, 0 );
}

//To add the given Tracer Property to the given Tracer
//Value is the result of invoking the corresponding method name on the given CallSite
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
//Also contains access to the Caller, Callee, CallSite, and Stack objects
function Tracer( stack, index, callee, caller ){
	
	var callSite = stack[index];
		
	Object.defineProperties( this, {
		caller : {
			get : function(){
				//If a caller value already exists, then return that object
				if( caller ) return caller;
				//If a caller exists, then create a new Tracer at the next higher index in the stack and store as the caller
				if( index + 1 < stack.length ) return caller = new Tracer( stack, index+1, this );
				//Otherwise, return null
				return null;
			},
			enumerable : true
		},
		callee : {
			get : function(){
				//If a callee value already exists, then return that object
				if( callee ) return callee;
				//If a callee exists, then create a new Tracer at the next lower index in the stack and store as the callee
				if( index ) return callee = new Tracer( stack, index-1, null, this );
				//Otherwise, return null
				return null;
			},
			enumerable : true
		},
		callSite : {
			value : callSite,
			enumerable : true
		},
		stack : {
			//The stack should begin at this CallSite
			value : stack.slice(index),
			enumerable : true
		},
		trace : {
			value : this,
			enumerable : true
		}
	});
	
	//Add all of the Tracer properties to this object by invoking the corresponding methods on the CallSite
	addTracerProperties( this, callSite );
}

//To add the given Property Name to the Global object
//Prefixes with '__', and assigns a getter which creates a new Tracer and returns the corresponding Property
function addGlobalProperty(propName ){
	Object.defineProperty( global, '__' + propName, {
		get : function(){
			return getTrace(1)[propName];
		},
		enumerable : true
	});
}

//To assign all of the global properties to the global object
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

//Create the new prepareStackTrace method which will assign the raw stack to the Error as the __stack property and return the stack as a String
function prepareStackTrace(){
	var joinStr = '\n    at ';

	Error.prepareStackTrace = function(obj, stack) {
		obj.__stack = stack;
		//To return a value which is identical to the original Error.stack string value
		return obj + joinStr + stack.join( joinStr );
	};
}

prepareStackTrace();
addGlobalProperties();

module.exports = getTrace;