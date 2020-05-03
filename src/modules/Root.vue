<template>
  <div>
    <Controls
      @restart="restart"
      @stop="stop"
    />

    <div
      v-if="selectedBlob"
      class="absolute bottom-0 w-full z-40"
    >
      <div class="bg-gray-600 w-64 m-auto p-4 border rounded mb-2">
        <div class="text-xl text-center">
          Blob details
        </div>
        <ul>
          <li>
            <span class="font-bold">Life:</span> {{ selectedBlob.life }}
          </li>
          <li>
            <span class="font-bold">FOV:</span> {{ selectedBlob.fov.toFixed(2) }}
          </li>
          <li>
            <span class="font-bold">Size:</span> {{ selectedBlob.size.toFixed(2) }}
          </li>
        </ul>
      </div>
    </div>

    <div
      ref="container"
      class="renderer-container"
    >
      <vgl-renderer
        ref="renderer"
        class="renderer"
        camera="mainCamera"
        scene="mainScene"
        :antialias="settings.antialias"
        :shadow-map-enabled="settings.shadows"
      >
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
          <!-- <vgl-directional-light-helper
            ref="lighthelper"
            color="rgb(255,20,147)"
            light="light"
            :size="1"
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
import Stats from 'three/examples/jsm/libs/stats.module';

import Controls from 'modules/Controls';
import Model from 'components/Model';
import Blob from 'components/Blob';
// import * as wasm from 'wasm/pkg';
import { LifeWorker, FoodWorker } from 'workers';
import generateMixin from 'mixins/generateMixin';
import {
  BASE_FOV, BASE_LIFE, BASE_SPEED, BASE_SIZE,
} from 'utils/consts';
import PickHelper from 'utils/pickHelper';
import knn from 'rbush-knn';
import MyRBush from 'utils/myRBush';

// console.error(wasm.main());
// wasm.browser_debug();

