import * as THREE from 'three'
import JEASINGS from 'jeasings'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import World from './World/World.js'
import GUI from './Utils/GUI.js'
import RayCaster from './RayCaster.js'
import CharacterControls from './CharacterControls.js'
import Loaders from './Utils/Loaders.js'
import { BUILDING_COLOR_TO_OBJECT, BUILDING_OBJECT_TO_COLOR, COLOR_TO_OBJECT, DEPTH_SKY, OBJECT_TO_COLOR, REAL_WORLD_OBJECT_TO_COLOR, VIEW_MODES } from './Utils/constants.js'
import { createCsvColor, increaseMapFrequency, isGreyColor, roundColor } from './Utils/helpers.js'
import ScreenshotHelper from './Utils/ScreenshotHelper.js'
import VisibilityEncoder from '../Services/VisibilityEncoder.js'
import ParticleHelper from './Utils/ParticleHelper.js'
import BirdsEye from './BirdsEye.js'
import Histogram from './D3Charts/Histogram/Histogram.js'
import QueryTabs from './UserControls/QueryTabs.js'
import MultiThumbSlider from './UserControls/MultiThumbSLider.js'
import PieChart from './D3Charts/PieChart/pieChart.js'
// import HiddenMap from './D3Charts/HiddenMap/HiddenMap.js'

// import require from 'require';
// import { myFunction } from '../parallel.js';


let instance = null

export default class Experience {
    constructor(canvas) {
        // myFunction()
        // Singleton
        if (instance) {
            return instance
        }
        instance = this
        // Console access for debugging purpose
        window.experience = this

        // Options
        this.canvas = canvas

        // Debug
        this.gui = new GUI()

        // Service
        this.visibilityEncoderService = new VisibilityEncoder()

        // Setup
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.povScene = new THREE.Scene()
        this.camera = new Camera()
        this.characterControls = new CharacterControls()
        this.renderer = new Renderer()
        this.loaders = new Loaders()
        this.birdsEye = new BirdsEye()
        this.queryLocationParticles = [];


        // POV
        this.lastCameraPosition = null;
        this.lastCameraRotation = null;
        this.povWorld = []

        // World
        this.world = new World()
        this.buildingMeshes = this.world.buildingMeshes
        this.raycaster = new RayCaster()
        this.screenshotHelper = new ScreenshotHelper()

        this.particleHelper = new ParticleHelper()

        this.currentMode = VIEW_MODES.realWorld

        this.shouldUpdateOnTick = true


        // Charts
        // this.hiddenMap = new HiddenMap();
        this.hiddenMap = this.world.hiddenMap;
        this.pieChart = new PieChart();

        this.histogram = new Histogram();
        console.log("Histogram created");

        // User Controls
        this.multiThumbSlider = new MultiThumbSlider();
        this.queryTabs = new QueryTabs();

        // Events
        this.sizes.on('resize', () => {
            this.resize()
        })

        this.time.on('tick', () => {
            if (this.shouldUpdateOnTick) {
                this.update()
            }
        })

        this.setGUI()

        //Download json file of the building meshes if download_buildings_data is set to true.
        let downloadBuildingMeshes = false;
        // let downloadBuildingMeshes = true;
        if (downloadBuildingMeshes == true) {  
            /////testing local to global world coordinates    
            // setTimeout(() =>{
            //     console.log("buildingMeshes:", this.buildingMeshes);
            //     let buildingLocalPositions = this.buildingMeshes.map(mesh => 
            //         mesh.geometry.boundingSphere ? mesh.localToWorld(mesh.geometry.boundingSphere.center) : new THREE.Vector3(0,0,0)
            //         )
            //     console.log({buildingLocalPositions})
            // }, 5000)
            /////Just logging data
            // setTimeout(() =>{
            //     console.log("buildingMeshes:", this.buildingMeshes);
            // }, 40000)
            ///Actually downloading the building data:
            this.downloadBuildingsData(40000) //Set a timeout enough for full model to be loaded on the interface.
        }
        
        // this.hiddenMap.createHiddenMap(); 
        // this.hiddenMap.displayGlobalLocations();

        // setTimeout(() =>{
        //     this.hiddenMap.displayGlobalLocations();
        // }, 20000)
        
    }

