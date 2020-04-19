import Vue from 'vue';

export default {
  state: {
    errors: {},
  },
  getters: {
    errors: (state) => (reqs) => {
      let results = [];
      Object.keys(state.errors).forEach((key) => {
        if (reqs.find((req) => state.errors[key].req === req)) results = [...results, state.errors[key]];
      });
      return results;
    },
  },
  mutations: {
    removeErrorEntry: (state, payload) => {
      const newErrors = { ...state.errors };
      delete newErrors[`${payload.uuid}`];
      Vue.set(state, 'errors', newErrors);
    },
    error: (state, payload) => {
      Vue.set(state, 'errors', { ...state.errors, [payload.uuid]: payload });
    },
  },
  actions: {
    removeError: (context, payload) => {
      context.commit('removeErrorEntry', payload);
    },
  },
};
