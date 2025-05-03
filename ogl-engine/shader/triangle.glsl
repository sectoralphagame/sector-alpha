float triangle(float x) {
    return abs(fract(x) * 2.0 - 1.0);
}

#pragma glslify: export(triangle)