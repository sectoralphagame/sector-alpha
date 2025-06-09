mat3 getTBN(vec3 vNormal, vec3 vTangent) {
    vec3 tangent = vTangent - dot(vTangent, vNormal) * vNormal;
    vec3 bitangent = cross(vNormal, tangent);

    return mat3(tangent, bitangent, vNormal);
}

#pragma glslify: export(getTBN)