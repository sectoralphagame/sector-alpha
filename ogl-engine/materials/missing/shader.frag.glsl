#version 300 es
precision highp float;

out vec4 fragData[3];

#define color vec3(1.0, 0.0, 1.0)

void main() {
    fragData[0] = vec4(color, 1.0f);
}