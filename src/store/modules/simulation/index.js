import Vue from 'vue';
import MyRBush from 'utils/myRBush';

export default {
  state: {
    settings: {
      antialias: false,
      shadows: false,
      foodPerSpawn: 4,
    },
    status: 'play',
    selectedBlob: null,
    tree: new MyRBush(),
  },
  getters: {
    status: (state) => state.status,
    setting: (state) => (setting) => state.settings[setting],
    settings: (state) => state.settings,
  },
  mutations: {
    changeStatus(state, payload) {
      state.status = payload;
    },
    updateSettings(state, payload) {
      Vue.set(state, 'settings', { ...state.settings, ...payload });
    },
  },
  actions: {
    changeStatus({ commit }, payload) {
      commit('changeStatus', payload);
    },
    updateSettings({ commit }, payload) {
      commit('updateSettings', payload);
    },
  },
};
