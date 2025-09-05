#version 300 es
precision highp float;

in vec2 vUv;
in float vFragDepth;

out vec4 fragData[3];

uniform vec3 uColor;
uniform float uCameraScale;

#define emissive 0.9f
#define K 0.01f

void main() {
    float alphaX = pow(1.f - vUv.x, 3.f);
    float alphaFactorY = (vUv.y - 0.5f) * 2.0f;
    float alphaY = K / (K + alphaFactorY * alphaFactorY) - K;
    float alpha = clamp(alphaX * alphaY - 0.005f, 0.f, 0.85f);

    fragData[0] = vec4(mix(uColor, vec3(1.f), pow(alphaY, 2.f) - 0.1f), alpha);
    fragData[1] = vec4(fragData[0].rgb, emissive * alpha);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}