export default {
  name: 'Root',
  components: {
    Model,
    Blob,
    Controls,
  },
  mixins: [generateMixin],
  data: () => ({
    tree: new MyRBush(),
    blobsStructs: {},
    blobsWorkers: {},
    consoleEnabled: false,
    showAbout: false,
    clickPosition: undefined,
    pickHelper: undefined,
    selectedBlob: undefined,
    composer: undefined,
  }),
  computed: {
    blobs() {
      return this.tree.all().filter((elem) => elem.type === 'blob');
    },
    foods() {
      return this.tree.all().filter((elem) => elem.type === 'food');
    },
    status() { return this.$store.getters.status; },
    settings() { return this.$store.getters.settings; },
  },
  watch: {
    status(newValue, oldValue) {
      if (newValue !== oldValue) {
        this[newValue]();
      }
    },
    clickPosition(coordinates) {
      const objectSelected = this.pickHelper.pick(coordinates, this.$refs.scene.inst, this.$refs.camera.inst);
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
      if (objectSelected) {
        this.selectedBlob = this.blobsStructs[objectSelected.userData.uuid];
        if (this.selectedBlob) {
          console.error(this.selectedBlob);
          this.refreshInterval = setInterval(() => {
            this.selectedBlob = this.blobsStructs[objectSelected.userData.uuid];
          }, 200);
        }
      } else {
        this.selectedBlob = null;
      }
    },
  },
  mounted() {
    // this.stats = new Stats();
    // this.stats.dom.style.top = null;
    // this.stats.dom.style.bottom = 0;
    // this.$refs.container.appendChild(this.stats.dom);

    this.getCanvasRelativePosition = (event) => {
      const rect = this.$refs.renderer.inst.domElement.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) * this.$refs.renderer.inst.domElement.width) / rect.width,
        y: ((event.clientY - rect.top) * this.$refs.renderer.inst.domElement.height) / rect.height,
      };
    };
    this.setPickPosition = (event) => {
      const pos = this.getCanvasRelativePosition(event);
      const x = (pos.x / this.$refs.renderer.inst.domElement.width) * 2 - 1;
      const y = (pos.y / this.$refs.renderer.inst.domElement.height) * -2 + 1;
      this.clickPosition = { x, y };
    };
    window.addEventListener('click', this.setPickPosition);

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
      if (document.visibilityState === 'visible' && this.autoPause) {
        this.$store.dispatch('changeStatus', 'play');
        this.autoPause = false;
      } else if (this.status === 'play') {
        this.autoPause = true;
        this.$store.dispatch('changeStatus', 'pause');
      }
    });

    this.pickHelper = new PickHelper(this.$refs.renderer);
    this.initializeSim();
  },
  methods: {
    initializeSim() {
      // this.stats.begin();
      this.generateBlobs(2);
      this.generateFoods(5);
      Object.keys(this.blobsStructs).forEach((blobKey) => {
        this.setBlobWorker(blobKey);
      });
      this.foodWorker = new FoodWorker();
      this.foodWorker.addEventListener('message', () => {
        this.generateFoods(this.settings.foodPerSpawn);
      });
    },
    stop() {
      this.tree.clear();
      Object.keys(this.blobsWorkers).forEach((workerKey) => {
        this.blobsWorkers[workerKey].postMessage({ type: 'kill' });
      });
      this.foodWorker.postMessage({ type: 'kill' });
      this.blobsWorkers = {};
      this.blobsStructs = {};
      this.foodsStructs = {};
      this.$refs.renderer.requestRender();
      // this.stats.end();
    },
    restart() {
      this.stop();
      console.clear();
      this.initializeSim();
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
        const blobUuid = event.data.blob.uuid;
        if (this.blobsStructs[blobUuid]) {
          switch (event.data.type) {
            case 'move': {
              this.tree.remove(this.blobsStructs[blobUuid]);
              if (Object.keys(this.blobsStructs[blobUuid].objectives).length
            && !this.foodsStructs[Object.keys(this.blobsStructs[blobUuid].objectives)[0]] && !this.blobsStructs[Object.keys(this.blobsStructs[blobUuid].objectives)[0]]) {
                this.console('error', '👻 The food the blob had for objective has disappeared');
                blobWorker.postMessage({
                  type: 'removeObjective',
                  objective: { uuid: Object.keys(this.blobsStructs[blobUuid].objectives)[0] },
                });
                delete this.blobsStructs[blobUuid].objectives[Object.keys(this.blobsStructs[blobUuid].objectives)[0]];
              }
              const closeBy = this.tree.search({
                minX: this.blobsStructs[blobUuid].x - this.blobsStructs[blobUuid].fov,
                minY: this.blobsStructs[blobUuid].y - this.blobsStructs[blobUuid].fov,
                maxX: this.blobsStructs[blobUuid].x + this.blobsStructs[blobUuid].fov,
                maxY: this.blobsStructs[blobUuid].y + this.blobsStructs[blobUuid].fov,
              });
              if (closeBy.find((element) => element.type === 'food' || (element.type === 'blob' && element.uuid !== blobUuid && element.size + (element.size * 0.15) < this.blobsStructs[blobUuid].size))) {
                const closestFood = knn(this.tree, this.blobsStructs[blobUuid].x, this.blobsStructs[blobUuid].y, 1, (item) => item.type === 'food'
                || (item.type === 'blob' && item.uuid !== blobUuid && item.size + item.size * 0.15 < this.blobsStructs[blobUuid].size));
                if (Math.abs(closestFood[0].x - this.blobsStructs[blobUuid].x) < 0.1 && Math.abs(closestFood[0].y - this.blobsStructs[blobUuid].y) < 0.1) {
                  if (this.blobsStructs[blobUuid].objectives[closestFood[0].uuid]) {
                    this.console('error', '🍎 Eating objective.', closestFood[0].uuid, closestFood[0].type);
                    this.tree.remove(closestFood[0]);
                    delete this[closestFood[0].type === 'food' ? 'foodsStructs' : 'blobsStructs'][closestFood[0].uuid];
                    let shouldDuplicate;
                    if (this.blobsStructs[blobUuid].life + 1 > 5) {
                      shouldDuplicate = true;
                    }
                    this.blobsStructs[blobUuid] = {
                      ...this.blobsStructs[blobUuid],
                      life: !shouldDuplicate ? this.blobsStructs[blobUuid].life + 1 : this.blobsStructs[blobUuid].life - 1,
                    };
                    if (closestFood[0].type === 'blob') {
                      this.blobsWorkers[closestFood[0].uuid].postMessage({ type: 'kill' });
                      delete this.blobsWorkers[closestFood[0].uuid];
                    }
                    delete this.blobsStructs[blobUuid].objectives[closestFood[0].uuid];
                    blobWorker.postMessage({
                      type: 'removeObjective',
                      objective: closestFood[0],
                    });
                    this.console('error', '💙 blob\'s life:', this.blobsStructs[blobUuid].life);
                    if (shouldDuplicate) {
                      this.generateBlobs(1, this.blobsStructs[blobUuid]).forEach((newBlob) => {
                        this.setBlobWorker(newBlob.uuid);
                      });
                    }
                  }
                } else if (!Object.keys(this.blobsStructs[blobUuid].objectives).length) {
                  this.console('error', '❗️ addingObjective.', closestFood[0].uuid, `angle ${-Math.atan2(closestFood[0].y - this.blobsStructs[blobUuid].y, closestFood[0].x - this.blobsStructs[blobUuid].x)}`);
                  this.blobsStructs[blobUuid] = {
                    ...this.blobsStructs[blobUuid],
                    angle: -Math.atan2(closestFood[0].y - this.blobsStructs[blobUuid].y, closestFood[0].x - this.blobsStructs[blobUuid].x),
                    objectives: { [closestFood[0].uuid]: closestFood[0] },
                  };
                  blobWorker.postMessage({
                    type: 'addObjective',
                    objective: closestFood[0],
                  });
                } else if (Object.keys(this.blobsStructs[blobUuid].objectives).length && !this.blobsStructs[blobUuid].objectives[closestFood[0].uuid]) {
                  blobWorker.postMessage({
                    type: 'removeObjective',
                    objective: { uuid: Object.keys(this.blobsStructs[blobUuid].objectives)[0] },
                  });
                  this.blobsStructs[blobUuid].objectives = {};
                  this.blobsStructs[blobUuid] = {
                    ...this.blobsStructs[blobUuid],
                    angle: -Math.atan2(closestFood[0].y - this.blobsStructs[blobUuid].y, closestFood[0].x - this.blobsStructs[blobUuid].x),
                    objectives: { [closestFood[0].uuid]: closestFood[0] },
                  };
                  blobWorker.postMessage({
                    type: 'addObjective',
                    objective: closestFood[0],
                  });
                }
              } else if (Object.keys(this.blobsStructs[blobUuid].objectives).length) {
                blobWorker.postMessage({
                  type: 'removeObjective',
                  objective: { uuid: Object.keys(this.blobsStructs[blobUuid].objectives)[0] },
                });
                this.blobsStructs[blobUuid].objectives = {};
              }
              const sin = Math.abs(Math.sin(this.blobsStructs[blobUuid].angle));
              const newX = this.blobsStructs[blobUuid].x + (Math.cos(this.blobsStructs[blobUuid].angle) * 0.1);
              const newY = this.blobsStructs[blobUuid].angle < 0 ? this.blobsStructs[blobUuid].y + (sin * 0.1) : this.blobsStructs[blobUuid].y - (sin * 0.1);
              if (newX < 5 && newY < 5 && newX > -5 && newY > -5) {
                this.blobsStructs[blobUuid].x = newX;
                this.blobsStructs[blobUuid].y = newY;
              } else {
                this.blobsStructs[blobUuid].angle = this.generateRandomRadian();
              }
              this.tree.insert(this.blobsStructs[blobUuid]);
              break;
            }
            case 'changeDirection': {
              if (!Object.keys(this.blobsStructs[blobUuid].objectives).length) {
                this.console('error', '⤵️ change direction');
                this.tree.remove(this.blobsStructs[blobUuid]);
                this.blobsStructs[blobUuid] = {
                  ...this.blobsStructs[blobUuid],
                  angle: this.generateRandomRadian(),
                };
                this.tree.insert(this.blobsStructs[blobUuid]);
              }
              break;
            }
            case 'looseLife': {
              this.tree.remove(this.blobsStructs[blobUuid]);
              this.blobsStructs[blobUuid] = {
                ...this.blobsStructs[blobUuid],
                life: this.blobsStructs[blobUuid].life - 1,
              };
              this.console('error', '💙 blob\'s life:', this.blobsStructs[blobUuid].life);
              if (this.blobsStructs[blobUuid].life === 0) {
                delete this.blobsStructs[blobUuid];
                blobWorker.postMessage({ type: 'kill' });
                delete this.blobsWorkers[blobKey];
                if (this.refreshInterval) clearInterval(this.refreshInterval);
                if (this?.selectedBlob?.uuid === blobUuid) this.selectedBlob = null;
                if (!Object.keys(this.blobsStructs).length) {
                  this.console('warn', 'all blobs died 🤭');
                  this.$refs.renderer.requestRender();
                  this.stop();
                }
              } else {
                this.tree.insert(this.blobsStructs[blobUuid]);
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
          fov: fromParent ? fromParent.fov + Math.random() * 0.3 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1) : BASE_FOV,
          size: fromParent ? fromParent.size + Math.random() * 0.5 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1) : BASE_SIZE,
        };
        blob.speed = Math.round((blob.size * BASE_SPEED) / BASE_SIZE);
        blob.life = Math.round((blob.size * BASE_LIFE) / BASE_SIZE);
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
