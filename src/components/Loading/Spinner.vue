<template>
  <div class="dark:text-white p-32 flex justify-center">
    <div class="loader">
      <svg viewBox="0 0 80 80">
        <circle
          id="test"
          cx="40"
          cy="40"
          r="32"
        />
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Spinner',
};
</script>

<style lang="scss" scoped>
.loader {
  --dot: #EF4144;
  --duration: 4s;
  height: 44px;
  margin: 0 16px;
  width: 44px;
  @apply relative inline-block;
  &:before {
    animation: dotRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
    background: var(--dot);
    border-radius: 50%;
    content: '';
    height: 6px;
    left: 19px;
    top: 37px;
    transform: translate(-18px, -18px);
    width: 6px;
    @apply absolute block;
  }
  svg {
    @apply w-full h-full block;
    circle {
      animation: pathCircle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
      fill: none;
      stroke-dasharray: (200 / 4 * 3) (200 / 4) (200 / 4 * 3) (200 / 4);
      stroke-dashoffset: 75;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 10px;
      @apply stroke-current text-blue-900;
    }
  }
  &.triangle {
    width: 48px;
    &:before {
      animation: dotTriangle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
      left: 21px;
      transform: translate(-10px, -18px);
    }
  }
}

.mode-dark {
  .loader {
    --dot: #F6F7F8;
    svg > circle {
      color: #EF4144;
    }
  }
}

@keyframes dotRect {
  25% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(18px, -18px);
  }
  75% {
    transform: translate(0, -36px);
  }
  100% {
    transform: translate(-18px, -18px);
  }
}

@keyframes pathCircle {
  25% {
    stroke-dashoffset: 125;
  }
  50% {
    stroke-dashoffset: 175;
  }
  75% {
    stroke-dashoffset: 225;
  }
  100% {
    stroke-dashoffset: 275;
  }
}
</style>
