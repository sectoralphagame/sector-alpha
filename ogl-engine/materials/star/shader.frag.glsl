#version 300 es
precision highp float;

#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: snoise4 = require(glsl-noise/simplex/4d)
#pragma glslify: pnoise2 = require(glsl-noise/periodic/2d)
#pragma glslify: luma = require(glsl-luma)
#pragma glslify: rim = require("./ogl-engine/shader/rim")

in vec2 vUv;
in vec3 vPosition;
in vec3 vWorldNormal;
in vec3 vViewDirection;
in float fCameraDistance;

out vec4 fragData[2];

uniform float uTime;
uniform sampler2D tSmoke;
uniform vec3 cameraPosition;
uniform vec3 vColor;
uniform float uNoise;
uniform float uNoisePower;

#define black vec3(0., 0., 0.)
#define white vec3(1., 1., 1.)

#define noiseScaleZ 1.

#define rimPower 0.4

void main() {
    vec3 scaledPosition = vec3(vPosition.x * noiseScaleZ, vPosition.y, vPosition.z * noiseScaleZ);
    float baseNoise = snoise4(vec4(scaledPosition * uNoise, uTime * 0.06f));
    float noise = clamp(snoise2(vec2(baseNoise * uNoisePower, uTime * 0.001f)), 0.0f, 0.3f);
    vec3 smokeColor = texture(tSmoke, fract(uTime * vec2(0.02f, 0.05f) + vUv) / 2.f).rgb;

    vec3 color = clamp(vColor * (smokeColor - noise), 0.0f, 1.0f);

    vec3 rimLighting = rim(rimPower, vViewDirection, vWorldNormal, mix(white, vColor, 0.9f));

    fragData[0] = vec4(color + rimLighting, 1.0f);
    fragData[1] = vec4(color, 0.4f) * 2.f;
}