#version 300 es
precision highp float;

#pragma glslify: viewNormal = require("./ogl-engine/shader/viewNormal");
#pragma glslify: getSpecular = require("./ogl-engine/shader/specular");

in vec3 FragPos;
in vec2 vUv;
in vec3 vNormal;
in vec3 vLighting;
in vec3 vMPos;
in float vFragDepth;

uniform mat4 viewMatrix;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform float uNormalScale;
uniform float uNormalUVScale;
uniform vec3 vLightColor;
uniform vec3 vLightDirection;
uniform float fLightPower;

out vec4 fragData[2];

void main() {
    gl_FragDepth = vFragDepth;

    vec3 tex = texture(tDiffuse, vUv).rgb;
    vec3 norm = viewNormal(vMPos, vUv, vNormal, tNormal, uNormalUVScale, uNormalScale, viewMatrix);

    // Diffuse shading (Lambertian)
    float diff = max(dot(norm, vLightDirection), 0.0f);
    vec3 diffuse = diff * vLightColor;

    vec3 specular = getSpecular(vMPos, FragPos, vLightDirection, norm, vLightColor);

    float shading = max(dot(norm, vLightDirection) * fLightPower, 0.0f);

    fragData[0].rgb = (specular + diffuse) * tex * vLighting + shading;
    fragData[0].a = 1.0f;
    fragData[1] = vec4(0.f);
}