import * as THREE from 'three';
import {GLTFLoader} from 'jsm/loaders/GLTFLoader.js';


async function loadTextures(texture) {
  const texLoader = new THREE.TextureLoader();
  const newTex = await texLoader.loadAsync('textures/' + texture);
  return newTex;
}

async function createPreview(canvas, model) {

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer: true, powerPreference: "high-performance"});
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.z = 2;

  const gltfLoader = new GLTFLoader();
  const gltfHead = await gltfLoader.loadAsync('models/Head.glb')
  scene.add(gltfHead.scene);
  const gltfFace = await gltfLoader.loadAsync('models/Face.glb')
  scene.add(gltfFace.scene);
  const light = new THREE.AmbientLight( 0x404040 );
  scene.add( light ); 
  renderer.setPixelRatio(window.devicePixelRatio);

  return {renderer, scene, camera, gltfHead, gltfFace, light, canvas};
}

function resizeRenderer(Preview) {
  const canvas = Preview.canvas;
  const renderer = Preview.renderer;
  const camera = Preview.camera;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (width === 0 || height === 0) return;

  const needResize = canvas.width !== width || canvas.height !== height;

  if(needResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
  }
}

const Previews = [];
const canvasItems = document.querySelectorAll(".three-canvas");
for (const canvas of canvasItems) {
  const preview = await createPreview(canvas);
  Previews.push(preview);
}

const Textures = []
for (const tex of ['D41.jpg', 'D42.jpg', 'D43.jpg', 'D44.jpg', 'D45.jpg']) {
  const newTex = await loadTextures(tex);
  Textures.push(newTex);
}

let texIndex = 0;
let lastTime = performance.now();
let timer = 0;

let headRotation = 0;
let headVel = -1;

let animationId;

function animate() {
  animationId = requestAnimationFrame(animate);

  const now = performance.now()
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  timer += delta;
  if(timer >= 0.2)
  {
    timer = 0;
    texIndex++;
    if(texIndex > 4) { texIndex = 0; }
  }

  headRotation += headVel * delta * 1;
  if(Math.abs(headRotation) > 1) {
    headRotation = 1 * headVel;
    headVel *= -1;
  }


  Previews.forEach(p => {
    resizeRenderer(p);
    if(p.gltfHead && p.gltfHead.scene && p.gltfFace && p.gltfFace.scene)
    {
      const Head = p.gltfHead.scene;
      Head.scale.set(0.07, 0.07, 0.07);
      Head.rotation.y = headRotation;
      const Face = p.gltfFace.scene;
      Face.scale.set(0.07, 0.07, 0.07);
      Face.rotation.y = headRotation;
      Face.traverse((child)=> {
        if(child.isMesh) {
          if(child.material.map){
            const tex = Textures[texIndex];
            tex.flipY = false;
            tex.encoding = THREE.sRGBEncoding;
            child.material.map = tex;
            child.material.needsUpdate = true;
          }
        }
      });
    }
    p.renderer.render(p.scene, p.camera);
  });
}

animate();
