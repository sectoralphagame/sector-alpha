#version 300 es
precision mediump float;

#pragma glslify: cnoise4 = require(glsl-noise/classic/4d)
#pragma glslify: luma = require(glsl-luma)
#pragma glslify: rim = require("./ogl-engine/shader/rim")

in vec2 vUv;
in vec3 vPosition;
in vec3 vWorldNormal;
in vec3 vViewDirection;

out vec4 fragData[2];

uniform float uTime;
uniform sampler2D tSmoke;
uniform vec3 cameraPosition;
uniform vec3 vColor;

#define black vec3(0., 0., 0.)
#define white vec3(1., 1., 1.)

#define noiseScale 200.0
#define noiseScaleZ 0.3

#define rimPower 0.4

void main() {
    vec3 scaledPosition = vec3(vPosition.x * noiseScaleZ, vPosition.y, vPosition.z * noiseScaleZ);
    float noise = clamp(cnoise4(vec4(scaledPosition * noiseScale, uTime * 1.1f)) * 0.5f + 0.1f, 0.0f, 1.0f);
    vec3 smokeColor = texture(tSmoke, vec2(fract(vUv.x + uTime * 0.05f), fract(vUv.y + uTime * 0.02f)) / 2.f).rgb;

    vec3 color = clamp(vColor * smokeColor * 2.f * noise, 0.0f, 1.0f);

    vec3 rimLighting = rim(rimPower, vViewDirection, vWorldNormal, mix(white, vColor, 0.9f));

    fragData[0] = vec4(color + rimLighting, 1.0f);
    fragData[1] = vec4(vec3(noise) + rimLighting, 0.4f);
}