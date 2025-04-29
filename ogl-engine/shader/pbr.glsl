#pragma glslify: cookTorranceSpec = require(glsl-specular-cook-torrance);
#pragma glslify: luma = require(glsl-luma);

vec4 pbr(vec3 albedo, vec3 norm, float metallic, float roughness, vec3 emissive, samplerCube tEnvMap, vec3 ambient, vec3 vTangent, vec3 vNormal, vec3 cameraPosition, vec3 worldPosition, Light[16] lights) {
    vec3 eyeDirection = normalize(cameraPosition - worldPosition);
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);

    vec3 F0 = vec3(0.04, 0.04, 0.04);
    F0 = mix(F0, albedo, metallic);

    for(int i = 0; i < lights.length(); i++) {
        if(lights[i].visible) {
            vec3 lightDir = vec3(0.0);
            float intensity = lights[i].intensity;
            if(lights[i].position.w == 0.0) {
                lightDir = normalize(-lights[i].position.xyz);
            } else {
                vec3 d = lights[i].position.xyz - worldPosition;
                lightDir = normalize(d);
                float dist = length(d);
                intensity /= 1.0 + dist + pow(dist, 2.0);
                if(intensity < 0.01) {
                    continue;
                }
            }
            float diff = max(dot(norm, lightDir), 0.0);
            vec3 color = lights[i].color * intensity;
            diffuse += diff * color;
            specular += cookTorranceSpec(lightDir, eyeDirection, norm, roughness, luma(F0)) * color;
        }
    }

    float specularPower = luma(specular);
    if(specularPower < 0.9) {
        specularPower = 0.;
    }

    vec3 reflectedDir = reflect(eyeDirection, norm);
    vec3 reflectionColor = texture(tEnvMap, -reflectedDir).rgb;

    return vec4((diffuse * (1. - metallic) + ambient + specular) * albedo + emissive + reflectionColor * metallic * roughness, 1.0);
}

#pragma glslify: export(pbr)