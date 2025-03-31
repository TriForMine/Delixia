"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["9117"],{42387:function(e,r,t){t.r(r),t.d(r,{rgbdDecodePixelShaderWGSL:()=>n});var a=t(83477);t(24086);let u="rgbdDecodePixelShader",l=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(fromRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV)),1.0);}`;a.v.ShadersStoreWGSL[u]||(a.v.ShadersStoreWGSL[u]=l);let n={name:u,shader:l}}}]);