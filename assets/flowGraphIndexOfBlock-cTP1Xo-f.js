import{F as i,R as a,u as o,v as s,d as h}from"./index-hptb-8y6.js";class l extends i{constructor(e){super(e),this.config=e,this.object=this.registerDataInput("object",a),this.array=this.registerDataInput("array",a),this.index=this.registerDataOutput("index",o,new s(-1))}_updateOutputs(e){const r=this.object.getValue(e),t=this.array.getValue(e);t&&this.index.setValue(new s(t.indexOf(r)),e)}serialize(e){super.serialize(e)}getClassName(){return"FlowGraphIndexOfBlock"}}h("FlowGraphIndexOfBlock",l);export{l as FlowGraphIndexOfBlock};
