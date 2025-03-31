"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["1020"],{42436:function(e,i,r){r.r(i),r.d(i,{iblScaledLuminancePixelShader:()=>l});var o=r(83477);r(2738);let c="iblScaledLuminancePixelShader",n=`precision highp sampler2D;precision highp samplerCube;
#include<helperFunctions>
varying vec2 vUV;
#ifdef IBL_USE_CUBE_MAP
uniform samplerCube iblSource;
#else
uniform sampler2D iblSource;
#endif
uniform int iblWidth;uniform int iblHeight;float fetchLuminance(vec2 coords) {
#ifdef IBL_USE_CUBE_MAP
vec3 direction=equirectangularToCubemapDirection(coords);vec3 color=textureCubeLodEXT(iblSource,direction,0.0).rgb;
#else
vec3 color=textureLod(iblSource,coords,0.0).rgb;
#endif
return dot(color,LuminanceEncodeApprox);}
void main(void) {float deform=sin(vUV.y*PI);float luminance=fetchLuminance(vUV);gl_FragColor=vec4(vec3(deform*luminance),1.0);}`;o.v.ShadersStore[c]||(o.v.ShadersStore[c]=n);let l={name:c,shader:n}}}]);