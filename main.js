import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import pointVertexShader from './shaders/pointVertex.glsl';
import pointFragmentShader from './shaders/pointFragment.glsl';

// Create scene
const scene = new THREE.Scene();
const geometryScene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Background toggle state
let showBackground = true;

// Add keyboard controls
document.addEventListener('keydown', (event) => {
    if (event.key === 'b' || event.key === 'B') {
        showBackground = !showBackground;
    }
});

// Create render targets
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

// Load SVG and create point cloud
const loader = new SVGLoader();
loader.load('./sagenetLogo.svg', function(data) {
    const paths = data.paths;
    const points = [];
    const delays = [];
    const colors = [];
    
    // Extract points from SVG paths
    paths.forEach(path => {
        const divisions = 200; // Increased from 100 for higher density
        
        for (let i = 0; i < path.subPaths.length; i++) {
            const subPath = path.subPaths[i];
            const points2D = subPath.getPoints(divisions);
            
            // Convert 2D points to 3D and add some randomness in Z
            points2D.forEach(point => {
                const randomOffset = Math.random() * Math.PI * 2;
                points.push(
                    point.x * 0.015 + Math.sin(randomOffset) * 0.05, // Reduced random variation
                    -point.y * 0.015 + Math.cos(randomOffset) * 0.05, // Reduced random variation
                    (Math.random() - 0.5) * 0.3 // Reduced Z depth for clearer formation
                );
                // Tighter delay range for more coherent formation
                delays.push(Math.random() * 1.2);
                
                // Add random color from our palette
                const colorChoices = [
                    new THREE.Color(0x1a365d),  // dark blue
                    new THREE.Color(0x7bb2e3),  // light blue
                    new THREE.Color(0xff7f50),  // orange
                    new THREE.Color(0xffffff)   // white
                ];
                const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
                colors.push(color.r, color.g, color.b);
            });
        }
    });
    
    // Create point cloud geometry
    const geometry = new THREE.BufferGeometry();
    
    // Add positions
    const positions = new Float32Array(points);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Add target positions (same as original positions)
    geometry.setAttribute('targetPosition', new THREE.BufferAttribute(positions.slice(), 3));
    
    // Add delays
    geometry.setAttribute('delay', new THREE.Float32BufferAttribute(delays, 1));
    
    // Add colors
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Create point cloud material with custom shaders
    const pointsMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            animationProgress: { value: 0 }
        },
        vertexShader: pointVertexShader,
        fragmentShader: pointFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    
    // Create point cloud
    const pointCloud = new THREE.Points(geometry, pointsMaterial);
    
    // Center the point cloud
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    pointCloud.position.sub(center);
    
    // Add to scene
    geometryScene.add(pointCloud);
    
    // Store reference to update in animation loop
    window.logoPointCloud = pointCloud;
}, 
// onProgress callback
undefined,
// onError callback
function(error) {
    console.error('Error loading SVG:', error);
});

// Load background texture
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('./sisters.png');

// Create background plane
const planeGeometry = new THREE.PlaneGeometry(16, 9);
const planeMaterial = new THREE.ShaderMaterial({ 
    uniforms: {
        tDiffuse: { value: backgroundTexture },
        time: { value: 0 }
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide
});
const backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
backgroundPlane.position.z = -2;
scene.add(backgroundPlane);

// Final composition plane
const finalPlaneGeometry = new THREE.PlaneGeometry(2, 2);
const finalPlaneMaterial = new THREE.ShaderMaterial({
    uniforms: {
        tBackground: { value: null },
        tGeometry: { value: null }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tBackground;
        uniform sampler2D tGeometry;
        varying vec2 vUv;

        vec3 screenBlend(vec3 a, vec3 b) {
            return 1.0 - (1.0 - a) * (1.0 - b);
        }

        void main() {
            vec4 background = texture2D(tBackground, vUv);
            vec4 geometry = texture2D(tGeometry, vUv);
            
            // Screen blend
            vec3 blended = screenBlend(background.rgb, geometry.rgb);
            
            gl_FragColor = vec4(blended, 1.0);
        }
    `
});
const finalPlane = new THREE.Mesh(finalPlaneGeometry, finalPlaneMaterial);
scene.add(finalPlane);

// Adjust plane scale to cover viewport
const adjustPlaneScale = () => {
    const windowAspect = window.innerWidth / window.innerHeight;
    const imageAspect = 16/9;
    
    if (windowAspect > imageAspect) {
        backgroundPlane.scale.set(windowAspect/imageAspect * 1.5, 1.5, 1);
    } else {
        backgroundPlane.scale.set(1.5, 1.5 * (imageAspect/windowAspect), 1);
    }
};
adjustPlaneScale();

// Array of different geometries
const geometries = [
    new THREE.BoxGeometry(3, 3, 3),
    // new THREE.SphereGeometry(4, 40, 40),
    // new THREE.TorusGeometry(1.4, 0.6, 16, 100),
    new THREE.TetrahedronGeometry(2),
    new THREE.OctahedronGeometry(2),
    new THREE.IcosahedronGeometry(2)
];

// Create initial material with random color
const material = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00,
    wireframe: true,
    transparent: true,
    opacity: 0.9
});

// Create mesh with initial geometry
let currentGeometryIndex = 0;
const mesh = new THREE.Mesh(geometries[currentGeometryIndex], material);
geometryScene.add(mesh);

// Create a second render target for the geometry
const geometryRenderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight
);

// Colors for geometry cycling
const geometryColors = [
    new THREE.Color(0xED8C00),  // orange
    new THREE.Color(0x006CA9),  // blue
    new THREE.Color(0x003968)   // dark blue
];
let currentColorIndex = 0;

// Function to get next color in cycle
const getNextColor = () => {
    const color = geometryColors[currentColorIndex];
    currentColorIndex = (currentColorIndex + 1) % geometryColors.length;
    return color;
};

// Variables for timing
let lastColorChange = 0;
let lastShapeChange = 0;
const colorChangeInterval = 100;
const shapeChangeInterval = 500;

// Animation loop
function animate(currentTime) {
    requestAnimationFrame(animate);

    // Convert currentTime to milliseconds if it's not already
    const time = currentTime || 0;

    // Update shader time uniform
    planeMaterial.uniforms.time.value = time * 0.001;
    
    // Update point cloud animation if it exists
    if (window.logoPointCloud) {
        window.logoPointCloud.material.uniforms.time.value = time * 0.001;
    }

    // Change color
    if (time - lastColorChange > colorChangeInterval) {
        material.color = getNextColor();
        lastColorChange = time;
    }

    // Change shape
    if (time - lastShapeChange > shapeChangeInterval) {
        currentGeometryIndex = (currentGeometryIndex + 1) % geometries.length;
        mesh.geometry.dispose(); // Clean up old geometry
        mesh.geometry = geometries[currentGeometryIndex];
        lastShapeChange = time;
    }

    // Rotate the mesh
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;

    // Render background scene to first render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    // Render geometry scene to second render target
    renderer.setRenderTarget(geometryRenderTarget);
    renderer.render(geometryScene, camera);

    // Update uniforms for final composition
    finalPlaneMaterial.uniforms.tBackground.value = showBackground ? renderTarget.texture : null;
    finalPlaneMaterial.uniforms.tGeometry.value = geometryRenderTarget.texture;

    // Render final composition to screen
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    renderTarget.setSize(width, height);
    geometryRenderTarget.setSize(width, height);
    
    adjustPlaneScale();
});

// Start the animation loop
animate();
