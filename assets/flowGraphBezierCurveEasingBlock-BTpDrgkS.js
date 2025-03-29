import{F as r,b as u,N as a,R as c,aa as h,d as g}from"./index-BAyO5ncN.js";class l extends r{constructor(t){super(t),this.config=t,this._easingFunctions={},this.mode=this.registerDataInput("mode",u,0),this.controlPoint1=this.registerDataInput("controlPoint1",a),this.controlPoint2=this.registerDataInput("controlPoint2",a),this.easingFunction=this.registerDataOutput("easingFunction",c)}_updateOutputs(t){const i=this.mode.getValue(t),s=this.controlPoint1.getValue(t),e=this.controlPoint2.getValue(t);if(i===void 0)return;const n=`${i}-${s.x}-${s.y}-${e.x}-${e.y}`;if(!this._easingFunctions[n]){const o=new h(s.x,s.y,e.x,e.y);o.setEasingMode(i),this._easingFunctions[n]=o}this.easingFunction.setValue(this._easingFunctions[n],t)}getClassName(){return"FlowGraphBezierCurveEasing"}}g("FlowGraphBezierCurveEasing",l);export{l as FlowGraphBezierCurveEasingBlock};
