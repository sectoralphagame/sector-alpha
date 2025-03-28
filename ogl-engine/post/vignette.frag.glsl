precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uStrength;
uniform float uSmoothness;
uniform float uOffset;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    vec2 centered = uv * 2.0 - 1.0;
    float dist = length(centered) + uOffset;

    float vignette = smoothstep(1.0, uSmoothness, dist);

    vignette = mix(1.0, vignette, uStrength);

    vec4 color = texture2D(uTexture, uv);
    gl_FragColor = color * vignette;
}