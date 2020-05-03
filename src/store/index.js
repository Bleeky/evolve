import Vue from 'vue';
import Vuex from 'vuex';

import errors from 'store/modules/errors';
import modal from 'store/modules/modal';
import simulation from 'store/modules/simulation';

Vue.use(Vuex);

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    errors,
    modal,
    simulation,
  },
  plugins: [
  ],
});

export default store;
