vec3 normalMap(vec3 normalTexColor, vec3 vNormal, vec3 vTangent) {
    vec3 tangent = vTangent - dot(vTangent, vNormal) * vNormal;
    vec3 bitangent = cross(vNormal, tangent);
    mat3 tbn = mat3(normalize(tangent), normalize(bitangent), normalize(vNormal));

    return normalize(tbn * normalTexColor);
}

#pragma glslify: export(normalMap)