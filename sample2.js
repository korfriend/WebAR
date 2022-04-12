const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
canvasElement.style.display="none";
const canvasCtx = canvasElement.getContext('2d');

//import { FACEMESH_FACE_OVAL } from "@mediapipe/face_mesh";
import * as THREE from "./node_modules/three/build/three.module.js";
import {OrbitControls} from "./node_modules/three/examples/jsm/controls/OrbitControls.js";
import { Lensflare, LensflareElement } from './node_modules/three/examples/jsm/objects/Lensflare.js';
import { TRIANGULATION } from './triangulation.js';

import { Line2 } from './node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from './node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './node_modules/three/examples/jsm/lines/LineGeometry.js';

const render_w = 640;
const render_h = 480;
const renderer_ar = new THREE.WebGLRenderer({ antialias: true });
const renderer_world = new THREE.WebGLRenderer({ antialias: true });
renderer_ar.setSize(render_w, render_h);
renderer_world.setSize(render_w, render_h);

const dpr = window.devicePixelRatio;
renderer_ar.setPixelRatio( dpr );
renderer_world.setPixelRatio( dpr );

document.body.appendChild (renderer_ar.domElement);
document.body.appendChild (renderer_world.domElement);

const camera_ar = new THREE.PerspectiveCamera( 63, render_w/render_h, 20.0, 500);
const camera_world = new THREE.PerspectiveCamera( 63, render_w/render_h, 1.0, 10000);
camera_ar.position.set( 0, 0, 100 );
camera_ar.up.set(0, 1, 0);
camera_ar.lookAt( 0, 0, 0 );
camera_ar.updateProjectionMatrix();

camera_world.position.set( 200, 0, 200 );
camera_world.up.set(0, 1, 0);
camera_world.lookAt( 0, 0, 0 );

const controls = new OrbitControls( camera_world, renderer_world.domElement );
controls.enableDamping = true;

const scene = new THREE.Scene();

const texture = new THREE.VideoTexture( videoElement );
texture.center = new THREE.Vector2(0.5, 0.5);
texture.rotation = Math.PI;
texture.flipY = false;

const texture2 = new THREE.VideoTexture( videoElement );
texture2.center = new THREE.Vector2(0.5, 0.5);
texture2.rotation = Math.PI;
texture2.flipY = false;

const texture3 = new THREE.VideoTexture( videoElement );
texture3.center = new THREE.Vector2(0.5, 0.5);
texture3.rotation = Math.PI;
texture3.flipY = false;

const degrees_to_radians = deg => (deg * Math.PI) / 180.0;
let unit_h = Math.tan(degrees_to_radians(camera_ar.fov / 2.0)) * 2;
let unit_w = unit_h / render_h * render_w;
const plane_geometry = new THREE.PlaneGeometry( unit_w * camera_ar.far, unit_h * camera_ar.far);
const plane_material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, map:texture3} );
const plane_bg = new THREE.Mesh( plane_geometry, plane_material );
plane_bg.position.set(0, 0, -400);
scene.add( plane_bg );

//scene.background = texture;

let geometry_faceoval = new THREE.BufferGeometry();
let linegeometry_faceoval = new LineGeometry();
let points_faceoval = null;
let lines_faceoval = null;
let face_mesh = null;

const textureLoader = new THREE.TextureLoader();
const textureFlare0 = textureLoader.load( './lensflare0.png' );
const textureFlare3 = textureLoader.load( './lensflare3.png' );

const light_flare = new THREE.PointLight( 0xffffff, 1.5, 2000 );
light_flare.color.setHSL( 0.995, 0.5, 0.7 );
light_flare.position.set( 0, 0, 0 );

const light = new THREE.DirectionalLight( 0xffffff, 1.0 );
light.position.set( 0, 0, 100 );

const light_ambient = new THREE.AmbientLight( new THREE.Color(0.5, 0.5, 0.5), 1.0 ); 

const lensflare = new Lensflare();
lensflare.addElement( new LensflareElement( textureFlare0, 200, 0, light.color ) );
lensflare.addElement( new LensflareElement( textureFlare3, 60, 0.6 ) );
lensflare.addElement( new LensflareElement( textureFlare3, 70, 0.7 ) );
lensflare.addElement( new LensflareElement( textureFlare3, 120, 0.9 ) );
lensflare.addElement( new LensflareElement( textureFlare3, 70, 1 ) );

light_flare.add( lensflare );
light_flare.visible = true;
//scene.add(light_flare);
scene.add(light);
scene.add(light_ambient);

let light_helper = new THREE.DirectionalLightHelper(light, 0.3);
function update_light(pos) {
  light.position.set(pos.x, pos.y, pos.z);
  light_helper.update();
}

let camera_ar_helper = new THREE.CameraHelper( camera_ar );
scene.add( camera_ar_helper );

