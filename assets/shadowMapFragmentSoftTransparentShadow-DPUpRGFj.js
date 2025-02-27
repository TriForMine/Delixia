import{g as o}from"./index-DfJDJLmV.js";const a="shadowMapFragmentSoftTransparentShadow",r=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;o.IncludesShadersStore[a]=r;const t={name:a,shader:r};export{t as shadowMapFragmentSoftTransparentShadow};
