#version 300 es
precision highp float;

#pragma glslify: Light = require("./ogl-engine/shader/light");

#pragma defines

in vec3 worldPosition;
in vec2 vUv;
in vec3 vTangent;
in vec3 vNormal;
in mat3 tbn;
in float vFragDepth;

uniform mat4 viewMatrix;
uniform sampler2D tGrunge;
uniform sampler2D tNormal;
uniform vec3 cameraPosition;
uniform vec3 ambient;
uniform Light lights[16];
uniform samplerCube tEnvMap;
uniform float uCameraScale;

out vec4 fragData[3];
#define EPSILON 0.001f

#pragma glslify: pbr = require("./ogl-engine/shader/pbr", lights = lights, cameraPosition = cameraPosition, worldPosition = worldPosition);
#pragma glslify: luma = require(glsl-luma);

void main() {
    if(distance(worldPosition, cameraPosition) > 100.f) {
        discard;
    }

    vec3 grungeMap = pow(texture(tGrunge, fract(vUv * 4.f)).rgb, vec3(1.f / 2.2f));
    float grunge = grungeMap.r;

    vec3 albedo = max(vec3(EPSILON), vec3(grunge));
    vec3 norm = normalize(tbn * (texture(tNormal, fract(vUv * 4.f)).rgb * 2.f - 1.f));

    float metallic = 0.0f;
    float roughness = grungeMap.r;

    fragData[0] = pbr(albedo, norm, metallic, roughness, vec3(0.f), tEnvMap, ambient);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}
