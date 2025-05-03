#pragma glslify: luma = require(glsl-luma);

float brightPass(vec4 color, float threshold) {
    return step(threshold, luma(color));
}

#pragma glslify: export(brightPass) 