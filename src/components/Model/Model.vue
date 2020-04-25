<script>
import {
  Object3D, MeshPhongMaterial, AnimationMixer, SkeletonHelper, Clock,
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
      const INITIAL_MTL = new MeshPhongMaterial({ color: 0x22f1f1, shininess: 10 });
      const object = new Object3D();
      const loader = new GLTFLoader();
      loader.load(this.src, (gltf) => {
        // console.error(gltf);
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // console.error(child.material.name, child);
            child.frustumCulled = false;
            child.castShadow = true;
            child.receiveShadow = true;
            // child.material = INITIAL_MTL;
          }
        });
        // if (gltf.animations.length) {
        //   const skeletonHelper = new SkeletonHelper(gltf.scene);
        //   object.add(skeletonHelper);
        //   const mixer = new AnimationMixer(object);
        //   const action = mixer.clipAction(gltf.animations[0], object);
        //   action.play();
        //   this.$emit('mixer', mixer);
        // }
        object.add(gltf.scene);
        this.vglObject3d.emit();
      });
      return object;
    },
  },
};
</script>
