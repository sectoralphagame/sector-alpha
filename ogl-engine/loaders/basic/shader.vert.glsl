#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;
in vec3 normal;
#ifdef instanced
    in vec3 offset;
    in float angle;
#endif

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform vec3 lightColor;
uniform vec3 lightDirection;

out vec2 vUv;
out vec3 vNormal;
out vec3 vMPos;
out vec3 vLighting;
out vec3 FragPos;

mat4 getYRotationMatrix(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    
    return mat4(
        c,   0.0,  s,  0.0,
        0.0, 1.0,  0.0, 0.0,
       -s,   0.0,  c,  0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

void main() {
    vec3 pos = position;

    #ifdef instanced
        mat4 rotationMatrix = getYRotationMatrix(angle);
        pos = (rotationMatrix * vec4(position, 1.0)).xyz;
        pos += offset;
    #endif

    FragPos = pos;
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vMPos = (modelMatrix * vec4(pos, 1.0)).xyz;

    highp vec3 ambientLight = vec3(0.1);
    highp vec3 directionalVector = normalize(lightDirection);

    highp vec3 transformedNormal = normalMatrix * normal;

    highp float directional = max(dot(transformedNormal.xyz, lightDirection), 0.0);
    vLighting = ambientLight + (lightColor * directional * 0.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(FragPos, 1.0);
}