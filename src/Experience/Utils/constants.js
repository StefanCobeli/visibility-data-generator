import * as THREE from 'three'

export const MIN_HEIGHT = 10
export const MAX_HEIGHT = 150000

export const AMORTIZE_SPEED_X = 2.0
export const AMORTIZE_SPEED_Y = 2.0
export const AMORTIZE_SPEED_Z = 2.0

//After 15 getting the error: 
//"There are too many active WebGL contexts on this page, the oldest context will be lost"
export const MAX_POV_AMOUNT = 6 //15 //15 seems to be the limit. 30 //12 //10//15

export const KeyCode = {
    ARROW_UP :'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    Z: 'KeyZ',
    X: 'KeyX',
    W: 'KeyW',
    A: 'KeyA',
    S: 'KeyS',
    D: 'KeyD',
    ESC: 'Escape'
}

// Color Detection 
export const OBJECT_TO_COLOR = {
    'building': '255,0,0',
    'water': '0,0,255',
    'road': '0,255,255',
    'sidewalk': '255,255,0',
    'surface': '255,0,255',
    'tree':'0,255,0',
    'sky':'0,0,0',
    'miscelaneous': '255,255,255'
}
export const COLOR_TO_OBJECT = {
    '255,0,0': 'building',
    '0,0,255': 'water',
    '0,255,255': 'road' ,
    '255,255,0': 'sidewalk',
    '255,0,255': 'surface',
    '0,255,0': 'tree',
    '0,0,0': 'sky',
    '255,255,255': 'miscelaneous'
}

// Building Data Detection 
export const BUILDING_OBJECT_TO_COLOR = {
    'brick': '255,0,0',
    'concrete': '255,255,0',
    'marble': '0,0,255',
    'plaster': '255,255,255',
    'metal': '0,255,0',
    'miscelaneous':'0,0,0',
    'sky':'#83A2EE',
}
export const BUILDING_COLOR_TO_OBJECT = {
    '255,0,0': 'brick',
    '255,255,0': 'concrete',
    '0,0,255': 'marble' ,
    '255,255,255': 'plaster',
    '0,255,0': 'metal',
    '0,0,0': 'miscelaneous'
}
// // Real world look like rendering
// export const REAL_WORLD_OBJECT_TO_COLOR = {
//     'building': '#9dadaa',
//     'buildingB': '#5a84bb',
//     'water': '#4f759c',
//     'road': '#b5bbca',
//     'sidewalk': '#8e96b1',
//     'surface': '#87b5b1',
//     'tree':'#6aac79',
//     'sky':'#bce0df',
// }

// Color schema taken from maplibre and OSM: https://maplibre.org/maplibre-gl-js/docs/examples/3d-buildings/
export const REAL_WORLD_OBJECT_TO_COLOR = {
    // 'building': '#d3d3d3',
    // 'buildingB': '#d3d3d3',
    // 'water': '#9EBFDE',//#9EBFDE
    'building': '#DCDCDC', //'#fcfcfc',
    'buildingB': '#DCDCDC',//'#fcfcfc',
    'water': '#c4e2fe',// light blue
    // 'water': '#466976',// 70, 105, 118// marine green - from google earth NY central park lake
    // 'water': '#5469C6',// 84, 105, 198// ocean blue - looks too artificial compared - from google earth NY Jersey Bight ocean
    'road': '#FFFFFF',
    'sidewalk': '#EBEADF',
    'surface': '#CDDDB6',//'#CDDDB6' '#D2DFBE'
    'tree':'#9DB97F', //'#9DB97F'
    // 'sky':'#bce0df',
    // 'sky': '#10152e'//dark blue
    'sky': '#83A2EE',//sky blue - form google earth top sky
    'sky' : "#C7CFF4" // 199,207,244 - blue pink sky - google earth
}

// Depth Color
export const DEPTH_SKY = '255, 0, 0'

// Camera Grid
export const INITIAL_FLOOR_BUILDING_POSITION = new THREE.Vector3(310, 45, 268)
export const ENDING_FLOOR_BUILDING_POSITION = new THREE.Vector3(348, 45, 204)

//Heights where camera will be placed:
// export const additionalHeights = [0, 70, 120, 170, 220, 270]
export const ADDITIONAL_HEIGHTS = [5, 10, 15, 25, 45, 70, 120, 170, 220, 270]//Include street level views more frequent.
// export const ADDITIONAL_HEIGHTS = [0, 5, 10, 15] // Short data testing heights

export const CAMERA_LOOKAT = [
    // new THREE.Vector3(
    //     500,
    //     268,
    //     1378
    // ),
    new THREE.Vector3(
        500,
        50,
        1378
    ),
    // new THREE.Vector3(
    //     733,
    //     55,
    //     714
    // ),
    new THREE.Vector3(
        733,
        200,
        714
    ),
    new THREE.Vector3(
        172,
        150,
        387
    ),
    // new THREE.Vector3(
    //     172,
    //     50,
    //     387
    // )
]

export const CAMERA_BUILDING_LOOKAT = [
    new THREE.Vector3(
        2973,
        20,
        1286
    ),
    new THREE.Vector3(
        2477,
        20,
        2838
    ),
    new THREE.Vector3(
        1900,
        20,
        2023
    ),
    new THREE.Vector3(
        -4,
        20,
        1536
    ),
    new THREE.Vector3(
        -119,
        20,
        -82
    ),
    new THREE.Vector3(
        382,
        20,
        912
    )
]

export const CAMERA_QUATERNIONS = [
    // front
    new THREE.Vector4(
        -0.007534356421990641,
        -0.8645907622571576,
        -0.012969834186012006,
        0.5022527557854521
    ),
    // left
    new THREE.Vector4(
        -0.011303683767284387,
        -0.493823204851973,
        -0.006420063330717134,
        0.8694651527633784
    ),
    // right
    new THREE.Vector4(
        -0.0007248579983432066,
        0.9958547474041749,
        0.00796700794279462,
        0.09060531683013229
    ),
    // down
    new THREE.Vector4(
        -0.07610121773373563,
        -0.8471770311086373,
        -0.12630575046404055,
        0.5104375965983629
    ),
]

// view modes
export const VIEW_MODES = {
    depth: 'depth',
    visibility: 'visibility',
    realWorld: 'realWorld',
    buildingData: 'buildingData'
}