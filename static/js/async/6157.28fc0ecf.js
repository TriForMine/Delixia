"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["6157"],{28348:function(e,r,n){var a=n(83477);let l="kernelBlurVaryingDeclaration";a.v.IncludesShadersStore[l]||(a.v.IncludesShadersStore[l]="varying vec2 sampleCoord{X};")},37186:function(e,r,n){n.r(r),n.d(r,{kernelBlurVertexShader:()=>i});var a=n(83477);n(28348);let l="kernelBlurVertex";a.v.IncludesShadersStore[l]||(a.v.IncludesShadersStore[l]="sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};");let t="kernelBlurVertexShader",d=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;a.v.ShadersStore[t]||(a.v.ShadersStore[t]=d);let i={name:t,shader:d}}}]);