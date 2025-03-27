import * as THREE from 'three'

import Experience from '../Experience'
import { sc1 } from '../Utils/screenshotPositions.js'
import { getDistance3D } from './helpers.js'
import { CAMERA_LOOKAT } from './constants.js'
import EventEmitter from './EventEmitter'

let instance = null

export default class ParticleHelper extends EventEmitter {
    constructor() {
        // singleton
        if (instance) {
            return instance
        }
        super()
        instance = this

        this.experience = new Experience()
        this.scene = this.experience.scene
        this.gui = this.experience.gui

        this.lastResult = undefined

        this.visibilityOptions = {
            building: 0,
            water: 1,
            tree: 2,
            sky: 3,
        }
        this.currentVisibility = 'building'

        this.points;
        this.pointsWithDirection;
        this.arrowHelpersGroup;
        // this.material = new THREE.PointsMaterial({
        //     size: 10,
        //     color: 'green',
        //     sizeAttenuation: false,
        // })

        // this.queryMaterial = new THREE.PointsMaterial({
        //     size: 10,
        //     color: 'orange',
        //     sizeAttenuation: false,
        // })
        this.queryMaterial = new THREE.MeshBasicMaterial({
            color: 'orange',
        })
        this.material = new THREE.MeshBasicMaterial({
            color: '#6F31EC',
        })

        
        this.selectedMaterial = new THREE.PointsMaterial({
            size: 10,
            color: new THREE.Color('#ffff00'),
            sizeAttenuation: false,
        })

        this.currentLookAt = 0
        this.createLookAtParticle()
        this.setGUI()
    }
    createLookAtParticle() {
        // const position = CAMERA_LOOKAT[this.currentLookAt]
        const position = new THREE.Vector3(
            0,
            0,
            0
        )
        const material = new THREE.PointsMaterial({
            size: 50,
        })
        const geometry = new THREE.BufferGeometry()
        this.lookAtParticle = new THREE.Points(geometry, material)
        this.lookAtParticle.position.set(position)

        this.scene.add(this.lookAtParticle)
    }
    updateLookAtParticle() {
    }
    updateLookAtParticlesForVisibilityEncoder() {
        this.currentLookAt += 1
        this.currentLookAt %= 6

        // this.points.geometry = this.lookAtResults[this.currentLookAt].geometry
        this.resetResultPoints()
        this.plotParticlesForVisibilityEnconderResult(this.lastResult)
    }
    plotParticlesForVisibilityEnconderResult(result) {

        this.lastResult = result;
        this.trigger("updatedQueryResult");
        this.lookAtResults = [
            {
                // we divide by 6 because we have 6 lookAt positions
                geometry: new THREE.BufferGeometry(),
                positions: new Float32Array(result.length * 3 / 6),
                colors: new Float32Array(result.length * 3 / 6) // *3 cuz RGB
            },
            {
                // we divide by 6 because we have 6 lookAt positions
                geometry: new THREE.BufferGeometry(),
                positions: new Float32Array(result.length * 3 / 6),
                colors: new Float32Array(result.length * 3 / 6) // *3 cuz RGB
            },
            {
                // we divide by 6 because we have 6 lookAt positions
                geometry: new THREE.BufferGeometry(),
                positions: new Float32Array(result.length * 3 / 6),
                colors: new Float32Array(result.length * 3 / 6) // *3 cuz RGB
            },
            {
                // we divide by 6 because we have 6 lookAt positions
                geometry: new THREE.BufferGeometry(),
                positions: new Float32Array(result.length * 3 / 6),
                colors: new Float32Array(result.length * 3 / 6) // *3 cuz RGB
            },
            {
                // we divide by 6 because we have 6 lookAt positions
                geometry: new THREE.BufferGeometry(),
                positions: new Float32Array(result.length * 3 / 6),
                colors: new Float32Array(result.length * 3 / 6) // *3 cuz RGB
            },
            {
                // we divide by 6 because we have 6 lookAt positions
                geometry: new THREE.BufferGeometry(),
                positions: new Float32Array(result.length * 3 / 6),
                colors: new Float32Array(result.length * 3 / 6) // *3 cuz RGB
            },

        ]
        console.log("Result examples:", result[0], result[result.length-1])
        for (let i = 0; i < result.length - result.length%6;) {
            //console.log("Result examples, before crushing:", result[i])
            
            for (let j = 0; j < 6; j++) { // we have 6 lookAt positions
                // if (i == result.length){
                //     break
                // }
                const lookAtIndex = Math.floor(i / 6) * 3
                this.lookAtResults[j].positions[lookAtIndex + 0] = result[i].camera_coordinates[0]
                this.lookAtResults[j].positions[lookAtIndex + 1] = result[i].camera_coordinates[1]
                this.lookAtResults[j].positions[lookAtIndex + 2] = result[i].camera_coordinates[2]
                
                const color = this.setColorBasedOnVisibility(result[i].predictions)
                // const color = new Float32Array([251*result[i].predictions.building
                //     , 128 * result[i].predictions.building
                //     , 114 * result[i].predictions.building]) 
                
                this.lookAtResults[j].colors[lookAtIndex + 0] = color[0]
                this.lookAtResults[j].colors[lookAtIndex + 1] = color[1]
                this.lookAtResults[j].colors[lookAtIndex + 2] = color[2]
                i++
            }
            
        }
        this.lookAtResults.forEach(result => {
            result.geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(result.positions, 3)
            )
            result.geometry.setAttribute(
                'color',
                new THREE.BufferAttribute(result.colors, 3)
            )
        })


        
        // material
        const material = new THREE.PointsMaterial({
            size: 3,
        })
        material.vertexColors = true

