#version 300 es
precision highp float;

in vec2 vUv;
in float vFragDepth;

out vec4 fragData[3];

uniform sampler2D tMap;
uniform vec3 uColor;
uniform float fEmissive;
uniform float uCameraScale;

void main() {
    vec4 tex = texture(tMap, vUv);
    if(tex.a < 0.1f) {
        discard;
    }

    fragData[0] = tex * vec4(uColor, 1.0f);
    fragData[1] = vec4(fragData[0].rgb, fEmissive);
    gl_FragDepth = log2(vFragDepth) / uCameraScale;
}