import{l as h,R as r,b as p,u as o,v as n,x as s,d}from"./index-BAyO5ncN.js";class i extends h{constructor(e){super(e),this.startIndex=this.registerDataInput("startIndex",r,0),this.endIndex=this.registerDataInput("endIndex",r),this.step=this.registerDataInput("step",p,1),this.index=this.registerDataOutput("index",o,new n(s((e==null?void 0:e.initialIndex)??0))),this.executionFlow=this._registerSignalOutput("executionFlow"),this.completed=this._registerSignalOutput("completed"),this._unregisterSignalOutput("out")}_execute(e){const l=s(this.startIndex.getValue(e)),u=this.step.getValue(e);let a=s(this.endIndex.getValue(e));for(let t=l;t<a&&(this.index.setValue(new n(t),e),this.executionFlow._activateSignal(e),a=s(this.endIndex.getValue(e)),!(t>i.MaxLoopIterations));t+=u);this.completed._activateSignal(e)}getClassName(){return"FlowGraphForLoopBlock"}}i.MaxLoopIterations=1e3;d("FlowGraphForLoopBlock",i);export{i as FlowGraphForLoopBlock};
