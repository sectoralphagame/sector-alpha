#version 300 es
precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform float uSeed;
uniform float uTime;

#pragma glslify: noise3 = require(glsl-noise/simplex/3d)
#pragma glslify: fbm2  =  require("./ogl-engine/shader/fbm2.glsl")

float vignette(vec2 uv, float roundness) {
    float dist = length(uv - 0.5f);
    return clamp(pow(dist * 2.0f, roundness), 0.f, 1.f);
}

void main() {
    float x = floor(vUv.x * 4.f);
    float y = floor(vUv.y * 4.f);
    float seed = uSeed * (4.f * y + x) * 100.f;

    vec2 uv = vec2(vUv.x * 4.f - x, vUv.y * 4.f - y);

    float noise = fbm2(uv * 1.5f + seed, 6);
    float value = (1.f - vignette(uv, 0.4f)) * noise;

    fragColor = vec4(vec3(value), 1.0f);
}