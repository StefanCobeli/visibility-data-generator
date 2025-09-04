// singleton store
let value = null;
const listeners = new Set();

export function setValue(v) {
  value = v;
  listeners.forEach((fn) => fn(v));
}

export function onValue(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn); // unsubscribe
}

export function getValue() {
  return value;
}

// === For brushedGalleryPoints ===
let brushedGalleryPoints = [];
const brushedListeners = new Set();

export function setBrushedPoints(points) {
  brushedGalleryPoints = points;
  brushedListeners.forEach((fn) => fn(points));
}

export function onBrushedPoints(fn) {
  brushedListeners.add(fn);
  return () => brushedListeners.delete(fn);
}

export function getBrushedPoints() {
  return brushedGalleryPoints;
}
