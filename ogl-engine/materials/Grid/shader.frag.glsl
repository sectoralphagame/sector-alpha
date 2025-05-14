#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vPosition;

out vec4 fragData[3];

uniform vec3 cameraPosition;
uniform mat4 viewMatrix;

#define width 0.01

void main() {
    vec3 cameraDirection = vec3(-viewMatrix[0][2], -viewMatrix[1][2], -viewMatrix[2][2]);
    float t = -cameraPosition.y / cameraDirection.y;
    vec3 intersection = cameraPosition + t * cameraDirection;
    intersection.y = 0.f;
    float cameraDistance = length(cameraPosition - vPosition);

    float size = pow(2.f, floor(length(cameraPosition - intersection) / 41.f + 1.f));

    float ax = 1.f - fract(vPosition.x / size);
    float ay = 1.f - fract(vPosition.z / size);
    if(ax > width && ay > width) {
        discard;
    }

    fragData[0] = vec4(vec3(1.f), min(0.2f, 1.f - cameraDistance / 200.f));
}