float shininess = 32.0;

vec3 specular(
    vec3 vMPos, 
    vec3 FragPos,
    vec3 lightDirection, 
    vec3 viewNormal,
    vec3 lightColor
) {
    vec3 viewDir = normalize(vMPos - FragPos);

    vec3 reflectDir = reflect(-lightDirection, viewNormal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);

    return spec * lightColor;
}

#pragma glslify: export(specular) 