import * as THREE from 'three';

// Measure the actual skinned poses, not the quantized position accessor bounds.
export function prepareActor(gltf) {
  const model = gltf.scene;
  const clip = gltf.animations.find(a => /idle/i.test(a.name)) || gltf.animations[0];
  const mixer = new THREE.AnimationMixer(model);
  const action = clip ? mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play() : null;
  const bounds = new THREE.Box3();
  for (let i = 0; i <= 12; i++) {
    if (clip) mixer.setTime(clip.duration * i / 12);
    model.updateMatrixWorld(true);
    model.traverse(o => { if (o.isSkinnedMesh) { o.computeBoundingBox(); o.frustumCulled = false; } });
    bounds.union(new THREE.Box3().setFromObject(model));
  }
  mixer.setTime(0);
  model.updateMatrixWorld(true);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Invalid model bounds');
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 3.6 / size.y;
  const actor = new THREE.Group();
  actor.name = 'REINA_Normalized';
  actor.add(model);
  actor.scale.setScalar(scale);
  actor.position.set(-center.x * scale, .12 - bounds.min.y * scale, -center.z * scale);
  return { actor, model, mixer, action, clip, size: size.multiplyScalar(scale), sourceBounds: bounds };
}

export function fitView(width, height, top, bottom, size) {
  const fov = 32;
  const usable = Math.max(80, Math.min(height - 10, bottom) - Math.max(0, top));
  const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const framingHeight = Math.max(4.1, size.y + .5);
  const distance = Math.max(framingHeight / (2 * tan * (usable / height)),
    (Math.max(3.7, size.x + .4)) / (2 * tan * (width / height) * .9));
  const centerY = (Math.max(0, top) + Math.min(height - 10, bottom)) / 2;
  return { fov, distance, offsetY: height / 2 - centerY };
}
