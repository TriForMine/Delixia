import{l,b as s,d as t}from"./index-BAyO5ncN.js";class r extends l{constructor(e){super(e),this.delayIndex=this.registerDataInput("delayIndex",s)}_execute(e,o){const a=this.delayIndex.getValue(e);if(a<=0||isNaN(a)||!isFinite(a))return this._reportError(e,"Invalid delay index");const i=e._getExecutionVariable(this,"pendingDelays",[])[a];i&&i.dispose(),this.out._activateSignal(e)}getClassName(){return"FlowGraphCancelDelayBlock"}}t("FlowGraphCancelDelayBlock",r);export{r as FlowGraphCancelDelayBlock};
