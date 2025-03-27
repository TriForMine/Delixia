import{g as r}from"./index-oz25ygLZ.js";const e="hdrFilteringVertexShader",i=`attribute vec2 position;varying vec3 direction;uniform vec3 up;uniform vec3 right;uniform vec3 front;
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
mat3 view=mat3(up,right,front);direction=view*vec3(position,1.0);gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;r.ShadersStore[e]=i;const o={name:e,shader:i};export{o as hdrFilteringVertexShader};
