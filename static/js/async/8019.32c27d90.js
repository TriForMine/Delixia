"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["8019"],{46160:function(e,r,a){a.r(r),a.d(r,{passPixelShader:()=>s});var i=a(83477);let l="passPixelShader",t=`varying vec2 vUV;uniform sampler2D textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);}`;i.v.ShadersStore[l]||(i.v.ShadersStore[l]=t);let s={name:l,shader:t}}}]);