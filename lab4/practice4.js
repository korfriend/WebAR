const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import * as THREE from 'three';
import * as Kalidokit from '../node_modules/kalidokit/dist/kalidokit.es.js'
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TRIANGULATION } from '../triangulation.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
const render_w = 640;
const render_h = 480;
renderer.setSize( render_w, render_h );
renderer.setViewport(0, 0, render_w, render_h);
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

const camera_ar = new THREE.PerspectiveCamera( 45, render_w/render_h, 1, 500 );
camera_ar.position.set( -1, 2, 3 );
camera_ar.up.set(0, 1, 0);
camera_ar.lookAt( 0, 1, 0 );

const controls = new OrbitControls( camera_ar, renderer.domElement );
controls.enablePan = false;
controls.enableZoom = false;
controls.target.set( 0, 1, 0 );
controls.update();

const scene = new THREE.Scene();

scene.background = new THREE.Color( 0xa0a0a0 );
scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 3, 10, 10 );
dirLight.castShadow = true;
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = - 2;
dirLight.shadow.camera.left = - 2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
scene.add( dirLight );

const ground_mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
ground_mesh.rotation.x = - Math.PI / 2;
ground_mesh.receiveShadow = true;
scene.add( ground_mesh );

let model, skeleton, skeleton_helper, mixer, numAnimations;
const loader = new GLTFLoader();
loader.load( '../models/gltf/Xbot.glb', function ( gltf ) {

    model = gltf.scene;
    scene.add( model );

    console.log(model);
    
    let bones = [];
    model.traverse( function ( object ) {

        if ( object.isMesh ) object.castShadow = true;

        //console.log(object.isBone);
        if ( object.isBone ) bones.push(object);
    } );

    bones.forEach(function(bone){
        console.log(bone.name);
        bone.matrixAutoUpdate = false;
    });

    skeleton = new THREE.Skeleton(bones);

    skeleton_helper = new THREE.SkeletonHelper( model );
    skeleton_helper.visible = true;
    
    scene.add( skeleton_helper );

    const animations = gltf.animations;
    mixer = new THREE.AnimationMixer( model );

    numAnimations = animations.length;

    for ( let i = 0; i !== numAnimations; ++ i ) {

        let clip = animations[ i ];
        const name = clip.name;

        console.log("action: " + name);
    }
} );

function ProjScale(p_ms, cam_pos, src_d, dst_d) {
  let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
  return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
}

function onResults2(results) {
  if (!results.poseLandmarks) {
    return;
  }
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  //results.poseLandmarks
  {
    // Only overwrite existing pixels.
    // canvasCtx.globalCompositeOperation = 'source-in';
    // canvasCtx.fillStyle = '#00FF00';
    // canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    //console.log(results.ea);
    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                  {color: '#00FF00', lineWidth: 2});
    drawLandmarks(canvasCtx, results.poseLandmarks,
                  {color: '#FF0000', radius: 1});
    canvasCtx.restore();
  }

  //Kalidokit.Pose.solve(results.poseLandmarks, {
  //    runtime: "mediapipe", // `mediapipe` or `tfjs`
  //    video: videoElement,
  //    imageSize: { height: 462, width: 820 },
  //    enableLegs: true,
  //});
  let poselm3d = results.poseLandmarks;
  let poseRig = Kalidokit.Pose.solve(poselm3d,results.poseLandmarks,{runtime:'mediapipe',imageSize:{width:820, height:462}})
  //console.log(poseRig);
    

  let bn_test = skeleton.getBoneByName("mixamorigHips");
  //console.log(bn_test.matrix);
  //bn_test.matrix = new THREE.Matrix4();

  renderer.render( scene, camera_ar );
  canvasCtx.restore();
}

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults2);

videoElement.play();

async function detectionFrame() {
  await pose.send({image: videoElement});
  videoElement.requestVideoFrameCallback(detectionFrame);
}

detectionFrame();