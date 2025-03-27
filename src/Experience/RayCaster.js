import * as THREE from 'three'
import Experience from './Experience'
import MaterialHelper from './Utils/MaterialHelper'
import { createArrayOfPointsFromGroup, createOBBHelper, updateChildrenMaterial } from './Utils/helpers'
import * as YUKA from 'yuka'
import ParticleHelper from './Utils/ParticleHelper'



export default class RayCaster {
    constructor() {
        this.instance = new THREE.Raycaster()

        this.experience = new Experience()
        this.camera = this.experience.camera
        this.screenshotHelper = this.experience.world.city.screenshotHelper
        this.gui = this.experience.gui
        this.visibilityEncoderService = this.experience.visibilityEncoderService
        this.particleHelper = new ParticleHelper()

        // this.setTransformControl()

        this.sizes = this.experience.sizes
        this.buildingMeshes = this.experience.buildingMeshes
        this.mouse = new THREE.Vector2()

        this.canvas = document.getElementsByClassName('webgl')[0].getBoundingClientRect();

        this.materialHelper = new MaterialHelper()

        this.previousHovered = undefined
        this.hoveredBuilding = undefined

        this.previousHoveredParticle = undefined
        this.hoveredParticle = undefined

        this.previousClicked = undefined

        this.clickedBuilding = undefined
        this.clickedBuildingHeight = undefined
        this.clickedBuildingCenter = undefined

        this.currentBoundingBox = undefined
        this.previousBoundingBox = undefined


        this.setGUI()

        window.addEventListener('mousemove', (_event) => {
            this.mouse.x = (_event.clientX / this.sizes.width) * 2 - 1
            this.mouse.y = - (_event.clientY / this.sizes.height) * 2 + 1
        })

        window.addEventListener('mousedown', (event) => {
            if (event.target.className != 'webgl') {
                return
            }
            if (this.hoveredBuilding && this.hoveredBuilding.name !== this.clickedBuilding?.name) {
                console.log('updating clicked building')
                this.previousClicked = this.clickedBuilding
                this.clickedBuilding = this.hoveredBuilding

                console.log("Building clicked")
                console.log(this.clickedBuilding);

                const points = createArrayOfPointsFromGroup(this.clickedBuilding)

                const boundingBoxHelper = this.createBoundingBox(points)

                this.pointsByNormal = this.groupPointsByNormal(boundingBoxHelper.geometry, boundingBoxHelper)

                // this.updateTransformControl()
                const buildingMaterial = this.materialHelper.getBuildingMaterial(
                    this.clickedBuilding,
                    this.materialHelper.materialMap[this.experience.currentMode],
                    this.experience.currentMode
                )
                updateChildrenMaterial(this.clickedBuilding, this.materialHelper.materialMap[this.experience.currentMode].click)
                updateChildrenMaterial(this.previousClicked, buildingMaterial)
            }
        })
    }
    callGetFacadesForClickedBuilding() {
        const basePoint = this.pointsByNormal.get('[0,-1,0]')

        console.log({basePoint})
        console.log("Clicked building height:", this.clickedBuildingHeight)

        this.visibilityEncoderService.predictFacadeFromBasePoints(basePoint, this.clickedBuildingHeight)
            .then(res => {
                console.log(res.data)
                this.particleHelper.resetResultPoints()
                this.particleHelper.plotParticlesForVisibilityEnconderResult(res.data)

            })
            .catch(err => {
                console.log('Error: ', err.message)
            })
    }

