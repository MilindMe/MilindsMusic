import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {records, recordSlots} from './data';

// All dimensions are in meters. The supplied sleeve meshes retain their UVs.
export default function ShopScene({onSelect, selected, reset, onStatus}) {
 const host = useRef(null);
 const api = useRef(null);
 const select = useRef(onSelect);
 select.current = onSelect;
 useEffect(() => { api.current?.reset(); }, [reset]);
 useEffect(() => { api.current?.select(selected); }, [selected]);
 useEffect(() => {
  const element = host.current;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias:true, alpha:true}); }
  catch { onStatus('error'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden','true');
  element.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#304639', 5, 12);
  const camera = new THREE.PerspectiveCamera(34, 1, .01, 30);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = false;
  controls.minAzimuthAngle = -.3;
  controls.maxAzimuthAngle = .3;
  controls.minPolarAngle = .65;
  controls.maxPolarAngle = 1.22;
  controls.rotateSpeed = .35;
  renderer.domElement.style.touchAction = 'pan-y';
  // Reserve vertical gestures for scrolling the page on small screens.
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  const crates = [], sleeves = [], materials = new Set(), textures = new Set();
  let disposed=false, frame=0, hovered=-1, active=selected, down=null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const render = () => {if(!disposed){renderer.render(scene,camera);sleeves.forEach((s,i)=>{const button=element.querySelector(`[data-sleeve="${i}"]`);if(button){const p=s.localToWorld(new THREE.Vector3(0,.17/s.scale.x,0)).project(camera);button.style.left=`${(p.x+1)*element.clientWidth/2}px`;button.style.top=`${(1-p.y)*element.clientHeight/2}px`;}});}};
  const material=(color,roughness=.85)=>{const m=new THREE.MeshStandardMaterial({color,roughness});materials.add(m);return m;};
  const wood=material('#856343'), edge=material('#ad8658'), dark=material('#3c3023'), wall=material('#354b3e'), floor=material('#304639');
  function box(w,h,d,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const grainCanvas=document.createElement('canvas');grainCanvas.width=256;grainCanvas.height=256;
  const ctx=grainCanvas.getContext('2d');ctx.fillStyle='#c1ab89';ctx.fillRect(0,0,256,256);
  for(let i=0;i<160;i++){const y=(i*47)%256;ctx.strokeStyle=`rgba(62,40,21,${.03+(i%5)*.014})`;ctx.lineWidth=.3+(i%3)*.3;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(85,y-2,170,y+3,256,y);ctx.stroke();}
  const grain=new THREE.CanvasTexture(grainCanvas);grain.colorSpace=THREE.SRGBColorSpace;grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(2,1);wood.map=grain;edge.map=grain;textures.add(grain);
  scene.add(new THREE.HemisphereLight('#f5ecd7','#4b5841',1.8));
  const sun = new THREE.DirectionalLight('#ffe4be',2.3);
  sun.position.set(-2.5,4,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-3;sun.shadow.camera.right=3;sun.shadow.camera.top=3;sun.shadow.camera.bottom=-3;sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
  const fill=new THREE.DirectionalLight('#b8d2c3',.7);fill.position.set(3,2,-1);scene.add(fill);
  box(18,.08,16,floor,0,-.12,0);
  // A quiet shop backdrop, deliberately subordinate to the real record artwork.
  box(12,5,.1,wall,0,2,-2.1);
  for(let x=-5;x<6;x+=.62)box(.012,5,.018,material('#3c5143'),x,2,-2.03);
  const shelfWood=material('#705b40');
  for(const x of [-1.55,1.55]) {
   box(1.1,.045,.25,shelfWood,x,.75,-1.86);
   box(1.1,.045,.25,shelfWood,x,1.38,-1.86);
   const colors=['#aa744f','#b0a17a','#697e70','#c1b891','#60665a','#7e5745'];
   for(let row=0;row<2;row++)for(let i=0;i<20;i++) {
    box(.035,.26+(i%3)*.015,.19,material(colors[(i+row)%colors.length]),x-.47+i*.048,.9+row*.63,-1.87);
   }
  }
  // One shared counter grounds all three crates.
  box(2.6,.08,.95,wood,0,-.035,.03);
  box(2.55,.035,.025,edge,0,-.06,.515);
  for(let i=0;i<3;i++) {
   const group=new THREE.Group();group.position.set((i-1)*.76,.012,0);group.rotation.y=(i-1)*-.08;group.userData.crate=i;
   scene.add(group);crates.push(group);
   box(.53,.035,.55,dark,0,.018,0,group);
   for(const x of [-.26,.26]) {
    box(.035,.27,.56,wood,x,.145,0,group);
    box(.043,.025,.575,edge,x,.285,0,group);
   }
   for(const z of [-.265,.265])for(let j=0;j<3;j++)box(.53,.063,.027,j===2?edge:wood,0,.065+j*.079,z,group);
   for(const x of [-.215,.215])box(.025,.255,.012,dark,x,.15,.285,group);
   // Paper label, without baking any website text into the model.
   box(.19,.065,.004,material('#d8c49a'),0,.145,.285,group);
  }
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  function hit(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const h=raycaster.intersectObjects(crates,true)[0];if(!h)return -1;let p=h.object;while(p&&p.userData.sleeve===undefined)p=p.parent;return p?.userData.sleeve??-1;}
  function update(){
   cancelAnimationFrame(frame);
   const tick=()=>{let moving=false;sleeves.forEach((c,i)=>{const y=c.userData.restY+((i===active||i===hovered)?.10:0);const delta=y-c.position.y;c.position.y+=reduced.matches?delta:delta*.16;if(Math.abs(delta)>.0002)moving=true;});render();if(moving)frame=requestAnimationFrame(tick);};
   tick();
  }
  function move(e){if(e.buttons)return;const next=hit(e);if(next!==hovered){hovered=next;renderer.domElement.style.cursor=next<0?'grab':'pointer';update();}}
  function leave(){hovered=-1;update();}
  function pointerDown(e){down={x:e.clientX,y:e.clientY};}
  function pointerUp(e){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7){const index=hit(e);if(index>=0){element.querySelector(`[data-sleeve="${index}"]`)?.focus({preventScroll:true});select.current(index);}}down=null;}
  renderer.domElement.addEventListener('pointermove',move);
  renderer.domElement.addEventListener('pointerleave',leave);
  renderer.domElement.addEventListener('pointerdown',pointerDown);
  renderer.domElement.addEventListener('pointerup',pointerUp);
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function contextLost(e){e.preventDefault();onStatus('error');}
  function resetView(){const distance=Math.max(3.1,1.5/(Math.tan(THREE.MathUtils.degToRad(17))*camera.aspect));camera.position.set(0,distance*.5,distance);scene.fog.near=distance+2;scene.fog.far=distance+12;controls.target.set(0,.2,0);controls.update();render();}
  const resize=new ResizeObserver(()=>{camera.aspect=element.clientWidth/element.clientHeight;camera.updateProjectionMatrix();renderer.setSize(element.clientWidth,element.clientHeight);resetView();});resize.observe(element);
  controls.addEventListener('change',render);
  api.current={reset:resetView,select:i=>{active=i;update();},hover:i=>{hovered=i;update();}};
  function disposeModel(root){root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}}});}
  new GLTFLoader().load('/models/vinyl-sleeves.glb',gltf=>{
   if(disposed){disposeModel(gltf.scene);return;}
   const originals=[...gltf.scene.children];
   recordSlots.forEach((recordId,i)=>{
    const mesh=originals[i%originals.length];
    // Preserve exported orientation by carrying its world transform into a group.
    gltf.scene.updateMatrixWorld(true);
    const wrapper=new THREE.Group();const clone=mesh.clone();clone.applyMatrix4(mesh.parent.matrixWorld);wrapper.add(clone);
    const bounds=new THREE.Box3().setFromObject(wrapper), center=bounds.getCenter(new THREE.Vector3());
    clone.position.sub(center);const size=bounds.getSize(new THREE.Vector3());wrapper.scale.setScalar(.42/Math.max(size.x,size.y));
    wrapper.userData.sleeve=i;wrapper.userData.restY=.255+(5-i%6)*.014;
    wrapper.position.set(0,wrapper.userData.restY,-.19+(i%6)*.071);wrapper.rotation.x=-.10+(i%6)*.012;
    const record=records.find(r=>r.id===recordId);
    if(record?.cover){
     const map=new THREE.TextureLoader().load(record.cover,texture=>{if(disposed){texture.dispose();return;}render();});map.colorSpace=THREE.SRGBColorSpace;textures.add(map);
     const mat=new THREE.MeshStandardMaterial({map,roughness:.8,side:THREE.DoubleSide});materials.add(mat);
     const cover=new THREE.Mesh(new THREE.PlaneGeometry(size.x,size.y),mat);cover.position.z=size.z/2+.001/wrapper.scale.x;wrapper.add(cover);
    }
    crates[Math.floor(i/6)%3].add(wrapper);sleeves.push(wrapper);
    clone.traverse(part=>{if(!part.isMesh)return;part.castShadow=true;part.receiveShadow=true;
    for(const m of Array.isArray(part.material)?part.material:[part.material]){materials.add(m);m.side=THREE.DoubleSide;for(const v of Object.values(m))if(v?.isTexture){v.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.add(v);}}});
   });
   onStatus('ready');render();
  },undefined,()=>{if(!disposed)onStatus('error');});
  resetView();
  return()=>{disposed=true;cancelAnimationFrame(frame);api.current=null;resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('webglcontextlost',contextLost);const geometries=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
 }, [onStatus]);
 return <div ref={host} style={{width:'100%',height:'100%'}}>{recordSlots.map((id,i)=><button key={i} data-sleeve={i} className="record-hit-area" aria-label={`Browse ${records.find(r=>r.id===id)?.album}, rack ${Math.floor(i/6)+1}, sleeve ${i%6+1}`} onFocus={()=>api.current?.hover(i)} onBlur={()=>api.current?.hover(-1)} onClick={()=>select.current(i)}/>)}</div>;
}
