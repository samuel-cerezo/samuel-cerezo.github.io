// Crear una escena básica usando three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('3d-container').appendChild(renderer.domElement);

// Agregar luz
const light = new THREE.AmbientLight(0x404040); // Luz ambiental suave
scene.add(light);

import { GaussianSplats3D } from './assets/js/gaussian-splats-3d.module.min.js';

// Crear el objeto para manejar los Gaussian Splats
const gaussianSplats = new GaussianSplats3D(scene);

// Cargar el archivo .ply desde la carpeta /assets/PLY
const loader = new THREE.PLYLoader();

// Cargar automáticamente el archivo 4-natural.ply cuando se carga la página
const plyFileUrl = 'assets/PLY/4-natural.ply';  // Ruta relativa dentro de tu repositorio

fetch(plyFileUrl)
  .then(response => response.arrayBuffer())
  .then(data => {
    const geometry = loader.parse(data);  // Cargar la geometría del archivo .ply

    // Convertir la geometría en puntos
    const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: THREE.VertexColors });
    const points = new THREE.Points(geometry, material);

    // Añadir los puntos a la escena
    scene.add(points);

    // Animar y renderizar
    animate();
  })
  .catch(error => console.error('Error al cargar el archivo PLY:', error));

// Función para manejar la carga de archivos cuando el usuario sube uno
document.getElementById('ply-file').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      // Cargar el archivo .ply cargado por el usuario
      const geometry = loader.parse(e.target.result);

      // Convertir la geometría en puntos
      const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: THREE.VertexColors });
      const points = new THREE.Points(geometry, material);

      // Añadir los puntos a la escena
      scene.add(points);
      
      // Animar y renderizar
      animate();
    };
    reader.readAsArrayBuffer(file); // Leer el archivo como ArrayBuffer
  }
});

// Configurar la cámara
camera.position.z = 5;

// Función de animación
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Ajustar el tamaño del canvas si la ventana cambia de tamaño
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
