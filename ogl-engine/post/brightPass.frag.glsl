precision highp float;

uniform sampler2D tMap;
uniform sampler2D tEmissive;
uniform float uThreshold;
varying vec2 vUv;

void main() {
    vec4 tex = texture2D(tMap, vUv);
    vec4 emissive = texture2D(tEmissive, vUv);
    float factor = step(uThreshold, length(tex.rgb) / 1.73205);
    if(length(emissive) > 0.) {
        factor = length(emissive);
    }
    gl_FragColor = tex * factor;
}