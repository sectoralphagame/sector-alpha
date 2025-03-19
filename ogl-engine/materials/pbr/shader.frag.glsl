#version 300 es
precision highp float;

#pragma glslify: Light = require("./ogl-engine/shader/light");
#pragma glslify: blinnPhongSpec = require(glsl-specular-blinn-phong)
#pragma glslify: cookTorranceSpec = require(glsl-specular-cook-torrance)
#pragma glslify: luma = require(glsl-luma)

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

uniform float uMetallic;

#ifdef USE_ROUGHNESS
uniform sampler2D tRoughness;
#else
uniform float uRoughness;
#endif

#ifdef USE_EMISSIVE
uniform sampler2D tEmissive;
#endif

#define EPSILON 0.001f

out vec4 fragData[2];

void main() {
    vec3 tex = max(vec3(EPSILON), pow(texture(tDiffuse, vUv).rgb, vec3(1.f / 2.2f)));  
    vec3 normalMap = texture(tNormal, vUv).rgb * 2.f - 1.f;

    vec3 tangent = vTangent - dot(vTangent, vNormal) * vNormal;
    vec3 bitangent = cross(vNormal, tangent);
    mat3 tbn = mat3(normalize(tangent), normalize(bitangent), normalize(vNormal));

    vec3 eyeDirection = normalize(cameraPosition - worldPosition);
    vec3 diffuse = vec3(0.0f);
    vec3 specular = vec3(0.0f);

    vec3 norm = normalize(tbn * normalMap);

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

    vec3 F0 = vec3(0.04f, 0.04f, 0.04f);
    F0 = mix(F0, tex, metallic);

    for(int i = 0; i < lights.length(); i++) {
        if(lights[i].visible) {
            vec3 lightDir = vec3(0.0f);
            float intensity = lights[i].intensity;
            if(lights[i].position.w == 0.0f) {
                lightDir = normalize(-lights[i].position.xyz);
            } else {
                vec3 d = lights[i].position.xyz - worldPosition;
                lightDir = normalize(d);
                float dist = length(d);
                intensity /= 1.0 + dist + pow(dist, 2.0f);
                if(intensity < 0.01f) {
                    continue;
                }
            }
            float diff = max(dot(norm, lightDir), 0.0f);
            vec3 color = lights[i].color * intensity;
            diffuse += diff * color;
            specular += cookTorranceSpec(lightDir, eyeDirection, norm, roughness, luma(F0)) * color;
        }
    }

    float specularPower = luma(specular);
    if(specularPower < 0.9) {
        specularPower = 0.;
    }

    fragData[0] = vec4((diffuse * (1. - metallic) + ambient + specular) * tex + emissive, 1.0f);
    fragData[1].r = luma(emissive) + specularPower / 5.;
}