    sortPointsClockwise(points) {
        // Compute the centroid of the four points
        const centroid = new THREE.Vector3();
        points.forEach(p => centroid.add(p));
        centroid.divideScalar(points.length);
    
        // Choose a reference normal (assume polygon is mostly in one plane)
        const normal = new THREE.Vector3();
        const v1 = new THREE.Vector3().subVectors(points[1], points[0]);
        const v2 = new THREE.Vector3().subVectors(points[2], points[0]);
        normal.crossVectors(v1, v2).normalize(); // Normal of the polygon plane
    
        // Choose a reference axis (X-axis) in the plane
        const referenceAxis = new THREE.Vector3().subVectors(points[0], centroid).normalize();
    
        // Sort by angle relative to the reference axis
        points.sort((a, b) => {
            const va = new THREE.Vector3().subVectors(a, centroid).normalize();
            const vb = new THREE.Vector3().subVectors(b, centroid).normalize();
    
            // Compute cross and dot products
            const cross = new THREE.Vector3().crossVectors(referenceAxis, va);
            const dot = referenceAxis.dot(va);
    
            // Compute angle using atan2 for correct ordering
            const angleA = Math.atan2(cross.dot(normal), dot);
    
            const crossB = new THREE.Vector3().crossVectors(referenceAxis, vb);
            const dotB = referenceAxis.dot(vb);
            const angleB = Math.atan2(crossB.dot(normal), dotB);
    
            return angleA - angleB; // Sort counterclockwise
        });
    
        return points;
    }

    callGetFacadesForClickedBuildingV2AsTiles() {
        const basePoint = this.pointsByNormal.get('[0,-1,0]')

        console.log({basePoint})
        console.log("Clicked building height:", this.clickedBuildingHeight)
        let points = basePoint.map(b => new THREE.Vector3(b[0],b[1],b[2]))
        points = this.sortPointsClockwise(points)
        
        console.log("Angle to faces are actually roatated with 90deg.")
        /// Computing viewing angles for each side:
        for (let i=0; i<4; i++){
            // console.log(points[i], points[(i+1) % 4])
            let p1 = points[i]
            let p2 =  points[(i+1) % 4]

            // Compute direction vector
            // const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
            const direction = new THREE.Vector3().subVectors(p1, p2).normalize();

            // Choose a reference up vector (avoid collinear cases)
            const worldUp = new THREE.Vector3(0, 1, 0);
            if (Math.abs(direction.dot(worldUp)) > 0.99) {
                // If collinear, choose another reference
                worldUp.set(1, 0, 0);
            }

            // Compute perpendicular right vector
            const right = new THREE.Vector3().crossVectors(worldUp, direction).normalize();

            // Compute new "up" vector to maintain orthogonality
            const up = new THREE.Vector3().crossVectors(direction, 1).normalize();

            // Create rotation matrix
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeBasis(right, up, direction); // Aligns with p1->p2

            // Extract Euler angles (optional)
            const euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix, 'YXZ');
            const rotX = THREE.MathUtils.radToDeg(euler.x);
            const rotY = THREE.MathUtils.radToDeg(euler.y);
            const rotZ = THREE.MathUtils.radToDeg(euler.z);

            // Output
            // console.log(`Side: [${p1.x}, ${p1.y}, ${p1.z}] - [${p2.x}, ${p2.y}, ${p2.z}]`, "Perpendicular orientation:", rotX, rotY, rotZ);
        }

        

