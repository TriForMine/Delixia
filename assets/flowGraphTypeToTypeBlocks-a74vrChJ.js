import{F as r}from"./flowGraphUnaryOperationBlock-BwqYg4UU.js";import{b as n,u as s,v as t,c as F,d as l}from"./index-hptb-8y6.js";import"./flowGraphCachedOperationBlock-DavOo_8v.js";class p extends r{constructor(o){super(F,n,a=>+a,"FlowGraphBooleanToFloat",o)}}l("FlowGraphBooleanToFloat",p);class u extends r{constructor(o){super(F,s,a=>t.FromValue(+a),"FlowGraphBooleanToInt",o)}}l("FlowGraphBooleanToInt",u);class h extends r{constructor(o){super(n,F,a=>!!a,"FlowGraphFloatToBoolean",o)}}l("FlowGraphFloatToBoolean",h);class c extends r{constructor(o){super(s,F,a=>!!a.value,"FlowGraphIntToBoolean",o)}}l("FlowGraphIntToBoolean",c);class w extends r{constructor(o){super(s,n,a=>a.value,"FlowGraphIntToFloat",o)}}l("FlowGraphIntToFloat",w);class G extends r{constructor(o){super(n,s,a=>{switch(o==null?void 0:o.roundingMode){case"floor":return t.FromValue(Math.floor(a));case"ceil":return t.FromValue(Math.ceil(a));case"round":return t.FromValue(Math.round(a));default:return t.FromValue(a)}},"FlowGraphFloatToInt",o)}}l("FlowGraphFloatToInt",G);export{p as FlowGraphBooleanToFloat,u as FlowGraphBooleanToInt,h as FlowGraphFloatToBoolean,G as FlowGraphFloatToInt,c as FlowGraphIntToBoolean,w as FlowGraphIntToFloat};
