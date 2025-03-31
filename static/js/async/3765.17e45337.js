"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["3765"],{26962:function(e,i,r){r.r(i),r.d(i,{hdrIrradianceFilteringVertexShader:()=>a});var t=r(83477);let n="hdrIrradianceFilteringVertexShader",o=`attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.v.ShadersStore[n]||(t.v.ShadersStore[n]=o);let a={name:n,shader:o}}}]);