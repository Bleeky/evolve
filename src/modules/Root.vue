<template>
  <vgl-renderer
    class="getting-started"
    camera="mainCamera"
    scene="mainScene"
  >
    <vgl-box-geometry name="box" />
    <vgl-scene name="mainScene">
      <vgl-mesh geometry="box" />
    </vgl-scene>
    <vgl-perspective-camera
      orbit-position="3 1 0.5"
      name="mainCamera"
    />
  </vgl-renderer>
</template>

<script>
export default {
  name: 'Root',
};
</script>

<style lang="scss" scoped>
.getting-started {
  width: 100%;
  height: 247px;
}

</style>
