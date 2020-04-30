<script>
import {
  Object3D,
  MeshBasicMaterial, SphereGeometry, Mesh, Group, MeshLambertMaterial, Color,
} from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes';
import { VglObject3d } from 'vue-gl';

export default {
  name: 'Blob',
  mixins: [VglObject3d],
  props: {
    blob: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      fov: 3,
      size: 2,
    };
  },
  computed: {
    inst() {
      function makeEye(size) {
        const geo = new SphereGeometry(size, 16, 16, Math.PI / 2, Math.PI);
        const material = new MeshBasicMaterial({ color: 0x000000 });
        return new Mesh(geo, material);
      }

      // function makeDeadEye(size) {
      //   const material = new MeshBasicMaterial({ color: 0x888888 });
      //   const thickness = size / 8;
      //   const h = new Mesh(new PlaneGeometry(size, thickness), material);
      //   h.rotation.set(0, Math.PI / 2, 0);
      //   const v = new Mesh(new PlaneGeometry(thickness, size), material);
      //   v.rotation.set(0, Math.PI / 2, 0);
      //   const g = new Group();
      //   g.add(h, v);
      //   return g;
      // }

      function createBlobCreatureParts(fov, size) {
        const resolution = 160;
        const isolation = 300;
        const effect = new MarchingCubes(resolution, new MeshBasicMaterial(), true, true);
        effect.scale.set(size, size, size);
        effect.isolation = isolation;

        const strength = 1.2 / ((Math.sqrt(3) - 1) / 4 + 1);
        effect.reset();
        effect.addBall(0.5, 0.5, 0.5, strength, 100);
        effect.addBall(0.52, 0.54, 0.5, strength / 8, 10);
        effect.addBall(0.515, 0.58, 0.5, strength / 4, 10);

        const geo = effect.generateBufferGeometry();
        effect.material.dispose();
        const color = new Color(`hsl(0, 100%, ${Math.round(50 + (((fov - 3) * 10) * 20))}%)`);
        const material = new MeshLambertMaterial({ color });
        const blob = new Mesh(geo, material);
        blob.name = 'blob';
        blob.scale.set(size, size, size);
        blob.position.y = size / 10;
        // blob.castShadow = true;

        // eyes
        const x = 0.082;
        const right = makeEye(size / 85);
        right.name = 'right-eye';
        right.position.set(size * x, size / 4.2, size / 30);
        right.rotation.set(-0.6, -0.6, 0);

        const left = right.clone(); // makeEye(size / 85)
        left.name = 'left-eye';
        left.position.set(size * x, size / 4.2, -size / 30);
        left.rotation.set(0.6, 0.6, 0);

        // const rightDead = makeDeadEye(size / 35);
        // rightDead.name = 'right-dead-eye';
        // rightDead.position.set(size * x + 0.25, size / 4.2, size / 28);
        // rightDead.rotation.set(-1, -0.4, -0.35);

        // const leftDead = rightDead.clone(); // makeDeadEye(size / 35)
        // leftDead.name = 'left-dead-eye';
        // leftDead.position.set(size * x + 0.25, size / 4.2, -size / 28);
        // leftDead.rotation.set(1, 0.4, -0.35);

        return [blob, left, right];
        // return [blob, left, right, rightDead, leftDead];
      }

      const cachedBlobParts = createBlobCreatureParts(this.fov, this.size);

      const createBlob = () => cachedBlobParts.reduce(
        (group, part) => group.add(part.clone(true)),
        new Group(),
      );

      const blob = createBlob();
      const object = new Object3D();
      object.add(blob);
      this.vglObject3d.emit();
      return object;
    },
  },
  created() {
    this.size = this.blob.size;
    this.fov = this.blob.fov;
  },
};
</script>

<style lang="scss" scoped>

</style>
