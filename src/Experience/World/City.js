import * as THREE from "three";
import Experience from "../Experience";
import { collada_models } from "./models.js";
import MaterialHelper from "../Utils/MaterialHelper.js";
import {
  float32Flatten,
  hydrateMap,
  updateChildrenMaterial,
} from "../Utils/helpers.js";
import ScreenshotHelper from "../Utils/ScreenshotHelper.js";
import { sc1 } from "../Utils/screenshotPositions.js";
import { VIEW_MODES } from "../Utils/constants.js";

const map = {};
const terrainMap = {};
const buildingMap = {};
const buildingMaterialMap = {};
let removedMeshes = 0;

export default class City {
  constructor() {
    this.materialHelper = new MaterialHelper();
    this.experience = new Experience();
    this.screenshotHelper = new ScreenshotHelper();

    this.characterControls = this.experience.characterControls;

    this.loaders = this.experience.loaders;
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.gui = this.experience.gui;

    this.povWorld = this.experience.povWorld;

    this.meshesToUpdateMaterial = [];
    this.positionsOfInterest = [];
    this.positionsToAvoid = [];

    this.buildingMeshes = [];
  }
  loadModels() {
    const toLoad = collada_models.length;
    let loaded = 0;
    this.experience.characterControls.isPaused = true;
    for (const model of collada_models) {
      this.loaders.colladaLoader.load(
        model.path,
        (gltf) => {
          this.scene.add(gltf.scene);
          this.auxRecursiveIterator(gltf.scene, gltf.metadataMap);
          loaded++;
          // console.log(`loaded ${loaded} /${toLoad}`)
          if (loaded == toLoad) {
            this.experience.characterControls.isPaused = false;

            // console.log(map)
            // console.log(terrainMap)
            // console.log(buildingMap)
            // console.log(buildingMaterialMap)
            // console.log({ removedMeshes })

            // clone current scene to POV scene
            this.experience.povScene = this.scene.clone();
            // this.experience.hiddenMap.dropdown.on("change", function () {
            //     console.log("Clicked dropdown:");//, possibleCoordName)
            //     coordName = this.experience.hiddenMap.dropdown.value;  // Update coordName based on dropdown selection
            //     this.experience.hiddenMap.createHiddenMap();              // Reload data with the new coordName
            // });
            this.experience.hiddenMap.createHiddenMap();

            // Create points of interest and to avoid
            // this.pointsOfInterest = float32Flatten(this.positionsOfInterest)
            // this.pointToAvoid = float32Flatten(this.positionsToAvoid)
            // console.log(this.pointsOfInterest.length, this.pointToAvoid.length)

            // Get valid points for screenshot
            // this.screenshotHelper.getValidPoints(this.pointsOfInterest, this.pointToAvoid)
            // console.log(fullArr.length)
            // let sc1 = [...new Set(fullArr.map(JSON.stringify))].map(JSON.parse)

            // Filter points that are too close from each other
            // console.log(sc1.length)
            this.filteredScreenshotPositions =
              this.screenshotHelper.filterScreenshotPositions(sc1);
            // console.log(this.filteredScreenshotPositions.length)

            // for debugging purposes show screenshot positions on screen
            // this.screenshotHelper.createParticleOnPosition(this.filteredScreenshotPositions)
          }
        },
        () => {}, // progress callback
        (err) => console.log(err)
      );
    }
  }
  setMaterialByMode(mode) {
    this.setMaterial(this.materialHelper.materialMap[mode], mode);
  }
  setMaterial(materialMap, mode) {
    this.meshesToUpdateMaterial.forEach((child) => {
      if (child.userData.type === "entity") {
        this.setMaterialEntityChild(child, materialMap);
      } else if (child.userData.terrain?.length > 0) {
        this.setMaterialTerrainChild(child, materialMap);
      } else {
        this.setMaterialBuildingChild(child, materialMap, mode);
      }
    });
  }
  setMaterialEntityChild(child, materialMap) {
    const key = child.userData["entity:type"];

    switch (key) {
      case "tree":
        hydrateMap(key, map);
        this.recursiveSetMaterial(child, materialMap["tree"], child.userData);
        break;
      case "street_light":
      case "subway_entrance":
      case "waste_receptacle":
        hydrateMap(key, map);
        this.recursiveSetMaterial(
          child,
          materialMap["default"],
          child.userData
        );
        break;
      case "bus_shelter":
      case "bus_stop":
      case "collection_box":
      case "hydrant":
      case "street_sign_sign":
      default:
        // to enhance performance we're removing any child
        this.recursiveRemoveChild(child);
        break;
    }
  }
  setMaterialTerrainChild(child, materialMap) {
    const key = child.userData["terrain"];
    hydrateMap(key, terrainMap);
    switch (key) {
      case "water":
        this.recursiveSetMaterial(child, materialMap["water"], child.userData);
        break;
      case "road":
        this.recursiveSetMaterial(child, materialMap["road"], child.userData);
        break;
      case "sidewalk":
        this.recursiveSetMaterial(
          child,
          materialMap["sidewalk"],
          child.userData
        );
        break;
      case "surface":
        this.recursiveSetMaterial(
          child,
          materialMap["surface"],
          child.userData
        );
        break;
    }
  }

