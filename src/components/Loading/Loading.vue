<template>
  <div>
    <template
      v-if="entry"
    >
      <transition
        appear
        name="fade"
      >
        <component :is="componentLoader" />
      </transition>
    </template>
    <template
      v-else
    >
      <transition
        appear
        name="fade"
      >
        <div>
          <slot />
        </div>
      </transition>
    </template>
  </div>
</template>

<script>
export default {
  name: 'Loading',
  props: {
    reqs: {
      type: Array,
      required: true,
    },
    component: {
      type: String,
      default: 'Spinner',
    },
  },
  computed: {
    entry() { return this.$store.getters.entries(this.reqs); },
    componentLoader() {
      return () => import(/* webpackChunkName: "[request]" */ `./${this.component}`);
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
