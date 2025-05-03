precision highp float;

#pragma glslify: brightPass = require(./ogl-engine/shader/brightPass);

uniform sampler2D tMap;
uniform sampler2D tEmissive;
uniform float uThreshold;
varying vec2 vUv;

void main() {
    vec4 tex = texture2D(tMap, vUv);
    vec4 emissive = texture2D(tEmissive, vUv) + tex * brightPass(tex, uThreshold);
    if(emissive.a <= 0.) {
        discard;
    }
    gl_FragColor = emissive;
}