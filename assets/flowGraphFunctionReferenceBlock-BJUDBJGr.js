import{F as u,ab as a,R as s,d as c}from"./index-BAyO5ncN.js";class r extends u{constructor(t){super(t),this.functionName=this.registerDataInput("functionName",a),this.object=this.registerDataInput("object",s),this.context=this.registerDataInput("context",s,null),this.output=this.registerDataOutput("output",s)}_updateOutputs(t){const n=this.functionName.getValue(t),i=this.object.getValue(t),o=this.context.getValue(t);if(i&&n){const e=i[n];e&&typeof e=="function"&&this.output.setValue(e.bind(o),t)}}getClassName(){return"FlowGraphFunctionReference"}}c("FlowGraphFunctionReference",r);export{r as FlowGraphFunctionReferenceBlock};
