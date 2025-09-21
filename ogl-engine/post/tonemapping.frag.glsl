precision highp float;

#pragma glslify: aces = require("glsl-tone-map/aces");

uniform sampler2D tMap;
uniform float uSaturation;
uniform float uContrast;
uniform float uExposure;
uniform float uMap;
uniform int uTime;

varying vec2 vUv;

vec3 linearToSRGB(vec3 x) {
    vec3 lo = 12.92 * x;
    vec3 hi = 1.055 * pow(max(x, 0.0), vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(0.0031308, x));
}

// tiny hash + TPDF
float h(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
// Output range is -1...1
float tpdf(vec2 p) {
    return h(p * 0.067) + h(p * 0.139) - 1.0;
}

const float pivot = 0.18;

void main() {
    vec3 color = texture2D(tMap, vUv).rgb;
    color *= uExposure;

    if(uMap > 0.5) {
        color = aces(color);
    }

    color = (color - pivot) * uContrast + pivot;

    vec3 srgb = linearToSRGB(clamp(color, 0.0, 1.0));

    float luma = dot(srgb, vec3(0.299, 0.587, 0.114));
    srgb = mix(vec3(luma), srgb, uSaturation);

    vec2 p = gl_FragCoord.xy + float(uTime);
    vec3 n = vec3(tpdf(p), tpdf(p + 37.0), tpdf(p + 91.0)) / 255.0;
    srgb += n;

    gl_FragColor = vec4(clamp(srgb, 0.0, 1.0), 1.0);
}
