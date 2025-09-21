#version 300 es
precision highp float;

#pragma glslify: Light = require("./ogl-engine/shader/light");

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldNormal;
in vec3 worldPosition;
in float vFragDepth;

out vec4 fragData[2];

uniform vec3 cameraPosition;
uniform float uCameraScale;
uniform vec3 uColor;
uniform float uX;
uniform float uY;
uniform Light lights[16];

#define fEmissive 1.0f

void main() {
    float viewAngle = dot(normalize(vWorldNormal), normalize(cameraPosition - worldPosition));
    float density = uY - exp(1.0f - viewAngle) * uX;
    vec3 norm = normalize(vNormal);

    float intensity = 0.0f;
    for(int i = 0; i < lights.length(); i++) {
        if(lights[i].visible && lights[i].position.w == 0.0) {
            vec3 lightDir = vec3(0.0);
            lightDir = normalize(-lights[i].position.xyz);
            float diff = max(dot(norm, lightDir), 0.0);
            intensity += lights[i].intensity * diff;
        }
    }
    intensity = clamp(intensity, 0.1f, 10.0f);

    fragData[0] = vec4(uColor * density, density * intensity);
    fragData[1] = fragData[0] * fEmissive;
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}