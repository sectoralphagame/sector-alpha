#version 300 es
precision highp float;

in vec3 FragPos;
in vec2 vUv;
in vec3 vNormal;
in vec3 vLighting;

uniform sampler2D tDiffuse;

out vec4 outColor;

void main() {
    vec3 tex = texture(tDiffuse, vUv).rgb;
    vec3 normal = normalize(vNormal);

    outColor = vec4(tex * vLighting, 1.0);
}