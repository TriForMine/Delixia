"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["2161"],{68125:function(e,r,t){t.r(r),t.d(r,{rgbdEncodePixelShaderWGSL:()=>l});var a=t(83477);t(24086);let n="rgbdEncodePixelShader",u=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=toRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb);}`;a.v.ShadersStoreWGSL[n]||(a.v.ShadersStoreWGSL[n]=u);let l={name:n,shader:u}}}]);