        this.visibilityEncoderService.predictFacadeFromBasePointsV2AsTiles(basePoint, this.clickedBuildingHeight)
            .then(res => {
                console.log(res.data)
                console.log("Displaying the building tiles...")
                this.particleHelper.resetResultPoints()
                this.particleHelper.plotParticlesForVisibilityEnconderResult(res.data)
            })
            .catch(err => {
                console.log('Error: ', err.message)
            })
    }

    callTestEnconderOnData() {
        const filteredPoints = this.particleHelper.filterPointsByRadius(
            30 + this.clickedBuildingHeight * 2,
            [
                this.clickedBuildingCenter.x,
                this.clickedBuildingCenter.y,
                this.clickedBuildingCenter.z
            ]
        )
        this.experience.scene.remove(this.boundingBox)
        const csv = this.screenshotHelper.generateImages(
            filteredPoints,
            false,
            false
        )
        console.log(csv)
        this.experience.scene.add(this.boundingBox)

        this.visibilityEncoderService.testEncoderOnData()
    }
    groupPointsByNormal(geometry, boxHelper) {
        const { normal, position } = geometry.attributes
        const pointsByNormal = new Map()

        for (let i = 0; i < position.array.length; i += 3) {
            const normalCoord = [
                normal.array[i + 0],
                normal.array[i + 1],
                normal.array[i + 2],
            ]
            const positionCoord = [
                position.array[i + 0],
                position.array[i + 1],
                position.array[i + 2],
            ]

            const vertex = new THREE.Vector3()
            vertex.fromBufferAttribute(position, i / 3)
            boxHelper.localToWorld(vertex)
            vertex.toArray(positionCoord)

            if (!pointsByNormal.has(JSON.stringify(normalCoord))) {
                pointsByNormal.set(JSON.stringify(normalCoord), [])
            }
            pointsByNormal.set(JSON.stringify(normalCoord), [...pointsByNormal.get(JSON.stringify(normalCoord)), positionCoord])
        }
        return pointsByNormal
    }
    updateTransformControl() {
        this.clickedBuilding.children.forEach(child => {
            const g = child.geometry
            g.computeBoundingBox()
            var centroid = new THREE.Vector3()
            centroid.addVectors(g.boundingBox.min, g.boundingBox.max).divideScalar(2)
            g.center()

            child.position.copy(centroid)
        })
        const m1 = this.clickedBuilding.children[0]
        const m2 = this.clickedBuilding.children[1]
        const m3 = this.clickedBuilding.children[2]
        this.clickedBuilding.position
            .copy(
                new THREE.Vector3(
                    m1.position.x,
                    m1.position.y,
                    m1.position.z
                )
            ).add(
                new THREE.Vector3(
                    m2.position.x,
                    m2.position.y,
                    m2.position.z
                )
            ).add(
                new THREE.Vector3(
                    m3.position.x,
                    m3.position.y,
                    m3.position.z
                )
            ).multiplyScalar(1 / 3)

        this.clickedBuilding.remove(m1)
        this.clickedBuilding.remove(m2)
        this.clickedBuilding.remove(m3)
        this.clickedBuilding.attach(m1)
        this.clickedBuilding.attach(m2)
        this.clickedBuilding.attach(m3)
        this.clickedBuilding.updateMatrixWorld()


        this.transformControl.attach(this.clickedBuilding)
    }
    setTransformControl() {
        this.transformControl = new TransformControls(this.camera.instance, this.experience.renderer.instance.domElement)
        this.transformControl.setMode('scale')
        this.experience.scene.add(this.transformControl)

        window.addEventListener('keydown', (event) => {
            switch (event.keyCode) {

                case 87: // W
                    this.transformControl.setMode('translate')
                    break


                case 82: // R
                    this.transformControl.setMode('scale')
                    break

                case 27: // Esc
                    this.transformControl.reset()
                    break

            }

        })
    }

    createBoundingBox(points) {
        const obb = new YUKA.OBB().fromPoints(points)
        this.helper = createOBBHelper(obb)

        console.log(this.helper)
        console.log(obb)
        console.log("Created Bonding boxes")
        this.guiFacadeControls.facadeTiles = null

        this.clickedBuildingHeight = obb.halfSizes.y * 2
        this.clickedBuildingCenter = obb.center

        this.previousBoundingBox = this.currentBoundingBox
        this.currentBoundingBox = this.helper

        this.experience.scene.add(this.helper)

        this.previousBoundingBox?.geometry.dispose()
        this.previousBoundingBox?.material.dispose()
        this.experience.scene.remove(this.previousBoundingBox)

        return this.helper
    }
    createSlidingBoundingBox(points) {
        const obb = new YUKA.OBB().fromPoints(points)
        this.helper = createOBBHelper(obb)
        const { geometry } = this.helper
        console.log(geometry)

        this.numSegments = Math.ceil(geometry.parameters.height / 5)
        this.currentSeg = 1
        this.geometry = geometry

        let lowestY = Infinity, highestY = -Infinity
        for (let i = 0; i < points.length; i++) {
            lowestY = Math.min(lowestY, points[i].y)
            highestY = Math.max(highestY, points[i].y)
        }
        console.log({ lowestY, highestY })

        this.maxHeight = highestY
        this.helper.position.y = lowestY
        console.log('maxH: ' + this.maxHeight)
        console.log('posY' + this.helper.position.y)
        this.heightStep = (this.maxHeight - this.helper.position.y) / this.numSegments

        this.buildingCameraPositions = []
        this.updateSegment(
            Math.ceil(geometry.parameters.width / 10),
            Math.ceil(geometry.parameters.depth / 10),
        )

        console.log(this.helper)
        console.log(obb)

        this.previousBoundingBox = this.currentBoundingBox
        this.currentBoundingBox = this.helper

        // this.experience.scene.add( this.helper )

        this.previousBoundingBox?.geometry.dispose()
        this.previousBoundingBox?.material.dispose()
        this.experience.scene.remove(this.previousBoundingBox)
    }

    updateSegment(widthSegments, depthSegments) {
        if (this.currentSeg > this.numSegments) {
            return
        }

        this.helper.position.y += this.heightStep

        const percentageStep = 1 / this.numSegments
        this.helper.geometry = new THREE.BoxGeometry(
            this.geometry.parameters.width,
            this.geometry.parameters.height * percentageStep,
            this.geometry.parameters.depth,
            widthSegments,
            1,
            depthSegments
        )
        const positions = this.helper.geometry.getAttribute('position')
        const normals = this.helper.geometry.getAttribute('normal')
        const topSidePositions = []

        for (let i = 0; i < positions.array.length; i += 3) {
            let index = i / 3

            const normal = new THREE.Vector3()
            normal.fromBufferAttribute(normals, index)

            if (
                normal.x == 0 &&
                normal.y == 1 &&
                normal.z == 0
            ) {
                const vertex = new THREE.Vector3()
                vertex.fromBufferAttribute(positions, index)
                this.helper.localToWorld(vertex)

                topSidePositions.push(vertex.toArray())
            }
        }

        this.currentSeg++
        this.buildingCameraPositions.push(...topSidePositions)
        this.updateSegment(widthSegments, depthSegments)
    }
    screenShotBuilding() {
        if (!this.buildingCameraPositions?.length) {
            console.warn('No building selected')
            return
        }
        this.screenshotHelper.generateBuildingImages(this.buildingCameraPositions, this.clickedBuilding.name)
    }
    plotRadiusScreenshotPositions() {
        this.particleHelper.resetRadiusPoints()
        this.particleHelper.plotPointsInsideRadius(
            30 + this.clickedBuildingHeight * 2,
            [
                this.clickedBuildingCenter.x,
                this.clickedBuildingCenter.y,
                this.clickedBuildingCenter.z,
            ]
        )
    }

    callGetFacadesForClickedBuildingAsContinousTiles() {
        const basePoint = this.pointsByNormal.get('[0,-1,0]')

        console.log({basePoint})
        console.log("Clicked building height:", this.clickedBuildingHeight)
        let points = basePoint.map(b => new THREE.Vector3(b[0],b[1],b[2]))
        points = this.sortPointsClockwise(points)
        
        console.log("Angle to faces are actually roatated with 90deg.")
        /// Computing viewing angles for each side:
        for (let i=0; i<4; i++){
            // console.log(points[i], points[(i+1) % 4])
            let p1 = points[i]
            let p2 =  points[(i+1) % 4]

            // Compute direction vector
            // const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
            const direction = new THREE.Vector3().subVectors(p1, p2).normalize();

            // Choose a reference up vector (avoid collinear cases)
            const worldUp = new THREE.Vector3(0, 1, 0);
            if (Math.abs(direction.dot(worldUp)) > 0.99) {
                // If collinear, choose another reference
                worldUp.set(1, 0, 0);
            }

            // Compute perpendicular right vector
            const right = new THREE.Vector3().crossVectors(worldUp, direction).normalize();

            // Compute new "up" vector to maintain orthogonality
            const up = new THREE.Vector3().crossVectors(direction, 1).normalize();

            // Create rotation matrix
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeBasis(right, up, direction); // Aligns with p1->p2

            // Extract Euler angles (optional)
            const euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix, 'YXZ');
            const rotX = THREE.MathUtils.radToDeg(euler.x);
            const rotY = THREE.MathUtils.radToDeg(euler.y);
            const rotZ = THREE.MathUtils.radToDeg(euler.z);

            // Output
            // console.log(`Side: [${p1.x}, ${p1.y}, ${p1.z}] - [${p2.x}, ${p2.y}, ${p2.z}]`, "Perpendicular orientation:", rotX, rotY, rotZ);
        }

        

        this.visibilityEncoderService.predictFacadeFromBasePointsAsContinousTiles(basePoint, this.clickedBuildingHeight)
            .then(res => {
                console.log(res.data)
                console.log("Displaying the building tiles...")
                // this.guiFacadeControls.resetResultPoints()
                // this.particleHelper.plotParticlesForVisibilityEnconderResult(res.data)
                this.guiFacadeControls.addTilesToScene(res.data);
                console.log("Semantic ID: ", this.guiFacadeControls.sliderValue, " representing ", this.guiFacadeControls.semanticName)
                
            })
            .catch(err => {
                console.log('Error: ', err.message)
            })
    }

    setGUI() {

        this.gui.dataGenerationFolder.add({
            screenShotSelectedBuilding: () => {
                this.screenShotBuilding()
            }
        }, 'screenShotSelectedBuilding')

        this.gui.dataGenerationFolder.add({
            plotRadiusSCPosition: () => {
                this.plotRadiusScreenshotPositions()
            }
        }, 'plotRadiusSCPosition')

        this.gui.endpointsFolder.add({
            callGetFacadesForClickedBuilding: () => {
                this.callGetFacadesForClickedBuilding()
            }
        }, 'callGetFacadesForClickedBuilding')

        // Object to store values
        this.guiFacadeControls = {
            sliderValue: 0,
            semanticName:"",
            textValue: "water",
            tileMeshes: [],
            facadeTiles: null,
            addTilesToScene : function addTilesToScene(tilesData) {
                this.facadeTiles = tilesData
                // this.removeTilesFromScene()
                tilesData.forEach(tile => {
                    // console.log({tile})
                    const { center, dimension, colors, points} = tile;
                    let side_length = dimension
                    // console.log({center, side_length, colors, points})
                    let color = ""
                    if(this.textValue in colors){
                        color = colors[this.textValue]
                        // console.log("Semantic: ", this.textValue)
                    }
                    else{
                        let semantic_by_id = Object.keys(colors)[this.sliderValue]
                        color = colors[semantic_by_id]
                        this.semanticName = semantic_by_id
                        //console.log("Semantic ID: ", this.sliderValue, " representing ", semantic_by_id)
                    }
                    // console.log({side_length})
                    // side_length = side_length * 0.99
                    // console.log({side_length})
                    // Compute normal vector from three random points
                    const p0 = new THREE.Vector3(...points[0]);
                    const p1 = new THREE.Vector3(...points[1]);
                    const p2 = new THREE.Vector3(...points[2]);

                    const v1 = new THREE.Vector3().subVectors(p1, p0);
                    const v2 = new THREE.Vector3().subVectors(p2, p0);
                    const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
                    
                    // Create a square tile geometry
                    const geometry = new THREE.PlaneGeometry(side_length, side_length);
                    // const geometry = new THREE.PlaneGeometry(10., 10.);
                    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.DoubleSide });
                    const tileMesh = new THREE.Mesh(geometry, material);
              
                    // Position the tile using its center
                    tileMesh.position.set(center[0], center[1], center[2]);

                    // If the tile needs rotation, compute it (assuming normal vector is given or inferred)
                    // if (tile.normal) {
                        // const normal = new THREE.Vector3(tile.normal[0], tile.normal[1], tile.normal[2]).normalize();
                    const up = new THREE.Vector3(0, 0, 1); // Default plane normal
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
                    tileMesh.applyQuaternion(quaternion);
                    // }

                    // Add tile to the scene
                    this.scene.add(tileMesh);
                    this.tileMeshes.push(tileMesh);
                });
            },
            removeTilesFromScene : function removeTilesFromScene() {// Function to remove all tiles from the scene
                console.log(`Removing existing ${this.tileMeshes.length} tiles from scene...`)
                this.tileMeshes.forEach(mesh => {
                this.scene.remove(mesh);      // Remove from scene
                mesh.geometry.dispose(); // Free memory
                mesh.material.dispose(); // Free memory
              });
              this.tileMeshes = []; // Clear the array
            },
            scene : this.experience.scene,
            displayFacade: function () {
                if(this.facadeTiles == null){
                    fetch('building_tiles_sample.json')
                    // fetch('building_tiles_global.json')
                    .then(response => response.json())
                    .then(data => {
                        this.addTilesToScene(data);
                    })
                    .catch(error => console.error('Error loading JSON:', error));              
                }
                else{
                    this.addTilesToScene(this.facadeTiles) 
                }
                console.log("Semantic ID: ", this.sliderValue, " representing ", this.semanticName)
            }
        };
        this.gui.facadesFolder.add(this.guiFacadeControls, 'sliderValue', 0, 7, 1) // Min: 0, Max: 100, Step: 1
            .name("Semantic ID")
            .onChange(value => console.log("New Semantic ID: ", value));
        // Add text input
        this.gui.facadesFolder.add(this.guiFacadeControls, 'textValue').name("Semantic Name:");

        // Add button to log text
        this.gui.facadesFolder.add(this.guiFacadeControls, 'displayFacade').name("Display Facade");

        // Add button to log text
        this.gui.facadesFolder.add(this.guiFacadeControls, 'removeTilesFromScene').name("Remove Tiles");


        

        this.gui.endpointsFolder.add({
            callGetFacadesForClickedBuildingV2AsTiles: () => {
                this.callGetFacadesForClickedBuildingV2AsTiles()
            }
        }, 'callGetFacadesForClickedBuildingV2AsTiles')

        this.gui.facadesFolder.add({
            getClickedBuildingFacadeAsContinousTiles: () => {
                this.callGetFacadesForClickedBuildingAsContinousTiles()
            }
        }, 'getClickedBuildingFacadeAsContinousTiles')


        this.gui.endpointsFolder.add({
            callTestEnconderOnData: () => {
                this.callTestEnconderOnData()
            }
        }, 'callTestEnconderOnData')

        ////////////////////////////////////////Sample Controls
        ////Sample input parsing three JS
        // Object to store values
        const guiControls = {
            sliderValue: 0,
            textValue: "",
            logText: function () {
                console.log("User Input:", this.textValue);
            }
        };
        this.gui.sampleControls.add(guiControls, 'sliderValue', 0, 10, 1) // Min: 0, Max: 100, Step: 1
            .name("Slider")
            .onChange(value => console.log("Slider Value:", value));
        // Add text input
        this.gui.sampleControls.add(guiControls, 'textValue').name("Enter Text");

        // Add button to log text
        this.gui.sampleControls.add(guiControls, 'logText').name("Log Text");

        this.gui.sampleControls.add({
            sampleTilesDisplay: () => {
                console.log("colsoleLoggingTest")
                fetch('tiles_sample.json')
                .then(response => response.json())
                .then(tiles => {
                  tiles.forEach(tile => {
                    const { center, dimension, points, color } = tile;
              
                    // Create the tile (square) using the dimension
                    const geometry = new THREE.PlaneGeometry(dimension, dimension);
                    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
                    const plane = new THREE.Mesh(geometry, material);
              
                    // Position it at the center
                    plane.position.set(...center);
              
                    // Rotate it if needed (for a horizontal tile facing up)
                    plane.rotation.x = -Math.PI / 2;
              
                    this.experience.scene.add(plane);
              
                    // Create small spheres for the random points
                    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                    points.forEach(point => {
                      const sphereGeometry = new THREE.SphereGeometry(0.05);
                      const sphere = new THREE.Mesh(sphereGeometry, pointMaterial);
                      sphere.position.set(...point);
                      this.experience.scene.add(sphere);
                    });
                  });
                })
                .catch(error => console.error("Error loading tiles:", error));
            }
        }, 'sampleTilesDisplay')

    }
    update() {
        // verificar camera bugada, entender onde estou atualizando-a e onde falho em chamar updates
        this.instance.setFromCamera(this.mouse, this.camera.instance)
        const locationParticles = this.experience.queryLocationParticles ? this.experience.queryLocationParticles : [];
        const intersects = this.instance.intersectObjects([...this.buildingMeshes])
        const intersectsParticle = this.instance.intersectObjects([...locationParticles])
        this.hoveredBuilding = intersects[0]?.object?.parent
        this.hoveredParticle = intersectsParticle[0]?.object
    }
}