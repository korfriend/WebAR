const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import * as THREE from 'three';
import * as Kalidokit from '../node_modules/kalidokit/dist/kalidokit.es.js'
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TRIANGULATION } from '../triangulation.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { CalculateJointAngles } from './calculate_joint_angles.js';

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
        if ( object.isBone ) {
          let axis_helper = new THREE.AxesHelper(20);
          // https://stackoverflow.com/questions/13309289/three-js-geometry-on-top-of-another
          axis_helper.material.depthTest = false;
          bones.push(object);
          //console.log(object);
          object.add(axis_helper);
        }
    } );

    bones.forEach(function(bone){
        console.log(bone.name);
        bone.matrixAutoUpdate = false;
        bone.matrix = new THREE.Matrix4().makeTranslation(bone.position.x, bone.position.y, bone.position.z);
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

        //console.log("action: " + name);
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
  
  let test = CalculateJointAngles.convert2dictionary(results.poseLandmarks);
  //console.log(test);
  //results.poseLandmarks
  {
    // Only overwrite existing pixels.
    // canvasCtx.globalCompositeOperation = 'source-in';
    // canvasCtx.fillStyle = '#00FF00';
    // canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    //console.log(results.poseLandmarks);

    

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
  //console.log(poseRig.LeftUpperLeg);
  //console.log(poseRig.LeftLowerLeg);
  //console.log(poseRig);
  let hips = skeleton.getBoneByName("mixamorigHips");
  let mixamor_leftUpLeg = skeleton.getBoneByName("mixamorigLeftUpLeg");
  let matT_leftUpLeg = new THREE.Matrix4().makeTranslation(mixamor_leftUpLeg.position.x, mixamor_leftUpLeg.position.y, mixamor_leftUpLeg.position.z);
  let mixamor_leftLeg = skeleton.getBoneByName("mixamorigLeftLeg");
  let matT_leftLeg = new THREE.Matrix4().makeTranslation(mixamor_leftLeg.position.x, mixamor_leftLeg.position.y, mixamor_leftLeg.position.z);
  // let mixamor_rightUpLeg = skeleton.getBoneByName("mixamorigRightUpLeg");
  // let matT_rightUpLeg = new THREE.Matrix4().makeTranslation(mixamor_rightUpLeg.position.x, mixamor_rightUpLeg.position.y, mixamor_rightUpLeg.position.z);
  // let mixamor_rightLeg = skeleton.getBoneByName("mixamorigRightLeg");
  // let matT_rightLeg = new THREE.Matrix4().makeTranslation(mixamor_rightLeg.position.x, mixamor_rightLeg.position.y, mixamor_rightLeg.position.z);
  //let euler_0 = new THREE.Matrix4().makeRotationX(poseRig.Hips.rotation.x)
  //new THREE.Euler( poseRig.Hips.rotation.x, poseRig.Hips.rotation.y, poseRig.Hips.rotation.z, 'XYZ' );
  let sv_euler_leftupleg = new THREE.Euler( poseRig.LeftUpperLeg.x, poseRig.LeftUpperLeg.y, poseRig.LeftUpperLeg.z, poseRig.LeftUpperLeg.rotationOrder ); // poseRig.LeftUpperLeg.rotationOrder
  let sv_euler_leftleg = new THREE.Euler( poseRig.LeftLowerLeg.x, poseRig.LeftLowerLeg.y, poseRig.LeftLowerLeg.z, poseRig.LeftLowerLeg.rotationOrder ); // poseRig.LeftLowerLeg.rotationOrder
  let sv_euler_rightupleg = new THREE.Euler( poseRig.RightUpperLeg.x, poseRig.RightUpperLeg.y, poseRig.RightUpperLeg.z, poseRig.RightUpperLeg.rotationOrder ); // poseRig.LeftUpperLeg.rotationOrder
  let sv_euler_rightleg = new THREE.Euler( poseRig.RightLowerLeg.x, poseRig.RightLowerLeg.y, poseRig.RightLowerLeg.z, poseRig.RightLowerLeg.rotationOrder ); // poseRig.LeftLowerLeg.rotationOrder
  //console.log(poseRig.LeftUpperLeg);
  //console.log(poseRig.RightLowerLeg);
  //let mat_rot_0 = new THREE.Matrix4().makeRotationFromEuler(euler_0);
  let sv_matR_leftupleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_leftupleg);
  let sv_matR_leftleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_leftleg);
  //let sv_matR_rightupleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_rightupleg);
  //let sv_matR_rightleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_rightleg);
  // let sv_matR_leftupleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_leftupleg);
  // let sv_matR_leftleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_leftleg);
  // let sv_matR_rightupleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_rightupleg);
  // let sv_matR_rightleg = new THREE.Matrix4().makeRotationFromEuler(sv_euler_rightleg);

  //let hips_yaw = new THREE.Matrix4().makeRotationZ(poseRig.Hips.rotation.z);
  //let hips_pitch = new THREE.Matrix4().makeRotationY(poseRig.Hips.rotation.y);
  //let hips_roll = new THREE.Matrix4().makeRotationX(poseRig.Hips.rotation.x);
  //console.log(poseRig.Hips);
  //let mat_rot_0 = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().multiplyMatrices(hips_roll, hips_pitch), hips_yaw);

  //hips.matrix.multiplyMatrices(mat_tln_0, mat_rot_0);
  mixamor_leftUpLeg.matrix.multiplyMatrices(sv_matR_leftupleg, matT_leftUpLeg);
  mixamor_leftLeg.matrix.multiplyMatrices(sv_matR_leftleg, matT_leftLeg);
  // mixamor_rightUpLeg.matrix.multiplyMatrices(sv_matR_rightupleg, matT_rightUpLeg);
  // mixamor_rightLeg.matrix.multiplyMatrices(sv_matR_rightleg, matT_rightLeg);
    
  //console.log(bn_test.matrix);
  //bn_test.matrix = new THREE.Matrix4();

  //videoElement.pause();
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