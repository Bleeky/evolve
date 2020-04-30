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
          <!-- <vgl-axes-helper size="10" /> -->
          <!-- <vgl-grid-helper
            :size="10"
            :divisions="10"
          /> -->
          <vgl-mesh
            ref="plane"
            geometry="plane"
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
            <Blob
              :key="blob.uuid"
              :blob="blob"
              :position="`${blob.x} 0 ${blob.y}`"
              :rotation="`0 ${blob.angle || 0} 0 ZYX`"
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
          <!-- <vgl-directional-light-helper
            ref="lighthelper"
            color="rgb(255,20,147)"
            light="light"
            :size="1"
          /> -->
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
// import * as wasm from 'wasm/pkg';
import { LifeWorker, MatingWorker, FoodWorker } from 'workers';
import knn from 'rbush-knn';
import MyRBush from 'utils/myRBush';

// console.error(wasm.main());
// wasm.browser_debug();


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
    // const t0 = performance.now();
    // const test2 = wasm.generate_random_rad();
    // const t1 = performance.now();
    // console.log(`Call to wasm took ${t1 - t0} milliseconds.`);
    // const t2 = performance.now();
    // const test = Math.random() * Math.PI * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
    // const t3 = performance.now();
    // console.log(`Call to js took ${t3 - t2} milliseconds.`);


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

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.play();
      } else {
        this.pause();
      }
    });

    this.generateBlobs(2);
    this.generateFoods(5);
    Object.keys(this.blobsStructs).forEach((blobKey) => {
      this.setBlobWorker(blobKey);
    });
    this.foodWorker = new FoodWorker();
    this.foodWorker.addEventListener('message', () => {
      this.generateFoods(3);
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
      this.foodWorker.postMessage({ type: 'kill' });
      this.$refs.renderer.requestRender();
    },
    restart() {
      this.stop();
      console.clear();
      this.generateBlobs(2);
      this.generateFoods(5);
      Object.keys(this.blobsStructs).forEach((blobKey) => {
        this.setBlobWorker(blobKey);
      });
      this.foodWorker = new FoodWorker();
      this.foodWorker.addEventListener('message', () => {
        this.generateFoods(3);
      });
    },
    pause() {
      this.console('warn', 'Simulation was paused');
      Object.keys(this.blobsWorkers).forEach((workerKey) => {
        this.blobsWorkers[workerKey].postMessage({ type: 'pause' });
      });
      this.foodWorker.postMessage({ type: 'pause' });
    },
    play() {
      Object.keys(this.blobsWorkers).forEach((workerKey) => {
        this.blobsWorkers[workerKey].postMessage({ type: 'play' });
      });
      this.foodWorker.postMessage({ type: 'play' });
    },
    setBlobWorker(blobKey) {
      const blobWorker = new LifeWorker();
      blobWorker.postMessage({
        type: 'update',
        tree: this.tree.all(),
        blob: this.blobsStructs[blobKey],
      });
      blobWorker.addEventListener('message', (event) => {
        if (this.blobsStructs[event.data.blob.uuid]) {
          switch (event.data.type) {
            case 'move': {
              let shouldPause;
              this.tree.remove(this.blobsStructs[event.data.blob.uuid]);
              if (Object.keys(this.blobsStructs[event.data.blob.uuid].objectives).length
            && !this.foodsStructs[Object.keys(this.blobsStructs[event.data.blob.uuid].objectives)[0]]) {
                this.console('error', '👻 The food the blob had for objective has disappeared');
                blobWorker.postMessage({
                  type: 'removeObjective',
                  objective: { uuid: Object.keys(this.blobsStructs[event.data.blob.uuid].objectives)[0] },
                });
                delete this.blobsStructs[event.data.blob.uuid].objectives[Object.keys(this.blobsStructs[event.data.blob.uuid].objectives)[0]];
              // shouldPause = true;
              }
              const closeBy = this.tree.search({
                minX: this.blobsStructs[event.data.blob.uuid].x - this.blobsStructs[event.data.blob.uuid].fov,
                minY: this.blobsStructs[event.data.blob.uuid].y - this.blobsStructs[event.data.blob.uuid].fov,
                maxX: this.blobsStructs[event.data.blob.uuid].x + this.blobsStructs[event.data.blob.uuid].fov,
                maxY: this.blobsStructs[event.data.blob.uuid].y + this.blobsStructs[event.data.blob.uuid].fov,
              });
              if (closeBy.find((element) => element.type === 'food')) {
                const closestFood = knn(this.tree, this.blobsStructs[event.data.blob.uuid].x, this.blobsStructs[event.data.blob.uuid].y, 1, (item) => item.type === 'food');
                if (Math.abs(closestFood[0].x - this.blobsStructs[event.data.blob.uuid].x) < 0.1 && Math.abs(closestFood[0].y - this.blobsStructs[event.data.blob.uuid].y) < 0.1) {
                  if (this.blobsStructs[event.data.blob.uuid].objectives[closestFood[0].uuid]) {
                    this.console('error', '🍎 Eating objective.', closestFood[0].uuid);
                    this.tree.remove(closestFood[0]);
                    delete this.foodsStructs[closestFood[0].uuid];
                    delete this.blobsStructs[event.data.blob.uuid].objectives[closestFood[0].uuid];
                    let shouldDuplicate;
                    if (this.blobsStructs[event.data.blob.uuid].life + 1 > 5) {
                      shouldDuplicate = true;
                    }
                    this.blobsStructs[event.data.blob.uuid] = {
                      ...this.blobsStructs[event.data.blob.uuid],
                      life: !shouldDuplicate ? this.blobsStructs[event.data.blob.uuid].life + 1 : this.blobsStructs[event.data.blob.uuid].life - 1,
                    };
                    blobWorker.postMessage({
                      type: 'removeObjective',
                      objective: closestFood[0],
                    });
                    // shouldPause = true;
                    this.console('error', '💙 blob\'s life:', this.blobsStructs[event.data.blob.uuid].life);
                    if (shouldDuplicate) {
                      this.generateBlobs(1, this.blobsStructs[event.data.blob.uuid]).forEach((newBlob) => {
                        this.setBlobWorker(newBlob.uuid);
                      });
                    }
                  }
                } else if (!Object.keys(this.blobsStructs[event.data.blob.uuid].objectives).length) {
                  this.console('error', '❗️ addingObjective.', closestFood[0].uuid, `angle ${-Math.atan2(closestFood[0].y - this.blobsStructs[event.data.blob.uuid].y, closestFood[0].x - this.blobsStructs[event.data.blob.uuid].x)}`);
                  this.blobsStructs[event.data.blob.uuid] = {
                    ...this.blobsStructs[event.data.blob.uuid],
                    angle: -Math.atan2(closestFood[0].y - this.blobsStructs[event.data.blob.uuid].y, closestFood[0].x - this.blobsStructs[event.data.blob.uuid].x),
                    objectives: { ...this.blobsStructs[event.data.blob.uuid].objectives, [closestFood[0].uuid]: closestFood[0] },
                  };
                  blobWorker.postMessage({
                    type: 'addObjective',
                    objective: closestFood[0],
                  });
                // shouldPause = true;
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
                this.console('error', '⤵️ change direction');
                this.tree.remove(this.blobsStructs[event.data.blob.uuid]);
                this.blobsStructs[event.data.blob.uuid] = {
                  ...this.blobsStructs[event.data.blob.uuid],
                  angle: this.generateRandomRadian(),
                };
                this.tree.insert(this.blobsStructs[event.data.blob.uuid]);
              }
              break;
            }
            case 'looseLife': {
              this.tree.remove(this.blobsStructs[event.data.blob.uuid]);
              this.blobsStructs[event.data.blob.uuid] = {
                ...this.blobsStructs[event.data.blob.uuid],
                life: this.blobsStructs[event.data.blob.uuid].life - 1,
              };
              this.console('error', '💙 blob\'s life:', this.blobsStructs[event.data.blob.uuid].life);
              if (this.blobsStructs[event.data.blob.uuid].life === 0) {
                delete this.blobsStructs[event.data.blob.uuid];
                blobWorker.postMessage({ type: 'kill' });
                delete this.blobsWorkers[blobKey];
                if (!Object.keys(this.blobsStructs).length) {
                  this.console('warn', 'all blobs died 🤭');
                  this.$refs.renderer.requestRender();
                  this.stop();
                }
              } else {
                this.tree.insert(this.blobsStructs[event.data.blob.uuid]);
              }
              break;
            }
            default:
              break;
          }
        }
      });
      this.blobsWorkers = { ...this.blobsWorkers, [blobKey]: blobWorker };
    },
    generateBlobs(quantity = 5, fromParent) {
      let blobs = [];
      for (let index = 0; index < quantity; index++) {
        const uuid = uuidv4();
        const blob = {
          uuid,
          type: 'blob',
          x: fromParent ? fromParent.x : this.generateRandomPosition(),
          y: fromParent ? fromParent.y : this.generateRandomPosition(),
          angle: this.generateRandomRadian(),
          objectives: {},
          fov: fromParent ? fromParent.fov + Math.random() * 0.3 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1) : 3,
          life: 4,
          speed: fromParent ? fromParent.speed + Math.random() * 2 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1) : 50,
          size: fromParent ? fromParent.size + Math.random() * 0.3 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1) : 2,
        };
        blobs = [...blobs, blob];
        this.blobsStructs[uuid] = blob;
      }
      if (fromParent) {
        this.console('error', '👶 a baby blob appeared:', blobs);
      }
      if (blobs.length > 1) this.tree.load(blobs);
      else this.tree.insert(blobs[0]);
      return blobs;
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
      // return wasm.generate_random_rad();
      return Math.random() * Math.PI * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
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
    console(type = 'error', ...args) {
      if (this.consoleEnabled) console[type](args);
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
