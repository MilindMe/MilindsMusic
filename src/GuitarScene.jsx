import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {projects} from './projects';

export default function GuitarScene({onSelect,selected,reset,onStatus}) {
 const host=useRef(null), buttons=useRef([]), api=useRef(null), select=useRef(onSelect);
 select.current=onSelect;
 useEffect(()=>{api.current?.reset();},[reset]);
 useEffect(()=>{api.current?.select(selected);},[selected]);
 useEffect(()=>{
  const el=host.current;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{onStatus('error');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.domElement.setAttribute('aria-hidden','true');el.prepend(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#29382f');
  const camera=new THREE.PerspectiveCamera(36,1,.05,40);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableZoom=false;controls.minAzimuthAngle=-.22;controls.maxAzimuthAngle=.22;controls.minPolarAngle=1.32;controls.maxPolarAngle=1.68;controls.rotateSpeed=.25;renderer.domElement.style.touchAction='pan-y';
  const materials=new Set(), textures=new Set(), geometry=new Set(), instruments=[];
  let disposed=false,frame=0,hover=-1,active=selected,down=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mat=(color,roughness=.8,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.add(m);return m;};
  function box(w,h,d,m,x,y,z){const g=new THREE.BoxGeometry(w,h,d);geometry.add(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
  const wood=mat('#765b3c'), darkWood=mat('#493e2c'), brass=mat('#a18d62',.4,.55), wall=mat('#354439'), trim=mat('#3b4a3c'), black=mat('#181e19');
  const grainCanvas=document.createElement('canvas');grainCanvas.width=512;grainCanvas.height=128;const ctx=grainCanvas.getContext('2d');ctx.fillStyle='#b9a481';ctx.fillRect(0,0,512,128);for(let i=0;i<100;i++){ctx.strokeStyle=`rgba(61,43,24,${.04+(i%5)*.012})`;ctx.beginPath();ctx.moveTo(0,(i*37)%128);ctx.bezierCurveTo(150,(i*37)%128-2,300,(i*37)%128+3,512,(i*37)%128);ctx.stroke();}const grain=new THREE.CanvasTexture(grainCanvas);grain.colorSpace=THREE.SRGBColorSpace;grain.wrapS=grain.wrapT=THREE.RepeatWrapping;textures.add(grain);wood.map=grain;
  scene.add(new THREE.HemisphereLight('#ffefd8','#556956',2));
  const light=new THREE.DirectionalLight('#ffe4b6',3);light.position.set(-2.5,4,4);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-4,right:4,top:4,bottom:-3,near:.1,far:20});light.shadow.normalBias=.014;light.shadow.bias=-.0001;scene.add(light);
  const fill=new THREE.DirectionalLight('#b9d5ce',1.4);fill.position.set(3,2,3);scene.add(fill);
  box(30,18,.15,wall,0,4,-.5);
  for(let x=-8;x<9;x+=.35)box(.012,18,.015,trim,x,4,-.41);
  box(30,.1,20,mat('#403e30'),0,-.15,5);
  box(30,.16,.08,darkWood,0,-.02,-.36);
  const rackWidth=Math.max(2.65,projects.length*1.05+.65);
  box(rackWidth,.13,.12,wood,0,1.65,-.30);
  box(rackWidth+.06,.025,.145,brass,0,1.575,-.285);
  // Rack slots are derived from the project list, ready for additional instruments.
  projects.forEach((project,i)=>{
   const x=(i-(projects.length-1)/2)*1.08;
   // Arms straddle the narrow neck below the headstock. The original guitars
   // reach about 0.08 units from center here; the inner edges sit at 0.097.
   const armOffset=project.hangerWidth??.11;
   box(.095,.13,.07,black,x,1.65,-.205);
   for(const offset of [-armOffset,armOffset]){
    box(.026,.045,.42,black,x+offset,1.73,-.07);
    box(.026,.065,.035,black,x+offset,1.755,.14);
   }
   const screwGeo=new THREE.SphereGeometry(.009,8,8);geometry.add(screwGeo);const screw=new THREE.Mesh(screwGeo,brass);screw.position.set(x,1.688,-.16);scene.add(screw);
   const group=new THREE.Group();group.position.set(x,.22,.035);group.rotation.z=i%2===0?-.025:.025;group.userData.project=i;scene.add(group);instruments.push(group);
  });
  const projected=new THREE.Vector3();
  function render(){if(disposed)return;scene.updateMatrixWorld(true);instruments.forEach((g,i)=>{const button=buttons.current[i];if(!button)return;projected.set(g.position.x,1.03,.20).project(camera);button.style.left=`${(projected.x*.5+.5)*el.clientWidth}px`;button.style.top=`${(-projected.y*.5+.5)*el.clientHeight}px`;button.style.visibility=projected.z<1?'visible':'hidden';});renderer.render(scene,camera);}
  function animate(){cancelAnimationFrame(frame);const tick=()=>{let moving=false;instruments.forEach((g,i)=>{const target=hover===i||active===projects[i].id? .09:.035;const delta=target-g.position.z;g.position.z+=reduced.matches?delta:delta*.18;if(Math.abs(delta)>.0003)moving=true;});render();if(moving)frame=requestAnimationFrame(tick);};tick();}
  function resetView(){const fitWidth=Math.max(2.9,rackWidth+.3);const distance=Math.max(3.85,fitWidth/(2*Math.tan(THREE.MathUtils.degToRad(18))*camera.aspect));camera.position.set(0,1.35,distance);controls.target.set(0,1.05,0);camera.far=Math.max(40,distance+20);camera.updateProjectionMatrix();controls.update();render();}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function hit(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);let node=raycaster.intersectObjects(instruments,true)[0]?.object;while(node&&node.userData.project===undefined)node=node.parent;return node?.userData.project??-1;}
  function move(e){if(e.buttons)return;const next=hit(e);if(next!==hover){hover=next;renderer.domElement.style.cursor=next<0?'grab':'pointer';animate();}}
  function leave(){hover=-1;animate();}
  function start(e){down={x:e.clientX,y:e.clientY};}
  function end(e){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7){const index=hit(e);if(index>=0){buttons.current[index]?.focus();select.current(projects[index].id);}}down=null;}
  function lost(e){e.preventDefault();onStatus('error');}
  const events={pointermove:move,pointerleave:leave,pointerdown:start,pointerup:end,webglcontextlost:lost};Object.entries(events).forEach(([event,fn])=>renderer.domElement.addEventListener(event,fn));
  controls.addEventListener('change',render);
  const resize=new ResizeObserver(()=>{camera.aspect=el.clientWidth/el.clientHeight;renderer.setSize(el.clientWidth,el.clientHeight);resetView();});resize.observe(el);
  api.current={reset:resetView,select:id=>{active=id;animate();}};
  function disposeTree(root){root.traverse(node=>{if(!node.isMesh)return;node.geometry.dispose();for(const m of Array.isArray(node.material)?node.material:[node.material]){Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose();});m.dispose();}});}
  const loader=new GLTFLoader();
  Promise.all(projects.map(async(project,i)=>{
   const gltf=await loader.loadAsync(project.model);
   if(disposed){disposeTree(gltf.scene);return;}
   gltf.scene.rotation.y=project.rotation??0;
   gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;mesh.castShadow=true;mesh.receiveShadow=true;geometry.add(mesh.geometry);for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){materials.add(m);Object.values(m).forEach(v=>{if(v?.isTexture){v.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.add(v);}});}});
   instruments[i].add(gltf.scene);render();
  })).then(()=>{if(!disposed){onStatus('ready');render();}}).catch(()=>{if(!disposed)onStatus('error');});
  resetView();
  return()=>{disposed=true;cancelAnimationFrame(frame);api.current=null;resize.disconnect();controls.dispose();Object.entries(events).forEach(([event,fn])=>renderer.domElement.removeEventListener(event,fn));geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
 },[onStatus]);
 return <div className="guitar-scene" ref={host}>{projects.map((project,i)=><button key={project.id} ref={el=>buttons.current[i]=el} className="instrument-hit-area" aria-label={`Explore project: ${project.instrument}`} onClick={()=>onSelect(project.id)} onFocus={()=>api.current?.select(project.id)} onBlur={()=>api.current?.select(selected)}></button>)}</div>;
}
