<template>
  <div>
    <div class="absolute top-0 left-0 block z-20 p-2">
      <button
        class="p-2 mr-1 border border-gray-900 rounded"
        @click="play"
      >
        Play
      </button>
      <button
        class="p-2 mr-1 border border-gray-900 rounded"
        @click="pause"
      >
        Pause
      </button>
      <button
        class="p-2 mr-1 border border-gray-900 rounded"
        @click="restart"
      >
        Restart
      </button>
      <button
        class="p-2 mr-1 border border-gray-900 rounded"

        @click="stop"
      >
        Stop
      </button>
    </div>

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
          <template v-for="food in foods">
            <Model
              :key="food.uuid"
              :src="require('assets/models/orange/scene.gltf')"
              scale="3 3 3"
              receive-shadow
              cast-shadow
              :position="`${food.x} 0 ${food.y}`"
            />
          </template>
          <template v-for="blob in blobs">
            <!-- <Model
              :key="animal.uuid"
              :src="require('assets/models/sheep/scene.gltf')"
              receive-shadow
              cast-shadow
              :position="`${animal.x} 0.21 ${animal.y}`"
              scale="0.001 0.001 0.001"
              :rotation="`0 ${animal.angle || 0} 0 ZYX`"
            /> -->
            <Blob
              :key="blob.uuid"
              :position="`${blob.x} 0 ${blob.y}`"
              :rotation="`0 ${blob.angle || 0} 0 ZYX`"
            />
          </template>
          <!-- <Blob
            :position="`3 0 2`"
            :rotation="`0 ${angleTest || 0} 0 ZYX`"
          /> -->
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
import { v4 as uuidv4 } from 'uuid';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import Model from 'components/Model';
import Blob from 'components/Blob';
import * as wasm from 'wasm/pkg';
import { LifeWorker, MatingWorker } from 'workers';
import knn from 'rbush-knn';
import MyRBush from 'utils/myRBush';

console.error(wasm.main());

