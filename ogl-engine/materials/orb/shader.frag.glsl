#version 300 es
precision highp float;

#pragma glslify: luma = require(glsl-luma)

in vec2 vUv;
in float vT;
in float vFragDepth;

out vec4 fragData[2];

uniform vec4 uStart;
uniform vec4 uEnd;
uniform float fEmissive;
uniform float uCameraScale;

void main() {
    float dist = distance(vUv, vec2(0.5f, 0.5f));
    fragData[0] = mix(uStart / 255.f, uEnd / 255.f, vT);
    fragData[0].a *= mix(1.f, 0.f, dist * 2.f);

    if(fragData[0].a < 0.01f) {
        discard;
    }

    fragData[1] = vec4(fragData[0].rgb, luma(fragData[0]) * fEmissive);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}