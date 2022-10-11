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

// register event-callback functions into renderer's dom
renderer.domElement.style = "touch-action:none";
renderer.domElement.onpointerdown = mouseDownHandler;
renderer.domElement.onpointermove = mouseMoveHandler;
renderer.domElement.onpointerup = mouseUpHandler;
renderer.domElement.onpointercancel = mouseUpHandler;
renderer.domElement.onpointerout = mouseUpHandler;
renderer.domElement.onpointerleave = mouseUpHandler;

function compute_pos_ps2ws(x_ss, y_ss) {
    //console.log(x_ss / window.innerWidth * 2 - 1)
    return new THREE.Vector3( x_ss / render_w * 2 - 1, 
        -y_ss / render_h * 2 + 1, -1 ).unproject( camera_ar );
    //return new THREE.Vector3( x_ss / window.innerWidth, -y_ss / window.innerHeight, -1 ).unproject( controls.object );
}

let mouse_btn_flag = false;
function mouseDownHandler(e) {
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  if(e.pointerType == 'mouse') {
    mouse_btn_flag = true;
    mouseMoveHandler(e);
  }
  else if(e.pointerType == 'touch') {
    evCache.push(e);
    console.log("pointerDown", e);
  }
}

function ProjScale(p_ms, cam_pos, src_d, dst_d) {
    let vec_cam2p = new THREE.Vector3().subVectors(p_ms, cam_pos);
    return new THREE.Vector3().addVectors(cam_pos, vec_cam2p.multiplyScalar(dst_d/src_d));
}

var evCache = new Array();
var prevDiff = -1;
function remove_event(ev) {
  // Remove this event from the target's cache
  for (var i = 0; i < evCache.length; i++) {
    if (evCache[i].pointerId == ev.pointerId) {
      evCache.splice(i, 1);
      break;
    }
  }
 }
function mouseUpHandler(e) {
  mouse_btn_flag = false;
  console.log("GGGGL");
  console.log(e);
  if(e.pointerType != 'touch') return;
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttonlog(ev.type, ev);
  // Remove this pointer from the cache and reset the target's
  // background and border
  remove_event(e);
  // If the number of pointers down is less than two then reset diff tracker
  if (evCache.length < 2) {
    prevDiff = -1;
  }
}

let x_prev = render_w / 2;
let y_prev = render_h / 2;
function mouseMoveHandler(e) {
  if(e.pointerType == 'mouse') {
    if(mouse_btn_flag) {
      let pos_light_np = compute_pos_ps2ws(e.clientX, e.clientY);
      //let pos_light = ProjScale(pos_light_np, camera_ar.position, camera_ar.near, light_plane_dist);
      update_light(pos_light_np);
      x_prev = e.clientX;
      y_prev = e.clientY;
    }
  }
  else if(e.pointerType == 'touch') {
    console.log("pointerMove", e);
    //e.target.style.border = "dashed";

    // Find this event in the cache and update its record with this event
    for (var i = 0; i < evCache.length; i++) {
      if (e.pointerId == evCache[i].pointerId) {
        evCache[i] = e;
        break;
      }
    }

    if (evCache.length == 1) {
      let pos_light_np = compute_pos_ps2ws(e.clientX, e.clientY);
      //let pos_light = ProjScale(pos_light_np, camera_ar.position, camera_ar.near, light_plane_dist);
      update_light(pos_light_np);
      x_prev = e.clientX;
      y_prev = e.clientY;
    }
    // If two pointers are down, check for pinch gestures
    else if (evCache.length == 2) {
      console.log("Pinch moving");
      // Calculate the distance between the two pointers
      var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

      if (prevDiff > 0) {
        if (curDiff > prevDiff) {
          // The distance between the two pointers has increased
          console.log("Pinch moving OUT -> Zoom in", e);
          camera_ar.near += 2.0;
          camera_ar.near = Math.min(camera_ar.near, camera_ar.far);
          camera_ar.updateProjectionMatrix();
        }
        if (curDiff < prevDiff) {
          // The distance between the two pointers has decreased
          console.log("Pinch moving IN -> Zoom out",e);
          camera_ar.near -= 2.0;
          camera_ar.near = Math.max(camera_ar.near, 1.0);
          camera_ar.updateProjectionMatrix();
        }
        let pos_light_np = compute_pos_ps2ws(x_prev, y_prev);
        update_light(pos_light_np);
      }

      // Cache the distance for the next move event
      prevDiff = curDiff;
    }
    e.preventDefault();
  }
}
