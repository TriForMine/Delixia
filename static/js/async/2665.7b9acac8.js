"use strict";(self.webpackChunkdelixia=self.webpackChunkdelixia||[]).push([["2665"],{75064:function(e,i,o){o.r(i),o.d(i,{proceduralVertexShader:()=>n});var d=o(83477);let t="proceduralVertexShader",a=`attribute vec2 position;varying vec2 vPosition;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vPosition=position;vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;d.v.ShadersStore[t]||(d.v.ShadersStore[t]=a);let n={name:t,shader:a}}}]);