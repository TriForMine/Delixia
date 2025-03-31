"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["3904"],{31559:function(e,t,s){s.r(t),s.d(t,{postprocessVertexShaderWGSL:()=>a});var r=s(83477);let i="postprocessVertexShader",n=`attribute position: vec2<f32>;uniform scale: vec2<f32>;varying vUV: vec2<f32>;const madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=(vertexInputs.position*madd+madd)*uniforms.scale;vertexOutputs.position=vec4(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}
`;r.v.ShadersStoreWGSL[i]||(r.v.ShadersStoreWGSL[i]=n);let a={name:i,shader:n}}}]);