"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["1164"],{62913:function(a,e,r){r.r(e),r.d(e,{shadowMapFragmentSoftTransparentShadowWGSL:()=>S});var n=r(83477);let s="shadowMapFragmentSoftTransparentShadow",t=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alpha) {discard;}
#endif
`;n.v.IncludesShadersStoreWGSL[s]||(n.v.IncludesShadersStoreWGSL[s]=t);let S={name:s,shader:t}}}]);