        // points
        this.points = new THREE.Points(this.lookAtResults[this.currentLookAt].geometry, material)
        this.points.geometry.buffersNeedUpdate = true

        this.scene.add(this.points)
    }
    resetArrowGroup(group) {
        if (!group) {
            return
        }
        this.scene.remove(group)
        group.traverse(child => {
            child?.dipose?.()
            child?.material?.dispose?.()
            child?.geometry?.dispose?.()
        })
        group = undefined
    }
    resetPoints(points) {
        if (!points) {
            return
        }
        this.scene.remove(points)
        // points.material.dispose()
        points.children.forEach(obj => {
            obj.material.dispose?.()
            obj.geometry.dispose?.()
        })

        // points.geometry.dispose()
        points = undefined
    }
    resetQueryLocationPoints(points) {
        if (!points) {
            return
        }
        this.scene.remove(points)
        // points.material.dispose()
        points.children.forEach(obj => {
            obj.material.dispose?.()
            obj.geometry.dispose?.()
        })

        // points.geometry.dispose()
        points = undefined
    }
    resetResultPoints() {
        this.resetPoints(this.points)
    }
    resetRadiusPoints() {
        this.resetPoints(this.radiusPoints)
    }
    updateParticleColors(visibility) {
        if (!this.points) {
            return
        }
        this.resetResultPoints()
        this.currentVisibility = visibility
        this.plotParticlesForVisibilityEnconderResult(this.lastResult)
    }
    setColorBasedOnVisibility(predictions) {
        const color = [0, 0, 0]
        switch (this.currentVisibility) {
            case 'building': //building
                color[0] = predictions[0]
                break
            case 'water':
                color[2] = predictions[1]
                break
            case 'tree':
                color[1] = predictions[2]
                break
            case 'sky':
                color[0] = predictions[3]
                color[1] = predictions[3]
                color[2] = predictions[3]
                break
        }
        return color
    }
    plotParticles(particles) {
        // create particles
        this.resetQueryLocationPoints(this.pointsWithDirection)
        
        const geometry = new THREE.BufferGeometry()
        const positions = particles.reduce((arr, particle) => {
            arr.push(particle.x)
            arr.push(particle.y)
            arr.push(particle.z)
            return arr;
        }, []);
        const particlePosition = new Float32Array(positions)

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(particlePosition, 3)
        )
        // const points = new THREE.Points(geometry, material)
        const points = []

        // create arrows
        const arrowGroup = new THREE.Group();
        const pointGroup = new THREE.Group();

        let index = 0;
        for (const particle of particles) {
            const position = [particle.x, particle.y, particle.z]
            const rotation = [
                THREE.MathUtils.degToRad(particle.xh),
                THREE.MathUtils.degToRad(particle.yh),
                THREE.MathUtils.degToRad(particle.zh),
            ]

            // const pointGeometry = new THREE.BufferGeometry()
            // const pointPosition = new Float32Array(position)
            // pointGeometry.setAttribute(
            //     'position',
            //     new THREE.BufferAttribute(pointPosition, 3)
            // ) 
            // let point;
            // if(particle.origin == 'query') {
                //     point = new THREE.Points(pointGeometry, this.queryMaterial)
            // }         
            // else if(particle.origin == 'global') {
            //     point = new THREE.Points(pointGeometry, this.material)
            // }else {
            //     point = new THREE.Points(pointGeometry, this.material)
            // }
            
            let point;
               
            //const spheres = new THREE.Group()  // Group to hold all spheres
            // let sphereGeometry = new THREE.SphereGeometry(5, 100, 100) // Radius 5, 16 segments  //Rounder spheres, harder to render 
            let sphereGeometry = new THREE.SphereGeometry(10, 5, 5) // Radius 5, 16 segments  
            
            if (particle.origin == 'query') {
                let sphere = new THREE.Mesh(sphereGeometry, this.queryMaterial)
                sphere.position.set(position[0], position[1], position[2]) // Set position         
                point = sphere//this.scene.add(spheres) // Add spheres to the scene
            }   
            else if(particle.origin == 'global') {
                let sphere = new THREE.Mesh(sphereGeometry, this.material)
                sphere.position.set(position[0], position[1], position[2]) // Set position         
                point = sphere
            }else {
                let sphere = new THREE.Mesh(sphereGeometry, this.material)
                sphere.position.set(position[0], position[1], position[2]) // Set position         
                point = sphere
            }

            points.push(point)

            const dir = new THREE.Vector3(1, 2, 0);

            //normalize the direction vector (convert to vector of length 1)
            dir.normalize();

            pointGroup.add(point);
            index++;
        }
        this.pointsWithDirection = pointGroup;
        this.scene.add(pointGroup)

        return points;
    }
    setGUI() {
        this.gui.dataVisualizationFolder.add({
            updateLookAtParticlesForVisibilityEncoder: () => {
                this.updateLookAtParticlesForVisibilityEncoder()
            }
        }, 'updateLookAtParticlesForVisibilityEncoder')
        this.gui.dataVisualizationFolder.add({
            buildingScores: () => {
                this.updateParticleColors('building')
            }
        }, 'buildingScores')

        this.gui.dataVisualizationFolder.add({
            waterScores: () => {
                this.updateParticleColors('water')
            }
        }, 'waterScores')

        this.gui.dataVisualizationFolder.add({
            treeScores: () => {
                this.updateParticleColors('tree')
            }
        }, 'treeScores')


        this.gui.dataVisualizationFolder.add({
            skyScores: () => {
                this.updateParticleColors('sky')
            }
        }, 'skyScores')
    }
    plotPointsInsideRadius(radius, center) {
        const pointsInsideRadius = this.filterPointsByRadius(radius, center)
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(pointsInsideRadius.length * 3)

        for (let i = 0; i < pointsInsideRadius.length; i++) {
            const i3 = i * 3
            positions[i3] = pointsInsideRadius[i][0]
            positions[i3 + 1] = pointsInsideRadius[i][1]
            positions[i3 + 2] = pointsInsideRadius[i][2]
        }

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        )

        // material
        const material = new THREE.PointsMaterial({
            size: 10,
            color: 'red'
        })

        // points
        this.radiusPoints = new THREE.Points(geometry, material)

        this.scene.add(this.radiusPoints)
    }
    filterPointsByRadius(radius, center) {
        const filteredPoints = []
        sc1.forEach(point => {
            if (getDistance3D(center, point) <= radius) {
                filteredPoints.push(point)
            }
        })
        return filteredPoints
    }
    updateParticleColorAtIndex(index) {
        const particles = this.pointsWithDirection.children
        for(let i=0; i<particles.length; i++) {
            if(i == index) {
                particles[i].material = this.selectedMaterial
            } else {
                particles[i].material = this.material
            }
        }
    }
}