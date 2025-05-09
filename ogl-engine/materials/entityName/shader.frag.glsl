#version 300 es
precision highp float;

#pragma glslify: msdf = require("./ogl-engine/shader/msdf.glsl")

in vec2 vUv;

out vec4 fragColor[3];

uniform sampler2D tMap;
uniform vec3 uColor;

void main() {
    float alpha = texture(tMap, vUv).a;

    if(alpha < 0.4f)
        discard;

    fragColor[2] = vec4(uColor, alpha * 1.7f);
}