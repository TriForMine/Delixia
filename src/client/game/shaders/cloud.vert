precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;

// Varying
varying vec3 vWorldNormal;

void main() {
    // Standard transform
    gl_Position = worldViewProjection * vec4(position, 1.0);

    // Transform normal to world space
    vWorldNormal = normalize((world * vec4(normal, 0.0)).xyz);
}