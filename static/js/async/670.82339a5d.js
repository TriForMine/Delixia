"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["670"],{34208:function(e,r,t){var n=t(83477);let a="kernelBlurVaryingDeclaration";n.v.IncludesShadersStoreWGSL[a]||(n.v.IncludesShadersStoreWGSL[a]="varying sampleCoord{X}: vec2f;")},63065:function(e,r,t){t.r(r),t.d(r,{kernelBlurVertexShaderWGSL:()=>l});var n=t(83477);t(34208);let a="kernelBlurVertex";n.v.IncludesShadersStoreWGSL[a]||(n.v.IncludesShadersStoreWGSL[a]="vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};");let u="kernelBlurVertexShader",i=`attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.sampleCenter=(input.position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;n.v.ShadersStoreWGSL[u]||(n.v.ShadersStoreWGSL[u]=i);let l={name:u,shader:i}}}]);