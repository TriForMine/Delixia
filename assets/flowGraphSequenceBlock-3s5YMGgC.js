import{W as i,d as s}from"./index-BAyO5ncN.js";class n extends i{constructor(e){super(e),this.config=e,this.executionSignals=[],this.setNumberOfOutputSignals(this.config.outputSignalCount)}_execute(e){for(let t=0;t<this.executionSignals.length;t++)this.executionSignals[t]._activateSignal(e)}setNumberOfOutputSignals(e=1){for(;this.executionSignals.length>e;){const t=this.executionSignals.pop();t&&(t.disconnectFromAll(),this._unregisterSignalOutput(t.name))}for(;this.executionSignals.length<e;)this.executionSignals.push(this._registerSignalOutput(`out_${this.executionSignals.length}`))}getClassName(){return"FlowGraphSequenceBlock"}}s("FlowGraphSequenceBlock",n);export{n as FlowGraphSequenceBlock};
