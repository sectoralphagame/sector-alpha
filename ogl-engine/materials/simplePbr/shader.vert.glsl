#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;
in vec3 normal;

#ifdef instanced
in vec3 offset;  // Offset for instanced position
in float angle;  // Rotation angle for instanced rotation
#endif

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;  // Combines model and view matrix (but no instancing transforms)
uniform mat4 projectionMatrix; // Projection matrix
uniform mat3 normalMatrix;     // Normal matrix (inverse transpose of model matrix)
uniform vec3 vLightColor;
uniform vec3 vLightDirection;
uniform float uTime;

out vec2 vUv;
out vec3 vNormal;
out vec3 vMPos;
out vec3 vLighting;
out vec3 FragPos;
out float vFragDepth;

// Function to get a Y-axis rotation matrix for instanced rotation
mat4 getYRotationMatrix(float angle) {
    float c = cos(angle);
    float s = sin(angle);

    return mat4(c, 0.0f, s, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, -s, 0.0f, c, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f);
}

void main() {
    vec3 pos = position;

    #ifdef instanced
        // Apply instance-specific Y-axis rotation
    mat4 rotationMatrix = getYRotationMatrix(angle);
        // Rotate the position of the instance
    pos = (rotationMatrix * vec4(position, 1.0f)).xyz;
        // Apply instance-specific translation (offset)
    pos += offset * vec3(50);  // Instance-specific translation
    #endif

    // Now apply the global model-view matrix (which contains the view matrix, i.e., the camera)
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0f);

    // Store the transformed position for use in the fragment shader
    FragPos = mvPosition.xyz;

    // Pass UVs to the fragment shader
    vUv = uv;

    // Transform the normal using the normal matrix
    vNormal = normalize(normalMatrix * normal);
    vMPos = (modelMatrix * vec4(position, 1.0f)).xyz;

    // Lighting calculation
    highp vec3 ambientLight = vec3(0.1f);  // Ambient light
    highp vec3 directionalVector = normalize(vLightDirection);  // Light direction (in world space)

    // Compute diffuse lighting based on the transformed normal
    highp float directional = max(dot(vNormal, directionalVector), 0.0f);
    vLighting = ambientLight + (vLightColor * directional * 0.5f);

    // Final transformation to clip space (projection)
    gl_Position = projectionMatrix * mvPosition;
    float c = 0.001f;
    float far = 5000000.0f;
    // vFragDepth = log(c * gl_Position.z + 1.f) / log(c * far + 1.f) * gl_Position.w;
    vFragDepth = gl_Position.z / gl_Position.w;
}
