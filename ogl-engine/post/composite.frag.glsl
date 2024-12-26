precision highp float;

uniform sampler2D tMap;
uniform sampler2D tBloom;
uniform vec2 uResolution;
uniform float uBloomStrength;

varying vec2 vUv;

void main() {
    gl_FragColor = texture2D(tMap, vUv) + texture2D(tBloom, vUv) * uBloomStrength;
}