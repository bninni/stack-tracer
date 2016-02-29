var trace = require('../index'),
	assert = require('assert'),
	vows = require('vows'),
	evalCapture = eval('__trace');
	
vows.describe('Test').addBatch({
	'Capturing a Trace':{
		'Filename/Line/Column' : function(){
			var myTracer = __trace;
			assert.equal( myTracer.line, 9 );
			assert.equal( myTracer.column, 19 );
			assert.equal( myTracer.fileName, __filename );
		},
		'Inside a Function' : function insideAFunction(){
			var myTracer = __trace;
			assert.equal( myTracer.this, this );
			assert.equal( myTracer.typeName, 'Object' );
			assert.equal( myTracer.function, insideAFunction );
			assert.equal( myTracer.functionName, 'insideAFunction' );
			assert.equal( myTracer.callee, null );
		},
		'Caller' : function caller(){
			var myContext = [];
			function getTracer(){
			  return __trace;
			}
			var myTracer = getTracer.call( myContext );
			assert.equal( myTracer.this, myContext );
			assert.equal( myTracer.typeName, 'Array' );
			assert.equal( myTracer.function, getTracer );
			assert.equal( myTracer.functionName, 'getTracer' );
			assert.equal( myTracer.callee, null );

			assert.equal( myTracer.caller.this, this );
			assert.equal( myTracer.caller.function, caller );
			assert.equal( myTracer.caller.functionName, 'caller' );
			assert.equal( myTracer.caller.callee, myTracer )
		},
		'Callee' : function callee(){
			function getTracer(){
				this.tracer = trace(1);
				this.callee = this.tracer.callee;
			}
			var myTracer = new getTracer();
			assert.equal( myTracer.tracer.this, this );
			assert.equal( myTracer.tracer.function, callee );
			assert.equal( myTracer.tracer.functionName, 'callee' );
			
			assert.equal( myTracer.callee.this, myTracer );
			assert.equal( myTracer.callee.function, getTracer );
			assert.equal( myTracer.callee.functionName, 'getTracer' );
			
			assert.equal( myTracer.callee.caller, myTracer.tracer );
		},
		'Method' : function (){
			var myObj = {
				get : function(){
					return __trace;
				}
			}
			var myTracer = myObj.get();
			assert.equal( myTracer.this, myObj );
			assert.equal( myTracer.function, myObj.get );
			assert.equal( myTracer.functionName, 'myObj.get' );
			assert.equal( myTracer.methodName, 'get' );
		},
		'Named Method' : function (){
			var myObj = {
				get : function getTracer(){
					return __trace;
				}
			}
			var myTracer = myObj.get();
			assert.equal( myTracer.this, myObj );
			assert.equal( myTracer.function, myObj.get );
			assert.equal( myTracer.functionName, 'getTracer' );
			assert.equal( myTracer.methodName, 'get' );
		},
		'Eval' : function(){
			var myTracer = eval('__trace');
			assert.equal( myTracer.column, 1 );
			assert.equal( myTracer.line, 1 );
			assert.equal( myTracer.isEval, true );
			assert.equal( myTracer.isToplevel, true );
		},
		'Constructor' : function(){
			function getTracer(){
				return __trace;
			}
			
			var myTracer = getTracer();
			assert.equal( myTracer.isConstructor, false );
			
			myTracer = new getTracer();
			assert.equal( myTracer.isConstructor, true );
		}
	},
}).exportTo(module);