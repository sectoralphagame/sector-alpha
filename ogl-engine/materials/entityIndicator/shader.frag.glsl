#version 300 es
precision highp float;

in vec2 vUv;

out vec4 fragData[2];

uniform mat4 modelMatrix;
uniform vec3 cameraPosition;
uniform vec4 uColor;
uniform float uSize;
uniform int uState;
uniform float uTime;

#define baseLineWidth 0.05f

float sdCircle(vec2 p, float radius) {
    return length(p) - radius;
}

float sdBox(vec2 p, vec2 size) {
    vec2 d = abs(p) - size;

    return length(max(d, 0.0f)) * sign(max(d.x, d.y));
}

float sdRoundedBox(vec2 p, vec2 size, float radius) {
    vec2 q = abs(p) - (size - vec2(radius));

    float outsideDist = length(max(q, 0.0f)) - radius;
    return outsideDist;
}

float sdCornersOnly(vec2 p, vec2 size, float radius) {
    float dRounded = sdRoundedBox(p, size, radius);
    return max(dRounded, -sdCircle(p, size.x * 1.3f));
}

void main() {
    vec2 p = vUv - vec2(0.5f);
    float lineWidth = baseLineWidth / uSize;
    float smoothing = lineWidth * 0.5f;

    float dist = sdRoundedBox(p, vec2(0.25f), 0.1f);
    float alpha = 1.0f - smoothstep(lineWidth - smoothing, lineWidth, abs(dist));

    if(uState == 1 || uState == 3) {
        float x = sdCornersOnly(p, vec2(0.35f) + sin(uTime * 3.f) * 0.04f, 0.1f);
        alpha += 1.0f - smoothstep(lineWidth - smoothing, lineWidth, abs(x));
    }

    if(alpha <= 0.05f) {
        discard;
    }

    fragData[0] = vec4(uColor.rgb, alpha);
    fragData[0].a = alpha;
}