#version 300 es
precision highp float;

#pragma glslify: Light = require("./ogl-engine/shader/light");
#pragma glslify: blinnPhongSpec = require(glsl-specular-blinn-phong)
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
uniform float uShininess;
#endif

#ifdef USE_EMISSIVE
uniform sampler2D tEmissive;
#endif

#define EPSILON 0.001f

out vec4 fragData[2];

void main() {
    vec3 tex = pow(texture(tDiffuse, vUv).rgb, vec3(1.f / 2.2f));
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
    float shininess = mix(2., 32., texture(tRoughness, vUv).r);
    #else
    float shininess = uShininess * 256.f;
    #endif

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
            specular += blinnPhongSpec(lightDir, eyeDirection, norm, shininess) * color;
        }
    }

    float specularPower = luma(specular);
    if(specularPower < 0.9) {
        specularPower = 0.;
    }

    fragData[0] = vec4(mix((diffuse + ambient + specular) * (tex + EPSILON), specular, uMetallic) + emissive, 1.0f);
    fragData[1].r = luma(emissive) + specularPower / 5.;
}