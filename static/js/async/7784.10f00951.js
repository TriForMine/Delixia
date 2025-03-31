"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["7784"],{40681:function(e,r,i){i.r(r),i.d(r,{rgbdEncodePixelShader:()=>t});var a=i(83477);i(2738);let d="rgbdEncodePixelShader",l=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`;a.v.ShadersStore[d]||(a.v.ShadersStore[d]=l);let t={name:d,shader:l}}}]);