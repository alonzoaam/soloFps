import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

import {Octree} from 'three/addons/math/Octree.js';

import {OctreeHelper} from 'three/addons/helpers/OctreeHelper.js';

import {Capsule} from 'three/addons/math/Capsule.js'

import {GUI} from 'three/addons/libs/lil-gui.module.min.js';

class InputController {
    constructor(target) {
        this.target_ = target || document;
        this.initialize_();
    }

    initialize_() {
        this.current_ = {
            leftButton:false,
            rightButton:false
        };
        this.previous_ = null;
        this.keyStates_ = {};
        this.previousKeys_ = {};
        this.target_.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
        this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e), false);
        this.target_.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
        this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
        this.target_.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
    }

    onKeyDown_(e) {
        this.keyStates_[e.code] = true;
    }

    onKeyUp_(e) {
        this.keyStates_[e.code] = false;
    }

    onMouseDown_(e) {

    }

    onMouseUp_(e) {

    }

    onMouseMove_(e) {
        
    }
}

class FirstPersonCamera {
    constructor(camera, objects) {
        this.camera_ = camera;
        this.input_ = new InputController();
    }

    update(timeElapsedS) {
        this.input_.update
    }
}



class World {
    constructor() {
        this.initialize_();
    }

    initialize_() {
        this.initializeRenderer_();
        this.initializeLights_();
        this.initializeScene_();
        this.initializeCollisions_();
        this.initializeModels_();

        this.previousRAF_ = null;
        this.raf_();
        this.onWindowResize_();
    }

    initializeRenderer_() {
        const container = document.getElementById( 'container' );

        this.threejs_ = new THREE.WebGLRenderer( {antialias: true } );
        this.threejs_.setPixelRatio( window.devicePixelRatio );
        this.threejs_.setSize( window.innerWidth, window.innerHeight );
        this.threejs_.shadowMap.enabled = true;
        this.threejs_.shadowMap.type = THREE.VSMShadowMap;

        document.body.appendChild(this.threejs_.domElement);
        container.appendChild( this.threejs_.domElement );

        window.addEventListener('resize', () => {
            this.onWindowResize_();
        }, false);

        this.camera_ = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera_.position.set(0,20,70);
        this.camera_.rotation.order = 'YXZ';

        this.scene_ = new THREE.Scene();

        this.clock_ = new THREE.Clock();

        this.worldOctree_ = new Octree();
        this.playerCollider_ = new Capsule(new THREE.Vector3(0,0.35,0), new THREE.Vector3(0,1,0), 0.35);

        this.playerVelocity_ = new THREE.Vector3();
        this.playerDirection_ = new THREE.Vector3();

        this.playerOnFloor_ = false;
        this.mouseTime_ = 0;

        this.keyStates_ = {};

        this.vector1 = new THREE.Vector3();
        this.vector2 = new THREE.Vector3();
        this.vector3 = new THREE.Vector3();

        document.addEventListener( 'keydown', ( event ) => {

            console.log(event.code);
            this.keyStates_[ event.code ] = true;
        
        } );
        
        document.addEventListener( 'keyup', ( event ) => {
        
            this.keyStates_[ event.code ] = false;
        
        } );
        
        container.addEventListener( 'mousedown', () => {
        
            document.body.requestPointerLock();
        
            this.mouseTime_ = performance.now();
        
        } );
        
        document.addEventListener( 'mouseup', () => {
        
            if ( document.pointerLockElement !== null ) throwBall();
        
        } );
        
        document.body.addEventListener( 'mousemove', ( event ) => {
        
            if ( document.pointerLockElement === document.body ) {
        
                this.camera_.rotation.y -= event.movementX / 500;
                this.camera_.rotation.x -= event.movementY / 500;
        
            }
        
        } );




    }

    initializeLights_() {
        const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
        fillLight1.position.set( 2, 1, 1 );
        this.scene_.add( fillLight1 );

        const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
        directionalLight.position.set( - 5, 25, - 1 );
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.01;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.left = - 30;
        directionalLight.shadow.camera.top	= 30;
        directionalLight.shadow.camera.bottom = - 30;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.radius = 4;
        directionalLight.shadow.bias = - 0.00006;
        this.scene_.add( directionalLight );
    }

