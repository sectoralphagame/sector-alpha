#version 300 es
precision highp float;

uniform samplerCube tMap;
uniform float uCameraScale;

in vec3 vDir;
in float vFragDepth;

out vec4 fragData[2];

void main() {
    fragData[0] = texture(tMap, vDir);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}