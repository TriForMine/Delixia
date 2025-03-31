import{u as P,v as A,R as l,$ as F,a0 as j,d as _}from"./index-hptb-8y6.js";import{F as I}from"./flowGraphCachedOperationBlock-DavOo_8v.js";const w=new RegExp(/\/\{(\w+)\}\//g);class N{constructor(t,n){this.path=t,this.ownerBlock=n,this.templatedInputs=[];let r=w.exec(t);const e=new Set;for(;r;){const[,o]=r;if(e.has(o))throw new Error("Duplicate template variable detected.");e.add(o),this.templatedInputs.push(n.registerDataInput(o,P,new A(0))),r=w.exec(t)}}getAccessor(t,n){let r=this.path;for(const e of this.templatedInputs){const o=e.getValue(n).value;if(typeof o!="number"||o<0)throw new Error("Invalid value for templated input.");r=r.replace(`{${e.name}}`,o.toString())}return t.convert(r)}}class D extends I{constructor(t){super(l,t),this.config=t,this.object=this.registerDataOutput("object",l),this.propertyName=this.registerDataOutput("propertyName",l),this.setterFunction=this.registerDataOutput("setFunction",l,this._setPropertyValue.bind(this)),this.getterFunction=this.registerDataOutput("getFunction",l,this._getPropertyValue.bind(this)),this.generateAnimationsFunction=this.registerDataOutput("generateAnimationsFunction",l,this._getInterpolationAnimationPropertyInfo.bind(this)),this.templateComponent=new N(t.jsonPointer,this)}_doOperation(t){var c,i,s;const n=this.templateComponent.getAccessor(this.config.pathConverter,t),r=n.info.get(n.object),e=(i=(c=n.info).getTarget)==null?void 0:i.call(c,n.object),o=(s=n.info.getPropertyName)==null?void 0:s[0](n.object);if(e)this.object.setValue(e,t),o&&this.propertyName.setValue(o,t);else throw new Error("Object is undefined");return r}_setPropertyValue(t,n,r,e){var i,s;const o=this.templateComponent.getAccessor(this.config.pathConverter,e),c=o.info.type;c.startsWith("Color")&&(r=b(r,c)),(s=(i=o.info).set)==null||s.call(i,r,o.object)}_getPropertyValue(t,n,r){const e=this.templateComponent.getAccessor(this.config.pathConverter,r);return e.info.get(e.object)}_getInterpolationAnimationPropertyInfo(t,n,r){const e=this.templateComponent.getAccessor(this.config.pathConverter,r);return(o,c,i,s)=>{var g;const m=[],u=e.info.type;return u.startsWith("Color")&&(o=o.map(h=>({frame:h.frame,value:b(h.value,u)}))),(g=e.info.interpolation)==null||g.forEach((h,f)=>{var y;const d=((y=e.info.getPropertyName)==null?void 0:y[f](e.object))||"Animation-interpolation-"+f;let C=o;i!==h.type&&(C=o.map(p=>({frame:p.frame,value:h.getValue(void 0,p.value.asArray?p.value.asArray():[p.value],0,1)}))),h.buildAnimations(e.object,d,60,C).forEach(p=>{s&&p.babylonAnimation.setEasingFunction(s),m.push(p.babylonAnimation)})}),m}}getClassName(){return"FlowGraphJsonPointerParserBlock"}}function b(a,t){return a.getClassName().startsWith("Color")?a:t==="Color3"?new F(a.x,a.y,a.z):t==="Color4"?new j(a.x,a.y,a.z,a.w):a}_("FlowGraphJsonPointerParserBlock",D);export{D as FlowGraphJsonPointerParserBlock};
