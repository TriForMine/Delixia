"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["2335"],{8421:function(t,e,i){i.r(e),i.d(e,{FlowGraphMultiGateBlock:()=>l});var s=i(16118),n=i(72041),a=i(5114),u=i(5126);class l extends n.Q{constructor(t){super(t),this.config=t,this.outputSignals=[],this.reset=this._registerSignalInput("reset"),this.lastIndex=this.registerDataOutput("lastIndex",a.fj,new u.K(-1)),this.setNumberOfOutputSignals(t?.outputSignalCount)}_getNextIndex(t){if(!t.includes(!1)&&this.config.isLoop&&t.fill(!1),!this.config.isRandom)return t.indexOf(!1);{let e=t.map((t,e)=>t?-1:e).filter(t=>-1!==t);return e.length?e[Math.floor(Math.random()*e.length)]:-1}}setNumberOfOutputSignals(t=1){for(;this.outputSignals.length>t;){let t=this.outputSignals.pop();t&&(t.disconnectFromAll(),this._unregisterSignalOutput(t.name))}for(;this.outputSignals.length<t;)this.outputSignals.push(this._registerSignalOutput(`out_${this.outputSignals.length}`))}_execute(t,e){if(t._hasExecutionVariable(this,"indexesUsed")||t._setExecutionVariable(this,"indexesUsed",this.outputSignals.map(()=>!1)),e===this.reset){t._deleteExecutionVariable(this,"indexesUsed"),this.lastIndex.setValue(new u.K(-1),t);return}let i=t._getExecutionVariable(this,"indexesUsed",[]),s=this._getNextIndex(i);s>-1&&(this.lastIndex.setValue(new u.K(s),t),i[s]=!0,t._setExecutionVariable(this,"indexesUsed",i),this.outputSignals[s]._activateSignal(t))}getClassName(){return"FlowGraphMultiGateBlock"}serialize(t){super.serialize(t),t.config.outputSignalCount=this.config.outputSignalCount,t.config.isRandom=this.config.isRandom,t.config.loop=this.config.isLoop,t.config.startIndex=this.config.startIndex}}(0,s.H7)("FlowGraphMultiGateBlock",l)}}]);