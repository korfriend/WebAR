const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
const render_w = 640;
const render_h = 480;
renderer.setSize( render_w, render_h );
renderer.setViewport(0, 0, render_w, render_h);
document.body.appendChild( renderer.domElement );

const camera_ar = new THREE.PerspectiveCamera( 45, render_w/render_h, 1, 500 );
camera_ar.position.set( 0, 0, 100 );
camera_ar.up.set(0, 1, 0);
camera_ar.lookAt( 0, 0, 0 );

const scene = new THREE.Scene();

const texture_bg = new THREE.VideoTexture( videoElement );
scene.background = texture_bg; 


function onResults2(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      // landmarks is NormalizedLandmark[]
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
                     {color: '#C0C0C070', lineWidth: 1});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
    }
  }
  renderer.render( scene, camera_ar );
  canvasCtx.restore();
}

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `./node_modules/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults2);

//const camera = new Camera(videoElement, {
//  onFrame: async () => {
//    await faceMesh.send({image: videoElement});
//  },
//  width: 1280,
//  height: 720
//});
//camera.start();

videoElement.play();

async function detectionFrame() {
  await faceMesh.send({image: videoElement});
  videoElement.requestVideoFrameCallback(detectionFrame);
}

detectionFrame();