import * as THREE from 'three';

import { GUI } from '../node_modules/three/examples/jsm/libs/lil-gui.module.min.js';

import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from '../node_modules/three/examples/jsm/controls/TransformControls.js';

let container;
let camera, scene, renderer;
const splineHelperObjects = [];
let splinePointsLength = 4;
const positions = [];
const point = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();
const onDownPosition = new THREE.Vector2();

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
let transformControl;

const ARC_SEGMENTS = 200;

const splines = {};

const params = {
    uniform: true,
    tension: 0.5,
    centripetal: true,
    chordal: true,
    addPoint: addPoint,
    removePoint: removePoint,
    exportSpline: exportSpline
};

init();

function init() {

    container = document.getElementById( 'container' );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 0, 250, 1000 );
    scene.add( camera );

    scene.add( new THREE.AmbientLight( 0xf0f0f0 ) );
    const light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 1500, 200 );
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 200;
    light.shadow.camera.far = 2000;
    light.shadow.bias = - 0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add( light );

    const planeGeometry = new THREE.PlaneGeometry( 2000, 2000 );
    planeGeometry.rotateX( - Math.PI / 2 );
    const planeMaterial = new THREE.ShadowMaterial( { color: 0x000000, opacity: 0.2 } );

    const plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.position.y = - 200;
    plane.receiveShadow = true;
    scene.add( plane );

    const helper = new THREE.GridHelper( 2000, 100 );
    helper.position.y = - 199;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add( helper );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    container.appendChild( renderer.domElement );

    const gui = new GUI();

    gui.add( params, 'uniform' ).onChange( render );
    gui.add( params, 'tension', 0, 1 ).step( 0.01 ).onChange( function ( value ) {

        splines.uniform.tension = value;
        updateSplineOutline();
        render();

    } );
    gui.add( params, 'centripetal' ).onChange( render );
    gui.add( params, 'chordal' ).onChange( render );
    gui.add( params, 'addPoint' );
    gui.add( params, 'removePoint' );
    gui.add( params, 'exportSpline' );
    gui.open();

    // Controls
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.damping = 0.2;
    controls.addEventListener( 'change', render );

    transformControl = new TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', render );
    transformControl.addEventListener( 'dragging-changed', function ( event ) {

        controls.enabled = ! event.value;

    } );
    scene.add( transformControl );

    transformControl.addEventListener( 'objectChange', function () {

        updateSplineOutline();

    } );

    document.addEventListener( 'pointerdown', onPointerDown );
    document.addEventListener( 'pointerup', onPointerUp );
    document.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener( 'resize', onWindowResize );

    /*******
     * Curves
     *********/

    for ( let i = 0; i < splinePointsLength; i ++ ) {

        addSplineObject( positions[ i ] );

    }

    positions.length = 0;

    for ( let i = 0; i < splinePointsLength; i ++ ) {

        positions.push( splineHelperObjects[ i ].position );

    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ARC_SEGMENTS * 3 ), 3 ) );

    let curve = new THREE.CatmullRomCurve3( positions );
    curve.curveType = 'catmullrom';
    curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
        color: 0xff0000,
        opacity: 0.35
    } ) );
    curve.mesh.castShadow = true;
    splines.uniform = curve;

    curve = new THREE.CatmullRomCurve3( positions );
    curve.curveType = 'centripetal';
    curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
        color: 0x00ff00,
        opacity: 0.35
    } ) );
    curve.mesh.castShadow = true;
    splines.centripetal = curve;

    curve = new THREE.CatmullRomCurve3( positions );
    curve.curveType = 'chordal';
    curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
        color: 0x0000ff,
        opacity: 0.35
    } ) );
    curve.mesh.castShadow = true;
    splines.chordal = curve;

    for ( const k in splines ) {

        const spline = splines[ k ];
        scene.add( spline.mesh );

    }

    load( [ 
        // new THREE.Vector3( 289.76843686945404, 452.51481137238443, 56.10018915737797 ),
        // new THREE.Vector3( - 53.56300074753207, 171.49711742836848, - 14.495472686253045 ),
        // new THREE.Vector3( - 91.40118730204415, 176.4306956436485, - 6.958271935582161 ),
        // new THREE.Vector3( - 383.785318791128, 491.1365363371675, 47.869296953772746 ) ,
        new THREE.Vector3( 323,189,68),
new THREE.Vector3( 305,198,65   ),
new THREE.Vector3( 305,201,70),
new THREE.Vector3( 295,210,64),
new THREE.Vector3( 289,213,67),
new THREE.Vector3( 287,216,67),
new THREE.Vector3( 274,222,78),
new THREE.Vector3( 271,225,79),
new THREE.Vector3( 266,228,83),
new THREE.Vector3( 273,231,80),
new THREE.Vector3( 278,234,81),
new THREE.Vector3( 273,237,74),
new THREE.Vector3( 280,240,71),
new THREE.Vector3( 277,246,75),
new THREE.Vector3( 277,249,75),
new THREE.Vector3( 258,270,77),
new THREE.Vector3( 254,273,82),
new THREE.Vector3( 254,276,80),
new THREE.Vector3( 253,279,82),
new THREE.Vector3( 251,282,84),
new THREE.Vector3( 249,285,83),
new THREE.Vector3( 248,288,84),
new THREE.Vector3( 246,291,86),
new THREE.Vector3( 245,294,87),
new THREE.Vector3( 240,297,91),
new THREE.Vector3( 241,300,92),
new THREE.Vector3( 238,303,94),
new THREE.Vector3( 237,306,97),
new THREE.Vector3( 235,309,102),
new THREE.Vector3( 234,312,102),
new THREE.Vector3( 230,318,109),
new THREE.Vector3( 228,321,112),
new THREE.Vector3( 225,324,113),
new THREE.Vector3( 224,327,115),
new THREE.Vector3( 221,330,118),
new THREE.Vector3( 219,333,119),
new THREE.Vector3( 216,336,123),
new THREE.Vector3( 216,339,125),
new THREE.Vector3( 215,342,130),
new THREE.Vector3( 210,345,138),
new THREE.Vector3( 204,348,139),
new THREE.Vector3( 205,351,138),
new THREE.Vector3( 207,354,134),
new THREE.Vector3( 206,357,140),
new THREE.Vector3( 205,360,140),
new THREE.Vector3( 204,363,142),
new THREE.Vector3( 203,366,145),
new THREE.Vector3( 200,369,148),
new THREE.Vector3( 198,372,151),
new THREE.Vector3( 197,375,154),
new THREE.Vector3( 195,378,157),
new THREE.Vector3( 194,381,161),
new THREE.Vector3( 193,384,162),
new THREE.Vector3( 191,387,165),
new THREE.Vector3( 190,390,168),
new THREE.Vector3( 190,393,170),
new THREE.Vector3( 187,396,177),
new THREE.Vector3( 187,399,179),
new THREE.Vector3( 185,402,182),
new THREE.Vector3( 184,405,185),
new THREE.Vector3( 183,408,191),
new THREE.Vector3( 183,411,193),
new THREE.Vector3( 183,414,199),
new THREE.Vector3( 183,420,202),
new THREE.Vector3( 180,423,206),
new THREE.Vector3( 173,441,225),
new THREE.Vector3( 172,444,228),
new THREE.Vector3( 172,450,238),
    ] );

    render();

}

