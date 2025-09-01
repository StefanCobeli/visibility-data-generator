import Experience from "./Experience"

import * as THREE from 'three'
import JEASINGS from 'jeasings'

import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { getDistance3D, getVertex, normalize3DCoord, subtractVectors } from "./Utils/helpers";

export default class BirdsEye {
    constructor() {
        this.experience = new Experience()
        this.canvas = this.experience.canvas
        this.camera = this.experience.camera
        this.controls = this.experience.characterControls
        this.scene = this.experience.scene
        this.gui = this.experience.gui

        this.plane = null;

        this.setGUI()
    }

    setCameraPositionLakeFacade() {
        const cameraPosition = {x: 3083.4403115020214, y: 183.08829851055833, z: 1597.4163062514085}
        // -7.437792976827618,  55.7431423000247,  -1.7641486363351758e-14
        const cameraRotation = {
            x: THREE.MathUtils.degToRad(-7.437792976827618), y: THREE.MathUtils.degToRad(55.7431423000247), z: THREE.MathUtils.degToRad(-1.7641486363351758e-14)
        }
        this.setCameraParameters(cameraPosition, cameraRotation)
    }

    setCameraPositionStreet(){
        const cameraPosition = {x: 1834.6653186615072, y: 55.28989447079854, z: 1091.2480561173586}
        // -6.291877386565971,  140.88467065646557,  -4.199775357469028e-14
        const cameraRotation = {
            x: THREE.MathUtils.degToRad(-6.291877386565971), y: THREE.MathUtils.degToRad(140.88467065646557), z: THREE.MathUtils.degToRad(-4.199775357469028e-14)
        }
        this.setCameraParameters(cameraPosition, cameraRotation)
    }

    setCameraPark(){
        const cameraPosition = {x: 165.1595479209716, y: 119.2755234039048, z: 1597.8762839711906}
        // -3.312496851885768,  -82.17841630726844,  -5.993432096049718e-14
        const cameraRotation = {
            x: THREE.MathUtils.degToRad(-3.312496851885768), y: THREE.MathUtils.degToRad(-82.17841630726844), z: THREE.MathUtils.degToRad(-5.993432096049718e-14)
        }
        this.setCameraParameters(cameraPosition, cameraRotation)
    }

    setCameraParameters(cameraPosition, cameraRotation){
        const cameraFar = 7500
        new JEASINGS.JEasing(this.camera.instance.position)
            .to(
                {
                    ...cameraPosition
                },
                500
            )
            .easing(JEASINGS.Cubic.Out)
            .start()
            new JEASINGS.JEasing(this.camera.instance.rotation)
                .to(
                    {
                        ...cameraRotation
                    },
                    500
                )
                .easing(JEASINGS.Cubic.Out)
                .start()
        this.camera.instance.far = cameraFar
        this.camera.instance.updateProjectionMatrix()
    }

    setBirdsEyeCamera() {
        const cameraPosition = {
            x: 1222.9460847744015,
            y: 798.3564726279227,
            z: -4474.680415156037,
        }
        const cameraRotation = {
            x: THREE.MathUtils.degToRad(-171.40058214768743), 
            y: THREE.MathUtils.degToRad(-1.9564645442454736), 
            z: THREE.MathUtils.degToRad(-179.7041930116)
        }
        const cameraFar = 7500

        new JEASINGS.JEasing(this.camera.instance.position)
            .to(
                {
                    ...cameraPosition
                },
                500
            )
            .easing(JEASINGS.Cubic.Out)
            .start()
            new JEASINGS.JEasing(this.camera.instance.rotation)
                .to(
                    {
                        ...cameraRotation
                    },
                    500
                )
                .easing(JEASINGS.Cubic.Out)
                .start()
        this.camera.instance.far = cameraFar
        this.camera.instance.updateProjectionMatrix()
    }

    //setFrontalViewCamera() { pos = {-1920, 1730, 560}, rot = {-105, -60, -105} }

    setTopViewCamera() {
        const cameraPosition = {
            x: 1231.608912861777,
            y:5292.627571294003,
            z:367.8714101460512,
        }
        const cameraRotation = {
            x: -1.5762670718082101, 
            y: -0.04848892572073814, 
            z: -1.6831906282366547
        }
        const cameraFar = 6000

        
        console.log(cameraRotation, cameraPosition)

        new JEASINGS.JEasing(this.camera.instance.position)
            .to(
                {
                    ...cameraPosition
                },
                500
            )
            .easing(JEASINGS.Cubic.Out)
            .start()
            new JEASINGS.JEasing(this.camera.instance.rotation)
                .to(
                    {
                        ...cameraRotation
                    },
                    500
                )
                .easing(JEASINGS.Cubic.Out)
                .start()
        this.camera.instance.far = cameraFar
        this.camera.instance.updateProjectionMatrix()
    }

