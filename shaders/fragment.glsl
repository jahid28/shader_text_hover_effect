uniform sampler2D uTexture;
precision mediump float;
varying vec2 vUv;
varying float vSmoothStep;
varying vec3 vColor;

void main(){
   
    float strength = distance(gl_PointCoord, vec2(0.5));//gl_PointCoord is to add uv on each particle
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);//this is to make a dot with some low opacity on the edges, so it looks like a bloom.
    // strength = step(.5, strength);

    vec3 mixedColor = mix(vec3(0.0), vec3(vSmoothStep+.1,vSmoothStep+.1,.1), strength);
    // vec3 mixedColor = mix(vec3(0.0), vec3(vSmoothStep-.5,vSmoothStep-.5,0.0), strength);
    // vec3 mixedColor = mix(vec3(0.0), vec3(1.0-vSmoothStep,0.0,0.0), strength);
    // vec3 mixedColor = mix(vec3(0.0), vec3(1.0-pow(vSmoothStep,.02),0.0,0.0), strength);

    gl_FragColor=vec4(mixedColor,1.0);
    // gl_FragColor=vec4(strength,strength,strength,1.0);

    //for texture:
    // vec4 textureColor = texture2D(uTexture, vUv);
    // gl_FragColor=textureColor;
    #include <colorspace_fragment>
}