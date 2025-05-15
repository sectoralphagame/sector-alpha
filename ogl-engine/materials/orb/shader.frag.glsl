#version 300 es
precision highp float;

#pragma glslify: luma = require(glsl-luma)

in vec2 vUv;
in float vT;

out vec4 fragData[3];

uniform vec4 uStart;
uniform vec4 uEnd;
uniform float fEmissive;

void main() {
    float dist = distance(vUv, vec2(0.5f, 0.5f));
    fragData[0] = mix(uStart / 255.f, uEnd / 255.f, vT);
    fragData[0].a *= sign((1.0f - 2.0f * dist));

    if(fragData[0].a < 0.01f) {
        discard;
    }

    fragData[1] = vec4(fragData[0].rgb, luma(fragData[0]) * fEmissive);
}