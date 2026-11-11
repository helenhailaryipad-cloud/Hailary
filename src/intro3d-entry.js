import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { prepareActor, fitView } from './intro3d-core.js';

let current = null;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const disposeTree = root => {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  root.traverse(o => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.isSkinnedMesh && o.skeleton) skeletons.add(o.skeleton);
    o.shadow?.dispose?.();
    for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) {
      materials.add(m);
      for (const value of Object.values(m)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const skeleton of skeletons) skeleton.dispose();
  for (const t of textures) { t.source?.data?.close?.(); t.dispose(); }
  for (const m of materials) m.dispose();
  for (const g of geometries) g.dispose();
};

function createGarden(scene) {
  const make = (geometry, material, position, scale) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    if (scale) mesh.scale.set(...scale);
    scene.add(mesh); return mesh;
  };
  const stone = new THREE.MeshStandardMaterial({ color: '#f0e2bd', roughness: .75 });
  const gold = new THREE.MeshStandardMaterial({ color: '#d5b96b', metalness: .45, roughness: .36 });
  make(new THREE.CylinderGeometry(2.02, 2.15, .28, 64), stone, [0,-.03,0]);
  make(new THREE.CylinderGeometry(2.16, 2.25, .17, 64), gold, [0,-.25,0]);
  const lawn = new THREE.MeshStandardMaterial({ color: '#a2cfb2', roughness: 1 });
  make(new THREE.CircleGeometry(36, 80), lawn, [0,-.36,0]).rotation.x = -Math.PI / 2;
  const bark = new THREE.MeshStandardMaterial({ color: '#b69c7e', roughness: 1 });
  const leaves = ['#a4d8bd','#87c5af','#e8bdcd'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .95 }));
  const orb = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2, radius = 7 + i % 3;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    const h = 2 + i % 3 * .4;
    make(new THREE.CylinderGeometry(.09,.17,h,8), bark, [x,h/2-.36,z]);
    for (let j=0;j<3;j++) make(orb,leaves[(i+j)%3],[x+(j-1)*.55,h+.2+j%2*.35,z],[1.1, .85, 1.05]);
  }
  // Floating islands and soft clouds stay well behind the central showcase.
  const cloud = new THREE.MeshStandardMaterial({ color: '#f4f8f3', roughness: 1 });
  for (let i=0;i<7;i++) {
    const angle=i/7*Math.PI*2;
    make(orb,leaves[0],[Math.cos(angle)*16,2+i%3,Math.sin(angle)*16],[2,.35,1.3]);
    make(new THREE.ConeGeometry(1.8,2.2,7),bark,[Math.cos(angle)*16,.8+i%3,Math.sin(angle)*16]).rotation.z=Math.PI;
    make(orb,cloud,[Math.cos(angle+.4)*19,6+i%2,Math.sin(angle+.4)*19],[2.8,.7,1.2]);
  }
  return { make };
}

function createMana(scene) {
  const group = new THREE.Group(); scene.add(group);
  const rings = [];
  for (let i=0;i<2;i++) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(i ? .5 : .15, i ? 1.5 : 2.2, i ? 2.3 : 1.5),
      transparent:true, opacity:.7, blending:THREE.AdditiveBlending, depthWrite:false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8-i*.18,.014,6,100),mat);
    ring.rotation.x=Math.PI/2;ring.position.y=.145+i*.07;group.add(ring);rings.push(ring);
  }
  const positions = new Float32Array(72*3), seeds = [];
  for(let i=0;i<72;i++) seeds.push({angle:i*2.39996,radius:1.5+(i%7)*.055,y:i/72*3.9,speed:.13+(i%5)*.025});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const pixels=document.createElement('canvas');pixels.width=pixels.height=32;
  const ctx=pixels.getContext('2d'),gradient=ctx.createRadialGradient(16,16,0,16,16,16);
  gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.25,'#affff1');gradient.addColorStop(1,'#00bbaa00');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
  const map=new THREE.CanvasTexture(pixels);
  const mat=new THREE.PointsMaterial({size:.11,map,color:new THREE.Color(.3,1.8,1.5),transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending});
  const points=new THREE.Points(geo,mat);group.add(points);
  return { group, update(t, enabled) { group.visible=enabled; if(!enabled)return;
    rings.forEach((r,i)=>{r.rotation.z=t*(i ? -.15:.2);r.material.opacity=.55+Math.sin(t*1.5+i)*.13;});
    seeds.forEach((s,i)=>{const a=s.angle+t*s.speed;positions[i*3]=Math.cos(a)*s.radius;positions[i*3+1]=.2+(s.y+t*.13)%3.8;positions[i*3+2]=Math.sin(a)*s.radius;});
    geo.attributes.position.needsUpdate=true;
  }};
}

