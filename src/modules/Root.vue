<template>
  <div>
    <!-- <div class="absolute bg-gray-100 top-0 left-0 block z-20">
      <button
        class=""
        @click="debug"
      >
        Debug
      </button>
      <button
        @click="render"
      >
        render
      </button>
    </div> -->

    <div class="renderer-container">
      <vgl-renderer
        ref="renderer"
        antialias
        shadow-map-enabled
        class="renderer"
        camera="mainCamera"
        scene="mainScene"
        precision="highp"
        power-preference="low-power"
      >
        <vgl-box-geometry
          name="box"
          :height="0.2"
          :width="0.2"
          :depth="0.2"
        />
        <vgl-plane-geometry
          name="plane"
          :width="10"
          :height="10"
        />
        <vgl-mesh-standard-material name="std" />
        <vgl-scene
          ref="scene"
          name="mainScene"
        >
          <vgl-axes-helper size="10" />
          <vgl-grid-helper
            :size="10"
            :divisions="10"
            :color-center-line="`rgb(25, 255, 255)`"
            :color-grid="`rgb(255, 255, 255)`"
          />
          <vgl-mesh
            ref="plane"
            geometry="plane"
            material="std"
            cast-shadow
            receive-shadow
          />
          <vgl-mesh
            ref="box"
            geometry="box"
            material="std"
            cast-shadow
            receive-shadow
          />
          <!-- <template v-for="f in food">
            <Model
              :key="f.uuid"
              :src="require('assets/models/orange/scene.gltf')"
              scale="3 3 3"
              receive-shadow
              cast-shadow
              :position="`${f.x} 0 ${f.y}`"
            />
          </template>
          <template v-for="animal in animals">
            <Model
              :key="animal.uuid"
              :src="require('assets/models/sheep/scene.gltf')"
              receive-shadow
              cast-shadow
              :position="`${animal.x} 0.21 ${animal.y}`"
              scale="0.001 0.001 0.001"
              :rotation="`0 ${animal.angle || 0} 0 ZYX`"
            />
            <Blob
              :key="animal.uuid"
              :position="`${animal.x} 0 ${animal.y}`"
              :rotation="`0 ${animal.angle || 0} 0 ZYX`"
            />
          </template> -->

          <vgl-ambient-light
            ref="ambientlight"
            name="ambientlight"
            :intensity="0.5"
          />
          <vgl-spot-light
            ref="light"
            name="light"
            intensity="1"
            cast-shadow
          />
          <vgl-directional-light-helper
            ref="lighthelper"
            color="rgb(255,20,147)"
            light="light"
            :size="1"
          />
        </vgl-scene>
        <vgl-perspective-camera
          ref="camera"
          orbit-position="15 1 0.5"
          name="mainCamera"
        />
      </vgl-renderer>
    </div>
  </div>
</template>

<script>
import RBush from 'rbush';
import { v4 as uuidv4 } from 'uuid';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import Model from 'components/Model';
import * as wasm from 'wasm/pkg';
import LifeCycleWorker from './lifeCycle.worker';

console.error(wasm.main());
// import('wasm/pkg').then((wasm) => {
//   wasm.main();
// });

export default {
  name: 'Root',
  components: {
    Model,
    Blob,
  },
  data: () => ({
    globalIndex: 0,
    tree: new RBush(),
    blobs: new RBush(),
    workers: {},
  }),
  computed: {
    food() {
      return this.tree.all().filter((item) => item.type === 'food');
    },
    animals() {
      return this.tree.all().filter((item) => item.type === 'animal');
    },
  },
  mounted() {
    this.$refs.box.inst.position.y += 0.5;
    this.$refs.box.inst.position.x += 2;
    this.$refs.plane.inst.rotateX(-Math.PI / 2);
    const sky = new Sky();
    sky.scale.setScalar(450000);
    this.$refs.scene.inst.add(sky);
    const { uniforms } = sky.material;
    const distance = 400;
    uniforms.turbidity.value = 10;
    uniforms.rayleigh.value = 2;
    uniforms.mieCoefficient.value = 0.005;
    uniforms.mieDirectionalG.value = 0.8;
    uniforms.luminance.value = 1;

    const theta = Math.PI * (0.40 - 0.5); // Inclination
    const phi = 2 * Math.PI * (0.25 - 0.5); // Azimuth

    uniforms.sunPosition.value.copy({
      x: distance * Math.cos(phi),
      y: distance * Math.sin(phi) * Math.sin(theta),
      z: distance * Math.sin(phi) * Math.cos(theta),
    });
    if (this.$refs.light) {
      this.$refs.light.inst.position.copy({
        x: (distance / 20) * Math.cos(phi),
        y: (distance / 20) * Math.sin(phi) * Math.sin(theta),
        z: (distance / 20) * Math.sin(phi) * Math.cos(theta),
      });
    }
    if (this.$refs.ambientlight) {
      this.$refs.ambientlight.inst.position.copy({
        x: (distance / 20) * Math.cos(phi),
        y: (distance / 20) * Math.sin(phi) * Math.sin(theta),
        z: (distance / 20) * Math.sin(phi) * Math.cos(theta),
      });
    }
    this.$refs.renderer.inst.render(this.$refs.scene.inst, this.$refs.camera.inst);

    this.controls = new OrbitControls(this.$refs.camera.inst, document.querySelector('.renderer'));
    this.controls.addEventListener('change', () => {
      this.$refs.renderer.requestRender();
    });
    window.addEventListener('resize', () => {
      this.$refs.camera.inst.aspect = window.innerWidth / window.innerHeight;
      this.$refs.camera.inst.updateProjectionMatrix();
      this.$refs.renderer.inst.setSize(window.innerWidth, window.innerHeight);
      this.$refs.renderer.requestRender();
    }, false);
    this.createFood();
    this.blobs = this.createBlobs(3);
    const length = 3 * 100;
    const size = Int32Array.BYTES_PER_ELEMENT * length;
    this.sharedBuffer = new SharedArrayBuffer(size);
    this.sharedArray = new Int32Array(this.sharedBuffer);

    Object.keys(this.blobs).forEach((blobKey) => {
      this.setWorker(this.blobs[blobKey], blobKey);
    });
    console.error(this.blobs);
    setTimeout(() => {
      console.error(this.sharedArray);
    }, 2000);
  },
  methods: {
    setWorker(blob, blobID) {
      const worker = new LifeCycleWorker();
      console.error(blobID, blob.x, blob.y);
      Atomics.store(this.sharedArray, blobID, blobID);
      Atomics.store(this.sharedArray, blobID + 1, blob.x);
      Atomics.store(this.sharedArray, blobID + 2, blob.y);
      worker.postMessage(this.sharedBuffer);
      this.blobs[blobID] = { ...blob, data: this.sharedArray };
      this.workers = { ...this.workers, [blob.uuid]: worker };
    },
    createFood(quantity = 5) {
      for (let index = 0; index < quantity; index++) {
        const x = Math.random() * 5 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
        const y = Math.random() * 5 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
      }
    },
    createBlobs(quantity = 1) {
      let blobs = {};
      for (let index = 0; index < quantity; index++) {
        const x = Math.random() * 5 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
        const y = Math.random() * 5 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
        blobs = { ...blobs, [this.globalIndex]: { x: Math.round(x), y: Math.round(y) } };
        this.globalIndex += 3;
      }
      return blobs;
    },
  },
};
</script>

<style lang="scss" scoped>
.renderer-container {
  height: 100vh;
  width: 100%;
  @apply relative;
  > * {
    @apply absolute top-0 left-0 bottom-0 right-0 flex;
  }
}

</style>
