#version 300 es
precision highp float;

in vec2 vUv;

out vec4 fragData[3];

uniform mat4 modelMatrix;
uniform vec3 cameraPosition;
uniform vec4 uColor;
uniform float uSize;
uniform float uTime;
uniform float uHp;
uniform float uShield;
uniform int uHovered;
uniform int uSelected;

#define baseLineWidth 0.04f
#define baseBarLineWidth 0.1f
#define barHeight 0.034f / log(uSize)
#define hpOffset (1.0 - barHeight * 3.)
#define shieldOffset hpOffset - barHeight * 2.0f

float sdCircle(vec2 p, float radius) {
    return length(p) - radius;
}

float sdRoundedBox(vec2 p, vec2 size, float radius) {
    vec2 q = abs(p) - (size - vec2(radius));

    float outsideDist = length(max(q, 0.0f)) - radius;
    return outsideDist;
}

float sdCornersOnly(vec2 p, vec2 size, float radius) {
    return sdRoundedBox(p, size, radius);
}

float box(vec2 p, vec2 from, vec2 to) {
    vec2 d = abs(p) - (to - from);
    return min(max(d.x, d.y), 0.0f) + length(max(d, 0.0f));
}

vec3 getHpColor(float hp) {
    if(hp > 0.5f) {
        return vec3(0.45f, 0.99f, 0.56f);
    } else if(hp > 0.25f) {
        return vec3(1.f, 1.f, 0.f);
    } else {
        return vec3(1.f, 0.f, 0.f);
    }
}

void main() {
    vec3 color = uColor.rgb;

    vec2 p = vUv - vec2(0.5f);
    float lineWidth = baseLineWidth / uSize;
    float barLineWidth = baseBarLineWidth / uSize;
    float smoothing = lineWidth * 0.5f;

    float dist = sdRoundedBox(p, vec2(0.2f), 0.1f);
    float alpha = 1.0f - smoothstep(lineWidth - smoothing, lineWidth, abs(dist));

    if(uSelected > 0) {
        float x = sdCornersOnly(p, vec2(0.26f) + sin(uTime * 3.f) * 0.02f, 0.1f);
        alpha += 1.0f - smoothstep(lineWidth - smoothing, lineWidth, abs(x));
    }

    float hp = box(vUv + vec2(0, -hpOffset), vec2(0.f, 0.0f), vec2(uHp, barHeight));
    alpha += 1.0f - sign(hp);

    if(sign(hp) < 0.f) {
        color = getHpColor(uHp);
    }

    float shield = box(vUv + vec2(0, -shieldOffset), vec2(0.f, 0.0f), vec2(uShield, barHeight));
    alpha += 1.0f - sign(shield);

    if(sign(shield) < 0.f) {
        color = vec3(0.16f, 0.5f, 0.98f);
    }

    if(alpha <= 0.05f) {
        discard;
    }

    fragData[2] = vec4(color, alpha * (0.75f + sign(float(uSelected)) * 0.22f + sign(float(uHovered)) * 0.1f));
}