#version 300 es
precision highp float;

#pragma glslify: Light = require("./ogl-engine/shader/light");

#pragma defines

in vec3 worldPosition;
in vec2 vUv;
in vec3 vTangent;
in vec3 vNormal;

uniform mat4 viewMatrix;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform vec3 cameraPosition;
uniform vec3 ambient;
uniform Light lights[16];
uniform samplerCube tEnvMap;

uniform float uMetallic;

#ifdef USE_ROUGHNESS
uniform sampler2D tRoughness;
#else
uniform float uRoughness;
#endif

#ifdef USE_EMISSIVE
uniform sampler2D tEmissive;
#endif

out vec4 fragData[3];
#define EPSILON 0.001f

#pragma glslify: normalMap = require("./ogl-engine/shader/normalMap");
#pragma glslify: pbr = require("./ogl-engine/shader/pbr", lights = lights, cameraPosition = cameraPosition, worldPosition = worldPosition);
#pragma glslify: luma = require(glsl-luma);

void main() {
    vec3 albedo = max(vec3(EPSILON), pow(texture(tDiffuse, vUv).rgb, vec3(1.f / 2.2f)));
    vec3 norm = normalMap(texture(tNormal, vUv).rgb * 2.f - 1.f, vNormal, vTangent);

    #ifdef USE_EMISSIVE
    vec3 emissive = texture(tEmissive, vUv).rgb;
    #else
    vec3 emissive = vec3(0.0f);
    #endif

    #ifdef USE_ROUGHNESS
    vec4 mr = texture(tRoughness, vUv);
    // float metallic = mr.r; // TODO: Make blender export metallic too
    float metallic = uMetallic;
    float roughness = mr.g;
    #else
    float metallic = uMetallic;
    float roughness = uRoughness;
    #endif

    fragData[0] = pbr(albedo, norm, metallic, roughness, emissive, tEnvMap, ambient, vTangent, vNormal);
    fragData[1] = vec4(fragData[0].rgb, luma(emissive));
}
