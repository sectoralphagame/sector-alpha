/**
 * @param size The size of the spritesheet (number of sprites in one row)
 */
vec2 spritesheetUv(vec2 uv, float index, float size) {
    float ii = mod(index, size * size);
    float x = floor(ii / size);
    float y = ii - x * size;

    return vec2(uv.x + x, uv.y + y) / size;
}

#pragma glslify: export(spritesheetUv)