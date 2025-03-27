import * as THREE from 'three'
import JEASINGS from 'jeasings'

import Experience from "./Experience"

import { WebGLRenderer } from 'three'
import { CAMERA_QUATERNIONS, REAL_WORLD_OBJECT_TO_COLOR } from "./Utils/constants"

const startClearColor = REAL_WORLD_OBJECT_TO_COLOR['sky']
export default class PovWorld {
    constructor(index) {
        this.index = index;

        this.experience = new Experience()

        this.camera = null
        this.scene = null
        this.sizes = this.experience.sizes

        this.gui = this.experience.gui

        this.locations = []
        this.maxLocations = 1
        this.currentLocationIndex = {
            value: this.index
        }
        this.createPovWorld(this.index);
        this.canvas = document.querySelector(`.webgl-pov${this.index}`);
        this.initScene(this.experience.povScene);
        this.canvas.addEventListener('click', () => {
            this.switchCameras();
        })
        this.animationDuration = 750

        this.setGUI()
    }
    static disposeAllPovWorlds() {
        document.querySelector('.galleryContent').innerHTML = ''
    }
    disposeWorld() {
        this.renderer.forceContextLoss()
        this.renderer.dispose()
        this.scene.remove(this.camera)
        this.camera = null
    }
    createPovWorld(index) {
        const webGlPovDiv = document.createElement('div');
        webGlPovDiv.className = 'galleryPovWorld'
        webGlPovDiv.id = `galleryPovWorld-${index}`
        webGlPovDiv.style.display = 'flex'
        webGlPovDiv.style.flexDirection = 'column'
        const canvas = document.createElement('canvas');
        canvas.className = `webgl-pov webgl-pov${index}`

        //https://stackoverflow.com/questions/6840326/how-can-i-create-and-style-a-div-using-javascript
        canvas.style.borderRadius = "5px"; 

        webGlPovDiv.appendChild(canvas)
        document.querySelector('.galleryContent').appendChild(webGlPovDiv);
        this.createTooltip(index)
    }
    createTooltip(index) {
        var tooltip = d3.select(`#galleryPovWorld-${index}`)
            .append("div")
            .style("visibility", "hidden")

        tooltip.node().classList.add("tooltip")
        tooltip.node().id = `chart${index}`


        d3.select(`#galleryPovWorld-${index}`)
            .on("mouseover", function () { return tooltip.style("visibility", "visible"); })
            .on("mouseout", function () { return tooltip.style("visibility", "hidden"); });
    }
    initScene(scene) {
        // clone of initial experience scene after loading all models
        this.scene = scene

        this.initCamera()

        this.renderer = new WebGLRenderer({
            canvas: document.querySelector(`canvas.webgl-pov${this.index}`)
        })
        const sizes = {
            height: document.querySelector('.galleryPovWorld').clientHeight,
            width: document.querySelector('.galleryPovWorld').clientWidth
        }
        this.renderer.setClearColor(startClearColor)
        this.renderer.setSize(sizes.width, sizes.height)
        this.renderer.setPixelRatio(this.sizes.pixelRatio)

        this.updateSceneOnce()
    }
    switchCameras() {
        this.experience.lastCameraPosition = this.camera.position;
        this.experience.lastCameraRotation = this.camera.rotation;

        this.animateCameraMovement();
    }
    animateCameraMovement() {
        new JEASINGS.JEasing(this.experience.camera.instance.position)
            .to(
                {
                    x: this.camera.position.x,
                    y: this.camera.position.y,
                    z: this.camera.position.z
                },
                this.animationDuration
            )
            .easing(JEASINGS.Cubic.Out)
            .start()
            .delay(250)
            .onComplete(() => this.animateCameraRotation())
    }
    animateCameraRotation() {
        new JEASINGS.JEasing(this.experience.camera.instance.quaternion)
            .to(
                {
                    x: this.camera.quaternion.x,
                    y: this.camera.quaternion.y,
                    z: this.camera.quaternion.z,
                    w: this.camera.quaternion.w,
                },
                this.animationDuration
            )
            .easing(JEASINGS.Cubic.Out)
            .start()
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            35,
            this.sizes.width / this.sizes.height,
            1,
            2500
        )
        this.camera.position.set(512, 100, 280)
        // this.instance.position.set(0, 100, 0)
        this.camera.lookAt(733, 55, 714) // random point on the lake

        // this.instance.position.set(337.87109375, -11.231389999389648,  -59.07550048828125)

        this.scene.add(this.camera)
    }
    updateTooltip() {
        // console.log(this.locations[this.index]['f_xyz'])
        // uncomment to use text tooltip
        this.createTextTooltip(this.index, this.locations[this.index]['f_xyz'])

        // uncomment to use piechart
        // this.experience.pieChart.createPieChart(
        //     this.index,
        //     this.locations[this.index]['f_xyz']
        // )
    }
    createTextTooltip(id, data) {
        console.log(data);
        const chartElement = document.querySelector(`#chart${id}`)
        chartElement.innerHTML = ''
        for(const key in data) {
            // console.log(key, data[key]);
            const p = document.createElement('p')
            p.textContent = `${key}: ${(data[key] * 100).toFixed(2)}%`
            p.style.borderRadius = "15px"; 
            chartElement.appendChild(p)
        }
    }
    updateViewPort(result) {
        this.locations = result
        // console.log(this.locations);
        this.updateCamera(this.index)
        this.updateTooltip()
    }
    updateCamera(index) {
        // update position
        const location = this.locations[index]
        // console.log({location})
        this.camera.position.set(
            location.x,
            location.y,
            location.z,
        )
        this.camera.rotation.set(
            THREE.MathUtils.degToRad(location.xh),
            THREE.MathUtils.degToRad(location.yh),
            THREE.MathUtils.degToRad(location.zh),
        )
        this.camera.updateProjectionMatrix()
        this.updateSceneOnce()
    }
    updateSceneOnce() {
        this.renderer.render(this.scene, this.camera)
    }
    setGUI() {
        this.gui.viewportFolder.add(
            this.currentLocationIndex, 'value'
        )
            .min(0)
            .max(this.maxLocations - 1)
            .step(1)
            .name(`POV ${this.index} Index`)
            .updateDisplay()
            .onFinishChange((index) => {
                this.updateCamera(index)
                this.experience.particleHelper.updateParticleColorAtIndex(index)
            })
    }
}