function addSplineObject( position ) {

    const material = new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } );
    const object = new THREE.Mesh( geometry, material );

    if ( position ) {

        object.position.copy( position );

    } else {

        object.position.x = Math.random() * 1000 - 500;
        object.position.y = Math.random() * 600;
        object.position.z = Math.random() * 800 - 400;

    }

    object.castShadow = true;
    object.receiveShadow = true;
    scene.add( object );
    splineHelperObjects.push( object );
    return object;

}

function addPoint() {

    splinePointsLength ++;

    positions.push( addSplineObject().position );

    updateSplineOutline();

    render();

}

function removePoint() {

    if ( splinePointsLength <= 4 ) {

        return;

    }

    const point = splineHelperObjects.pop();
    splinePointsLength --;
    positions.pop();

    if ( transformControl.object === point ) transformControl.detach();
    scene.remove( point );

    updateSplineOutline();

    render();

}

function updateSplineOutline() {

    for ( const k in splines ) {

        const spline = splines[ k ];

        const splineMesh = spline.mesh;
        const position = splineMesh.geometry.attributes.position;

        for ( let i = 0; i < ARC_SEGMENTS; i ++ ) {

            const t = i / ( ARC_SEGMENTS - 1 );
            spline.getPoint( t, point );
            position.setXYZ( i, point.x, point.y, point.z );

        }

        position.needsUpdate = true;

    }

}

function exportSpline() {

    const strplace = [];

    for ( let i = 0; i < splinePointsLength; i ++ ) {

        const p = splineHelperObjects[ i ].position;
        strplace.push( `new THREE.Vector3(${p.x}, ${p.y}, ${p.z})` );

    }

    console.log( strplace.join( ',\n' ) );
    const code = '[' + ( strplace.join( ',\n\t' ) ) + ']';
    prompt( 'copy and paste code', code );

}

function load( new_positions ) {

    while ( new_positions.length > positions.length ) {

        addPoint();

    }

    while ( new_positions.length < positions.length ) {

        removePoint();

    }

    for ( let i = 0; i < positions.length; i ++ ) {

        positions[ i ].copy( new_positions[ i ] );

    }

    updateSplineOutline();

}

function render() {

    splines.uniform.mesh.visible = params.uniform;
    splines.centripetal.mesh.visible = params.centripetal;
    splines.chordal.mesh.visible = params.chordal;
    renderer.render( scene, camera );

}

function onPointerDown( event ) {

    onDownPosition.x = event.clientX;
    onDownPosition.y = event.clientY;

}

function onPointerUp() {

    onUpPosition.x = event.clientX;
    onUpPosition.y = event.clientY;

    if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) transformControl.detach();

}

function onPointerMove( event ) {

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );

    const intersects = raycaster.intersectObjects( splineHelperObjects, false );

    if ( intersects.length > 0 ) {

        const object = intersects[ 0 ].object;

        if ( object !== transformControl.object ) {

            transformControl.attach( object );

        }

    }

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}