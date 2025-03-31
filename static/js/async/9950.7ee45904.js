"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["9950"],{86495:function(e,r,i){i.r(r),i.d(r,{rgbdDecodePixelShader:()=>t});var a=i(83477);i(2738);let d="rgbdDecodePixelShader",l=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=vec4(fromRGBD(texture2D(textureSampler,vUV)),1.0);}`;a.v.ShadersStore[d]||(a.v.ShadersStore[d]=l);let t={name:d,shader:l}}}]);