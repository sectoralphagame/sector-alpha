mat3 tbn(mat4 modelMatrix, mat3 normalMatrix, vec3 tangent, vec3 normal) {
    vec3 T = normalize(mat3(modelMatrix) * tangent);
    vec3 N = normalize(normalMatrix * normal);
    vec3 B = normalize(cross(N, T));

    return mat3(T, B, N);
}

#pragma glslify: export(tbn) 
