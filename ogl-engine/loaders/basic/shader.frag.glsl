#version 300 es
precision highp float;

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

out vec4 outColor;

vec3 getNormal() {
    vec3 pos_dx = dFdx(vMPos.xyz);
    vec3 pos_dy = dFdy(vMPos.xyz);
    vec2 tex_dx = dFdx(vUv);
    vec2 tex_dy = dFdy(vUv);

    vec3 t = normalize(pos_dx * tex_dy.t - pos_dy * tex_dx.t);
    vec3 b = normalize(-pos_dx * tex_dy.s + pos_dy * tex_dx.s);
    mat3 tbn = mat3(t, b, normalize(vNormal));

    vec3 n = texture(tNormal, vUv * uNormalUVScale).rgb * 2.0 - 1.0;
    n.xy *= uNormalScale;
    vec3 normal = normalize(tbn * n);

    // Get world normal from view normal
    return normalize((vec4(normal, 0.0) * viewMatrix).xyz);
}

void main() {
    vec3 tex = texture(tDiffuse, vUv).rgb;
    vec3 normal = getNormal();
    float shading = max(dot(normal, lightDirection) * 0.1, 0.0);

    outColor = vec4((tex * vLighting) + shading, 1.0);
}