import{W as t,c as i,d as s}from"./index-BAyO5ncN.js";class o extends t{constructor(a){super(a),this.onOn=this._registerSignalOutput("onOn"),this.onOff=this._registerSignalOutput("onOff"),this.value=this.registerDataOutput("value",i)}_execute(a,u){var l;let e=a._getExecutionVariable(this,"value",typeof((l=this.config)==null?void 0:l.startValue)=="boolean"?!this.config.startValue:!1);e=!e,a._setExecutionVariable(this,"value",e),this.value.setValue(e,a),e?this.onOn._activateSignal(a):this.onOff._activateSignal(a)}getClassName(){return"FlowGraphFlipFlopBlock"}}s("FlowGraphFlipFlopBlock",o);export{o as FlowGraphFlipFlopBlock};
