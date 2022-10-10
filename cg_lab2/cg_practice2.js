import * as THREE from 'three';
import {OrbitControls} from "../node_modules/three/examples/jsm/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer();
renderer.setSize( 640, 480 );
renderer.setViewport( 0, 0, 640, 480 );
        
const container = document.getElementById( 'myContainer' );

container.appendChild( renderer.domElement );

// camera setting
const camera = new THREE.PerspectiveCamera( 45, 640.0/480.0, 1, 500 );
camera.position.set( 0, 0, -100 );
camera.up.set(0, 1, 0);
camera.lookAt( 0, 0, 50 );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;

// geometry setting
const points = [
    10, 10, 0,
    -10, 10, 0,
    -10, -10, 0,
    10, -10, 0
];
//points.push( new THREE.Vector3( 10, 10, 0 ) );
//points.push( new THREE.Vector3( -10, 10, 0 ) );
//points.push( new THREE.Vector3( -10, -10, 0 ) );
//points.push( new THREE.Vector3( 10, -10, 0 ) );

const pointsArray = new Float32Array(points);

let planeGeometry = new THREE.BufferGeometry();
//const geometry = new THREE.BufferGeometry().setFromPoints( points );
planeGeometry.setAttribute('position', new THREE.BufferAttribute(pointsArray, 3));

const tris = [
    0, 1, 3,      1, 2, 3
];
planeGeometry.setIndex(tris);

// material setting
const material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide, wireframe: true } );

// mesh model 
const myRect = new THREE.Mesh( planeGeometry, material );
        
// create my world (scene)
const myScene = new THREE.Scene();

myScene.add( myRect );

//renderer.render( myScene, camera );
animate();
function animate() {
    requestAnimationFrame( animate );
    renderer.render( myScene, camera );
}