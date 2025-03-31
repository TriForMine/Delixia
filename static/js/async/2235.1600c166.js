"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["2235"],{80176:function(a,e,r){r.r(e),r.d(e,{shadowMapFragmentSoftTransparentShadow:()=>t});var d=r(83477);let o="shadowMapFragmentSoftTransparentShadow",s=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;d.v.IncludesShadersStore[o]||(d.v.IncludesShadersStore[o]=s);let t={name:o,shader:s}}}]);