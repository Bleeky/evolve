import RBush from 'rbush';
import knn from 'rbush-knn';

let tree;
let position;

self.addEventListener('message', (e) => {
  if (e.data.type === 'initial') {
    tree = new RBush();
    tree = tree.load(e.data.tree);
    position = e.data.position;
  }
  if (e.data.type === 'update') {
    tree = new RBush();
    tree = tree.load(e.data.tree);
    if (e.data.position) {
      position = e.data.position;
    }
  }
}, false);
setInterval(() => {
  if (tree) {
    const neighbors = knn(tree, position.x, position.y, 1, (item) => item.type === 'food');
    if (tree.search({
      minX: position.x,
      minY: position.y,
      maxX: position.x,
      maxY: position.y,
    }).find((elem) => elem.type === 'food')) {
      console.error('I SHOULD EAT IT !');
      self.postMessage({ type: 'eat', food: neighbors[0] });
    }
    if (neighbors.length) {
      const newPosition = {
        x: neighbors[0].x === position.x ? position.x : neighbors[0].x > position.x ? position.x + 0.5 : position.x - 0.5,
        y: neighbors[0].y === position.y ? position.y : neighbors[0].y > position.y ? position.y + 0.5 : position.y - 0.5,
      };
      self.postMessage({ type: 'move', newPosition });
    }
  }
  // console.error('webworker loop');
}, 500);