    disposePlane() {
        if(this.plane == null) return;

        this.scene.remove(this.plane);
        this.scene.remove(this.transformControls);
        this.plane.geometry.dispose();
        this.plane.material.dispose();
        this.transformControls.dispose()
        this.plane = null;
        this.transformControls = null;
    }
    togglePlane() {
        var element = document.getElementById('plane-checkbox');
        if(element.checked == true) {
            this.addPlane()
        } else {
            this.disposePlane()
        }
    }
    addStreetPlane(){
        this.disposePlane()
        this.setTransformControls()

        const geometry = new THREE.PlaneGeometry(2000, 1000, 1, 1)
        geometry.rotateX(Math.PI * 0.5)

        const material = new THREE.MeshBasicMaterial({
            color: 'teal',
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
        })
        this.plane = new THREE.Mesh(geometry, material)
        this.plane.position.set(
            1689.921323470862,
            24.90033517884177,
            832.5969455267501,
        )        

        this.plane.rotation.set(-0.004059820241478084
            , -0.49919566973695967, -0.03061909652818535)
  
        this.plane.scale.set(0.5562019512335841, 1, 0.030994724123535735)
        this.transformControls.attach(this.plane)

        this.scene.add(this.plane)
    }
    addPlane() {
        this.setTransformControls()

        const geometry = new THREE.PlaneGeometry(2000, 1000, 1, 1)
        geometry.rotateX(Math.PI * 0.5)

        const material = new THREE.MeshBasicMaterial({
            color: 'teal',
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
        })
        this.plane = new THREE.Mesh(geometry, material)
        //Overaching plane parameters v1
        // this.plane.position.set(
        //     1474,
        //     45,
        //     1110
        // )
        // this.plane.rotation.set(-0.019, -0.160, -0.017)
        // this.plane.scale.set(1.4, 1, 1.6)
        //Overaching plane parameters v2
        this.plane.position.set(
            1510.1877989871039,
            40.78571191458468,
            1085.889975096684,
        )
        this.plane.rotation.set(-0.008375958724445198
            , -0.16511212811059173, -0.009660297603200701)
        this.plane.scale.set(1.3921600270881098, 1, 1.6242933499781063)
        // this.plane.position.set(
        //     1480,
        //     80,
        //     670
        // )
        //position
        // x: 1460.
        // y: 45.
        // z: 1090.
        //rotation:
        //-0.019, -0.160, -0.017
        //scale: 
        //x:1.4, y:1, z:1.6
        this.transformControls.attach(this.plane)

        this.scene.add(this.plane)
    }

    getPlaneDirections() {
        const directions = []
        
        // get position attribute after applying rotation to the plane
        const newGeometry = this.plane.geometry.clone()
        newGeometry.applyMatrix4( this.plane.matrix );
        
        const planePosition = newGeometry.attributes.position.array
        let AB, AC, AD
        let p0, p1, p2, p3

        p0 = getVertex(planePosition, 0)
        p1 = getVertex(planePosition, 1)
        p2 = getVertex(planePosition, 2)
        p3 = getVertex(planePosition, 3)

        AB = subtractVectors(p0, p1)
        AC = subtractVectors(p0, p2)
        AD = subtractVectors(p0, p3)

        let distAB, distAC, distAD
        distAB = getDistance3D(p0, p1)
        distAC = getDistance3D(p0, p2)
        distAD = getDistance3D(p0, p3)
        const distances = [distAB, distAC, distAD]

        const maxDistance = Math.max(...distances)
        if(distAB != maxDistance) {
            directions.push(normalize3DCoord(AB))
        }
        if(distAC != maxDistance) {
            directions.push(normalize3DCoord(AC))
        }
        if(distAD != maxDistance) {
            directions.push(normalize3DCoord(AD))
        }

        return directions
    }


    setTransformControls() {
        if(this.transformControls != null) return;
        
        this.transformControls = new TransformControls( this.camera.instance, this.canvas );

        this.scene.add(this.transformControls)
        this.transformControls.addEventListener( 'dragging-changed', (event) => {
            this.controls.outsideLock = event.value
        } );

        window.addEventListener( 'keydown', (event) => {
            switch (event.key) {
                case 't':
                    this.transformControls.setMode( 'translate' );
                    break;

                case 'r':
                    this.transformControls.setMode( 'rotate' );
                    break;

                case 'y':
                    this.transformControls.setMode( 'scale' );
                    break;

            }

        } );
    }

    setGUI() {
        this.gui.birdsEyeFolder.add({
            setBirdsEyeCamera: () => {
                this.setBirdsEyeCamera()
            }
        }, 'setBirdsEyeCamera')
        this.gui.birdsEyeFolder.add({
            setTopViewCamera: () => {
                this.setTopViewCamera()
            }
        }, 'setTopViewCamera')
        this.gui.birdsEyeFolder.add({
            addPlane: () => {
                this.addPlane()
            }
        }, 'addPlane')
        this.gui.birdsEyeFolder.add({
            removePlane: () => {
                this.disposePlane()
            }
        }, 'removePlane')
        this.gui.birdsEyeFolder.add({
            logPlane: () => {
                if(this.plane != null) {
                    console.log(this.plane)
                }
                this.getPlaneDirections()
            }
        }, 'logPlane')
    }
}
