import{W as a,u as l,v as n,d as u}from"./index-BAyO5ncN.js";class o extends a{constructor(t){super(t),this.config=t,this.outputSignals=[],this.reset=this._registerSignalInput("reset"),this.lastIndex=this.registerDataOutput("lastIndex",l,new n(-1)),this.setNumberOfOutputSignals(t==null?void 0:t.outputSignalCount)}_getNextIndex(t){if(t.includes(!1)||this.config.isLoop&&t.fill(!1),this.config.isRandom){const e=t.map((s,i)=>s?-1:i).filter(s=>s!==-1);return e.length?e[Math.floor(Math.random()*e.length)]:-1}else return t.indexOf(!1)}setNumberOfOutputSignals(t=1){for(;this.outputSignals.length>t;){const e=this.outputSignals.pop();e&&(e.disconnectFromAll(),this._unregisterSignalOutput(e.name))}for(;this.outputSignals.length<t;)this.outputSignals.push(this._registerSignalOutput(`out_${this.outputSignals.length}`))}_execute(t,e){if(t._hasExecutionVariable(this,"indexesUsed")||t._setExecutionVariable(this,"indexesUsed",this.outputSignals.map(()=>!1)),e===this.reset){t._deleteExecutionVariable(this,"indexesUsed"),this.lastIndex.setValue(new n(-1),t);return}const s=t._getExecutionVariable(this,"indexesUsed",[]),i=this._getNextIndex(s);i>-1&&(this.lastIndex.setValue(new n(i),t),s[i]=!0,t._setExecutionVariable(this,"indexesUsed",s),this.outputSignals[i]._activateSignal(t))}getClassName(){return"FlowGraphMultiGateBlock"}serialize(t){super.serialize(t),t.config.outputSignalCount=this.config.outputSignalCount,t.config.isRandom=this.config.isRandom,t.config.loop=this.config.isLoop,t.config.startIndex=this.config.startIndex}}u("FlowGraphMultiGateBlock",o);export{o as FlowGraphMultiGateBlock};
