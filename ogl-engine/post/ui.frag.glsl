precision highp float;

uniform sampler2D tMap;
uniform sampler2D tUi;

varying vec2 vUv;

void main() {
    vec4 ui = texture2D(tUi, vUv);
    gl_FragColor = mix(texture2D(tMap, vUv), ui, ui.a);
}