    initializeScene_() {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            './resources/skybox/vz_classic_land_front.png',
            './resources/skybox/vz_classic_land_back.png',
            './resources/skybox/vz_classic_land_up.png',
            './resources/skybox/vz_classic_land_down.png',
            './resources/skybox/vz_classic_land_left.png',
            './resources/skybox/vz_classic_land_right.png'
      ]);


        texture.colorSpace = THREE.SRGBColorSpace;
        this.scene_.background = texture;

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 10, 10),
            new THREE.MeshStandardMaterial({color: 0x111111}));
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this.scene_.add(plane);

    }

    initializeCamera_() {
        this.camera_ = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera_.rotation.order = 'YXZ'
    }

    initializeCollisions_() {
    
    }

    initializeModels_() {
        this.loader = new GLTFLoader().setPath('./models/gltf/');
        this.loader.load('collision-world.glb', (gltf) => {
            this.scene_.add(gltf.scene);
            this.worldOctree_.fromGraphNode(gltf.scene);
            gltf.scene.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if(child.material.map) {
                        child.material.map.anisotropy = 4;
                    }
                }
            });

            this.helper_ = new OctreeHelper(this.worldOctree_);
            this.helper_.visible = false;
            this.scene_.add(this.helper_);

            const gui = new GUI ( {width: 200 } );
            gui.add( {debug:false}, 'debug' )
                .onChange( function ( value ) {
                    helper_.visible = value;
                });
        });
    }

    playerCollisions() {
        const result = this.worldOctree_.capsuleIntersect( this.playerCollider_ );

        this.playerOnFloor_ = false;

        if( result ) {
            this.playerOnFloor_ = result.normal.y > 0;

            this.playerCollider_.translate( result.normal.multiplyScalar( result.depth ) );
        }
    }

    updatePlayer( deltaTime ) {
        let damping = Math.exp(-4 * deltaTime) - 1;
        
        this.playerVelocity_.addScaledVector(this.playerVelocity_, damping);

        this.deltaPosition_ = this.playerVelocity_.clone().multiplyScalar( deltaTime );

        this.playerCollider_.translate(this.deltaPosition_ );

        this.playerCollisions();

        this.camera_.position.copy(this.playerCollider_.end);
    }

    playerSphereCollision(sphere) {
    
    }

    throwBall() {

    }

    getForwardVector() {
        this.camera_.getWorldDirection(this.playerDirection_);
        this.playerDirection_.y = 0;
        this.playerDirection_.normalize();

        //console.log(this.playerDirection_);
        return this.playerDirection_;

    }

    getSideVector() {
        this.camera_.getWorldDirection(this.playerDirection_);
        this.playerDirection_.y = 0;
        this.playerDirection_.normalize();
        this.playerDirection_.cross(this.camera_.up);

        return this.playerDirection_;

    }

    controls( deltaTime ) {

        // gives a bit of air control
        const speedDelta = deltaTime * ( this.playerOnFloor_ ? 25 : 8 );

        if ( this.keyStates_[ 'KeyW' ] ) {

            this.playerVelocity_.add( this.getForwardVector().multiplyScalar( speedDelta ) );

        }

        if ( this.keyStates_[ 'KeyS' ] ) {

            this.playerVelocity_.add( this.getForwardVector().multiplyScalar( - speedDelta ) );

        }

        if ( this.keyStates_[ 'KeyA' ] ) {

            this.playerVelocity_.add( this.getSideVector().multiplyScalar( - speedDelta ) );

        }

        if ( this.keyStates_[ 'KeyD' ] ) {

            this.playerVelocity_.add( this.getSideVector().multiplyScalar( speedDelta ) );

        }

        if ( this.playerOnFloor_ ) {

            if ( this.keyStates_[ 'Space' ] ) {

                this.playerVelocity_.y = 15;

            }

        }

    }

    onWindowResize_() {
        this.camera_.aspect = window.innerWidth / window.innerHeight;
        this.camera_.updateProjectionMatrix();

        this.threejs_.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        const deltaTime = Math.min(0.05, this.clock_.getDelta()) / 5;

        for (let i = 0; i<5; i++) {
            this.controls(deltaTime);
            this.updatePlayer(deltaTime);
        }

        this.threejs_.render(this.scene_, this.camera_);
        requestAnimationFrame( this.animate() );
    }

    raf_() {
        requestAnimationFrame((t) => {
            if (this.previousRAF_ === null) {
                this.previousRAF_ = t;
            }

            this.step_(t - this.previousRAF_);
            this.threejs_.autoClear = true;
            this.threejs_.render(this.scene_, this.camera_);
            this.previousRAF_ = t;
            this.raf_();
        })
    }

    step_(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        this.controls(timeElapsedS);
        this.updatePlayer(timeElapsedS);
    }
}

let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
    _APP = new World();
})