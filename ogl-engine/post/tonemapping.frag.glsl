precision highp float;

#pragma glslify: aces = require("./ogl-engine/shader/aces");

uniform sampler2D tMap;
uniform float uGamma;
uniform float uSaturation;
uniform float uContrast;
uniform float uAces;

varying vec2 vUv;

void main() {
    vec4 color = texture2D(tMap, vUv);
    if(uAces > 0.5) {
        color.rgb = aces(color.rgb);
    }

    color = vec4(color.rgb, 1.);
    color = vec4(pow(color.rgb, vec3(1.0 / uGamma)), color.a);
    color = (color - 0.5) * uContrast + 0.5;
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    gl_FragColor = mix(vec4(luma, luma, luma, 1.), color, uSaturation);
}