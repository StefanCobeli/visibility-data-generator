import axios, * as others from 'axios'

export default class VisibilityEncoder {
    constructor() {
    }

    testEncoderOnCurrentPosition(currentPosition) {
        const params = {
            // nmt: 'None'
        }
        // if(buildingHeight) {
        //     params.bh = Math.round(buildingHeight * 1.2)
        //     params.ppf = Math.round(Math.round(buildingHeight) * 30 / 6)
        // }
        return axios(
            {
                method: 'post',
                baseURL: 'http://127.0.0.1:5000/',
                params,
                url: '/test_encoder_on_current_position',
                headers: {
                    scheme: 'http',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                data: currentPosition
                
            }
        )
    }

    predictFacadeFromBasePoints(facadePoints, buildingHeight) {
        const params = {
            // nmt: 'None'
        }
        if(buildingHeight) {
            params.bh = Math.round(buildingHeight)
            params.ppf = Math.round(Math.round(buildingHeight) * 30 / 6)
        }
        return axios(
            {
                method: 'post',
                baseURL: 'http://127.0.0.1:5000/',
                params,
                url: '/predict_facade_from_base_points',
                headers: {
                    scheme: 'http',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                data: facadePoints
            }
        )
    }

    predictFacadeFromBasePointsV2AsTiles(facadePoints, buildingHeight) {
        const params = {
            // nmt: 'None'
        }
        if(buildingHeight) {
            params.bh = Math.round(buildingHeight)
            params.ppf = Math.round(Math.round(buildingHeight) * 30 / 6)
        }
        return axios(
            {
                method: 'post',
                baseURL: 'http://127.0.0.1:5000/',
                params,
                url: '/predict_facade_from_base_points_as_tiles',
                headers: {
                    scheme: 'http',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                data: facadePoints
            }
        )
    }

    predictFacadeFromBasePointsAsContinousTiles(facadePoints, buildingHeight) {
        const params = {
            // nmt: 'None'
        }
        if(buildingHeight) {
            params.bh = Math.round(buildingHeight)
            params.ppf = Math.round(Math.round(buildingHeight) * 30 / 6)
        }
        return axios(
            {
                method: 'post',
                baseURL: 'http://127.0.0.1:5000/',
                params,
                url: '/predict_facade_from_base_points_as_continous_tiles',
                headers: {
                    scheme: 'http',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                data: facadePoints
            }
        )
    }

    testEncoderOnData(locationData) {
        const params = {
            // nmt: 'None'
        }
        return axios(
            {
                method: 'post',
                baseURL: 'http://127.0.0.1:5000/',
                params,
                url: '/test_encoder_on_data',
                headers: {
                    scheme: 'http',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                data: locationData
            }
        )
    }

    printPredictionArray(predictions) {
        const classes = ['building', ' water', ' tree', ' sky']
        for(let i=0; i<predictions.length; i++) {
            console.log(`${classes[i]}: ${predictions[i]}`)
        }
    }
    /*
        Query Location using surfaces
            - go to controls menu
            - click on folder with some methods for queryLocation
            - only of those below at a given moment
                - use transform controls to place the surface on screen (moves user to birds view)
                    (https://threejs.org/docs/#examples/en/controls/TransformControls)
                - add plane/ remove plane -> center, point exterior, length n width
                - add sphere/remove sphere -> center, point surface (or radius)
                - add semisphere/remove semisphere -> same as sphere (for the moment, the cut is being hardcoded)
                - remove all
            - if we click querLocation we'll use the selected surface with its respective parameters
            - create a fixed location to show the whole city (bird view)
            - how to render a big model from the distance and try not to render that much detail
            - represent results on screen, when you click on the result, go there and having the possibility to move back to birds view
    */
    queryLocation(numLocations, seed, goals, intervals=null) {
        const params = {
        }
        const data = [{
            f_xyz: goals,
            num_locations: numLocations
        }]
        return axios(
            {
                method: 'post',
                baseURL: 'http://127.0.0.1:5000/',
                params,
                url: '/query_locations',
                headers: {
                    scheme: 'http',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                data
            }
        )
    }

    queryLocationOnPlane({numLocations, seed, goals, pointOnPlane, direction1, direction2, radius, intervals=null}) {
        const params = {
        }
        const data = [{
            f_xyz: goals,
            point_on_plane: pointOnPlane,
            direction_1: direction1,
            direction_2: direction2,
            r: radius,
            num_locations: numLocations,
            seed: seed,
            intervals: intervals
        }]
        console.log(data);
        return axios(
            {
                method: 'post',
                baseURL: 'http://127.0.0.1:5000/',
                params,
                url: '/query_plane_locations',
                headers: {
                    scheme: 'http',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                data
            }
        )
    }
}