export default {
  name: 'Root',
  components: {
    Model,
    Blob,
  },
  data: () => ({
    tree: new MyRBush(),
    blobsStructs: {},
    blobsWorkers: {},
    angleTest: 2.6,
  }),
  computed: {
    blobs() {
      return this.tree.all().filter((elem) => elem.type === 'blob');
    },
    foods() {
      return this.tree.all().filter((elem) => elem.type === 'food');
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

    uniforms.sunPosition.value.copy(this.generatePosition(distance, phi, theta));
    if (this.$refs.light) {
      this.$refs.light.inst.position.copy(this.generatePosition(distance / 20, phi, theta));
    }
    if (this.$refs.ambientlight) {
      this.$refs.ambientlight.inst.position.copy(this.generatePosition(distance / 20, phi, theta));
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

    this.generateBlobs(1);
    this.generateFoods(3);
    Object.keys(this.blobsStructs).forEach((blobKey) => {
      this.setBlobWorker(blobKey);
    });
  },
  methods: {
    stop() {
      this.tree.clear();
      Object.keys(this.blobsWorkers).forEach((workerKey) => {
        this.blobsWorkers[workerKey].postMessage({ type: 'kill' });
      });
      this.blobsWorkers = {};
      this.blobsStructs = {};
      this.foodsStructs = {};
      this.$refs.renderer.requestRender();
    },
    restart() {
      this.stop();
      console.clear();
      this.generateBlobs(1);
      this.generateFoods(3);
      Object.keys(this.blobsStructs).forEach((blobKey) => {
        this.setBlobWorker(blobKey);
      });
    },
    pause() {
      console.warn('Simulation was paused');
      Object.keys(this.blobsWorkers).forEach((workerKey) => {
        this.blobsWorkers[workerKey].postMessage({ type: 'pause' });
      });
    },
    play() {
      Object.keys(this.blobsWorkers).forEach((workerKey) => {
        this.blobsWorkers[workerKey].postMessage({ type: 'play' });
      });
    },
    setBlobWorker(blobKey) {
      const blobWorker = new LifeWorker();
      blobWorker.postMessage({
        type: 'update',
        tree: this.tree.all(),
        blob: this.blobsStructs[blobKey],
      });
      blobWorker.addEventListener('message', (event) => {
        switch (event.data.type) {
          case 'move': {
            let shouldPause;
            this.tree.remove(this.blobsStructs[event.data.blob.uuid]);
            const closeBy = this.tree.search({
              minX: this.blobsStructs[event.data.blob.uuid].x - this.blobsStructs[event.data.blob.uuid].fov,
              minY: this.blobsStructs[event.data.blob.uuid].y - this.blobsStructs[event.data.blob.uuid].fov,
              maxX: this.blobsStructs[event.data.blob.uuid].x + this.blobsStructs[event.data.blob.uuid].fov,
              maxY: this.blobsStructs[event.data.blob.uuid].y + this.blobsStructs[event.data.blob.uuid].fov,
            });
            if (closeBy.find((element) => element.type === 'food')) {
              const closestFood = knn(this.tree, this.blobsStructs[event.data.blob.uuid].x, this.blobsStructs[event.data.blob.uuid].y, 1, (item) => item.type === 'food');
              if (Math.abs(closestFood[0].x - this.blobsStructs[event.data.blob.uuid].x) < 0.1 && Math.abs(closestFood[0].y - this.blobsStructs[event.data.blob.uuid].y) < 0.1) {
                console.error('Eating objective.', closestFood[0]);
                if (this.blobsStructs[event.data.blob.uuid].objectives[closestFood[0].uuid]) {
                  this.tree.remove(closestFood[0]);
                  delete this.foodsStructs[closestFood[0].uuid];
                  delete this.blobsStructs[event.data.blob.uuid].objectives[closestFood[0].uuid];
                  blobWorker.postMessage({
                    type: 'removeObjective',
                    objective: closestFood[0],
                  });
                }
              } else if (!Object.keys(this.blobsStructs[event.data.blob.uuid].objectives).length) {
                console.error('addingObjective.', closestFood[0].uuid, `angle ${-Math.atan2(closestFood[0].y - this.blobsStructs[event.data.blob.uuid].y, closestFood[0].x - this.blobsStructs[event.data.blob.uuid].x)}`);
                this.blobsStructs[event.data.blob.uuid] = {
                  ...this.blobsStructs[event.data.blob.uuid],
                  angle: -Math.atan2(closestFood[0].y - this.blobsStructs[event.data.blob.uuid].y, closestFood[0].x - this.blobsStructs[event.data.blob.uuid].x),
                  objectives: { ...this.blobsStructs[event.data.blob.uuid].objectives, [closestFood[0].uuid]: closestFood[0] },
                };
                blobWorker.postMessage({
                  type: 'addObjective',
                  objective: closestFood[0],
                });
                shouldPause = true;
              }
            }
            const sin = Math.abs(Math.sin(this.blobsStructs[event.data.blob.uuid].angle));
            const newX = this.blobsStructs[event.data.blob.uuid].x + (Math.cos(this.blobsStructs[event.data.blob.uuid].angle) * 0.1);
            const newY = this.blobsStructs[event.data.blob.uuid].angle < 0 ? this.blobsStructs[event.data.blob.uuid].y + (sin * 0.1) : this.blobsStructs[event.data.blob.uuid].y - (sin * 0.1);
            if (newX < 5 && newY < 5 && newX > -5 && newY > -5) {
              this.blobsStructs[event.data.blob.uuid] = {
                ...this.blobsStructs[event.data.blob.uuid],
                x: newX,
                y: newY,
              };
            } else {
              console.warn('generate random radian, got out of bounds.');
              this.blobsStructs[event.data.blob.uuid] = {
                ...this.blobsStructs[event.data.blob.uuid],
                angle: this.generateRandomRadian(),
              };
            }
            this.tree.insert(this.blobsStructs[event.data.blob.uuid]);
            if (shouldPause) this.pause();
            break;
          }
          case 'changeDirection': {
            if (!Object.keys(this.blobsStructs[event.data.blob.uuid].objectives).length) {
              console.error('change direction');
              this.tree.remove(this.blobsStructs[event.data.blob.uuid]);
              this.blobsStructs[event.data.blob.uuid] = {
                ...this.blobsStructs[event.data.blob.uuid],
                angle: this.generateRandomRadian(),
              };
              this.tree.insert(this.blobsStructs[event.data.blob.uuid]);
            }
            break;
          }
          default:
            break;
        }
      });
      this.blobsWorkers = { ...this.blobsWorkers, [blobKey]: blobWorker };
    },
    generateBlobs(quantity = 5) {
      let blobs = [];
      for (let index = 0; index < quantity; index++) {
        const uuid = uuidv4();
        const blob = {
          uuid,
          type: 'blob',
          x: this.generateRandomPosition(),
          y: this.generateRandomPosition(),
          angle: this.generateRandomRadian(),
          objectives: {},
          fov: 3,
        };
        blobs = [...blobs, blob];
        this.blobsStructs = { ...this.blobsStructs, [uuid]: blob };
      }
      this.tree.load(blobs);
    },
    generateFoods(quantity = 5) {
      let foods = [];
      for (let index = 0; index < quantity; index++) {
        const uuid = uuidv4();
        const food = {
          uuid,
          type: 'food',
          x: this.generateRandomPosition(),
          y: this.generateRandomPosition(),
        };
        foods = [...foods, food];
        this.foodsStructs = { ...this.foodsStructs, [uuid]: food };
      }
      this.tree.load(foods);
    },
    generateRandomRadian() {
      return Math.random() * Math.PI * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
      // return Math.random() * Math.PI * 2;
    },
    generateRandomPosition() {
      const random = Math.random() * 5 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
      return parseFloat(random.toFixed(1));
    },
    generatePosition(distance, phi, theta) {
      return ({
        x: distance * Math.cos(phi),
        y: distance * Math.sin(phi) * Math.sin(theta),
        z: distance * Math.sin(phi) * Math.cos(theta),
      });
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
