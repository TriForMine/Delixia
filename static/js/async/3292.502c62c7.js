"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["3292"],{85138:function(t,e,a){a.r(e),a.d(e,{FlowGraphSendCustomEventBlock:()=>o});var n=a(15607),i=a(16118);class o extends n.F{constructor(t){for(let e in super(t),this.config=t,this.config.eventData)this.registerDataInput(e,this.config.eventData[e].type,this.config.eventData[e].value)}_execute(t){let e=this.config.eventId,a={};this.dataInputs.forEach(e=>{a[e.name]=e.getValue(t)}),t.configuration.coordinator.notifyCustomEvent(e,a),this.out._activateSignal(t)}getClassName(){return"FlowGraphReceiveCustomEventBlock"}}(0,i.H7)("FlowGraphReceiveCustomEventBlock",o)}}]);