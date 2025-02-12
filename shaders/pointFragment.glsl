varying float vOpacity;
varying vec3 vColor;

void main() {
    // Create a circular point
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Apply color and opacity
    gl_FragColor = vec4(vColor, vOpacity);
}
