#version 300 es
precision highp float;

uniform samplerCube tMap;

in vec3 vDir;

out vec4 fragData[2];

void main() {
    fragData[0].rgb = texture(tMap, vDir).rgb;
    fragData[0].a = 1.0f;
    fragData[1] = vec4(0.1f);
}