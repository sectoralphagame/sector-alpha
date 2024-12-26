#version 300 es
precision highp float;

in vec2 vUv;
in float fDist;

out vec4 fragData[2];

uniform vec3 uColor;
uniform vec4 uRings;
uniform int uSelected;

#define rStop 0.4f
#define rStopSel 0.5f

void main() {
    float dist = distance(vUv, vec2(0.5f));
    float r = clamp(uRings[1] - fDist * 0.01f, uRings[0], uRings[1]);
    float rSel = clamp(uRings[3] - fDist * 0.001f, uRings[2], uRings[3]);
    if((dist >= r && dist <= rStop) || (uSelected > 0 && (dist >= rSel && dist <= rStopSel))) {
        fragData[0] = vec4(uColor, 1.0f);
    } else {
        discard;
    }
}