#version 300 es
precision highp float;

#pragma glslify: triangle = require("./ogl-engine/shader/triangle");
#pragma glslify: fbm3 = require("./ogl-engine/shader/fbm3");

in vec2 vUv;
in float vFragDepth;

out vec4 fragData[3];

uniform vec3 uColor;
uniform float uCameraScale;
uniform float uTime;
uniform float uIntensity;
uniform float uAspectRatio;

#define width 10.

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

void main() {
    float d = triangle(vUv.y);
    float falloff = 1.f - d;
    float noise = fbm3(vec3(vUv.y * 20.f, (vUv.x * 10.f + uTime * 15.f * uIntensity) * uAspectRatio / 50.f, uTime), 2);
    float mask = clamp(-sdCircle((vUv - vec2(0.5f)) * 2.f, 1.16f), 0.f, 1.f);
    float flux = max(0.1f, noise * 3.f);
    float core = max(((1.f - d) * width - (width - 1.f)) + flux, 0.f);

    vec3 color = uColor * falloff + vec3(core);
    float alpha = (falloff - triangle(fract(uTime * 15.f * uIntensity)) * 0.15f + core) * mask * uIntensity;

    alpha = clamp(alpha, 0.f, 1.f);
    fragData[0] = vec4(color, alpha);
    fragData[1] = vec4(max(vec3(0), color - 1.0f), alpha);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}