/**
 * NADDIE - UI Controls Module
 * Simplified version - Handles all UI interactions
 */

class UIController {
    constructor(viewer, config = {}) {
        this.viewer = viewer;
        this.config = config;
        
        // Cache DOM elements
        this.canvas = document.getElementById('3d-viewer');
        this.dockPanel = document.getElementById('dock-panel');
        
        // Texture elements
        this.textureTypeButtons = document.querySelectorAll('.texture-type-btn');
        this.solidColor = document.getElementById('solid-color');
        this.roughnessSlider = document.getElementById('roughness-slider');
        this.metalnessSlider = document.getElementById('metalness-slider');
        this.metalColorButtons = document.querySelectorAll('.metal-color-btn');
        
        // Lighting elements
        this.lightingSwatches = document.querySelectorAll('[data-lighting]');
        this.lightingColor = document.getElementById('lighting-color');
        this.lightingIntensity = document.getElementById('lighting-intensity');
        this.resetLightBtn = document.getElementById('reset-light-btn');
        this.lightPosX = document.getElementById('light-pos-x');
        this.lightPosY = document.getElementById('light-pos-y');
        this.lightPosZ = document.getElementById('light-pos-z');
        this.lightTypeButtons = document.querySelectorAll('.light-type-btn');
        
        // Background elements
        this.bgSwatches = document.querySelectorAll('[data-bg]');
        
        // Model elements
        this.geometryButtons = document.querySelectorAll('.geometry-btn');
        
        // State
        this.currentTextureType = 'original';
        this.currentMetalColor = 'copper';
        
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupTextureControls();
        this.setupLightingControls();
        this.setupBackgroundControls();
        this.setupModelControls();
        
        // Hide texture controls if Normal is selected by default
        if (this.currentTextureType === 'original') {
            document.getElementById('solid-controls').style.display = 'none';
            document.getElementById('metal-controls').style.display = 'none';
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        // Helper function to minimize dock and deselect tabs
        const minimizeDock = () => {
            this.dockPanel.classList.add('minimized');
            // Deselect all tabs
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            // Hide all panels
            tabPanels.forEach(panel => {
                panel.hidden = true;
            });
        };
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                const isActive = btn.classList.contains('active');
                
                // Always maximize dock on tab click
                this.dockPanel.classList.remove('minimized');
                
                // Show position controls if lighting tab is active
                const activeTab = document.querySelector('.tab-btn.active');
                const positionControls = document.getElementById('position-controls');
                if (positionControls && activeTab) {
                    const isLightingTab = activeTab.dataset.tab === 'lighting';
                    const isPositionalLight = this.currentLightType && this.currentLightType !== 'ambient';
                    positionControls.style.display = (isLightingTab && isPositionalLight) ? 'block' : 'none';
                }
                
                // If clicking already active tab, just ensure dock is maximized
                if (isActive) {
                    return;
                }
                
                // Update buttons
                tabButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                
                // Update panels
                tabPanels.forEach(panel => {
                    if (panel.id === `panel-${tab}`) {
                        panel.hidden = false;
                    } else {
                        panel.hidden = true;
                    }
                });
            });
        });
        
        // Minimize dock when clicking outside (but not on canvas)
        document.addEventListener('click', (e) => {
            const isOnDock = this.dockPanel.contains(e.target);
            const isOnCanvas = e.target.id === '3d-viewer';
            
            if (!isOnDock && !isOnCanvas) {
                minimizeDock();
            }
        });
    }

    setupTextureControls() {
        // Texture type buttons
        this.textureTypeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.textureType;
                this.currentTextureType = type;
                
                // Update active state
                this.textureTypeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show/hide appropriate controls
                document.getElementById('solid-controls').style.display = type === 'solid' ? 'block' : 'none';
                document.getElementById('metal-controls').style.display = type === 'metal' ? 'block' : 'none';
                document.getElementById('original-controls').style.display = type === 'original' ? 'block' : 'none';
                
                // Hide color and intensity controls in solid-controls when Normal is selected
                const solidControlsDiv = document.getElementById('solid-controls');
                if (solidControlsDiv) {
                    const colorControl = solidControlsDiv.querySelector('.color-picker-control');
                    const roughnessControl = solidControlsDiv.querySelectorAll('.slider-control');
                    if (colorControl) {
                        colorControl.style.display = type === 'original' ? 'none' : 'block';
                    }
                    roughnessControl.forEach(ctrl => {
                        ctrl.style.display = type === 'original' ? 'none' : 'block';
                    });
                }
                
                // Apply texture
                this.applyTexture();
            });
        });
        
        // Solid color picker
        if (this.solidColor) {
            this.solidColor.addEventListener('input', () => {
                if (this.currentTextureType === 'solid') {
                    this.applyTexture();
                }
            });
        }
        
        // Roughness slider
        if (this.roughnessSlider) {
            this.roughnessSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = value.toFixed(1);
                
                if (this.currentTextureType === 'solid') {
                    this.viewer.setRoughness(value);
                }
            });
        }
        
        // Metalness slider
        if (this.metalnessSlider) {
            this.metalnessSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = value.toFixed(1);
                
                if (this.currentTextureType === 'metal') {
                    this.viewer.setMetalness(value);
                }
            });
        }
        
        // Metal color buttons
        this.metalColorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentMetalColor = btn.dataset.metalColor;
                
                this.metalColorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (this.currentTextureType === 'metal') {
                    this.applyTexture();
                }
            });
        });
    }

    applyTexture() {
        if (this.currentTextureType === 'original') {
            this.viewer.setTexture('original');
        } else if (this.currentTextureType === 'solid') {
            const color = this.solidColor?.value || '#007bff';
            const roughness = parseFloat(this.roughnessSlider?.value || 0.5);
            this.viewer.setTexture('solid', color, 0.1, roughness);
        } else if (this.currentTextureType === 'metal') {
            const metalness = parseFloat(this.metalnessSlider?.value || 0.8);
            this.viewer.setTexture('metal', this.currentMetalColor, metalness, 0.2);
        }
    }

    updateLightingControlsForType(lightType) {
        // Get current light settings from viewer
        const settings = this.viewer.getLightSettings(lightType);
        
        // Update UI controls
        if (this.lightingIntensity) {
            this.lightingIntensity.value = settings.intensity;
            this.lightingIntensity.nextElementSibling.textContent = settings.intensity.toFixed(1);
        }
        if (this.lightingColor) {
            this.lightingColor.value = settings.color;
        }
        
        // Show/hide position controls (Ambient light has no position)
        const positionControls = document.getElementById('position-controls');
        if (positionControls) {
            positionControls.style.display = (lightType !== 'ambient') ? 'block' : 'none';
        }
        
        if (lightType !== 'ambient') {
            if (this.lightPosX) {
                this.lightPosX.value = settings.position.x;
                this.lightPosX.nextElementSibling.textContent = settings.position.x.toFixed(1);
            }
            if (this.lightPosY) {
                this.lightPosY.value = settings.position.y;
                this.lightPosY.nextElementSibling.textContent = settings.position.y.toFixed(1);
            }
            if (this.lightPosZ) {
                this.lightPosZ.value = settings.position.z;
                this.lightPosZ.nextElementSibling.textContent = settings.position.z.toFixed(1);
            }
        }
    }
    
    // Lighting presets
    setupLightingControls() {
        // Light type buttons (Ambient, Main, Fill, Back)
        this.currentLightType = 'ambient';
        
        this.lightTypeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lightType = btn.dataset.lightType;
                this.currentLightType = lightType;
                
                // Update active state
                this.lightTypeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update UI controls based on light type
                this.updateLightingControlsForType(lightType);
            });
        });
        
        // Initialize with ambient light settings
        this.updateLightingControlsForType('ambient');
        
        // Lighting presets
        this.lightingSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                const preset = swatch.dataset.lighting;
                
                // Update active state
                this.lightingSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                
                this.viewer.setLighting(preset);
            });
        });
        
        // Lighting color
        if (this.lightingColor) {
            this.lightingColor.addEventListener('input', (e) => {
                this.viewer.setLightProperty(this.currentLightType, 'color', e.target.value);
            });
        }
        
        // Lighting intensity
        if (this.lightingIntensity) {
            this.lightingIntensity.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = value.toFixed(1);
                this.viewer.setLightProperty(this.currentLightType, 'intensity', value);
            });
        }

        // Light position controls
        const updateLightPosition = () => {
            const x = parseFloat(this.lightPosX?.value || 3);
            const y = parseFloat(this.lightPosY?.value || 5);
            const z = parseFloat(this.lightPosZ?.value || 5);
            this.lightPosX.nextElementSibling.textContent = x;
            this.lightPosY.nextElementSibling.textContent = y;
            this.lightPosZ.nextElementSibling.textContent = z;
            this.viewer.setLightProperty(this.currentLightType, 'position', { x, y, z });
        };

        if (this.lightPosX) {
            this.lightPosX.addEventListener('input', updateLightPosition);
        }
        if (this.lightPosY) {
            this.lightPosY.addEventListener('input', updateLightPosition);
        }
        if (this.lightPosZ) {
            this.lightPosZ.addEventListener('input', updateLightPosition);
        }
        
        // Reset lighting button
        if (this.resetLightBtn) {
            this.resetLightBtn.addEventListener('click', () => {
                this.viewer.resetLighting();
                
                // Reset UI
                this.lightingSwatches.forEach(s => s.classList.remove('active'));
                document.querySelector('[data-lighting="warm"]')?.classList.add('active');
                this.lightingIntensity.value = 1;
                this.lightingIntensity.nextElementSibling.textContent = '1.0';
                // Reset position sliders
                if (this.lightPosX) { this.lightPosX.value = 3; this.lightPosX.nextElementSibling.textContent = '3'; }
                if (this.lightPosY) { this.lightPosY.value = 5; this.lightPosY.nextElementSibling.textContent = '5'; }
                if (this.lightPosZ) { this.lightPosZ.value = 5; this.lightPosZ.nextElementSibling.textContent = '5'; }
                // Reset light type to ambient
                this.currentLightType = 'ambient';
                this.lightTypeButtons.forEach(b => b.classList.remove('active'));
                document.querySelector('[data-light-type="ambient"]')?.classList.add('active');
                this.updateLightingControlsForType('ambient');
            });
        }
    }

    setupBackgroundControls() {
        this.bgSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                const bg = swatch.dataset.bg;
                
                // Update active state
                this.bgSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                
                this.viewer.setBackground(bg);
            });
        });
    }

    setupModelControls() {
        // Geometry buttons
        this.geometryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const geometry = btn.dataset.geometry;
                
                // Update active state
                this.geometryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.viewer.setGeometry(geometry);
            });
        });
    }

    cleanup() {
        // Remove event listeners if needed
    }
}

export default UIController;
