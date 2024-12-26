#version 300 es
precision highp float;

#pragma glslify: Light = require("./ogl-engine/shader/light");
#pragma glslify: blinnPhongSpec = require(glsl-specular-blinn-phong)

in vec3 worldPosition;
in vec2 vUv;
in vec3 vTangent;
in vec3 vNormal;

uniform mat4 viewMatrix;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tRoughness;
uniform vec3 cameraPosition;
uniform vec3 ambient;
uniform Light lights[16];

out vec4 fragData[2];


void main() {
    vec3 tex = texture(tDiffuse, vUv).rgb;
    vec3 normalMap = texture(tNormal, vUv).rgb * 2.f - 1.f;
    float shininess = length(texture(tRoughness, vUv))*256.;

    vec3 tangent = vTangent - dot(vTangent, vNormal) * vNormal;
    vec3 bitangent = cross(vNormal, tangent);
    mat3 tbn = mat3(normalize(tangent), normalize(bitangent), normalize(vNormal));

    vec3 eyeDirection = normalize(cameraPosition - worldPosition);
    vec3 diffuse = vec3(0.0f);
    vec3 specular = vec3(0.0f);

    vec3 norm = normalize(tbn * normalMap);

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

    fragData[0] = vec4((diffuse + ambient + specular) * tex, 1.0f);
}