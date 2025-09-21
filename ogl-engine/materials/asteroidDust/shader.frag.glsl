#version 300 es
precision highp float;

#pragma glslify: triangle = require(./ogl-engine/shader/triangle);

in vec2 vUv;
in float vFragDepth;
flat in float vInstanceIndex;

out vec4 fragData[2];

uniform sampler2D tMap;
uniform vec3 uColor;
uniform float uEmissive;
uniform float uAlpha;
uniform float uTime;
uniform float uCameraScale;
uniform vec3 ambient;

#define animSpeed 0.02f

void main() {
    float value = texture(tMap, vUv).r;
    float l = max(0.f, value - 0.1f);
    float alpha = uAlpha * l * clamp(triangle(uTime * (mod(vInstanceIndex, 9.f) + 0.1f) * animSpeed + vInstanceIndex * 0.01f), 0.15f, 0.9f);

    if(alpha < 1.f / 255.f)
        discard;

    fragData[0] = vec4(uColor, alpha);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}