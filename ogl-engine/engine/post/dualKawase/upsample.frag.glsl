#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uTexel;
uniform float uOffset;
uniform sampler2D tMap;

void main() {

    vec2 halfpixel = uTexel * 0.5f;
    vec2 o = halfpixel * uOffset;

    vec4 color = vec4(0.0f);

    color += texture(tMap, vUv + vec2(-o.x * 2.0f, 0.0f));
    color += texture(tMap, vUv + vec2(o.x * 2.0f, 0.0f));
    color += texture(tMap, vUv + vec2(0.0f, -o.y * 2.0f));
    color += texture(tMap, vUv + vec2(0.0f, o.y * 2.0f));

    color += texture(tMap, vUv + vec2(-o.x, o.y)) * 2.0f;
    color += texture(tMap, vUv + vec2(o.x, o.y)) * 2.0f;
    color += texture(tMap, vUv + vec2(-o.x, -o.y)) * 2.0f;
    color += texture(tMap, vUv + vec2(o.x, -o.y)) * 2.0f;

    fragColor = (color / 12.0f);
}