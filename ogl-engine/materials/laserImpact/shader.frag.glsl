#version 300 es
precision highp float;

in vec2 vUv;
in float vFragDepth;
in vec3 vNormal;
in vec3 vViewDirection;

out vec4 fragData[3];

uniform vec3 uColor;
uniform float uCameraScale;
uniform float uTime;
uniform float uIntensity;

#define tMultiplier 10.

float fresnel(float amount, vec3 normal, vec3 view) {
    return pow(1.0f - dot(normalize(normal), normalize(view)), amount);
}

void main() {
    float t = fract(uTime * tMultiplier);
    float f = fresnel(t * 120.f, vNormal, vViewDirection);
    float alpha = max(uIntensity * 1.2f - f, 0.f);
    fragData[0] = vec4(uColor, alpha * 1.f);
    fragData[1] = fragData[0];
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}