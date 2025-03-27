import { WebGLRenderer } from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { SAOPass } from 'three/addons/postprocessing/SAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

import Experience from './Experience.js'
import { REAL_WORLD_OBJECT_TO_COLOR } from './Utils/constants.js'

const startClearColor = REAL_WORLD_OBJECT_TO_COLOR['sky']
export default class Renderer {
    constructor() {
        this.experience = new Experience()
        this.canvas = this.experience.canvas
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene

        this.gui = this.experience.gui

        this.camera = this.experience.camera

        this.setInstance()
        this.enableAmbientOcclusion()
        this.setGUI()
    }

    enableAmbientOcclusion() {
        this.composer = new EffectComposer( this.instance )
        const renderPass = new RenderPass( this.scene, this.camera.instance )
        this.composer.addPass( renderPass )
        this.saoPass = new SAOPass( this.scene, this.camera.instance )

        this.setSaoParameters()

        this.composer.addPass( this.saoPass )
        const outputPass = new OutputPass()
        this.composer.addPass( outputPass )
    }

    setInstance() {
        this.instance = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            preserveDrawingBuffer: true,
            logarithmicDepthBuffer: false,
            powerPreference: "high-performance"
        })
        this.instance.setClearColor(startClearColor)
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }
    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }
    updateClearColor(color) {
        this.instance.setClearColor(color)
    }
    createImage(fileName) {
        const url = this.instance.domElement.toDataURL()

        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('target', '_blank')
        link.setAttribute('download', fileName)

        link.click()
    }

    setSaoParameters() {
        this.saoPass.params.saoIntensity = 0.05
        this.saoPass.params.saoScale = 14
        this.saoPass.params.saoKernelRadius = 15
        this.saoPass.params.saoMinResolution = 0.05
        this.saoPass.params.saoBlurRadius = 50
        this.saoPass.params.saoBlurStdDev = 15
        this.saoPass.enabled = false
    }

    setGUI() {
        this.gui.dataGenerationFolder.add({screenshot: () => {
            const randomName = (Math.random() + 1).toString(36).substring(7)
            this.createImage(randomName)
        }}, 'screenshot')

        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'output', {
            'Default': SAOPass.OUTPUT.Default,
            'SAO Only': SAOPass.OUTPUT.SAO,
            'Normal': SAOPass.OUTPUT.Normal
        } ).onChange( function ( value ) {
            this.saoPass.params.output = value
        } )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBias', - 1, 0.2 )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoIntensity', 0, 0.2 )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoScale', 0, 10 )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoKernelRadius', 1, 5 )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoMinResolution', 0, 0.2 )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBlur' )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBlurRadius', 0, 10 )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBlurStdDev', 0.5, 5 )
        this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBlurDepthCutoff', 0.0, 0.001 )

        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBias', - 1, 1 )
        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoIntensity', 0, 1 )
        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoScale', 0, 100 )
        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoKernelRadius', 1, 30 )
        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoMinResolution', 0, 1 )
        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBlur' )
        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBlurRadius', 0, 200 )
        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBlurStdDev', 0.5, 150 )
        // this.gui.ambientOcclusionFolder.add( this.saoPass.params, 'saoBlurDepthCutoff', 0.0, 0.1 )

        this.gui.ambientOcclusionFolder.add( this.saoPass, 'enabled' ).listen()
    }

    compile() {
        this.instance.compile(this.scene, this.camera.instance, this.instance.getRenderTarget())
    }

    update() {
        this.composer.render()
    }
}