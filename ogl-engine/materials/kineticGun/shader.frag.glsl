#version 300 es
precision highp float;

#pragma glslify: luma = require(glsl-luma)

in vec2 vUv;
in float vT;

out vec4 fragData[3];

uniform vec4 uColor;

void main() {
    float a = 1.f - 2.f * distance(vUv, vec2(0.5f, 0.5f));
    fragData[0].rgb = mix(uColor.rgb, vec3(1.f), a * a);
    fragData[0].a = a * uColor.a;

    if(fragData[0].a < 1.f / 255.f) {
        discard;
    }

    fragData[1] = vec4(fragData[0].rgb, luma(fragData[0]));
}