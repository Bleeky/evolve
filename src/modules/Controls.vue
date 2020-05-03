<template>
  <div>
    <div
      id="controls"
      class="absolute top-0 left-0 block z-20 p-2 flex"
    >
      <transition
        name="fade"
        mode="out-in"
      >
        <button
          v-if="status === 'pause'"
          class="p-2 mr-1 border border-gray-900 rounded flex items-center hover:text-white hover:bg-gray-900"
          @click.stop="changeStatus('play')"
        >
          <Icon
            icon="IconPlay"
            :class="'fill-current h-4 w-4 mr-2'"
          />
          Play
        </button>
        <button
          v-else-if="status === 'play'"
          class="p-2 mr-1 border border-gray-900 rounded flex items-center hover:text-white hover:bg-gray-900"
          @click.stop="changeStatus('pause')"
        >
          <Icon
            icon="IconPause"
            :class="'fill-current h-4 w-4 mr-2'"
          />
          Pause
        </button>
      </transition>
      <button
        class="p-2 mr-1 border border-gray-900 rounded flex items-center hover:text-white hover:bg-gray-900"
        @click.stop="$emit('restart'); changeStatus('play')"
      >
        <Icon
          icon="IconRewind"
          :class="'fill-current h-4 w-4 mr-2'"
        />

        Restart
      </button>
      <button
        class="p-2 mr-1 border border-gray-900 rounded flex items-center hover:text-white hover:bg-gray-900"
        @click.stop="$emit('stop')"
      >
        <Icon
          icon="IconStop"
          :class="'fill-current h-4 w-4 mr-2'"
        />

        Stop
      </button>
    </div>
    <div
      id="infos"
      class="absolute top-0 right-0 block z-20 p-2 flex"
    >
      <button
        class="p-2 mr-1 border border-gray-900 rounded flex items-center hover:text-white hover:bg-gray-900"
        @click="showModal = 'settings'; changeStatus('pause')"
      >
        Settings
      </button>
      <button
        class="p-2 mr-1 border border-gray-900 rounded flex items-center hover:text-white hover:bg-gray-900"
        @click="showModal = 'rules'; changeStatus('pause')"
      >
        Rules
      </button>
      <button
        class="p-2 mr-1 border border-gray-900 rounded flex items-center hover:text-white hover:bg-gray-900"
        @click="showModal = 'about'; changeStatus('pause')"
      >
        About
      </button>
    </div>
    <Modal
      :visible="showModal !== ''"
      :close-on-outside="false"
      :dark="true"
      @close="showModal = ''"
    >
      <template
        v-slot:content
      >
        <div class="flex justify-center p-12 md:p-40 flex-col items-center">
          <template v-if="showModal === 'about'">
            <h2 class="text-4xl font-bold text-gray-800">
              About Evolve
            </h2>
            <div class="mt-2">
              Evolve is a small project to simulate a very simple process of evolution in a population of individuals.
            </div>
            <div class="mt-2">
              It is also a small experiment project to play with WebWorkers and the ThreeJS library.
            </div>
            <div class="mt-4 text-gray-800">
              Made with ❤️ by <a
                class="font-bold"
                href="https://github.com/Bleeky"
                target="_blank"
              >
                Bleeky
              </a>
            </div>
            <a
              href="https://github.com/Bleeky/evolve"
              target="_blank"
            >
              <Icon
                icon="IconGithub"
                :class="'mt-10 text-gray-900 stroke-current h-10 w-10 cursor-pointer hover:text-gray-600'"
              />
            </a>
          </template>
          <template v-else-if="showModal === 'settings'">
            <h2 class="text-4xl font-bold text-gray-800">
              Settings
            </h2>
            <div class="flex flex-col mt-2">
              <div>
                <input
                  id="antialiasing"
                  v-model="antialias"
                  type="checkbox"
                >
                <label for="antialiasing">Anti-aliasing</label>
              </div>
              <div>
                <input
                  id="shadow"
                  v-model="shadows"
                  type="checkbox"
                >
                <label for="shadow">Shadows</label>
              </div>
              <div class="mt-2">
                Food per spawn
              </div>
              <div class="flex items-center">
                <input
                  v-model="foodPerSpawn"
                  type="range"
                  min="2"
                  max="8"
                >
                <span class="ml-2 px-2 border border-gray-500 rounded">
                  {{ foodPerSpawn }}
                </span>
              </div>
            </div>
          </template>
          <template v-else-if="showModal === 'rules'">
            <h2 class="text-4xl font-bold text-gray-800">
              Rules of the simulation
            </h2>
            <div class="mt-2 text-gray-800">
              This simulation show blobs moving randomly in a closed environment. Once they reach a certain amount of food, they are able to reproduce.
              Each new blob that appear from the dupplication will have random mutation from his parent's traits.
            </div>
            <div class="text-3xl font-bold mt-10 mb-4 text-gray-800">
              The traits
            </div>
            <div class="flex justify-start flex-col">
              <div class="text-xl font-bold mb-4">
                FOV
              </div>
              <div class="text-gray-700 text-sm">
                The FOV (Field of View) trait represents the distance at wich the blob will be able to see potential food. Giving them more time than the competion to rush toward it !
              </div>
              <div class="text-xl font-bold mb-4 mt-4">
                Size
              </div>
              <div class="text-gray-700 text-sm">
                The size trait have several influences over the simulation. A bigger blob will lose health more slowly, reducing its heart-rate and thus his speed.<br>
                But size can give a competitive advantage: a blob that is at least 15% bigger than another one will be able to eat it. Though.
              </div>
            </div>
          </template>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script>
export default {
  name: 'Controls',
  data() {
    return {
      showModal: '',
    };
  },
  computed: {
    antialias: {
      get() {
        return this.$store.getters.setting('antialias');
      },
      set(value) {
        this.$store.commit('updateSettings', { antialias: value });
      },
    },
    shadows: {
      get() {
        return this.$store.getters.setting('shadows');
      },
      set(value) {
        this.$store.commit('updateSettings', { shadows: value });
      },
    },
    foodPerSpawn: {
      get() {
        return this.$store.getters.setting('foodPerSpawn');
      },
      set(value) {
        this.$store.commit('updateSettings', { foodPerSpawn: value });
      },
    },
    status() { return this.$store.getters.status; },
  },
  methods: {
    changeStatus(status) {
      this.$store.dispatch('changeStatus', status);
    },
  },
};
</script>

<style lang="scss" scoped>

</style>
