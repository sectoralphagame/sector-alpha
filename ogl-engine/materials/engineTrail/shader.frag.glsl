#version 300 es
precision highp float;

in vec2 vUv;

out vec4 fragData[2];

uniform vec3 uColor;

#define emissive 0.8f
#define K 0.02

void main() {
    float alphaX = 1.f - vUv.x;
    float alphaFactorY = (vUv.y - 0.5f) * 2.0f;
    float alphaY = K / (K + alphaFactorY * alphaFactorY) - K;
    float alpha = alphaX * alphaY;

    fragData[0] = vec4(uColor * (1.f + emissive) * alphaX, alpha);
    fragData[1].r = emissive;
}