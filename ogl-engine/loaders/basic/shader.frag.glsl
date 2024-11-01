#version 300 es
precision highp float;

#pragma glslify: viewNormal = require("./ogl-engine/shader/viewNormal");
#pragma glslify: getSpecular = require("./ogl-engine/shader/specular");

in vec3 FragPos;
in vec2 vUv;
in vec3 vNormal;
in vec3 vLighting;
in vec3 vMPos;

uniform mat4 viewMatrix;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform float uNormalScale;
uniform float uNormalUVScale;
uniform vec3 lightDirection;

out vec4 fragData[2];

vec3 lightColor = vec3(1);
float lightPower = 0.05f;

void main() {
    vec3 tex = texture(tDiffuse, vUv).rgb;
    vec3 norm = viewNormal(vMPos, vUv, vNormal, tNormal, uNormalUVScale, uNormalScale, viewMatrix);

    // Diffuse shading (Lambertian)
    float diff = max(dot(norm, lightDirection), 0.0f);
    vec3 diffuse = diff * lightColor;

    vec3 specular = getSpecular(vMPos, FragPos, lightDirection, norm, lightColor);

    float shading = max(dot(norm, lightDirection) * lightPower, 0.0f);

    fragData[0].rgb = (specular + diffuse) * tex * vLighting + shading;
    fragData[0].a = 1.0f;
    fragData[1] = vec4(0.f);
}