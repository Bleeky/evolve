import RBush from 'rbush';

export default class MyRBush extends RBush {
  toBBox({ x, y }) {
    return {
      minX: x, minY: y, maxX: x, maxY: y,
    };
  }

  compareMinX(a, b) { return a.x - b.x; }

  compareMinY(a, b) { return a.y - b.y; }
}
