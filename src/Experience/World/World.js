import Experience from '../Experience'
import Loaders from '../Utils/Loaders'
import Lights from '../Lights'
import City from './City'
import ParticleHelper from '../Utils/ParticleHelper'
import { normalizeGoal } from '../Utils/helpers'
import Histogram from '../D3Charts/Histogram/Histogram'
import PovWorld from '../povWorld'
import { MAX_POV_AMOUNT } from '../Utils/constants'
import HiddenMap from '../D3Charts/HiddenMap/HiddenMap'

export default class World {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.visibilityEncoderService = this.experience.visibilityEncoderService
        this.gui = this.experience.gui
        this.birdsEye = this.experience.birdsEye

        this.particleHelper = new ParticleHelper()
        // this.hiddenMap      = new HiddenMap()
        this.hiddenMap      = this.experience.hiddenMap;

        this.histogram = new Histogram()

        this.loaders = new Loaders()

        this.lights = new Lights()
        this.city = new City()
        this.buildingMeshes = this.city.buildingMeshes

        this.city.loadModels()

        this.scene.add(this.lights.directionalLightA)
        this.scene.add(this.lights.directionalLightB)
        this.scene.add(this.lights.ambientLight)

        this.queryParameters = {};
        this.queryLocationParameters = {
            numLocations: {
                value: 5
            },
        }
        this.openessParameters = {}
        this.initializeOpenessParameters()
        this.setGUI()
    }
    setQueryParameters(dictionary) {
        this.queryParameters = {};
        dictionary.forEach(val => {
            const name = val['name'].toLowerCase()
            const percentage = val['value'] / 100;
            this.queryParameters[name] = percentage;
        })
        console.log(this.queryParameters);
    }
    initializeOpenessParameters() {
        const slidersRows = document.getElementsByClassName('sliderRow')

        for(let j = 0; j < slidersRows.length; j++) {
            for (let i = 0; i < slidersRows[j].children.length; i++) {
                if(slidersRows[j].children[i].nodeName == "INPUT" && slidersRows[j].children[i].type == "range") {
                    this.openessParameters[slidersRows[j].children[i].id] = parseInt(slidersRows[j].children[i].value) / 100
                }
            }
        }
        console.log(this.openessParameters);
    }
    getOpenessParameters(value, id) {
        this.openessParameters[id] = parseInt(value) / 100
        this.queryParameters = structuredClone(this.openessParameters)
    }
    setOpenessParameters() {
        this.queryParameters = structuredClone(this.openessParameters)
    }
    callQueryViewPoints() {
        var element = document.getElementById('plane-checkbox');
        if(element.checked == true) {
            this.callQueryLocationOnPlane()
        } else {
            this.callQueryLocation()
        }
    }
    callQueryLocation() {        
        this.visibilityEncoderService.queryLocation(
            this.queryLocationParameters.numLocations.value,
            1,
            this.queryParameters
        )
            .then(res => {
                console.log(res);
                this.updatePovInterface(res);
                this.experience.queryLocationParticles = this.particleHelper.plotParticlesWithDirection(res.data)
            })
            .catch(err => {
                console.error(err);
            })
    }

    callQueryLocationOnPlane() {     
        const plane = this.birdsEye.plane
        const planeScale = plane.scale
        const planeCenter = plane.position
        const planeWidth = plane.geometry.parameters.width * planeScale.x
        const planeHeight = plane.geometry.parameters.height * planeScale.z
        
        const planeDirections = this.birdsEye.getPlaneDirections()
        
        this.visibilityEncoderService.queryLocationOnPlane({
            numLocations: parseInt(document.querySelector('#numLocations').value),
            seed: 20,
            goals: this.queryParameters,
            pointOnPlane: [...planeCenter],
            direction1: planeDirections[0],
            direction2: planeDirections[1],
            radius: [planeWidth, planeHeight]
        })
            .then(res => {
                console.log(res);
                this.updatePovInterface(res);
                this.experience.queryLocationParticles = this.particleHelper.plotParticlesWithDirection(res.data)
                //Update Latent Features 2D map:
                this.hiddenMap.renderQueryOnHiddenMap(res.data)
            })
            .catch(err => {
                console.error(err);
            })
    }

    resetAndCreatePovs(res) {
        if(res == null) return;
        console.log(res);
        PovWorld.disposeAllPovWorlds();
        this.experience.povWorld.forEach(world => world.disposeWorld())
        this.experience.povWorld = []
        const povAmount = Math.min(res.data?.length, MAX_POV_AMOUNT);
        // const povAmount = Math.min(res.length, MAX_POV_AMOUNT);
        for(let i=0; i <  povAmount; i++) {
            this.experience.povWorld.push(new PovWorld(i))
        }
    }

    updatePovInterface(res) {
        if(res == null) return;
        this.resetAndCreatePovs(res);
        this.experience.povWorld.forEach((world) => {
            world.maxLocations = res.data.length
            world.updateViewPort(res.data)
            for(const gui of world.gui.viewportFolder.controllers) {
                gui.max(res.data.length - 1)
                gui.updateDisplay()
            }
        })
    }

    updatePovInterfaceAfterBrushOnHistogram(res) {
        if(res == null) return;
        console.log({res})
        this.resetAndCreatePovs(res);
        this.experience.povWorld .forEach((world) => {
            world.updateViewPort(res.data)
            for(const gui of world.gui.viewportFolder.controllers) {
                gui.max(res.length - 1)
                gui.updateDisplay()
            }
        })
    }

    setGUI() {
        this.gui.queryPositionFolder.add(this.queryLocationParameters.numLocations, 'value').min(1).max(10000).step(1).name('numLocations')

        // this.gui.queryPositionFolder.add(this.queryLocationParameters.building, 'value').min(0).max(1).step(0.01).name('building')
        // this.gui.queryPositionFolder.add(this.queryLocationParameters.water, 'value').min(0).max(1).step(0.01).name('water')
        // this.gui.queryPositionFolder.add(this.queryLocationParameters.tree, 'value').min(0).max(1).step(0.01).name('tree')
        // this.gui.queryPositionFolder.add(this.queryLocationParameters.sky, 'value').min(0).max(1).step(0.01).name('sky')

        this.gui.queryPositionFolder.add({
            callQueryLocation: () => {
                this.callQueryLocation()
            }
        }, 'callQueryLocation')

        this.gui.queryPositionFolder.add({
            callQueryLocationOnPlane: () => {
                this.callQueryLocationOnPlane()
            }
        }, 'callQueryLocationOnPlane')
    }
    update() {
        this.city.update()
    }
}