    //Soluiton for asyncronous threejs calls.
    downloadBuildingsData(timeout) {
        //Download json file of the building meshes
        console.log("Retrieved building meshes:")
        console.log(this.buildingMeshes.length)
        console.log(this.buildingMeshes)
        console.log(Array.isArray(this.buildingMeshes))

        setTimeout(() => {
            console.log("Waited logging")
            console.log(this.buildingMeshes[0]); // Logs: [1, 2, 3]
            console.log(this.buildingMeshes.length); // Logs: [1, 2, 3]
            // let buildingData = this.buildingMeshes.map(mesh => mesh.userData)
            // let buildingData = this.buildingMeshes.map(mesh => Object.assign({}, mesh.userData, {"location":mesh.matrixWorld.elements.slice(12,15)}))
            // let buildingData = this.buildingMeshes.map(mesh => Object.assign({}, mesh.userData, {"location":mesh.geometry.boundingSphere.center}))
            let buildingData = this.buildingMeshes.map(mesh => 
                Object.assign({}, 
                    mesh.userData, 
                    {"Local Location": mesh.geometry.boundingSphere ? mesh.geometry.boundingSphere.center : new THREE.Vector3(0,0,0) },
                    {"World Location": mesh.geometry.boundingSphere ? mesh.localToWorld(mesh.geometry.boundingSphere.center) : new THREE.Vector3(0,0,0)}
                ))
            console.log(buildingData)
            const jsonBuildingData = JSON.stringify(buildingData, null, 4);
            const blob = new Blob([jsonBuildingData], { type: 'application/json' });
            const url = URL.createObjectURL(blob); // Create a URL for the Blob
            const a = document.createElement('a'); // Create a <a> element
            a.href = url;
            a.download = 'buildingsData.json'; // Set the file name
            document.body.appendChild(a); // Append the link to the body
            a.click(); // Programmatically click the link to trigger the download
            document.body.removeChild(a); // Remove the link when done
            URL.revokeObjectURL(url); // Release the URL object to free memory

        }, timeout);
    }

    setGUI() {
        this.gui.endpointsFolder.add({
            callTestEncoderOnCurrentPosition: () => {
                this.callTestEncoderOnCurrentPosition()
            }
        }, 'callTestEncoderOnCurrentPosition')
        this.gui.dataGenerationFolder.add({
            enableDepthMode: () => {
                this.enableDepthMode()
            }
        }, 'enableDepthMode')
        this.gui.dataGenerationFolder.add({
            enableVisibilityMode: () => {
                this.enableVisibilityMode()
            }
        }, 'enableVisibilityMode')
        this.gui.dataGenerationFolder.add({
            enableBuildingDataMode: () => {
                this.enableBuildingDataMode()
            }
        }, 'enableBuildingDataMode')
        this.gui.dataGenerationFolder.add({
            enableRealWorldMode: () => {
                this.enableRealWorldMode()
            }
        }, 'enableRealWorldMode')
        this.gui.dataGenerationFolder.add({
            countColorOfPixels: () => {
                this.countColorOfPixels(true)
            }
        }, 'countColorOfPixels')

        this.gui.dataGenerationFolder.add({
            generateImagesAndCsv: () => {
                this.screenshotHelper.generateImages(
                    this.world.city.filteredScreenshotPositions,
                    true
                )
            }
        }, 'generateImagesAndCsv')

        this.gui.dataGenerationFolder.add({
            generateCsvOnly: () => {
                this.screenshotHelper.generateImages(
                    this.world.city.filteredScreenshotPositions,
                    false
                )
            }
        }, 'generateCsvOnly')
    }
    countColorOfPixels(shouldLogResults = false) {
        if (this.currentMode == VIEW_MODES['realWorld']) {
            console.warn('This method should not be used on Real World Rendering')
            return
        }
        const gl = this.renderer.instance.getContext()
        const readPixelBuffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, readPixelBuffer)

