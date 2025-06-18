#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;

out vec2 vUv;
out float vFragDepth;

uniform float uTime;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

void main() {
    vUv = uv;

    vec3 vPosition = normalize(position);
    float noise = sin(dot(vPosition, vec3(1.f)) + uTime);
    vec3 displacement = vPosition * noise * 1.2f;

    mat4 trs = modelMatrix;
    trs[3][0] += cameraPosition.x;
    trs[3][1] += cameraPosition.y;
    trs[3][2] += cameraPosition.z;

    gl_Position = projectionMatrix * viewMatrix * trs * vec4(position, 1.0f) + vec4(displacement, 1.0f);
    vFragDepth = 1.0f + gl_Position.w;
}
