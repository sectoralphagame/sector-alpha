precision highp float;

#pragma glslify: blur9 = require(glsl-fast-gaussian-blur)

uniform sampler2D tMap;
uniform vec2 uDirection;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
    gl_FragColor = blur9(tMap, vUv, uResolution, uDirection);
}