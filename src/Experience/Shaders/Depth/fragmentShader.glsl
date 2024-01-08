#include <packing>

varying vec2 vUv;
uniform sampler2D tDepth;
uniform float cameraNear;

uniform float cameraFar;
float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
    return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

void main() {
    float depth = readDepth(tDepth, vUv);

    gl_FragColor.rgb = 1.0 - vec3(depth);
    gl_FragColor.rgb = vec3(1., 1., 0.0);
    gl_FragColor.a = 1.0;
}