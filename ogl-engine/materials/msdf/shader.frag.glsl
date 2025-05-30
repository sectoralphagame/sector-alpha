#version 300 es
precision highp float;

#pragma glslify: msdf = require("./ogl-engine/shader/msdf.glsl")

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D tMap;
uniform vec3 uColor;

void main() {
    float alpha = msdf(tMap, vUv);

    if(alpha < 0.01f)
        discard;

    fragColor.rgb = uColor;
    fragColor.a = alpha;
}