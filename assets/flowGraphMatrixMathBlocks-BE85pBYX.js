import{F as M,r as h,U as w,K as F,M as m,c as k,V as u,Q as x,m as s,b as D,d as r}from"./index-hptb-8y6.js";import{F as V}from"./flowGraphUnaryOperationBlock-BwqYg4UU.js";import{F as b}from"./flowGraphBinaryOperationBlock-B1ZutyOp.js";import"./flowGraphCachedOperationBlock-DavOo_8v.js";class E extends V{constructor(t){super(s((t==null?void 0:t.matrixType)||"Matrix"),s((t==null?void 0:t.matrixType)||"Matrix"),a=>a.transpose?a.transpose():m.Transpose(a),"FlowGraphTransposeBlock",t)}}r("FlowGraphTransposeBlock",E);class _ extends V{constructor(t){super(s((t==null?void 0:t.matrixType)||"Matrix"),D,a=>a.determinant(),"FlowGraphDeterminantBlock",t)}}r("FlowGraphDeterminantBlock",_);class v extends V{constructor(t){super(s((t==null?void 0:t.matrixType)||"Matrix"),s((t==null?void 0:t.matrixType)||"Matrix"),a=>a.inverse?a.inverse():m.Invert(a),"FlowGraphInvertMatrixBlock",t)}}r("FlowGraphInvertMatrixBlock",v);class Q extends b{constructor(t){super(s((t==null?void 0:t.matrixType)||"Matrix"),s((t==null?void 0:t.matrixType)||"Matrix"),s((t==null?void 0:t.matrixType)||"Matrix"),(a,e)=>e.multiply(a),"FlowGraphMatrixMultiplicationBlock",t)}}r("FlowGraphMatrixMultiplicationBlock",Q);class O extends M{constructor(t){super(t),this.input=this.registerDataInput("input",F),this.position=this.registerDataOutput("position",h),this.rotationQuaternion=this.registerDataOutput("rotationQuaternion",w),this.scaling=this.registerDataOutput("scaling",h),this.isValid=this.registerDataOutput("isValid",k,!1)}_updateOutputs(t){const a=t._getExecutionVariable(this,"executionId",-1),e=t._getExecutionVariable(this,"cachedPosition",null),i=t._getExecutionVariable(this,"cachedRotation",null),p=t._getExecutionVariable(this,"cachedScaling",null);if(a===t.executionId&&e&&i&&p)this.position.setValue(e,t),this.rotationQuaternion.setValue(i,t),this.scaling.setValue(p,t);else{const l=this.input.getValue(t),n=e||new u,c=i||new x,d=p||new u,G=Math.round(l.m[3]*1e4)/1e4,y=Math.round(l.m[7]*1e4)/1e4,B=Math.round(l.m[11]*1e4)/1e4,I=Math.round(l.m[15]*1e4)/1e4;if(G!==0||y!==0||B!==0||I!==1){this.isValid.setValue(!1,t),this.position.setValue(u.Zero(),t),this.rotationQuaternion.setValue(x.Identity(),t),this.scaling.setValue(u.One(),t);return}const T=l.decompose(d,c,n);this.isValid.setValue(T,t),this.position.setValue(n,t),this.rotationQuaternion.setValue(c,t),this.scaling.setValue(d,t),t._setExecutionVariable(this,"cachedPosition",n),t._setExecutionVariable(this,"cachedRotation",c),t._setExecutionVariable(this,"cachedScaling",d),t._setExecutionVariable(this,"executionId",t.executionId)}}getClassName(){return"FlowGraphMatrixDecompose"}}r("FlowGraphMatrixDecompose",O);class R extends M{constructor(t){super(t),this.position=this.registerDataInput("position",h),this.rotationQuaternion=this.registerDataInput("rotationQuaternion",w),this.scaling=this.registerDataInput("scaling",h),this.value=this.registerDataOutput("value",F)}_updateOutputs(t){const a=t._getExecutionVariable(this,"executionId",-1),e=t._getExecutionVariable(this,"cachedMatrix",null);if(a===t.executionId&&e)this.value.setValue(e,t);else{const i=m.Compose(this.scaling.getValue(t),this.rotationQuaternion.getValue(t),this.position.getValue(t));this.value.setValue(i,t),t._setExecutionVariable(this,"cachedMatrix",i),t._setExecutionVariable(this,"executionId",t.executionId)}}getClassName(){return"FlowGraphMatrixCompose"}}r("FlowGraphMatrixCompose",R);export{_ as FlowGraphDeterminantBlock,v as FlowGraphInvertMatrixBlock,R as FlowGraphMatrixComposeBlock,O as FlowGraphMatrixDecomposeBlock,Q as FlowGraphMatrixMultiplicationBlock,E as FlowGraphTransposeBlock};
