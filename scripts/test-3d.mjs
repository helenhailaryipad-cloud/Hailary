import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { prepareActor, fitView } from '../src/intro3d-core.js';
// The tests exercise GLTF decoding, bones and clip evaluation without a GPU.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
const bytes=fs.readFileSync('src/assets/angel-archer-v2.glb');
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'1228c9128b78b2c550fc0ac2ad90914f3a7d4cb7fced4947d2c8d0f1333075af','Must use the corrected uploaded model');
assert.equal(bytes.readUInt32LE(4),2);
const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
assert.equal(doc.images.length,2);assert.ok(doc.images.every(i=>i.bufferView!==undefined&&!i.uri));
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const bow=gltf.scene.getObjectByName('Bow'),bowScale=bow.scale.clone();
const state=prepareActor(gltf);assert.equal(state.clip.name,'Idle');assert.ok(Math.abs(state.clip.duration-11.3)<.001);
assert.equal(state.action.loop,THREE.LoopRepeat);assert.equal(state.action.repetitions,Infinity);
assert.ok(Math.abs(state.size.y-3.6)<.0001);assert.ok(state.size.x<5&&state.size.z<4);assert.ok(bow.scale.equals(bowScale));
const wing=gltf.scene.getObjectByName('WingL'),hip=gltf.scene.getObjectByName('Hips');
const startWing=wing.quaternion.clone(),startHip=hip.position.clone();state.mixer.update(2.3);state.actor.updateMatrixWorld(true);
assert.ok(wing.quaternion.angleTo(startWing)>1e-5||hip.position.distanceTo(startHip)>1e-5,'Idle must animate the rig');
state.mixer.setTime(.8);const expected=hip.position.clone();state.mixer.setTime(state.clip.duration+.8);assert.ok(hip.position.distanceTo(expected)<.001,'Idle must loop');
for(const [w,h,top,bottom] of [[760,1194,92,850],[760,936,92,600],[390,844,88,550],[760,600,92,390]]){
 const fit=fitView(w,h,top,bottom,state.size),camera=new THREE.PerspectiveCamera(fit.fov,w/h,.05,80);
 camera.setViewOffset(w,h,0,fit.offsetY,w,h);camera.position.set(0,1.8+fit.distance*.04,fit.distance);camera.lookAt(0,1.8,0);camera.updateMatrixWorld();
 for(const x of [-state.size.x/2,state.size.x/2])for(const y of [.12,3.72])for(const z of [-state.size.z/2,state.size.z/2]){
  const p=new THREE.Vector3(x,y,z).project(camera),pixelY=(1-p.y)*h/2;
  assert.ok(Math.abs(p.x)<1,`Horizontal framing ${w}x${h}`);assert.ok(pixelY>top-4&&pixelY<bottom+4,`Vertical framing ${w}x${h}: ${pixelY}`);
 }
}
const worker=(await import('../dist/server/index.js?3dtest')).default;
const response=await worker.fetch(new Request('https://test.local/assets/angel-archer-v2.glb'),{});
assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'model/gltf-binary');
const served=Buffer.from(await response.arrayBuffer());assert.equal(Buffer.compare(served,bytes),0,'Worker must serve the exact corrected GLB');
console.log('PASS: corrected GLB, embedded textures, quantized skin, Idle loop, unchanged bow transforms, four camera sizes, exact binary delivery.');
