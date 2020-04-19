<template>
  <transition
    name="slide-fade"
    appear
  >
    <div
      v-if="visible"
      :class="['bg-gray-900-hue table h-full fixed left-0 top-0 w-full z-10', dark && 'bg-gray-200-hue']"
    >
      <div class="absolute top-0 right-0 p-6 flex">
        <slot name="button" />
        <span
          :class="['cursor-pointer p-3 border rounded bg-gray-900 text-white border-white hover:bg-white hover:text-blue-900 hover:border-transparent']"
          @click.once="$emit('close')"
        >
          <Icon
            icon="IconCross"
            :class="'fill-current h-6 w-6'"
          />
        </span>
      </div>

      <transition
        name="slide-fade"
        appear
      >
        <div
          class="table-cell align-middle"
          @click="closeOnOutside && $emit('close')"
        >
          <slot name="content" />
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    closeOnOutside: {
      type: Boolean,
      default: true,
    },
    dark: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    visible(newValue) {
      if (newValue === true) window.addEventListener('keydown', this.leaveOnEscape);
      else window.removeEventListener('keydown', this.leaveOnEscape);
    },
  },
  beforeCreate() {
    this.leaveOnEscape = (event) => {
      if (event.keyCode === 27) {
        this.$emit('close');
      }
    };
  },
};
</script>

<style lang="scss" scoped>
</style>
