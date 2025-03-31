"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["1929"],{42788:function(e,r,t){t.r(r),t.d(r,{depthBoxBlurPixelShader:()=>S});var o=t(83477);let i="depthBoxBlurPixelShader",l=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 screenSize;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 colorDepth=vec4(0.0);for (int x=-OFFSET; x<=OFFSET; x++)
for (int y=-OFFSET; y<=OFFSET; y++)
colorDepth+=texture2D(textureSampler,vUV+vec2(x,y)/screenSize);gl_FragColor=(colorDepth/float((OFFSET*2+1)*(OFFSET*2+1)));}`;o.v.ShadersStore[i]||(o.v.ShadersStore[i]=l);let S={name:i,shader:l}}}]);