// https://beautifier.io/
renderer_ar.domElement.addEventListener("mousedown", mouseMoveHandler, false);
renderer_ar.domElement.addEventListener("mousemove", mouseMoveHandler, false);
renderer_ar.domElement.addEventListener("wheel", mouseWheelHandler, false);

function compute_pos_ps2ws(x_ss, y_ss) {
    //console.log(x_ss / window.innerWidth * 2 - 1)
    return new THREE.Vector3( x_ss / render_w * 2 - 1, 
        -y_ss / render_h * 2 + 1, -1 ).unproject( camera_ar );
    //return new THREE.Vector3( x_ss / window.innerWidth, -y_ss / window.innerHeight, -1 ).unproject( controls.object );
}

let light_plane_dist = camera_ar.near;
function mouseDownHandler(e) {
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  if(e.which == 1) // e.which
      console.log("L brn : " + e.clientX  + ", " + e.clientY);
  else if (e.which == 3)
      console.log("R brn : " + e.clientX  + ", " + e.clientY);
}

function ProjScale(p_ms, cam_pos, src_d, dst_d) {
    let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
    return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
}

let x_prev = render_w / 2;
let y_prev = render_h / 2;
function mouseMoveHandler(e) {
  if(e.which == 1) {
      let pos_light_np = compute_pos_ps2ws(e.clientX, e.clientY);
      //let pos_light = ProjScale(pos_light_np, camera_ar.position, camera_ar.near, light_plane_dist);
      update_light(pos_light_np);
      x_prev = e.clientX;
      y_prev = e.clientY;
  }
}

function mouseWheelHandler(e) {
    e.preventDefault();
    //light_plane_dist += e.deltaY * -0.01;
    camera_ar.near += e.deltaY * -0.01;
    camera_ar.updateProjectionMatrix();
    //camera_ar_helper.update();
    let pos_light_np = compute_pos_ps2ws(x_prev, y_prev);
    //let pos_light = ProjScale(pos_light_np, camera_ar.position, camera_ar.near, light_plane_dist);
    update_light(pos_light_np);
}


