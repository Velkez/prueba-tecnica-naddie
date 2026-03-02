/**
 * NADDIE - 3D Viewer Module
 * Simplified version - Three.js scene management
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Viewer {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.config = config;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.model = null;
        this.lights = {};
        this.controls = null;
        
        this.gltfLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        
        // Default values
        this.defaultRotation = config.scene?.rotation || { x: -0.7, y: 2, z: -0.4 };
        this.defaultBackground = config.scene?.background || 'default';
        this.defaultLighting = config.scene?.lighting || { intensity: 1, color: '#ffffff', preset: 'warm' };
        
        // Original textures storage for GLB models
        this.originalTextures = null;
        this.originalMaterials = null;
        
        this.init();
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        this.createBackground();
        this.loadModel();
        this.animate();
    }

    createScene() {
        this.scene = new THREE.Scene();
    }

    createCamera() {
        const camConfig = this.config.camera || {};
        this.camera = new THREE.PerspectiveCamera(
            camConfig.fov || 50,
            window.innerWidth / window.innerHeight,
            camConfig.near || 0.1,
            camConfig.far || 1000
        );
        
        const pos = camConfig.position || { x: 0, y: 10, z: 3 };
        this.camera.position.set(pos.x, pos.y, pos.z);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 10;
        this.controls.enablePan = false;
        this.controls.rotateSpeed = 0.8;
        this.controls.zoomSpeed = 1.0;
        
        // Set initial target to origin
        this.controls.target.set(0, 0, 0);
        
        // Important: update controls initially
        this.controls.update();
    }

    createLights() {
        // Lighting presets
        const presets = {
            warm: '#ff9500',
            cool: '#5ac8fa',
            neutral: '#ffffff',
            dramatic: '#3a3a3c'
        };
        
        const preset = this.defaultLighting.preset || 'warm';
        const presetColor = presets[preset] || presets.warm;
        
        // Ambient light
        const ambient = new THREE.AmbientLight('#ffffff', 0.5);
        this.scene.add(ambient);
        this.lights.ambient = ambient;
        
        // Main directional light
        const mainLight = new THREE.DirectionalLight(presetColor, 1.2);
        mainLight.position.set(3, 5, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);
        this.lights.main = mainLight;
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(presetColor, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
        this.lights.fill = fillLight;
        
        // Back light
        const backLight = new THREE.DirectionalLight(presetColor, 0.2);
        backLight.position.set(0, -5, -5);
        this.scene.add(backLight);
        this.lights.back = backLight;
    }

    createBackground() {
        const bg = this.defaultBackground;
        
        const backgrounds = {
            default: '#f5f5f7',
            dark: '#1d1d1f',
            blue: '#007aff'
        };
        
        const color = backgrounds[bg] || backgrounds.default;
        this.scene.background = new THREE.Color(color);
    }

    loadModel() {
        const modelConfig = this.config.model || {};
        
        // Check if we should use default geometry instead of loading a model
        if (modelConfig.useGeometry) {
            const geometryType = modelConfig.geometry || 'torus';
            this.setGeometry(geometryType);
            return;
        }
        
        const path = modelConfig.path || '/assets/models/';
        const filename = modelConfig.filename || 'master_chief_helmet.glb';
        
        this.gltfLoader.load(
            path + filename,
            (gltf) => {
                this.model = gltf.scene;
                
                // Setup shadows
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Convert to MeshStandardMaterial for PBR
                        if (child.material) {
                            const oldMat = child.material;
                            child.material = new THREE.MeshStandardMaterial();
                            
                            if (oldMat.color) child.material.color = oldMat.color.clone();
                            if (oldMat.map) child.material.map = oldMat.map;
                            if (oldMat.normalMap) child.material.normalMap = oldMat.normalMap;
                            if (oldMat.roughness !== undefined) child.material.roughness = oldMat.roughness;
                            if (oldMat.metalness !== undefined) child.material.metalness = oldMat.metalness;
                            
                            // Fix emissive to prevent light inside object
                            child.material.emissive = new THREE.Color(0x000000);
                            child.material.emissiveIntensity = 0;
                            child.material.side = THREE.FrontSide;
                            
                            oldMat.dispose();
                        }
                    }
                });
                
                // Apply scale
                const scale = modelConfig.scale || 0.018;
                this.model.scale.setScalar(scale);
                
                // Center model using a wrapper group approach
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                // Create a wrapper group for the model
                const modelGroup = new THREE.Group();
                modelGroup.add(this.model);
                
                // Center the model within the group
                this.model.position.x = -center.x;
                this.model.position.y = -center.y;
                this.model.position.z = -center.z;
                
                // Add group to scene instead of model directly
                this.scene.add(modelGroup);
                this.modelGroup = modelGroup;
                
                // Update controls target to origin
                this.controls.target.set(0, 0, 0);
                this.controls.update();
                
                // Adjust camera distance based on model size
                const maxDim = Math.max(size.x, size.y, size.z);
                this.camera.position.set(0, maxDim * 0.3, maxDim * 2.5);
                this.camera.lookAt(0, 0, 0);
                
                // Apply initial rotation
                this.model.rotation.set(
                    this.defaultRotation.x,
                    this.defaultRotation.y,
                    this.defaultRotation.z
                );
                
                this.mesh = this.model;
                
                // Save original textures
                this.saveOriginalTextures();
            },
            undefined,
            (error) => {
                console.warn('Failed to load model, using fallback:', error.message);
                this.createFallbackGeometry();
            }
        );
    }

    createFallbackGeometry() {
        const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
        const material = new THREE.MeshStandardMaterial({ 
            color: '#007bff',
            roughness: 0.5,
            metalness: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.rotation.set(
            this.defaultRotation.x,
            this.defaultRotation.y,
            this.defaultRotation.z
        );
        
        this.scene.add(this.mesh);
    }

    saveOriginalTextures() {
        if (!this.model) return;
        
        this.originalMaterials = [];
        
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                this.originalMaterials.push(child.material.clone());
            }
        });
    }

    restoreOriginalTextures() {
        if (!this.model || !this.originalMaterials) return;
        
        let index = 0;
        this.model.traverse((child) => {
            if (child.isMesh && this.originalMaterials[index]) {
                child.material = this.originalMaterials[index].clone();
                index++;
            }
        });
    }

    // Public methods for UI controls
    
    setTexture(type, color = '#007bff', metalness = 0.8, roughness = 0.5) {
        if (!this.mesh) return;
        
        if (type === 'original') {
            this.applyNormalMaterial();
        } else if (type === 'solid') {
            this.applySolidMaterial(color, roughness);
        } else if (type === 'metal') {
            this.applyMetalMaterial(color, metalness);
        }
    }
    
    applyNormalMaterial() {
        if (!this.mesh) return;
        
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshNormalMaterial({
                    wireframe: false
                });
            }
        });
    }

    applySolidMaterial(color, roughness) {
        if (!this.mesh) return;
        
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: roughness,
                    metalness: 0.1
                });
            }
        });
    }

    applyMetalMaterial(color, metalness) {
        if (!this.mesh) return;
        
        const metalColors = {
            copper: '#b87333',
            silver: '#c0c0c0',
            gold: '#ffd700'
        };
        
        const actualColor = metalColors[color] || color;
        
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: actualColor,
                    roughness: 0.2,
                    metalness: metalness
                });
            }
        });
    }

    setLighting(preset) {
        const presets = {
            warm: '#ff9500',
            cool: '#5ac8fa',
            neutral: '#ffffff',
            dramatic: '#3a3a3c'
        };
        
        const color = presets[preset] || presets.warm;
        
        // Update directional lights
        if (this.lights.main) this.lights.main.color.set(color);
        if (this.lights.fill) this.lights.fill.color.set(color);
        if (this.lights.back) this.lights.back.color.set(color);
    }

    setLightingIntensity(intensity) {
        if (this.lights.main) this.lights.main.intensity = intensity;
    }

    setLightingColor(color) {
        if (this.lights.main) this.lights.main.color.set(color);
    }

    setLightingPosition(x, y, z) {
        if (this.lights.main) {
            this.lights.main.position.set(x, y, z);
        }
    }

    setLightProperty(type, property, value) {
        const light = this.lights[type];
        if (!light) return;
        
        if (property === 'color') {
            light.color.set(value);
        } else if (property === 'intensity') {
            light.intensity = value;
        } else if (property === 'position' && light.position) {
            light.position.set(value.x, value.y, value.z);
        }
    }

    getLightSettings(type) {
        const light = this.lights[type];
        if (!light) {
            return { intensity: 0.5, color: '#ffffff', position: { x: 0, y: 0, z: 0 } };
        }
        
        return {
            intensity: light.intensity,
            color: '#' + light.color.getHexString(),
            position: light.position ? { x: light.position.x, y: light.position.y, z: light.position.z } : { x: 0, y: 0, z: 0 }
        };
    }

    setBackground(bg) {
        const backgrounds = {
            default: '#f5f5f7',
            dark: '#1d1d1f',
            blue: '#007aff',
            gradient: null
        };
        
        if (bg === 'gradient') {
            // Create gradient background
            const canvas = document.createElement('canvas');
            canvas.width = 2;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 512);
            gradient.addColorStop(0, '#ff9a9e');
            gradient.addColorStop(0.5, '#fecfef');
            gradient.addColorStop(1, '#fecfef');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 2, 512);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
        } else {
            const color = backgrounds[bg] || backgrounds.default;
            this.scene.background = new THREE.Color(color);
        }
    }

    setRoughness(value) {
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.roughness = value;
            }
        });
    }

    setMetalness(value) {
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.metalness = value;
            }
        });
    }

    resetRotation() {
        if (!this.model) return;
        
        // Reset controls target to center
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
        
        // Use modelGroup if available, otherwise use model
        const target = this.modelGroup || this.model;
        
        // Animate to default rotation
        const startRot = {
            x: target.rotation.x,
            y: target.rotation.y,
            z: target.rotation.z
        };
        
        const duration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            
            this.model.rotation.x = startRot.x + (this.defaultRotation.x - startRot.x) * eased;
            this.model.rotation.y = startRot.y + (this.defaultRotation.y - startRot.y) * eased;
            this.model.rotation.z = startRot.z + (this.defaultRotation.z - startRot.z) * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    resetLighting() {
        this.setLighting(this.defaultLighting.preset || 'warm');
        this.setLightingIntensity(1);
        this.setLightingColor('#ffffff');
        // Reset position to default
        this.setLightingPosition(3, 5, 5);
    }

    resetAll() {
        this.resetRotation();
        this.resetLighting();
        this.setBackground(this.defaultBackground);
        this.setTexture('original');
    }

    loadModelFromFile(file, onComplete, onError) {
        const validExtensions = ['.glb', '.gltf'];
        const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        
        if (!validExtensions.includes(extension)) {
            if (onError) onError(new Error('Tipo de archivo no válido'));
            return false;
        }
        
        const url = URL.createObjectURL(file);
        
        this.gltfLoader.load(
            url,
            (gltf) => {
                URL.revokeObjectURL(url);
                
                // Remove old model
                if (this.model) {
                    this.scene.remove(this.model);
                }
                
                this.model = gltf.scene;
                
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                this.model.scale.setScalar(0.5);
                this.scene.add(this.model);
                this.mesh = this.model;
                
                this.saveOriginalTextures();
                
                if (onComplete) onComplete();
            },
            undefined,
            (error) => {
                URL.revokeObjectURL(url);
                if (onError) onError(error);
            }
        );
        
        return true;
    }

    setGeometry(type) {
        const validTypes = ['torus', 'box', 'sphere', 'torusKnot'];
        if (!validTypes.includes(type)) return;
        
        // Remove current mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
        
        let geometry;
        switch (type) {
            case 'torus':
                geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(1, 32, 16);
                break;
            case 'torusKnot':
                geometry = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16);
                break;
        }
        
        const material = new THREE.MeshNormalMaterial({ 
            wireframe: false
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.rotation.set(
            this.defaultRotation.x,
            this.defaultRotation.y,
            this.defaultRotation.z
        );
        
        this.scene.add(this.mesh);
        this.model = this.mesh;
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        window.removeEventListener('resize', this.handleResize);
    }
}

export default Viewer;
