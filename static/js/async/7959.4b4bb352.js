"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["7959"],{36285:function(t,e,u){u.r(e),u.d(e,{FlowGraphFunctionReferenceBlock:()=>a});var s=u(98729),n=u(5114),i=u(16118);class a extends s.A{constructor(t){super(t),this.functionName=this.registerDataInput("functionName",n.w9),this.object=this.registerDataInput("object",n.s8),this.context=this.registerDataInput("context",n.s8,null),this.output=this.registerDataOutput("output",n.s8)}_updateOutputs(t){let e=this.functionName.getValue(t),u=this.object.getValue(t),s=this.context.getValue(t);if(u&&e){let n=u[e];n&&"function"==typeof n&&this.output.setValue(n.bind(s),t)}}getClassName(){return"FlowGraphFunctionReference"}}(0,i.H7)("FlowGraphFunctionReference",a)}}]);