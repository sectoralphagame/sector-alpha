precision highp float;

uniform sampler2D tMap;
uniform sampler2D tUi;

varying vec2 vUv;

void main() {
    vec4 ui = texture2D(tUi, vUv);
    gl_FragColor = mix(clamp(texture2D(tMap, vUv), 0., 1.), ui, ui.a);
}