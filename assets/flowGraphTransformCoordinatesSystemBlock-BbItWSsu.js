import{F as c,R as e,r,T as a,V as m,d as h}from"./index-hptb-8y6.js";class y extends c{constructor(t){super(t),this.sourceSystem=this.registerDataInput("sourceSystem",e),this.destinationSystem=this.registerDataInput("destinationSystem",e),this.inputCoordinates=this.registerDataInput("inputCoordinates",r),this.outputCoordinates=this.registerDataOutput("outputCoordinates",r)}_updateOutputs(t){const i=this.sourceSystem.getValue(t),n=this.destinationSystem.getValue(t),u=this.inputCoordinates.getValue(t),d=i.getWorldMatrix(),l=n.getWorldMatrix(),s=a.Matrix[0].copyFrom(l);s.invert();const o=a.Matrix[1];s.multiplyToRef(d,o);const p=this.outputCoordinates.getValue(t);m.TransformCoordinatesToRef(u,o,p)}getClassName(){return"FlowGraphTransformCoordinatesSystemBlock"}}h("FlowGraphTransformCoordinatesSystemBlock",y);export{y as FlowGraphTransformCoordinatesSystemBlock};
