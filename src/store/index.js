import Vue from 'vue';
import Vuex from 'vuex';

import errors from 'store/modules/errors';
import modal from 'store/modules/modal';

Vue.use(Vuex);

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    errors,
    modal,
  },
  plugins: [
  ],
});

export default store;
