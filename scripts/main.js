/**
 * NADDIE - 3D Viewer
 * Main entry point - Simplified version
 */

import Viewer from './modules/viewer.js';
import UIController from './modules/ui-controls.js';
import ModalController from './modules/modal.js';

// Configuration constants
const CONFIG = {
    scene: {
        rotation: { x: -0.7, y: 2, z: -0.4 },
        texture: 'original',
        lighting: { intensity: 1, color: '#ffffff', preset: 'warm' },
        background: 'default',
        cubeColor: '#007bff'
    },
    camera: {
        fov: 50,
        near: 0.1,
        far: 1000,
        position: { x: 0, y: 10, z: 3 }
    },
    model: {
        useGeometry: true,
        geometry: 'torus'
    }
};

class App {
    constructor() {
        this.viewer = null;
        this.uiController = null;
        this.modalController = null;
    }

    init() {
        const canvas = document.getElementById('3d-viewer');
        
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        // Initialize viewer
        this.viewer = new Viewer(canvas, CONFIG);

        // Initialize UI controller
        this.uiController = new UIController(this.viewer, CONFIG);

        // Initialize modal controller
        this.modalController = new ModalController();

        // Setup resize handler
        window.addEventListener('resize', () => {
            this.viewer.handleResize();
        });

        // Open welcome modal on first visit
        if (!localStorage.getItem('naddie-visited')) {
            this.modalController.open();
            localStorage.setItem('naddie-visited', 'true');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
