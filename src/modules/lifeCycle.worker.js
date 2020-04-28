import RBush from 'rbush';
import knn from 'rbush-knn';

let tree;
let elem;
let health;
let lifeCycleInterval;
let healthInterval;

self.addEventListener('message', (e) => {
  if (e.data.type === 'update') {
    tree = new RBush();
    tree = tree.load(e.data.tree);
    if (!health) health = e.data.elem.health;
    if (e.data.elem) elem = e.data.elem;
  } else if (e.data.type === 'kill') {
    clearInterval(lifeCycleInterval);
    clearInterval(healthInterval);
    self.close();
  }
}, false);

function angle(cx, cy, ex, ey) {
  const theta = Math.atan2(ey - cy, ex - cx);
  // theta *= 180 / Math.PI;
  return theta;
}

lifeCycleInterval = setInterval(() => {
  if (tree && elem) {
    if (!elem.hasMated && health > 2) {
      const neighbors = tree.search({
        minX: elem.x - 3,
        minY: elem.y - 3,
        maxX: elem.x + 3,
        maxY: elem.y + 3,
      }).find((e) => e.type === 'animal' && e.uuid !== elem.uuid && !e.hasMated);
      const closeBy = tree.search({
        minX: elem.x - 0.3,
        minY: elem.y - 0.3,
        maxX: elem.x + 0.3,
        maxY: elem.y + 0.3,
      }).find((e) => e.type === 'animal' && e.uuid !== elem.uuid && !e.hasMated);
      if (closeBy && closeBy.uuid !== elem.uuid && tree.all().filter((treeElem) => treeElem.type === 'animal').length < 5) {
        // console.error('mating with close by');
        health -= 1;
        self.postMessage({ type: 'mate', mate: neighbors[0] });
      } else if (neighbors) {
        console.error('going to potential mate', neighbors);
        const neighbor = knn(tree, elem.x, elem.y, 1, (item) => item.type === 'animal' && item.uuid !== elem.uuid && !item.hasMated);
        if (neighbor.length) {
          const newPosition = {
            x: neighbor[0].x.toFixed(1) === elem.x.toFixed(1) ? elem.x : neighbor[0].x > elem.x ? elem.x + elem.speed : elem.x - elem.speed,
            y: neighbor[0].y.toFixed(1) === elem.y.toFixed(1) ? elem.y : neighbor[0].y > elem.y ? elem.y + elem.speed : elem.y - elem.speed,
          };
          self.postMessage({ type: 'move', newPosition, angle: angle(newPosition.y, newPosition.x, elem.y, elem.x) });
        }
      }
    } else if (health <= 2) {
      const neighbors = knn(tree, elem.x, elem.y, 1, (item) => item.type === 'food');
      if (tree.search(elem).find((e) => e.type === 'food')) {
        health += 1;
        self.postMessage({ type: 'eat', food: neighbors[0] });
      }
      if (neighbors.length) {
        const newPosition = {
          x: neighbors[0].x.toFixed(1) === elem.x.toFixed(1) ? elem.x : neighbors[0].x > elem.x ? elem.x + elem.speed : elem.x - elem.speed,
          y: neighbors[0].y.toFixed(1) === elem.y.toFixed(1) ? elem.y : neighbors[0].y > elem.y ? elem.y + elem.speed : elem.y - elem.speed,
        };
        self.postMessage({ type: 'move', newPosition, angle: angle(newPosition.y, newPosition.x, elem.y, elem.x) });
      }
    }
  }
}, 40);

healthInterval = setInterval(() => {
  health -= 1;
  if (health <= 0) self.postMessage({ type: 'died', elem });
}, 3000);
