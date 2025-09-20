#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D tMap;
uniform vec2 uTexel;
uniform float uOffset;

void main() {
    vec2 halfpixel = uTexel * 0.5f;

    vec4 sum = texture(tMap, vUv) * 4.0f;
    sum += texture(tMap, vUv - halfpixel.xy * uOffset);
    sum += texture(tMap, vUv + halfpixel.xy * uOffset);
    sum += texture(tMap, vUv + vec2(halfpixel.x, -halfpixel.y) * uOffset);
    sum += texture(tMap, vUv - vec2(halfpixel.x, -halfpixel.y) * uOffset);

    fragColor = sum / 8.0f;
}