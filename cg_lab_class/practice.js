import * as THREE from 'three';
import {OrbitControls} from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import {VertexNormalsHelper} from "../node_modules/three/examples/jsm/helpers/VertexNormalsHelper.js";

const renderer = new THREE.WebGLRenderer();
const render_w = 640;
const render_h = 480;
renderer.setSize( render_w, render_h );
renderer.setViewport( 0, 0, render_w, render_h );
renderer.shadowMap.enabled = true;

const container = document.getElementById( 'myContainer' );

container.appendChild( renderer.domElement );

// camera setting
const camera = new THREE.PerspectiveCamera( 45, render_w/render_h, 1, 500 );
camera.position.set( 0, 0, -100 );
camera.up.set(0, 1, 0);
camera.lookAt( 0, 0, 50 );

const controls = new OrbitControls( camera, renderer.domElement );


// geometry setting
const points = [
    10, 0, 0,
    0, 10, 0,
    0, 0, 10,
    0, 0, 0,
];
const normals = [
  1, 0, 0,
  1, 0, 0,
  1, 0, 0,
  1, 0, 0,
];


const triIndices = [
    1, 0, 3,         2, 1, 3,
    3, 0, 2,         1, 2, 0
]

const geometry = new THREE.BufferGeometry();
const pointsArray = new Float32Array(points);
const normalsArray = new Float32Array(normals);
//geometry.setFromPoints()
geometry.setAttribute('position', new THREE.BufferAttribute( pointsArray, 3 ));
//geometry.setAttribute('normal', new THREE.BufferAttribute( normalsArray, 3 ));
geometry.setIndex(triIndices);
geometry.computeVertexNormals();

// material setting
const materialOld = new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: false } );
const material = new THREE.MeshPhongMaterial( { color: 0xffff00, wireframe: false, flatShading: false, shininess: 300} );

// line model 
const myMesh = new THREE.Mesh( geometry, material );
//myMesh.position.set(20, 0, 0);
//myMesh.matrix = 
myMesh.castShadow = true;
myMesh.receiveShadow = true;


// create my world (scene)
const myScene = new THREE.Scene();
myScene.background = new THREE.Color( "rgb(150, 150, 200)" );

myScene.add( myMesh );


const myMesh2 = new THREE.Mesh(
  new THREE.SphereGeometry( 5, 16, 8 ),
  new THREE.MeshPhongMaterial( { color: 0xffffff, wireframe: false } )
);

//myMesh2.castShadow = true;
myMesh2.receiveShadow = true;

myMesh.add( myMesh2 );

const myLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
myLight.position.set(20, 20, 20);
myLight.target = myMesh2;

//myLight.target.position.set( 0, 0, 0 );
myLight.castShadow = true;
myLight.shadow.camera.near = 1;
myLight.shadow.camera.far = 100;
myLight.shadow.bias = 0.001;
myLight.shadow.mapSize.width = 1000;
myLight.shadow.mapSize.height = 1000;



myScene.add(myLight);

const lightHelper = new THREE.DirectionalLightHelper( myLight, 5 );
myScene.add(lightHelper);

const axesHelper = new THREE.AxesHelper( 50 );
myScene.add( axesHelper );

const testHelper = new VertexNormalsHelper( myMesh, 3, 0xff0000 );
myScene.add( testHelper );

axesHelper.visible = false;
myMesh2.visible = true;
testHelper.visible = false;

animate();

function animate() {
    requestAnimationFrame( animate );
    
    controls.update();
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

function compute_pos_ss2ws(x_ss, y_ss) {
    return new THREE.Vector3( x_ss / render_w * 2 - 1, -y_ss / render_h * 2 + 1, -1 ).unproject( camera );
}

let mouse_btn_flag = false;
function mouseDownHandler(e) {
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  if(e.pointerType == 'mouse') {
    mouse_btn_flag = true;

    console.log("Mouse down ^^");

    // to do //
    //myMesh.position.set(10, 0, 0);
    //myMesh.scale.set(2, 2, 2);
    
    //myModel.quaternion
    //myMesh.setRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4));
    //myMesh.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);

    let matLocal = new THREE.Matrix4();
    const matT = new THREE.Matrix4().makeTranslation(10, 0, 0);
    const matS = new THREE.Matrix4().makeScale(2, 2, 2);
    const matR = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI / 4);
    // matLocal := matS * matT
    //matLocal = matT.clone();//.multiply(matT); // matLocal := matLocal * matT
    //matLocal.multiply(matR); // matLocal := matT * matR
    //matLocal.premultiply(matS); // // matLocal := matS * matT
    //myMesh.matrix = matLocal.clone();
    //myMesh.matrixAutoUpdate = false;

    mouseMoveHandler(e);
  }
  else if(e.pointerType == 'touch') {
    evCache.push(e);
    console.log("pointerDown", e);
  }
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
  //console.log("Mouse Up");
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

    console.log("Mouse Pos SS:", e.clientX, e.clientY);
    //const myPosSS = new THREE.Vector3(e.clientX, e.clientY, -1);
    const myPosPS = new THREE.Vector3(
       e.clientX / render_w * 2 - 1, 
      -e.clientY / render_h * 2 + 1, 
      -1);
    
    const myPosWS = myPosPS.clone();
    myPosWS.unproject( camera );
    console.log("Mouse Pos PS:", myPosPS.x, myPosPS.y, myPosPS.z);
    console.log("Mouse Pos WS:", myPosWS.x, myPosWS.y, myPosWS.z);


    if(mouse_btn_flag) {
      let posNp = compute_pos_ss2ws(e.clientX, e.clientY);
      // to do //
      //console.log("Mouse Pos:", e.clientX, e.clientY);
      //console.log("Mouse Pos:", posNp);

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
      // to do //
      let posNp = compute_pos_ss2ws(e.clientX, e.clientY);
      console.log("Mouse Pos:", posNp);
      

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
          camera.near += 2.0;
          camera.near = Math.min(camera_ar.near, camera_ar.far);
          camera.updateProjectionMatrix();
        }
        if (curDiff < prevDiff) {
          // The distance between the two pointers has decreased
          console.log("Pinch moving IN -> Zoom out",e);
          camera.near -= 2.0;
          camera.near = Math.max(camera_ar.near, 1.0);
          camera.updateProjectionMatrix();
        }
        
      }
      // Cache the distance for the next move event
      prevDiff = curDiff;
    }
    e.preventDefault();
  }
}
