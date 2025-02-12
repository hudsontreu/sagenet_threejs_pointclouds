varying float vOpacity;

void main() {
    // Create a circular point
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Apply opacity
    gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity);
}
