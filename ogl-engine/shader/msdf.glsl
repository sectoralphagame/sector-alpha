float msdf(sampler2D map, vec2 uv) {
    vec3 tex = texture(map, uv).rgb;

    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b));
    float d = fwidth(signedDist);

    return smoothstep(0.5 - d, 0.5 + d, signedDist);
}

#pragma glslify: export(msdf)