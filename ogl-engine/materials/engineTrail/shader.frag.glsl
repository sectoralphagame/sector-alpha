#version 300 es
precision highp float;

in vec2 vUv;
in float vFragDepth;

out vec4 fragData[3];

uniform vec3 uColor;
uniform float uCameraScale;

#define emissive 0.9f
#define K 0.02

void main() {
    float alphaX = 1.f - vUv.x;
    float alphaFactorY = (vUv.y - 0.5f) * 2.0f;
    float alphaY = K / (K + alphaFactorY * alphaFactorY) - K;
    float alpha = alphaX * alphaY;

    fragData[0] = vec4(uColor * (1.f + emissive) * alphaX, alpha);
    fragData[1] = vec4(fragData[0].rgb, emissive * alpha);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}