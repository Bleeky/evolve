export default {
  state: {
    config: {},
  },
  getters: {
    config: (state) => state.config,
  },
  mutations: {
    setModal(state, payload) {
      state.config = payload;
    },
    clearModal(state, payload) {
      state.config = {};
    },
  },
  actions: {
    modal({ commit }, payload) {
      commit('setModal', payload);
    },
    clearModal({ commit }, payload) {
      commit('clearModal', payload);
    },
  },
};
