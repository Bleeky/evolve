<script>
import {
  Object3D,
} from 'three';
import { VglObject3d } from 'vue-gl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default {
  name: 'Model',
  mixins: [VglObject3d],
  props: {
    src: { type: String },
  },
  computed: {
    inst() {
      const object = new Object3D();
      const loader = new GLTFLoader();
      loader.load(this.src, (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // child.frustumCulled = false;
            // child.receiveShadow = true;
            child.castShadow = true;
          }
        });
        object.name = 'food';
        object.add(gltf.scene);
        this.vglObject3d.emit();
      });
      return object;
    },
  },
};
</script>
