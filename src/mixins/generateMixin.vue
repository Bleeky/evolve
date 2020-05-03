<script>
export default {
  name: 'GenerateMixin',
  methods: {
    generateRandomRadian() {
    // return wasm.generate_random_rad();
      return Math.random() * Math.PI * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
    },
    generateRandomPosition() {
      const random = Math.random() * 5 * (Math.floor(Math.random() * 2) === 1 ? 1 : -1);
      return parseFloat(random.toFixed(1));
    },
    generatePosition(distance, phi, theta) {
      return ({
        x: distance * Math.cos(phi),
        y: distance * Math.sin(phi) * Math.sin(theta),
        z: distance * Math.sin(phi) * Math.cos(theta),
      });
    },
  },
};
</script>
