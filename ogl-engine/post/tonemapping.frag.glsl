precision highp float;

uniform sampler2D tMap;

varying vec2 vUv;

vec3 aces(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    vec4 color = texture2D(tMap, vUv);

    gl_FragColor = vec4(aces(color.rgb), 1.);
}