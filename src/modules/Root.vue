<template>
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
        <template v-for="f in food">
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
          />
        </template>
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
</template>

<script>
import RBush from 'rbush';
import { v4 as uuidv4 } from 'uuid';
import { Clock } from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import Model from 'components/Model';
import LifeCycleWorker from './lifeCycle.worker';
import FoodCycleWorker from './foodCycle.worker';

export default {
  name: 'Root',
  components: {
    Model,
  },
  data: () => ({
    mixer: undefined,
    clock: new Clock(),
    tree: new RBush(),
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

    const theta = Math.PI * (0.46 - 0.5); // Inclination
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
    // setInterval(() => {
    //   this.$refs.sheep.inst.position.x -= 0.07;
    //   this.$refs.renderer.requestRender();
    // }, 100);
    // this.animate();
    this.createFood();
    this.createAnimals();
    this.tree.all().forEach((item) => {
      let currentItem = item;
      if (item.type === 'animal') {
        const worker = new LifeCycleWorker();
        worker.postMessage({ type: 'initial', tree: this.tree.all(), position: { x: item.x, y: item.y } });
        worker.addEventListener('message', (e) => {
          if (e.data.type === 'move') {
            this.tree.remove(currentItem);
            currentItem = {
              ...item,
              x: e.data.newPosition.x,
              y: e.data.newPosition.y,
              minX: e.data.newPosition.x - 0.5,
              minY: e.data.newPosition.y - 0.5,
              maxX: e.data.newPosition.x + 0.5,
              maxY: e.data.newPosition.y + 0.5,
            };
            this.tree.insert(currentItem);
            worker.postMessage({ type: 'update', tree: this.tree.all(), position: { x: currentItem.x, y: currentItem.y } });
          } else if (e.data.type === 'eat') {
            this.tree.remove(e.data.food, (a, b) => a.uuid === b.uuid);
            worker.postMessage({ type: 'update', tree: this.tree.all(), position: { x: currentItem.x, y: currentItem.y } });
          }
        }, false);
        this.workers = { ...this.workers, [item.uuid]: worker };
      }
    });
    setInterval(() => {
      this.createFood(2);
      Object.keys(this.workers).forEach((workerKey) => {
        this.workers[workerKey].postMessage({ type: 'update', tree: this.tree.all() });
      });
    }, 5000);
    // const foodCycleWorker = new FoodCycleWorker();
    //  foodCycleWorker.addEventListener('message', (e) => {
    //  });
  },
  methods: {
    // animate() {
    //   requestAnimationFrame(this.animate);
    //   if (this.mixer) this.mixer.update(this.clock.getDelta());
    //   this.$refs.renderer.inst.render(this.$refs.scene.inst, this.$refs.camera.inst);
    // },
    createFood(quantity = 5) {
      for (let index = 0; index < quantity; index++) {
        const uuid = uuidv4();
        let x = Math.floor(Math.random() * 5) + 1;
        x *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
        let y = Math.floor(Math.random() * 5) + 1;
        y *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
        const item = {
          x,
          y,
          minX: x - 0.5,
          minY: y - 0.5,
          maxX: x + 0.5,
          maxY: y + 0.5,
          uuid,
          type: 'food',
        };
        this.tree.insert(item);
      }
    },
    createAnimals() {
      for (let index = 0; index < 2; index++) {
        const uuid = uuidv4();
        let x = Math.floor(Math.random() * 5) + 1;
        x *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
        let y = Math.floor(Math.random() * 5) + 1;
        y *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
        const item = {
          x,
          y,
          minX: x - 0.5,
          minY: y - 0.5,
          maxX: x + 0.5,
          maxY: y + 0.5,
          uuid,
          type: 'animal',
        };
        this.tree.insert(item);
      }
      // Web worders with setInterval here
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
