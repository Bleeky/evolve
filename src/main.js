import Vue from 'vue';
import * as VueGL from 'vue-gl';

import Modal from 'components/Modal';
import Errors from 'components/Errors';
import Icon from 'components/Icon';
import App from './App';
import router from './router';
import store from './store';
import './styles/app.scss';

Vue.component('Modal', Modal);
Vue.component('Errors', Errors);
Vue.component('Icon', Icon);
Object.keys(VueGL).forEach((name) => Vue.component(name, VueGL[name]));

new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
});
