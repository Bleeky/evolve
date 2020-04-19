<template>
  <div>
    <div
      v-for="error in errors"
      :key="error.uuid"
      class="bg-red-100 border-t-4 border-red-500 rounded-b text-red-900 px-4 py-3 shadow-md mb-4 relative"
      role="alert"
    >
      <div class="flex justify-between">
        <div class="flex">
          <div class="py-1">
            <Icon
              icon="IconInfo"
              :class="'fill-current h-6 w-6 text-red-500 mr-4'"
            />
          </div>
          <div>
            <p class="font-bold">
              Something went wrong.
            </p>
            <p class="text-sm">
              {{ error.message }}
            </p>
          </div>
        </div>
        <span
          class="px-4 py-3"
        >
          <Icon
            icon="IconCross"
            :class="'fill-current h-6 w-6 text-red-500 cursor-pointer'"
            @click.native="removeError(error.uuid)"
          />
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Errors',
  props: {
    reqs: {
      type: Array,
      required: true,
    },
    max: {
      type: Number,
      default: null,
    },
  },
  computed: {
    errors() { return this.$store.getters.errors(this.reqs); },
  },
  methods: {
    removeError(uuid) {
      this.$store.dispatch('removeError', {
        uuid,
      });
    },
  },

};
</script>

<style lang="scss" scoped>

</style>
