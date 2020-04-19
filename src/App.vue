<template>
  <div
    id="app"
    class="bg-white dark:bg-gray-900"
  >
    <router-view />
  </div>
</template>

<script>
import { mapState } from 'vuex';

function checkDarkMode() {
  const storedMode = localStorage.getItem('mode');
  if ((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || storedMode === 'dark') {
    return true;
  }
  return false;
}

export default {
  name: 'App',
  components: { },
  data() {
    return {
      menu: false,
      darkmode: false,
    };
  },
  computed: mapState({
    modal: (state) => state.modal.config,
  }),
  created() {
    if (checkDarkMode()) {
      this.darkmode = true;
      document.documentElement.classList.add('mode-dark');
    } else {
      this.darkmode = false;
      document.documentElement.classList.remove('mode-dark');
    }
  },
  methods: {
    clearModal() {
      const { modal } = this;
      this.$store.dispatch('clearModal');
      if (modal.cancel) modal.cancel();
    },
    toggleMode() {
      if (!this.darkmode) {
        document.documentElement.classList.add('mode-dark');
        localStorage.setItem('mode', 'dark');
      } else {
        document.documentElement.classList.remove('mode-dark');
        localStorage.setItem('mode', 'light');
      }
      this.darkmode = !this.darkmode;
    },
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.icon-light {
  transform-origin: center;
  transition: opacity .5s, transform .5s;
}
.icon-dark {
  transform: rotateX(180deg);
  transform-origin: center;
  transition: opacity .5s, transform .5s;
}

</style>