        if (this.currentMode == VIEW_MODES['visibility']) {
            return this.countColorVisiblityMode(readPixelBuffer, shouldLogResults)
        }
        if (this.currentMode == VIEW_MODES['buildingData']) {
            return this.countColorBuildingDataMode(readPixelBuffer, shouldLogResults)
        }
        if (this.currentMode == VIEW_MODES['depth']) {
            this.countColorDepthMode(readPixelBuffer)
            return
        }

        console.warn('unexpected view mode')
    }
    countColorVisiblityMode(readPixelBuffer, shouldLogResults) {
        let csvLine = []
        const colorMap = {}
        for (let i = 0; i < readPixelBuffer.length; i += 4) {
            let color = [
                readPixelBuffer[i],
                readPixelBuffer[i + 1],
                readPixelBuffer[i + 2]
            ]
            color = roundColor(color)

            if (!(color in COLOR_TO_OBJECT)) {
                increaseMapFrequency('unknown', colorMap)

                continue
            }
            increaseMapFrequency(color, colorMap)
        }
        // console.log('Camera position and quaternion:')
        // console.log(this.camera.instance.position)

        csvLine.push(`${this.camera.instance.position.x.toFixed(1)}`)
        csvLine.push(`${this.camera.instance.position.y.toFixed(1)}`)
        csvLine.push(`${this.camera.instance.position.z.toFixed(1)}`)

        // console.log(this.camera.instance.quaternion)
        // csvLine.push(`${this.camera.instance.rotation.x * (180 / Math.PI)}`)
        // csvLine.push(`${this.camera.instance.rotation.y * (180 / Math.PI)}`)
        // csvLine.push(`${this.camera.instance.rotation.z * (180 / Math.PI)}`)
        
        /*World Roation Angles - 02.03.2025*/
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(this.camera.instance.matrixWorld);
        // Convert to Euler angles
        const euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix, 'YXZ');
        // Convert radians to degrees
        const rotX = THREE.MathUtils.radToDeg(euler.x);
        const rotY = THREE.MathUtils.radToDeg(euler.y);
        const rotZ = THREE.MathUtils.radToDeg(euler.z);
        csvLine.push(`${rotX.toFixed(1)}`)
        csvLine.push(`${rotY.toFixed(1)}`)
        csvLine.push(`${rotZ.toFixed(1)}`)

        //Sperical coordinates 01.31.2025
        /*
        const cameraDirection = new THREE.Vector3();
        this.camera.instance.getWorldDirection(cameraDirection); // Get forward direction of camera
        // Compute angles in spherical coordinates
        const spherical = new THREE.Spherical().setFromVector3(cameraDirection);
        const theta = THREE.MathUtils.radToDeg(spherical.theta); // Horizontal viewing angle
        const phi = THREE.MathUtils.radToDeg(spherical.phi); // Vertical viewing angle
        csvLine.push(`${phi}`)
        csvLine.push(`${theta}`)
        */


        const totalPixels = readPixelBuffer.length / 4
        if (shouldLogResults) {
            console.log('Visibility of canvas:')
            for (const color in colorMap) {
                if (color in COLOR_TO_OBJECT) {
                    console.log(`${COLOR_TO_OBJECT[color]}: ${colorMap[color] * 100 / totalPixels}% | ${colorMap[color]} pixels`)
                } else {
                    console.log(`${color}: ${colorMap[color] * 100 / totalPixels}% | ${colorMap[color]} pixels`)
                }
            }
        }

        csvLine.push(createCsvColor(colorMap))
        return csvLine
    }
    countColorBuildingDataMode(readPixelBuffer, shouldLogResults) {
        let csvLine = []
        const colorMap = {}
        for (let i = 0; i < readPixelBuffer.length; i += 4) {
            let color = [
                readPixelBuffer[i],
                readPixelBuffer[i + 1],
                readPixelBuffer[i + 2]
            ]
            color = roundColor(color)

            if (!(color in COLOR_TO_OBJECT)) {
                increaseMapFrequency('unknown', colorMap)

                continue
            }
            increaseMapFrequency(color, colorMap)
        }
        // console.log('Camera position and quaternion:')
        // console.log(this.camera.instance.position)

        csvLine.push(`${this.camera.instance.position.x.toFixed(1)}`)
        csvLine.push(`${this.camera.instance.position.y.toFixed(1)}`)
        csvLine.push(`${this.camera.instance.position.z.toFixed(1)}`)

        // console.log(this.camera.instance.quaternion)
        // csvLine.push(`${this.camera.instance.rotation.x * (180 / Math.PI)}`)
        // csvLine.push(`${this.camera.instance.rotation.y * (180 / Math.PI)}`)
        // csvLine.push(`${this.camera.instance.rotation.z * (180 / Math.PI)}`)

        /*World Roation Angles - 02.03.2025*/
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(this.camera.instance.matrixWorld);
        // Convert to Euler angles
        const euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix, 'YXZ');
        // Convert radians to degrees
        const rotX = THREE.MathUtils.radToDeg(euler.x);
        const rotY = THREE.MathUtils.radToDeg(euler.y);
        const rotZ = THREE.MathUtils.radToDeg(euler.z);
        csvLine.push(`${rotX.toFixed(1)}`)
        csvLine.push(`${rotY.toFixed(1)}`)
        csvLine.push(`${rotZ.toFixed(1)}`)

        //Sperical coordinates 01.31.2025
        /*
        const cameraDirection = new THREE.Vector3();
        this.camera.instance.getWorldDirection(cameraDirection); // Get forward direction of camera
        // Compute angles in spherical coordinates
        const spherical = new THREE.Spherical().setFromVector3(cameraDirection);
        const theta = THREE.MathUtils.radToDeg(spherical.theta); // Horizontal viewing angle
        const phi = THREE.MathUtils.radToDeg(spherical.phi); // Vertical viewing angle
        csvLine.push(`${phi}`)
        csvLine.push(`${theta}`)
        */

        const totalPixels = readPixelBuffer.length / 4
        if (shouldLogResults) {
            console.log('Visibility of canvas:')
            for (const color in colorMap) {
                if (color in BUILDING_COLOR_TO_OBJECT) {
                    console.log(`${BUILDING_COLOR_TO_OBJECT[color]}: ${colorMap[color] * 100 / totalPixels}% | ${colorMap[color]} pixels`)
                } else {
                    console.log(`${color}: ${colorMap[color] * 100 / totalPixels}% | ${colorMap[color]} pixels`)
                }
            }
        }

        csvLine.push(createCsvColor(colorMap, this.currentMode))
        return csvLine
    }
    countColorDepthMode(readPixelBuffer) {
        console.log('COLOR DEPTH MODE')
        const colorMap = {}
        let totalGreyPixel = 0
        let sumGreyColor = 0
        for (let i = 0; i < readPixelBuffer.length; i += 4) {
            let color = [
                readPixelBuffer[i],
                readPixelBuffer[i + 1],
                readPixelBuffer[i + 2]
            ]
            if (isGreyColor(color)) {
                increaseMapFrequency(color, colorMap)
                sumGreyColor += color[0]
                totalGreyPixel += 1
            }
        }
        console.log('Camera position and quaternion:')
        console.log(this.camera.instance.position)
        console.log(this.camera.instance.quaternion)
        console.log('Visibility of canvas:')
        const averageGreyColor = sumGreyColor / totalGreyPixel
        console.log(`Average grey color: ${averageGreyColor}, ${averageGreyColor}, ${averageGreyColor}`)
        console.log(`Avg visibility depth is ${averageGreyColor * 100 / 255}%`)
    }
    getCameraCoordinates() {
        let csvLine = []

        csvLine.push(`${this.camera.instance.position.x}`)
        csvLine.push(`${this.camera.instance.position.y}`)
        csvLine.push(`${this.camera.instance.position.z}`)

        // csvLine.push(`${this.camera.instance.rotation.x * (180 / Math.PI)}`)
        // csvLine.push(`${this.camera.instance.rotation.y * (180 / Math.PI)}`)
        // csvLine.push(`${this.camera.instance.rotation.z * (180 / Math.PI)}`)

        /*World Roation Angles - 02.03.2025*/
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(this.camera.instance.matrixWorld);
        // Convert to Euler angles
        const euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix, 'YXZ');
        // Convert radians to degrees
        const rotX = THREE.MathUtils.radToDeg(euler.x);
        const rotY = THREE.MathUtils.radToDeg(euler.y);
        const rotZ = THREE.MathUtils.radToDeg(euler.z);
        csvLine.push(`${rotX}`)
        csvLine.push(`${rotY}`)
        csvLine.push(`${rotZ}`)

        //Sperical coordinates 01.31.2025
        /*
        const cameraDirection = new THREE.Vector3();
        this.camera.instance.getWorldDirection(cameraDirection); // Get forward direction of camera
        // Compute angles in spherical coordinates
        const spherical = new THREE.Spherical().setFromVector3(cameraDirection);
        const theta = THREE.MathUtils.radToDeg(spherical.theta); // Horizontal viewing angle
        const phi = THREE.MathUtils.radToDeg(spherical.phi); // Vertical viewing angle
        csvLine.push(`${phi}`)
        csvLine.push(`${theta}`)
        */
        
        return csvLine
    }

    enableDepthMode() {
        const start = performance.now()

        this.currentMode = VIEW_MODES['depth']
        this.world.city.setMaterialByMode(VIEW_MODES['depth'])
        this.world.lights.setDirectionalLight(false)
        this.renderer.updateClearColor(`rgb(${DEPTH_SKY})`)
        this.renderer.saoPass.enabled = false
        const end = performance.now()
        console.log(`Execution time: ${end - start} ms`)
    }
    enableVisibilityMode() {
        const start = performance.now()

        this.currentMode = VIEW_MODES['visibility']
        this.world.city.setMaterialByMode(VIEW_MODES['visibility'])
        this.world.lights.setDirectionalLight(false)
        this.renderer.updateClearColor(`rgb(${OBJECT_TO_COLOR['sky']})`)
        this.renderer.saoPass.enabled = false
        
        const end = performance.now()
        console.log(`Execution time: ${end - start} ms`)
    }
    enableBuildingDataMode() {
        const start = performance.now()

        this.currentMode = VIEW_MODES['buildingData']
        this.world.city.setMaterialByMode(VIEW_MODES['buildingData'])
        this.world.lights.setDirectionalLight(false)
        this.renderer.updateClearColor(`rgb(${BUILDING_OBJECT_TO_COLOR['miscelaneous']})`)
        this.renderer.saoPass.enabled = false
        
        const end = performance.now()
        console.log(`Execution time: ${end - start} ms`)
    }
    enableRealWorldMode() {
        const start = performance.now()


        THREE.ColorManagement.enabled = false;
        THREE.ColorManagement.legacyMode = true;

        this.currentMode = VIEW_MODES['realWorld']
        this.world.city.setMaterialByMode(VIEW_MODES['realWorld'])
        this.world.lights.setDirectionalLight(true)
        this.renderer.updateClearColor(`${REAL_WORLD_OBJECT_TO_COLOR['sky']}`)
        this.renderer.saoPass.enabled = true
        const end = performance.now()
        console.log(`Execution time: ${end - start} ms`)

    }

    callTestEncoderOnCurrentPosition() {
        const mockF_xyz = '[8409,5857,0,743,6027,275462,752078,0]'
        const requestData = {
            'x': this.camera.instance.position.x,
            'y': this.camera.instance.position.y,
            'z': this.camera.instance.position.z,
            'xh': this.camera.instance.rotation.x * (180 / Math.PI),
            'yh': this.camera.instance.rotation.y * (180 / Math.PI),
            'zh': this.camera.instance.rotation.z * (180 / Math.PI),
            'f_xyz': mockF_xyz,
            'image_name': 'mockImageName'
        }
        this.visibilityEncoderService.testEncoderOnCurrentPosition(requestData)
            .then(result => {
                console.log(result.data[0].camera_coordinates)
                console.log(result.data[0].predictions)
                this.visibilityEncoderService.printPredictionArray(
                    result.data[0].predictions
                )
            })
            .catch(e => console.error(e))
    }

    resize() {
        this.camera.resize()
        this.renderer.resize()
    }
    update() {
        this.camera.update()
        this.renderer.update()
        this.raycaster.update()
        this.world.update()
        this.characterControls.update()
        JEASINGS.update()
    }
}