import{l as p,R as a,d as u}from"./index-hptb-8y6.js";class h extends p{constructor(t){super(t),this.config=t,this.object=this.registerDataInput("object",a,t.target),this.value=this.registerDataInput("value",a),this.propertyName=this.registerDataInput("propertyName",a,t.propertyName),this.customSetFunction=this.registerDataInput("customSetFunction",a)}_execute(t,l){try{const s=this.object.getValue(t),r=this.value.getValue(t),e=this.customSetFunction.getValue(t);e?e(s,this.propertyName.getValue(t),r,t):this._setPropertyValue(s,this.propertyName.getValue(t),r)}catch(s){this._reportError(t,s)}this.out._activateSignal(t)}_setPropertyValue(t,l,s){const r=l.split(".");let e=t;for(let i=0;i<r.length-1;i++){const o=r[i];e[o]===void 0&&(e[o]={}),e=e[o]}e[r[r.length-1]]=s}getClassName(){return"FlowGraphSetPropertyBlock"}}u("FlowGraphSetPropertyBlock",h);export{h as FlowGraphSetPropertyBlock};
