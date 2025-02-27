import{g as o}from"./index-S6l8SMkQ.js";const a="shadowMapFragmentSoftTransparentShadow",r=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(((fragmentInputs.position.xy)%(8.0)))))/64.0>=uniforms.softTransparentShadowSM.x*alpha) {discard;}
#endif
`;o.IncludesShadersStoreWGSL[a]=r;const n={name:a,shader:r};export{n as shadowMapFragmentSoftTransparentShadowWGSL};
