#version 300 es
precision highp float;

out vec4 fragData[2];

#define color vec3(1.0, 0.0, 1.0)

void main() {
    fragData[0] = vec4(color, 1.0f);
    fragData[1] = vec4(0.f);
}