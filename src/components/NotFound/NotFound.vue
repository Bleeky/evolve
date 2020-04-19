<template>
  <transition
    appear
    name="fade"
  >
    <div class="flex flex-col justify-center items-center p-32">
      <!-- <img
        :src="require('assets/not_found.png')"
        class="object-contain h-40"
      > -->
      <div class="mt-10 text-4xl dark:text-white">
        Not found! Maybe try somewhere else?
      </div>
      <router-link
        to="/login"
        class="mt-10 focus:outline-none bg-blue-900 hover:bg-gray-700 text-white font-semibold hover:text-white py-2 px-4 border border-blue-900 hover:border-gray-700 rounded"
      >
        Take me home
      </router-link>
    </div>
  </transition>
</template>

<script>

export default {
  name: 'NotFound',
};
</script>

<style lang="scss" scoped>

</style>