  setMaterialBuildingChild(child, materialMap, mode) {
    const key = child.userData.building;

    const buildingMaterial = this.materialHelper.getBuildingMaterial(
      child,
      materialMap,
      mode
    );

    hydrateMap(key, buildingMap);
    hydrateMap(child.userData["building:material"], buildingMaterialMap);

    this.buildingMeshes.push(...child.children);
    this.recursiveSetMaterial(child, buildingMaterial, child.userData);
  }
  auxRecursiveIterator(object3d, metadataMap) {
    const children = object3d.children;
    for (const child of children) {
      this.recursiveChildAction(child, metadataMap);
    }
  }
  recursiveChildAction(child, metadataMap) {
    if (child.name in metadataMap) {
      child.userData = metadataMap[child.name];

      if (child.userData.type === "entity") {
        this.setMaterialEntityChild(
          child,
          this.materialHelper.materialMap["realWorld"]
        );
      } else if (child.userData.terrain?.length > 0) {
        this.setMaterialTerrainChild(
          child,
          this.materialHelper.materialMap["realWorld"]
        );
      } else {
        this.setMaterialBuildingChild(
          child,
          this.materialHelper.materialMap["realWorld"],
          VIEW_MODES["realWorld"]
        );
      }
    }
    return;
  }
  recursiveSetMaterial(child, material, userData) {
    if (Object.keys(child.userData).length == 0) {
      child.userData = userData;
    }
    const childUserData = child.userData;

    // Since the objects are not being udpated, we don't need to calculate their values every frame
    // Setting autoupdate to false helps on performance by removing unnecessary calculations
    child.matrixAutoUpdate = false;

    if (child.isMesh) {
      this.createArrayOfPoints(child);
      this.meshesToUpdateMaterial.push(child);
      child.material = material;
      return;
    }
    if (child.children.length > 0) {
      child.children.forEach((c) =>
        this.recursiveSetMaterial(c, material, childUserData)
      );
    }
  }
  recursiveRemoveChild(child) {
    if (child.isMesh && child instanceof THREE.Object3D) {
      // for better memory management and performance
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        Object.keys(child.material).forEach((prop) => {
          if (!child.material[prop]) {
            return;
          }
          if (
            child.material[prop] !== null &&
            typeof child.material[prop].dispose === "function"
          ) {
            child.material[prop].dispose();
          }
        });
        if (child.material instanceof Array) {
          // for better memory management and performance
          child.material.forEach((material) => material.dispose());
        } else {
          // for better memory management and performance
          child.material.dispose();
        }
      }

      child.removeFromParent();
      removedMeshes++;

      return;
    }
    if (child.children.length > 0) {
      child.children.forEach((c) => this.recursiveRemoveChild(c));
    }
  }
  createArrayOfPoints(child) {
    const terrain = child.userData.terrain;
    const entityType = child.userData["entity:type"];
    const isBuilding = !terrain && !entityType;
    const geometry = child.geometry;
    const position = geometry.getAttribute("position");
    const vertexArr = [];
    for (let i = 0; i < position.array.length; i += 3) {
      let index = i / 3;
      //convert from local to world position
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(position, index);
      child.localToWorld(vertex);
      vertexArr.push(...vertex);
    }
    if (isBuilding) {
      this.positionsToAvoid.push(vertexArr);
    } else if (terrain) {
      this.positionsOfInterest.push(vertexArr);
    }
  }
  update() {
    const currentHover = this.experience.raycaster.hoveredBuilding;
    const previousHovered = this.experience.raycaster.previousHovered;

    if (
      currentHover &&
      previousHovered?.name != currentHover.name &&
      this.experience.raycaster.clickedBuilding?.name !== currentHover.name
    ) {
      // console.log('updating hover material')
      // updateChildrenMaterial(currentHover, this.materialHelper.materialMap['realWorld'].hover)
      // if(previousHovered?.name !== this.experience.raycaster.clickedBuilding?.name) {
      //     updateChildrenMaterial(previousHovered, this.materialHelper.materialMap['realWorld'].building)
      // }
      this.experience.raycaster.previousHovered = currentHover;
    }
    if (!currentHover && previousHovered) {
      // if(previousHovered.name !== this.experience.raycaster.clickedBuilding?.name) {
      //     updateChildrenMaterial(previousHovered, this.materialHelper.materialMap['realWorld'].building)
      // }
      this.previousHovered = currentHover;
    }
  }
}