function mount(host) {
  if (!host) return;
  current?.dispose();
  let disposed=false, contextLost=false, renderer, controls, composer, bloom, output, state, scene;
  let frame=0, previous=0, lastDraw=0, elapsed=0, motion=!reduced.matches, glow=true;
  let size=new THREE.Vector3(3.3,3.6,1), baseDistance=10, dpr=Math.min(window.devicePixelRatio||1,1.35);
  const controller=new AbortController(), cleanups=[];
  const status=host.querySelector('[data-model-status]');
  const setStatus=(text,error=false)=>{if(!status||disposed)return;status.hidden=false;status.textContent=text;
    if(error){const retry=document.createElement('button');retry.textContent='Retry 3D';retry.onclick=()=>mount(host);status.append(document.createElement('br'),retry);}};
  const on=(el,event,fn,options)=>{if(!el)return;el.addEventListener(event,fn,options);cleanups.push(()=>el.removeEventListener(event,fn,options));};
  const stop=()=>{cancelAnimationFrame(frame);frame=0;previous=0;lastDraw=0;};
  const instance={dispose(){if(disposed)return;disposed=true;stop();controller.abort();cleanups.splice(0).forEach(f=>f());observer?.disconnect();
    if(state){state.mixer.stopAllAction();state.mixer.uncacheRoot(state.model);}controls?.dispose();
    bloom?.dispose();output?.dispose();composer?.dispose();if(scene)disposeTree(scene);
    if(renderer){renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}document.body.classList.remove('three-loaded');if(current===instance)current=null;
  }};
  let observer;
  current=instance;
  try {
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(dpr);renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const canvas=renderer.domElement;canvas.className='reina-webgl';canvas.tabIndex=0;
    canvas.setAttribute('aria-label','Interactive 3D REINA. Drag to rotate, pinch to zoom. Double-tap or Home resets the view. Arrow keys rotate.');
    host.prepend(canvas);
    scene=new THREE.Scene();scene.background=new THREE.Color('#bedfe9');scene.fog=new THREE.Fog('#bedfe9',10,29);
    scene.add(new THREE.HemisphereLight('#fff8e3','#8bb6bd',2.0));
    const key=new THREE.DirectionalLight('#fff4dc',2.6);key.position.set(-3,7,5);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=5;key.shadow.camera.bottom=-2;key.shadow.normalBias=.025;scene.add(key);
    const rim=new THREE.DirectionalLight('#8ef4e3',1.6);rim.position.set(3,4,-4);scene.add(rim);
    createGarden(scene);scene.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});
    const mana=createMana(scene);
    const camera=new THREE.PerspectiveCamera(32,1,.05,80);
    controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.07;
    controls.rotateSpeed=.6;controls.zoomSpeed=.75;controls.minPolarAngle=.55;controls.maxPolarAngle=1.52;
    controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
    try { composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
      bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.42,.35,1.25);composer.addPass(bloom);output=new OutputPass();composer.addPass(output);
    } catch { composer?.dispose();bloom?.dispose();output?.dispose();composer=null;bloom=null;output=null; }
    const resetView=()=>{
      const rect=host.getBoundingClientRect(),header=document.querySelector('header').getBoundingClientRect(),stats=document.querySelector('.intro-attributes').getBoundingClientRect();
      const w=Math.max(1,rect.width),h=Math.max(1,rect.height),fit=fitView(w,h,header.bottom-rect.top+12,stats.top-rect.top-10,size);
      baseDistance=fit.distance;camera.fov=fit.fov;camera.aspect=w/h;
      camera.setViewOffset(w,h,0,fit.offsetY,w,h);camera.updateProjectionMatrix();
      controls.target.set(0,1.8,0);camera.position.set(0,1.8+baseDistance*.04,baseDistance);
      controls.minDistance=baseDistance*.68;controls.maxDistance=baseDistance*1.8;controls.update();controls.saveState();
      renderer.setSize(w,h,false);composer?.setSize(w,h);
    };
    observer=new ResizeObserver(()=>{if(!disposed)resetView();});observer.observe(host);
    const attrs=document.querySelector('.intro-attributes');if(attrs)observer.observe(attrs);
    resetView();
    on(reduced,'change',()=>{motion=!reduced.matches;});
    let tapStart=null,lastTap=null;
    on(canvas,'pointerdown',e=>{if(!e.isPrimary){tapStart=null;lastTap=null;return;}tapStart={x:e.clientX,y:e.clientY,time:e.timeStamp};});
    on(canvas,'pointerup',e=>{if(!tapStart||!e.isPrimary)return;const moved=Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y),duration=e.timeStamp-tapStart.time;tapStart=null;
      if(moved<8&&duration<250){if(lastTap&&e.timeStamp-lastTap.time<350&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<24){resetView();lastTap=null;}else lastTap={time:e.timeStamp,x:e.clientX,y:e.clientY};}else lastTap=null;
    });
    on(canvas,'pointercancel',()=>{tapStart=null;lastTap=null;});
    on(canvas,'keydown',event=>{
      if(['ArrowLeft','ArrowRight','Home','+','-','='].includes(event.key)){event.preventDefault();if(event.key==='Home'){resetView();return;}
        const offset=camera.position.clone().sub(controls.target);
        if(event.key.startsWith('Arrow'))offset.applyAxisAngle(new THREE.Vector3(0,1,0),event.key==='ArrowLeft' ? .13 : -.13);
        else offset.setLength(THREE.MathUtils.clamp(offset.length()*(event.key==='-'?1.1:.9),controls.minDistance,controls.maxDistance));
        camera.position.copy(controls.target).add(offset);controls.update();
      }
    });
    on(canvas,'webglcontextlost',event=>{event.preventDefault();contextLost=true;controller.abort();stop();setStatus('3D paused. Tap Retry to reload the model.',true);});
    const draw=now=>{if(disposed||document.hidden)return;frame=requestAnimationFrame(draw);if(now-lastDraw<1000/30)return;
      const dt=previous?Math.min((now-previous)/1000,.06):0;previous=now;lastDraw=now;
      if(motion){elapsed+=dt;state?.mixer.update(dt);}controls.update();mana.update(elapsed,glow);
      if(bloom)bloom.enabled=glow;
      try{if(composer)composer.render(dt);else renderer.render(scene,camera);}catch{contextLost=true;controller.abort();stop();setStatus('3D rendering stopped. Please try again.',true);}
    };
    const start=()=>{if(!disposed&&!contextLost&&!document.hidden&&!frame){previous=0;lastDraw=0;frame=requestAnimationFrame(draw);}};
    on(document,'visibilitychange',()=>{if(document.hidden)stop();else start();});
    setStatus('Loading REINA…');start();
    fetch('assets/angel-archer-v2.glb',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('Model download failed');return r.arrayBuffer();})
      .then(buffer=>{if(disposed||contextLost)return null;return new GLTFLoader().parseAsync(buffer,'');})
      .then(gltf=>{if(!gltf)return;if(disposed||contextLost){disposeTree(gltf.scene);return;}
        state=prepareActor(gltf);size=state.size;state.model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}}});
        scene.add(state.actor);resetView();if(status)status.hidden=true;document.body.classList.add('three-loaded');
      }).catch(error=>{if(disposed||error.name==='AbortError')return;setStatus('The 3D model could not load. Retry or use the 2D switch.',true);});
  } catch { setStatus('3D is unavailable in this browser. Use the 2D switch or Retry.',true); }
  return instance;
}
window.Wonder3D={mount,dispose(){current?.dispose();}};
mount(document.querySelector('#intro3d'));
