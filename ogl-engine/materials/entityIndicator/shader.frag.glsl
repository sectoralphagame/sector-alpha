#version 300 es
precision highp float;

in vec2 vUv;

out vec4 fragData[2];

uniform mat4 modelMatrix;
uniform vec3 cameraPosition;
uniform vec4 uColor;
uniform float uSize;

#define offset 0.2f / uSize

void main() {
    float dist = distance(vUv, vec2(0.5f, 0.5f));
    float cameraDist = distance(cameraPosition, modelMatrix[3].xyz);
    float alpha = clamp(cameraDist / 10.f, 0.f, 1.f);
    if(cameraDist < 1.f) {
        alpha = 0.f;
    }

    if(dist > 0.5f || dist < 0.5f - offset || alpha <= 0.05f) {
        discard;
    }

    fragData[0] = uColor;
    fragData[0].a = alpha;
    fragData[1] = fragData[0] * 0.5f;
}