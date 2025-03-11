uniform float uTime;
uniform float uSize;
uniform vec3 uMousePos;
uniform float uRadius;
uniform float uElevation;

attribute float aScale;
attribute vec3 aRandomness;

varying vec2 vUv;
varying float vSmoothStep;

void main(){
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    //for wave:
    //  float elevation = sin(modelPosition.x*2.0 - uTime*5.0)*0.2;
    // elevation += sin(modelPosition.z*3.0 - uTime)*0.1;
    // modelPosition.y += elevation;

    //calculating all points within the circle and finding instant step and smooth step:
    float distanceSquared =  pow((modelPosition.x - uMousePos.x),2.0) +  pow((modelPosition.z - uMousePos.z),2.0);
    float instantStep=step( pow(uRadius,2.0),distanceSquared);
    float smoothStep=smoothstep(0.0,pow(uRadius,2.0),distanceSquared);

    //for elevation:
    float elevation = ((uElevation)*(1.0-smoothStep));
    modelPosition.y += elevation;

    //circular motion:
    // modelPosition.x += sin(uTime*5.0)*0.1*(1.0-smoothStep);
    // modelPosition.z += cos(uTime*5.0)*0.1*(1.0-smoothStep);

    //moving in random directions:
    modelPosition.x += sin(uTime*2.0*aRandomness.x)*aRandomness.x*aRandomness.y*2.0;
    modelPosition.y += cos(uTime*2.0*aRandomness.y)*aRandomness.y*aRandomness.z*2.0;
    modelPosition.z += cos(uTime*2.0*aRandomness.z)*aRandomness.z*aRandomness.x*2.0;

    //updating the position of the points:
    float dx = (modelPosition.x - uMousePos.x);  // Distance from the circle's internal y-axis
    float dz = (modelPosition.z - uMousePos.z);  // Distance from the circle's internal x-axis
    float distanceBetweenPoints =  sqrt(dx*dx + dz*dz);
    float unitDx = dx / distanceBetweenPoints;
    float unitDz = dz / distanceBetweenPoints;
    smoothStep=1.0-smoothStep;
    float power=round(0.35 * pow(uRadius, 0.85) * 100.0) / 100.0;//taken from chatgpt
    modelPosition.x += unitDx * smoothStep*(1.0-instantStep)*power;
    modelPosition.z += unitDz * smoothStep*(1.0-instantStep)*power;
   
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    gl_PointSize = uSize *2.0;
    // gl_PointSize = uSize * aScale*3.0; // for random size
    //disable the below code to see squishy blood like effect
    gl_PointSize *= (1.0 / - viewPosition.z); 

    vUv = uv;
    vSmoothStep=smoothStep;
}