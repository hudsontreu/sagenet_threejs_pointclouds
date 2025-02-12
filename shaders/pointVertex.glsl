uniform float time;
uniform float animationProgress;

attribute vec3 targetPosition;
attribute float delay;

varying float vOpacity;

// Noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Wave function with reduced intensity during logo formation
vec3 applyWave(vec3 pos, float progress, float delay, float intensity) {
    float wave = sin(progress * 6.28318 + delay * 10.0) * 2.0 * intensity;
    float wave2 = cos(progress * 4.28318 + delay * 5.0) * 1.5 * intensity;
    
    return vec3(
        pos.x,
        pos.y + wave * (1.0 - abs(progress - 0.5) * 2.0),
        pos.z + wave2 * (1.0 - abs(progress - 0.5) * 2.0)
    );
}

void main() {
    // Calculate the animation phase (0 to 1)
    float progress = mod(time * 0.5 + delay, 3.0) / 3.0;
    
    // Create dynamic start and end positions
    float noise = random(vec2(delay, time * 0.1)) * 0.5; // Reduced noise
    vec3 startPos = vec3(
        -15.0 + noise,
        position.y * 1.2 + sin(delay * 10.0) * 2.0,
        position.z + cos(delay * 8.0) * 1.5
    );
    
    vec3 endPos = vec3(
        15.0 + noise,
        position.y * 1.2 + sin(delay * 10.0 + 3.14) * 2.0,
        position.z + cos(delay * 8.0 + 3.14) * 1.5
    );
    
    // Position for logo formation
    vec3 logoPos = targetPosition;
    
    vec3 currentPos;
    float opacity;
    
    // Flowing in (0.0 to 0.3)
    if (progress < 0.3) {
        float p = progress / 0.3;
        p = smoothstep(0.0, 1.0, p);
        currentPos = mix(startPos, logoPos, p);
        currentPos = applyWave(currentPos, p, delay, 1.0 - p); // Reduce wave as we approach logo
        opacity = smoothstep(0.0, 0.2, p);
    }
    // Hold logo shape (0.3 to 0.7)
    else if (progress < 0.7) {
        currentPos = logoPos;
        // Very subtle movement during logo formation
        float wobble = sin(time * 2.0 + delay * 10.0) * 0.02;
        currentPos += vec3(wobble, wobble, wobble);
        opacity = 1.0;
    }
    // Flowing out (0.7 to 1.0)
    else {
        float p = (progress - 0.7) / 0.3;
        p = smoothstep(0.0, 1.0, p);
        currentPos = mix(logoPos, endPos, p);
        currentPos = applyWave(currentPos, p, delay, p); // Increase wave as we leave logo
        opacity = smoothstep(1.0, 0.8, p);
    }
    
    vOpacity = opacity;
    
    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Larger points during logo formation
    float logoPhase = 1.0 - abs(progress - 0.5) * 2.0;
    gl_PointSize = mix(2.0, 4.0, logoPhase);
}