const faceMesh = new FaceMesh({locateFile: (file) => {
    return `./node_modules/@mediapipe/face_mesh/${file}`;
  }});

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {

        let count_landmarks_faceoval = FACEMESH_FACE_OVAL.length;
        if(points_faceoval == null) {
            geometry_faceoval.setAttribute('position', new THREE.BufferAttribute(
                new Float32Array((count_landmarks_faceoval + 1) * 3), 3));
                
            points_faceoval = new THREE.Points(geometry_faceoval, 
                new THREE.PointsMaterial({color:0xFF0000, size: 1, sizeAttenuation: true}));

            let matFatLine = new LineMaterial( {
                color: 0x00ff00,
                linewidth: 5, // in world units with size attenuation, pixels otherwise
                worldUnits: false,
                //vertexColors: true,
                //resolution:  // to be set by renderer, eventually
                dashed: false,
                alphaToCoverage: true,

            } );
            matFatLine.resolution.set( render_w, render_h ); // resolution of the viewport
            matFatLine.needsUpdate = true;
            lines_faceoval = new Line2( linegeometry_faceoval, matFatLine );

            let face_geometry = new THREE.BufferGeometry();
            face_geometry.setAttribute('position', new THREE.BufferAttribute(
                new Float32Array(landmarks.length * 3), 3));
            face_geometry.setAttribute('uv', new THREE.BufferAttribute(
                new Float32Array(landmarks.length * 2), 2));
            face_geometry.setAttribute('normal', new THREE.BufferAttribute(
                new Float32Array(landmarks.length * 3), 3));
            face_geometry.setIndex(TRIANGULATION);
            //let face_material1 = new THREE.MeshBasicMaterial({ color: 0xffffff, map:texture  });
            let face_material2 = new THREE.MeshPhongMaterial(
                { color: new THREE.Color(1.0, 1.0, 1.0), map:texture, 
                    specular: new THREE.Color(0, 0, 0), shininess:1000  });
            face_mesh = new THREE.Mesh(face_geometry, face_material2);
            console.log("# of landmarks : " + landmarks.length);
            console.log("THREE GEOMETRY SET!");
            scene.add(points_faceoval);
            scene.add(lines_faceoval);
            scene.add(face_mesh);
        }
        // now points_faceoval is NOT NULL
        const p_c = new THREE.Vector3(0, 0, 0).unproject(camera_ar);
        const vec_cam2center = new THREE.Vector3().subVectors(p_c, camera_ar.position);
        const center_dist = vec_cam2center.length();
    
        let oval_positions = points_faceoval.geometry.attributes.position.array;
        let linePoints = []; linePoints.length = count_landmarks_faceoval;
        for(let i = 0; i < count_landmarks_faceoval; i++) {
            //console.log(FACEMESH_FACE_OVAL[i][0]);
            const index = FACEMESH_FACE_OVAL[i][0];
            let p = landmarks[index];
            let p_ms = new THREE.Vector3((p.x - 0.5) * 2.0, -(p.y - 0.5) * 2.0, p.z).unproject(camera_ar);
            p_ms = ProjScale(p_ms, camera_ar.position, center_dist, 100.0);

            oval_positions[i * 3 + 0] = p_ms.x;
            oval_positions[i * 3 + 1] = p_ms.y;
            oval_positions[i * 3 + 2] = p_ms.z;

            linePoints[i] = p_ms;
        }
        oval_positions[count_landmarks_faceoval * 3 + 0] = oval_positions[0];
        oval_positions[count_landmarks_faceoval * 3 + 1] = oval_positions[1];
        oval_positions[count_landmarks_faceoval * 3 + 2] = oval_positions[2];
        linePoints[count_landmarks_faceoval] = linePoints[0];

        let positions = face_mesh.geometry.attributes.position.array;
        let uvs = face_mesh.geometry.attributes.uv.array;
        let p_center = new THREE.Vector3(0, 0, 0);
        for(let i = 0; i < landmarks.length; i++) {
            let p = landmarks[i];
            let p_ms = new THREE.Vector3((p.x - 0.5) * 2.0, -(p.y - 0.5) * 2.0, p.z).unproject(camera_ar);
            p_ms = ProjScale(p_ms, camera_ar.position, center_dist, 100.0);

            let pp = new THREE.Vector3().copy(p_ms);
            p_center.addVectors(p_center, pp.divideScalar(landmarks.length));

            positions[i * 3 + 0] = p_ms.x;
            positions[i * 3 + 1] = p_ms.y;
            positions[i * 3 + 2] = p_ms.z;
            uvs[i*2 + 0] = p.x;
            uvs[i*2 + 1] = -p.y + 1.0;
            //console.log(p.x +", "+p.y);
        }
        controls.target = p_center;
        //console.log(p_center.x + ", " + p_center.y + ", " + p_center.z);
        face_mesh.geometry.computeVertexNormals();

        linegeometry_faceoval.setPositions(oval_positions);
        lines_faceoval.computeLineDistances();
        lines_faceoval.scale.set( 1, 1, 1 );

        points_faceoval.geometry.attributes.position.needsUpdate = true;
        face_mesh.geometry.attributes.position.needsUpdate = true;
        face_mesh.geometry.attributes.uv.needsUpdate = true;
        
        let count_landmarks_left_iris = FACEMESH_LEFT_IRIS.length;
        let lm_il = [0.0, 0.0, 0.0];
        for(let i = 0; i < count_landmarks_left_iris; i++) {
            const index = FACEMESH_LEFT_IRIS[i][0];
            const p = landmarks[index];
            lm_il[0] += p.x / count_landmarks_left_iris;
            lm_il[1] += p.y / count_landmarks_left_iris;
            lm_il[2] += p.z / count_landmarks_left_iris;
        }
        let p_il_ms = new THREE.Vector3((lm_il[0] - 0.5) * 2.0, -(lm_il[1] - 0.5) * 2.0, lm_il[2]).unproject(camera_ar);
        p_il_ms = ProjScale(p_il_ms, camera_ar.position, center_dist, 99.9);
        //sphere_iris.visible = true;
        light_flare.visible = true;
        light_flare.position.copy( p_il_ms );
        light.target = face_mesh;
        //console.log(count_landmarks_left_iris);

        controls.update(); // camera_world

        light_helper.update();
        camera_ar_helper.update();

        scene.background = texture;
        face_mesh.material.map = texture;
        scene.remove(light_helper);
        scene.remove(camera_ar_helper);
        scene.remove( plane_bg );
        renderer_ar.render( scene, camera_ar );
        scene.background = null;
        face_mesh.material.map = texture2;
        scene.add(light_helper);
        scene.add(camera_ar_helper);
        scene.add( plane_bg );
        //texture.update();
        renderer_world.render( scene, camera_world );


      //drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
      //               {color: '#C0C0C070', lineWidth: 1});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
      //drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});
    }
  }
  canvasCtx.restore();
}

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5, 
  selfieMode: true,
  //enableFaceGeometry: false
});
faceMesh.onResults(onResults);

//const webcamera = new Camera(videoElement, {
//  onFrame: async () => {
//    await faceMesh.send({image: videoElement});
//  },
//  width: 640,
//  height: 480,
//});
//webcamera.start();

//animate();
//function animate() {
//    requestAnimationFrame( animate );
////    renderer.render( scene, camera );
//}

function startEstimation(video, ctx_w, ctx_h) {
  let width = video.videoWidth;
  let height = video.videoHeight;

  canvasElement.width = ctx_w;
  canvasElement.height = ctx_h;

  video.play();

  async function detectionFrame(now, metadata) {
    await faceMesh.send({ image: video }); // processing
    video.requestVideoFrameCallback(detectionFrame);
  }
  video.requestVideoFrameCallback(detectionFrame);
  console.log("Processing started");
}
startEstimation(videoElement, render_w, render_h);