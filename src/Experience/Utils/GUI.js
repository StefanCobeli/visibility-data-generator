import * as dat from 'lil-gui'

export default class GUI {
    constructor() {
        const enableGUI = import.meta.env.DEV
        this.instance = new dat.GUI()
        this.debugObject = {}

        if(!enableGUI) {
        // if(true){
            this.instance.hide()
        }

        this.dataVisualizationFolder = this.instance.addFolder('Data Visualization')
            .close()
        this.endpointsFolder = this.instance.addFolder('Endpoints')
            .close()
        this.dataGenerationFolder = this.instance.addFolder('Data Generation')
            .close()
        this.cameraFolder = this.instance.addFolder('Camera')
            .close()
        this.lightsFolder = this.instance.addFolder('Lights')
            .close()
        this.ambientOcclusionFolder = this.instance.addFolder('Ambient Occlusion')
            .close()
        this.queryPositionFolder = this.instance.addFolder('Query Position')
            .close()
        this.viewportFolder = this.instance.addFolder('Viewport')
            .close()
        this.birdsEyeFolder = this.instance.addFolder('BirdsEye')
            .close()
        this.sampleControls = this.instance.addFolder('SampleControls')
                .close()
            
        
        this.facadesFolder = this.instance.addFolder('Facades')
    }
}
