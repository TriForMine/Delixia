"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["2768"],{19137:function(t,i,e){e.r(i),e.d(i,{FlowGraphBezierCurveEasingBlock:()=>r});var s=e(30047),n=e(98729),o=e(5114),a=e(16118);class r extends n.A{constructor(t){super(t),this.config=t,this._easingFunctions={},this.mode=this.registerDataInput("mode",o.ab,0),this.controlPoint1=this.registerDataInput("controlPoint1",o.rh),this.controlPoint2=this.registerDataInput("controlPoint2",o.rh),this.easingFunction=this.registerDataOutput("easingFunction",o.s8)}_updateOutputs(t){let i=this.mode.getValue(t),e=this.controlPoint1.getValue(t),n=this.controlPoint2.getValue(t);if(void 0===i)return;let o=`${i}-${e.x}-${e.y}-${n.x}-${n.y}`;if(!this._easingFunctions[o]){let t=new s.sj(e.x,e.y,n.x,n.y);t.setEasingMode(i),this._easingFunctions[o]=t}this.easingFunction.setValue(this._easingFunctions[o],t)}getClassName(){return"FlowGraphBezierCurveEasing"}}(0,a.H7)("FlowGraphBezierCurveEasing",r)}}]);