"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["7820"],{5442:function(e,r,t){t.r(r),t.d(r,{passPixelShaderWGSL:()=>S});var a=t(83477);let p="passPixelShader",u=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureSample(textureSampler,textureSamplerSampler,input.vUV);}`;a.v.ShadersStoreWGSL[p]||(a.v.ShadersStoreWGSL[p]=u);let S={name:p,shader:u}}}]);