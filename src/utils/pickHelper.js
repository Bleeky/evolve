import { Raycaster, Color } from 'three';

export default class PickHelper {
  constructor(renderer) {
    this.raycaster = new Raycaster();
    this.renderer = renderer;
    this.selectedBlobColor = null;
    this.selectedBlob = null;
  }

  pick(normalizedPosition, scene, camera) {
    if (!normalizedPosition) return null;

    this.raycaster.setFromCamera(normalizedPosition, camera);
    const intersectedObjects = this.raycaster.intersectObjects(scene.children, true);
    if (intersectedObjects.length) {
      const blob = intersectedObjects.find((obj) => obj.object.getObjectByName('blob'));
      if (blob) {
        if (this.selectedBlob) {
          this.selectedBlob.material.color = this.selectedBlobColor;
        }
        this.selectedBlob = blob.object;
        this.selectedBlobColor = blob.object.material.color;
        const color = new Color(0x8a7d7c);
        blob.object.material.color = color;
        this.renderer.requestRender();
        return blob.object;
      }
      if (this.selectedBlob) {
        this.selectedBlob.material.color = this.selectedBlobColor;
        this.renderer.requestRender();
      }
    }
    return null;
  }
}
