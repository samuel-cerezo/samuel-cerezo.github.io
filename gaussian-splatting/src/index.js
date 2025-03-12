import { PlyParser } from './loaders/ply/PlyParser.js';
import { PlayCanvasCompressedPlyParser } from './loaders/ply/PlayCanvasCompressedPlyParser.js';
import { PlyLoader } from './loaders/ply/PlyLoader.js';
import { SpzLoader } from './loaders/spz/SpzLoader.js';
import { SplatLoader } from './loaders/splat/SplatLoader.js';
import { KSplatLoader } from './loaders/ksplat/KSplatLoader.js';
import * as LoaderUtils from './loaders/Utils.js';
import { SplatBuffer } from './loaders/SplatBuffer.js';
import { SplatParser } from './loaders/splat/SplatParser.js';
import { SplatPartitioner } from './loaders/SplatPartitioner.js';
import { SplatBufferGenerator } from './loaders/SplatBufferGenerator.js';
import { Viewer } from './Viewer.js';
import { DropInViewer } from './DropInViewer.js';
import { OrbitControls } from './OrbitControls.js';
import { AbortablePromise } from './AbortablePromise.js';
import { SceneFormat } from './loaders/SceneFormat.js';
import { WebXRMode } from './webxr/WebXRMode.js';
import { RenderMode } from './RenderMode.js';
import { LogLevel } from './LogLevel.js';
import { SceneRevealMode } from './SceneRevealMode.js';
import { SplatRenderMode } from './SplatRenderMode.js';

export {
    PlyParser,
    PlayCanvasCompressedPlyParser,
    PlyLoader,
    SpzLoader,
    SplatLoader,
    KSplatLoader,
    LoaderUtils,
    SplatBuffer,
    SplatParser,
    SplatPartitioner,
    SplatBufferGenerator,
    Viewer,
    DropInViewer,
    OrbitControls,
    AbortablePromise,
    SceneFormat,
    WebXRMode,
    RenderMode,
    LogLevel,
    SceneRevealMode,
    SplatRenderMode
};


import { PlyLoader } from './loaders/ply/PlyLoader.js';
import * as THREE from 'three';

// Crear la escena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);

// Cargar el archivo 4-natural.ply
const loader = new PlyLoader();
loader.load('models/4-natural.ply', (geometry) => {
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Configurar la cámara
    camera.position.z = 5;

    // Función de animación
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();
});
