precision highp float;

#pragma glslify: blur13 = require(glsl-fast-gaussian-blur)

uniform sampler2D tMap;
uniform vec2 uDirection;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
    gl_FragColor = blur13(tMap, vUv, uResolution, uDirection);
}