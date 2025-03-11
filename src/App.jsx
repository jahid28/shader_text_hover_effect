import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
// import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

import GUI from "lil-gui";
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";
function App() {
  const ref = useRef(null);
  const gui = new GUI();
  const parameters = {};
  // parameters.count = 5000;
  parameters.radius = 1;
  parameters.randomness = 0.2;
  parameters.randomnessPower = 3;
  parameters.elevation = 0;
  parameters.text = "Jahid";
  parameters.subdivisions = 0;
  parameters.divisions = 200;
  parameters.textSize = 2;

  useEffect(() => {
    if (ref.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // it will make sure that the pixel ratio will not be more than 2 bcz 2 is enough.
      // renderer.setClearColor(0xffffff, 1);
      ref.current.appendChild(renderer.domElement);
      scene.add(camera);
      camera.position.set(0, 5, 0);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      // controls.enableZoom = false;
      // controls.enableRotate = false;

      // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      // scene.add(ambientLight);
      // const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
      // directionalLight.position.set(10, 10, 10);
      // scene.add(directionalLight);

      const gltfLoader = new GLTFLoader();
      const fontLoader = new FontLoader();
      const textureLoader = new THREE.TextureLoader();
      const flagTexture = textureLoader.load("/textures/flag.jpg");

      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshBasicMaterial({ visible: false, color: "lime" })
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = 0.1;
      scene.add(plane);

      // const axesHelper = new THREE.AxesHelper(5);
      // scene.add(axesHelper);

      function resampleShape(shape, divisions) {
        // Resample the outer contour.
        const spacedPoints = shape.getSpacedPoints(divisions);
        const newShape = new THREE.Shape(spacedPoints);
        // Process any holes in the shape.
        shape.holes.forEach((hole) => {
          const spacedHolePoints = hole.getSpacedPoints(divisions);
          newShape.holes.push(new THREE.Path(spacedHolePoints));
        });
        return newShape;
      }

      function subdivideGeometry(geometry, iterations) {
        // Work with non-indexed geometry to simplify the process.
        geometry = geometry.toNonIndexed();
        let posAttr = geometry.getAttribute("position");
        let positions = posAttr.array;

        // Build an array of triangles (each triangle is an array of three Vector3's).
        let triangles = [];
        for (let i = 0; i < positions.length; i += 9) {
          const v0 = new THREE.Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          );
          const v1 = new THREE.Vector3(
            positions[i + 3],
            positions[i + 4],
            positions[i + 5]
          );
          const v2 = new THREE.Vector3(
            positions[i + 6],
            positions[i + 7],
            positions[i + 8]
          );
          triangles.push([v0, v1, v2]);
        }

        // For each iteration, subdivide every triangle into 4 triangles.
        for (let iter = 0; iter < iterations; iter++) {
          let newTriangles = [];
          triangles.forEach((tri) => {
            const [v0, v1, v2] = tri;
            // Compute midpoints for each edge.
            const a = new THREE.Vector3()
              .addVectors(v0, v1)
              .multiplyScalar(0.5);
            const b = new THREE.Vector3()
              .addVectors(v1, v2)
              .multiplyScalar(0.5);
            const c = new THREE.Vector3()
              .addVectors(v2, v0)
              .multiplyScalar(0.5);
            // Create four new triangles.
            newTriangles.push([v0, a, c]);
            newTriangles.push([a, v1, b]);
            newTriangles.push([c, b, v2]);
            newTriangles.push([a, b, c]);
          });
          triangles = newTriangles;
        }

        // Rebuild a flat array of vertices from the subdivided triangles.
        const newVertices = [];
        triangles.forEach((tri) => {
          tri.forEach((v) => {
            newVertices.push(v.x, v.y, v.z);
          });
        });

        const newGeometry = new THREE.BufferGeometry();
        newGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(newVertices), 3)
        );
        newGeometry.computeVertexNormals();
        return newGeometry;
      }

      let geometry = null;
      let material = null;
      let points = null;

      const generateScene = () => {
        if (points !== null) {
          geometry.dispose();
          material.dispose();
          scene.remove(points);
        }

        fontLoader.load(
          "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
          (font) => {
            let subdivisions = parameters.subdivisions;
            let divisions = parameters.divisions;

            const shapes = font.generateShapes(
              parameters.text,
              parameters.textSize,
              2
            );
            // Resample each shape for an even outline.
            const resampledShapes = shapes.map((shape) =>
              resampleShape(shape, divisions)
            );
            // Build the initial geometry from the resampled shapes.
            let textGeometry = new THREE.ShapeGeometry(resampledShapes);

            // Optionally subdivide the geometry to get a denser mesh.
            if (subdivisions > 0) {
              textGeometry = subdivideGeometry(textGeometry, subdivisions);
            }
            textGeometry.center();

            // gltfLoader.load("/models/jk.glb", (gltf) => {
            let allVertices = textGeometry.attributes.position;
            //rotate the model:
            const rotation = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
            allVertices.applyMatrix4(rotation);
            let numOfVertices = allVertices.count;

            geometry = new THREE.BufferGeometry();

            //for model:
            const positions = new Float32Array(numOfVertices * 3);
            positions.set(allVertices.array);
            const colors = new Float32Array(numOfVertices * 3);
            const scales = new Float32Array(numOfVertices * 1);
            const randomness = new Float32Array(numOfVertices * 3);

            // const positions = new Float32Array(parameters.count * 3);
            // const colors = new Float32Array(parameters.count * 3);
            // const scales = new Float32Array(parameters.count * 1);
            // const randomness = new Float32Array(parameters.count * 3);

            for (let i = 0; i < numOfVertices * 3; i += 3) {
              // for (let i = 0; i < parameters.count * 3; i += 3) {
              //comment these 3 lines for model:
              // positions[i] = (Math.random() - 0.5) * 4;
              // positions[i + 1] = 0;
              // positions[i + 2] = (Math.random() - 0.5) * 4;

              colors[i] = Math.random();
              colors[i + 1] = Math.random();
              colors[i + 2] = Math.random();

              scales[i] = Math.random();

              const randomX =
                Math.pow(Math.random(), parameters.randomnessPower) *
                (Math.random() < 0.5 ? 1 : -1) *
                parameters.randomness *
                2;
              // parameters.radius;
              const randomY =
                Math.pow(Math.random(), parameters.randomnessPower) *
                (Math.random() < 0.5 ? 1 : -1) *
                parameters.randomness *
                2;
              // parameters.radius;
              const randomZ =
                Math.pow(Math.random(), parameters.randomnessPower) *
                (Math.random() < 0.5 ? 1 : -1) *
                parameters.randomness *
                2;
              // parameters.radius;

              randomness[i] = randomX;
              randomness[i + 1] = randomY;
              randomness[i + 2] = randomZ;
            }

            geometry.setAttribute(
              "position",
              new THREE.BufferAttribute(positions, 3)
            );
            geometry.setAttribute(
              "color",
              new THREE.BufferAttribute(colors, 3)
            );
            geometry.setAttribute(
              "aScale",
              new THREE.BufferAttribute(scales, 1)
            );
            geometry.setAttribute(
              "aRandomness",
              new THREE.BufferAttribute(randomness, 3)
            );

            material = new THREE.ShaderMaterial({
              // side: THREE.DoubleSide,
              // wireframe: true,
              vertexShader,
              fragmentShader,
              vertexColors: true,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              uniforms: {
                uTime: { value: 0 },
                uMousePos: { value: new THREE.Vector3(100, 0, 100) },
                uSize: { value: 30 * renderer.getPixelRatio() },
                uRadius: { value: parameters.radius },
                uElevation: { value: parameters.elevation },
                uTexture: { value: flagTexture },
              },
            });

            points = new THREE.Points(geometry, material);
            scene.add(points);
          }
        );
      };

      generateScene();

      // gui
      //   .add(parameters, "count")
      //   .min(100)
      //   .max(50000)
      //   .step(100)
      //   .name("Count")
      //   .onFinishChange(generateScene);
      gui
        .add(parameters, "radius")
        .min(0.5)
        .max(10)
        .step(0.5)
        .name("Radius")
        .onFinishChange(generateScene);
      gui
        .add(parameters, "randomness")
        .min(0.1)
        .max(1)
        .step(0.1)
        .name("Randomness")
        .onFinishChange(generateScene);
      gui
        .add(parameters, "randomnessPower")
        .min(1)
        .max(10)
        .step(1)
        .name("RandomnessPower")
        .onFinishChange(generateScene);
      gui
        .add(parameters, "elevation")
        .min(0)
        .max(2)
        .step(0.1)
        .name("Elevation")
        .onFinishChange(generateScene);
      gui
        .add(parameters, "subdivisions")
        .min(0)
        .max(1)
        .step(0.1)
        .name("Subdivisions")
        .onFinishChange(generateScene);
      gui
        .add(parameters, "divisions")
        .min(100)
        .max(300)
        .step(10)
        .name("Divisions")
        .onFinishChange(generateScene);
      gui
        .add(parameters, "textSize")
        .min(0.1)
        .max(2)
        .step(0.1)
        .name("Text Size")
        .onFinishChange(generateScene);
      gui.add(parameters, "text").name("Text").onFinishChange(generateScene);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      window.addEventListener("mousemove", (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) {
          // console.log(intersects[0].point);
          material.uniforms.uMousePos.value = intersects[0].point;
        }
      });

      const clock = new THREE.Clock();

      const animate = () => {
        const elapsedTime = clock.getElapsedTime();
        if (material) {
          material.uniforms.uTime.value = elapsedTime;
        }
        controls.update();

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();

      window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      });

      return () => {
        ref.current.removeChild(renderer.domElement);
      };
    }
  }, [ref]);

  return (
      <div style={{ overflow: "hidden",width:"100vw",height:"100vh" }} ref={ref}></div>
  );
}

export default App;
