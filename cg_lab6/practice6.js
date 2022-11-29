import * as THREE from 'three';

let camera, scene, renderer;

let uniforms;
let myTex;

init();
animate();

function init() {

    const container = document.getElementById( 'container' );

    camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0.5, 1 );

    scene = new THREE.Scene();

    const geometry = new THREE.PlaneGeometry( 2, 2 );
    console.log(geometry);

    const textureLoader = new THREE.TextureLoader();
    myTex = textureLoader.load('../cg_lab5/lab5.jpg');
    myTex.magFilter = THREE.LinearFilter;

    var loader = new THREE.TextureLoader();
		
    loader.load( '../cg_lab5/lab5.jpg', function( texture ) {
        console.log( 'Texture dimensions: %sx%s', texture.image.width, texture.image.height );
        myTex = texture;
        console.log(myTex.image);
    });
    console.log(myTex.image);
    
    //myTex.minFilter = THREE.NearestFilter;

    uniforms = {
        time: { value: 1.0 },
        myTexImg: {value: myTex},
        bufferSize: {value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
        //imgSize: {value: null}
        imgSize: {value: myTex.image!= null ? new THREE.Vector2(myTex.image.width, myTex.image.height) : null}
    };

    //THREE.UniformsLib

    const material = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        //map: 
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent

    } );

    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );

    
    renderer.setPixelRatio( window.devicePixelRatio );
    container.appendChild( renderer.domElement );

    onWindowResize();

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    //console.log(performance.now());
    uniforms[ 'time' ].value = performance.now() / 1000;
    uniforms['myTexImg'].value = myTex;
    //if(myTex.image != null)
    //console.log(myTex.image);
    uniforms[ 'imgSize' ].value = myTex.image!= null ? new THREE.Vector2(myTex.image.width, myTex.image.height) : new THREE.Vector2(0, 0);
    renderer.render( scene, camera );

}