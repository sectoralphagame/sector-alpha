precision highp float;

#pragma glslify: aces = require("glsl-tone-map/aces");

uniform sampler2D tMap;
uniform float uGamma;
uniform float uSaturation;
uniform float uContrast;
uniform float uExposure;
uniform float uMap;

varying vec2 vUv;

void main() {
    vec4 color = texture2D(tMap, vUv);
    color.rgb *= uExposure;

    if(uMap > 0.5) {
        color.rgb = aces(color.rgb);
    }

    color.rgb = pow(color.rgb, vec3(1.0 / uGamma));
    color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    gl_FragColor = mix(vec4(luma, luma, luma, 1.), color, uSaturation);
}