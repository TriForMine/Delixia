"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["3503"],{32540:function(e,r,a){a.r(r),a.d(r,{layerPixelShaderWGSL:()=>o});var t=a(83477);a(24086);let l="layerPixelShader",i=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform color: vec4f;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
var baseColor: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);
#if defined(CONVERT_TO_GAMMA)
baseColor=toGammaSpace(baseColor);
#elif defined(CONVERT_TO_LINEAR)
baseColor=toLinearSpaceVec4(baseColor);
#endif
#ifdef ALPHATEST
if (baseColor.a<0.4) {discard;}
#endif
fragmentOutputs.color=baseColor*uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;t.v.ShadersStoreWGSL[l]||(t.v.ShadersStoreWGSL[l]=i);let o={name:l,shader:i}}}]);