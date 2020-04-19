import Vue from 'vue';
import Router from 'vue-router';
import store from 'store';

import { Spinner } from 'components/Loading';
import { ErrorLazy } from 'components/Errors';

Vue.use(Router);

async function lazyLoadView(AsyncView, AsyncModule, moduleName) {
  const AsyncHandler = () => ({
    component: new Promise(((resolve, reject) => {
      const promiseComponent = AsyncView;
      let promiseModule;
      if (AsyncModule && moduleName && !store._modules.root._children[moduleName]) {
        promiseModule = AsyncModule;
      }
      Promise.all([promiseComponent, promiseModule || null]).then((r) => {
        if (r[1]) store.registerModule(moduleName, r[1].default);
        resolve(r[0]);
      }).catch((e) => reject(e));
    })),
    loading: Spinner,
    error: ErrorLazy,
    delay: 200,
    timeout: 20000,
  });

  return Promise.resolve({
    functional: true,
    render(h, { data, children }) {
      return h(AsyncHandler, data, children);
    },
  });
}

const router = new Router({
  routes: [
    {
      path: '*',
      name: 'NotFound',
      component: () => import(/* webpackChunkName: "notFound" */ 'components/NotFound'),
    },
    {
      path: '/',
      name: 'Root',
      component: () => import(/* webpackChunkName: "root" */ 'modules/Root'),
    },
  ],
});

export default router;
