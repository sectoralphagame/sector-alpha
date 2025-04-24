#version 300 es
precision highp float;

#pragma glslify: luma = require(glsl-luma);

in vec2 vUv;
flat in float vInstanceIndex;

out vec4 fragData[2];

uniform sampler2D tMap;
uniform vec3 uColor;
uniform float uEmissive;
uniform float uAlpha;
uniform float uTime;
uniform vec3 ambient;

#define animSpeed 0.02f

float triangle(float x) {
    return abs(fract(x) * 2.0f - 1.0f); // range [0,1], shaped like a triangle
}

void main() {
    vec3 value = texture(tMap, vUv).rgb;
    float l = max(0.f, luma(value) - 0.1f);
    float alpha = uAlpha * l * clamp(triangle(uTime * (mod(vInstanceIndex, 9.f) + 0.1f) * animSpeed + vInstanceIndex * 0.01f), 0.15f, 0.9f);

    if(alpha < 1.f / 255.f)
        discard;

    vec4 color = vec4(uColor, alpha);

    fragData[0] = color;
    fragData[1] = vec4(0.f, 0.f, 0.f, 1.0f);
}