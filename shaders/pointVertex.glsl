uniform float time;
uniform float animationProgress;

attribute vec3 targetPosition;
attribute float delay;

varying float vOpacity;

void main() {
    // Calculate the animation phase (0 to 1)
    float progress = mod(time * 0.5 + delay, 3.0) / 3.0;
    
    // Starting position (left side)
    vec3 startPos = vec3(-10.0, position.y, position.z);
    // End position (right side)
    vec3 endPos = vec3(10.0, position.y, position.z);
    
    // Position for logo formation
    vec3 logoPos = targetPosition;
    
    vec3 currentPos;
    float opacity;
    
    // Flowing in (0.0 to 0.3)
    if (progress < 0.3) {
        float p = progress / 0.3;
        currentPos = mix(startPos, logoPos, smoothstep(0.0, 1.0, p));
        opacity = smoothstep(0.0, 0.2, p);
    }
    // Hold logo shape (0.3 to 0.7)
    else if (progress < 0.7) {
        currentPos = logoPos;
        opacity = 1.0;
    }
    // Flowing out (0.7 to 1.0)
    else {
        float p = (progress - 0.7) / 0.3;
        currentPos = mix(logoPos, endPos, smoothstep(0.0, 1.0, p));
        opacity = smoothstep(1.0, 0.8, p);
    }
    
    vOpacity = opacity;
    
    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 2.0;
}
