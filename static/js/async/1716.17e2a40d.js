"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["1716"],{30467:function(e,i,t){t.r(i),t.d(i,{hdrIrradianceFilteringVertexShaderWGSL:()=>u});var r=t(83477);let n="hdrIrradianceFilteringVertexShader",f=`attribute position: vec2f;varying direction: vec3f;uniform up: vec3f;uniform right: vec3f;uniform front: vec3f;
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
var view: mat3x3f= mat3x3f(uniforms.up,uniforms.right,uniforms.front);vertexOutputs.direction=view*vec3f(input.position,1.0);vertexOutputs.position= vec4f(input.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;r.v.ShadersStoreWGSL[n]||(r.v.ShadersStoreWGSL[n]=f);let u={name:n,shader:f}}}]);