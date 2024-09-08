#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;
in vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 lightColor;
uniform vec3 lightDirection;

out vec2 vUv;
out vec3 vNormal;
out vec3 vLighting;
out vec3 FragPos;

void main() {
    FragPos = position;
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    highp vec3 ambientLight = vec3(0.04);
    highp vec3 directionalVector = normalize(lightDirection);

    highp vec3 transformedNormal = normalMatrix * normal;

    highp float directional = max(dot(transformedNormal.xyz, lightDirection), 0.0);
    vLighting = ambientLight + (lightColor * directional * 0.3);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(FragPos, 1.0);
}