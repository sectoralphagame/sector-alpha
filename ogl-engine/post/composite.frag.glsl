precision highp float;

uniform sampler2D tMap;
uniform sampler2D tBloom;
uniform float uBloomStrength;

varying vec2 vUv;

void main() {
    vec4 blurred = texture2D(tBloom, vUv);
    gl_FragColor = texture2D(tMap, vUv) + blurred * uBloomStrength;
}