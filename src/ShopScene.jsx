import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {records, recordSlots, books} from './data';
import {projects} from './projects';
import {applyLighting} from './lighting';

// Layout and rest transforms belong to authoring/music-store.blend.
// Stable entityId properties bind the exported objects to website behaviors.
export default function ShopScene({lightMode='golden', onSelect, selected, reset, onStatus, onProgress, view='home', animateTransition=false, onTransitionComplete, onGlobePhase, onGlobeComplete}) {
 const lightModeRef=useRef(lightMode);lightModeRef.current=lightMode;
 const host=useRef(null),api=useRef(null),select=useRef(onSelect),viewRef=useRef(view);
 const globeCallbacks=useRef({onGlobePhase,onGlobeComplete});globeCallbacks.current={onGlobePhase,onGlobeComplete};
 const transition=useRef({animateTransition,onTransitionComplete});
 transition.current={animateTransition,onTransitionComplete};
 select.current=onSelect;viewRef.current=view;
 useEffect(()=>{api.current?.view(view);},[view]);
 useEffect(()=>{api.current?.reset();},[reset]);
 useEffect(()=>{api.current?.select(selected);},[selected]);
 useEffect(()=>{api.current?.lighting(lightMode);},[lightMode]);
 useEffect(()=>{
  const element=host.current;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}
  catch{onStatus('error');return;}
  const smallViewport=window.matchMedia('(max-width: 700px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,smallViewport?1.25:1.75));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
  renderer.domElement.setAttribute('aria-hidden','true');
  renderer.domElement.style.touchAction='pan-y';element.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.Fog('#304639',5,30);
  const camera=new THREE.PerspectiveCamera(34,1,.01,100);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=false;
  controls.minAzimuthAngle=-.3;controls.maxAzimuthAngle=.3;
  controls.rotateSpeed=.35;controls.touches.ONE=THREE.TOUCH.ROTATE;
  // Low amber light and restrained sky fill keep the shaded side of objects dusky.
  const hemisphere=new THREE.HemisphereLight('#c4cbd7','#34392f',.85);scene.add(hemisphere);
  const sun=new THREE.DirectionalLight('#ffd09a',2.8);
  sun.position.set(-4,2.7,2);sun.castShadow=true;sun.shadow.mapSize.set(smallViewport?1024:2048,smallViewport?1024:2048);
  Object.assign(sun.shadow.camera,{left:-3,right:3,top:3,bottom:-3});
  sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
  const fill=new THREE.DirectionalLight('#a8bacb',.45);fill.position.set(3,2,3);scene.add(fill);
  const lightRig={hemisphere,key:sun,fill,scene};
  applyLighting(lightModeRef.current,'shop',lightRig);

  const entities=new Map(),instruments=[],sleeves=[],shelfBooks=[],viewGroups=[];
  const guitarButtons=projects.map((_,i)=>element.querySelector(`[data-guitar="${i}"]`));
  const sleeveButtons=recordSlots.map((_,i)=>element.querySelector(`[data-sleeve="${i}"]`));
  const bookButtons=books.map((_,i)=>element.querySelector(`[data-book="${i}"]`));
  const globeButton=element.querySelector('[data-globe]');
  const mauritiusBeacon=element.querySelector('.mauritius-beacon');
  const materials=new Set(),textures=new Set(),geometries=new Set();
  const coverMaterials=new Map();
  const textureLoader=new THREE.TextureLoader();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,failed=false,loaded=false,frame=0,cameraFrame=0,travelling=false;
  let hovered=-1,active=selected,down=null,currentView=viewRef.current;
  let globe=null,globeAnchor=null,globeTimer=0,globeJourney=false;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();

  function register(root){
   root.traverse(node=>{
    if(!node.isMesh)return;
    node.castShadow=false;
    node.receiveShadow=true;
    geometries.add(node.geometry);
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
     materials.add(material);
     for(const value of Object.values(material))if(value?.isTexture){
      value.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.add(value);
     }
    }
   });
  }
  function visible(node){for(let p=node;p;p=p.parent)if(!p.visible)return false;return true;}
  function placeButton(entry,anchor){
   const button=entry.button;if(!button)return;
   const point=entry.node.localToWorld(anchor.clone()).project(camera);
   button.hidden=!visible(entry.node)||point.z>1||point.z< -1;
   button.style.left=`${(point.x+1)*element.clientWidth/2}px`;
   button.style.top=`${(1-point.y)*element.clientHeight/2}px`;
  }
  function render(){
   if(disposed)return;
   renderer.render(scene,camera);
   instruments.forEach(entry=>placeButton(entry,currentView==='home'?entry.lowerAnchor:entry.anchor));
   sleeves.forEach(entry=>placeButton(entry,entry.anchor));
   // Shelves stay visible in the guitar view, but books are only interactive from Home.
   shelfBooks.forEach(entry=>{if(currentView==='home')placeButton(entry,entry.anchor);else if(entry.button)entry.button.hidden=true;});
   if(globe){
    const anchor=globeAnchor??globe.worldToLocal(new THREE.Box3().setFromObject(globe).getCenter(new THREE.Vector3()));
    placeButton({node:globe,button:globeButton},anchor);
    const beacon=mauritiusBeacon;
    const point=globe.localToWorld(anchor.clone()).project(camera);
    beacon.hidden=!globeJourney||!visible(globe)||point.z>1;
    beacon.style.left=`${(point.x+1)*element.clientWidth/2}px`;beacon.style.top=`${(1-point.y)*element.clientHeight/2}px`;
   }
  }
  function anchors(node){
   const bounds=new THREE.Box3().setFromObject(node),center=bounds.getCenter(new THREE.Vector3());
   const lower=center.clone();lower.y=bounds.min.y+(bounds.max.y-bounds.min.y)*.22;
   return {anchor:node.worldToLocal(center),lowerAnchor:node.worldToLocal(lower)};
  }
  function glow(){
   instruments.forEach((entry,i)=>{
    const enabled=hovered===100+i||active===projects[i].id;
    entry.halos.forEach(mesh=>{mesh.visible=enabled;});
    entry.surfaces.forEach(({material,color,intensity})=>{
     material.emissive.copy(enabled?new THREE.Color('#d4b87e'):color);
     material.emissiveIntensity=enabled?.012:intensity;
    });
   });
   // Clickable books keep a faint warm glow so they read as interactive; hover adds the rim and brightens it.
   shelfBooks.forEach((entry,i)=>{
    const enabled=hovered===200+i||active===`book:${books[i].id}`;
    entry.halo.opacity=currentView!=='home'?0:enabled?.85:.28;
    entry.surfaces.forEach(({material})=>{
     material.emissive.set('#d4b87e');
     material.emissiveIntensity=currentView!=='home'?0:enabled?.4:.15;
    });
   });
  }
  function update(){
   glow();cancelAnimationFrame(frame);
   const tick=()=>{
    let moving=false;
    const slide=(entry,raised)=>{
     const target=entry.rest.clone();if(raised)target.add(entry.lift);
     const distance=entry.node.position.distanceTo(target);
     entry.node.position.lerp(target,reduced.matches?1:.16);
     if(distance>.0002)moving=true;
    };
    sleeves.forEach((entry,i)=>slide(entry,i===hovered||i===active));
    shelfBooks.forEach((entry,i)=>slide(entry,200+i===hovered||active===`book:${books[i].id}`));
    render();if(moving)frame=requestAnimationFrame(tick);
   };
   tick();
  }
  function hit(event){
   const rect=renderer.domElement.getBoundingClientRect();
   pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
   raycaster.setFromCamera(pointer,camera);
   let node=null,closest=Infinity;
   for(const entry of instruments){
    const hit=raycaster.intersectObject(entry.node,true).find(value=>visible(value.object));
    if(hit&&hit.distance<closest){node=hit.object;closest=hit.distance;}
   }
   if(currentView==='home'){
    const globeHit=globe&&raycaster.intersectObject(globe,true).find(value=>visible(value.object));
    if(globeHit&&globeHit.distance<closest){node=globeHit.object;closest=globeHit.distance;}
    for(const entry of sleeves){
     const sleeveHit=raycaster.intersectObject(entry.node,true).find(value=>visible(value.object));
     if(sleeveHit&&sleeveHit.distance<closest){node=sleeveHit.object;closest=sleeveHit.distance;}
    }
    for(const entry of shelfBooks){
     const bookHit=raycaster.intersectObject(entry.node,true).find(value=>visible(value.object));
     if(bookHit&&bookHit.distance<closest){node=bookHit.object;closest=bookHit.distance;}
    }
   }
   while(node){
    if(currentView==='home'&&node===globe)return 1000;
    if(node.userData.runtimeGuitar!==undefined)return 100+node.userData.runtimeGuitar;
    if(currentView==='home'&&node.userData.runtimeSleeve!==undefined)return node.userData.runtimeSleeve;
    if(currentView==='home'&&node.userData.runtimeBook!==undefined)return 200+node.userData.runtimeBook;
    node=node.parent;
   }
   return -1;
  }
  function choose(index){
   if(index===1000){startGlobe();return;}
   cancelGlobe();
   if(index>=200)select.current(`book:${books[index-200].id}`);
   else if(index>=100){if(currentView==='home')location.hash='projects';else select.current(projects[index-100].id);}
   else if(index>=0)select.current(index);
  }
  function move(event){if(event.buttons)return;const next=hit(event);if(next!==hovered){hovered=next;renderer.domElement.style.cursor=next<0?'grab':'pointer';update();}}
  function leave(){hovered=-1;update();}
  function pointerDown(event){down={x:event.clientX,y:event.clientY};}
  function pointerUp(event){
   if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<7){
    const index=hit(event);
    if(index>=0){element.querySelector(index===1000?'[data-globe]':index>=200?`[data-book="${index-200}"]`:index>=100?`[data-guitar="${index-100}"]`:`[data-sleeve="${index}"]`)?.focus({preventScroll:true});choose(index);}
   }
   down=null;
  }
  function contextLost(event){event.preventDefault();cancelGlobe();onStatus('error');}
  const events={pointermove:move,pointerleave:leave,pointerdown:pointerDown,pointerup:pointerUp,webglcontextlost:contextLost};
  Object.entries(events).forEach(([name,fn])=>renderer.domElement.addEventListener(name,fn));

  function destination(){
   const marker=entities.get(`camera_${currentView}`),targetMarker=entities.get(`target_${currentView}`);
   if(!marker||!targetMarker)return {position:new THREE.Vector3(0,1.55,3.1),target:new THREE.Vector3(0,.2,0),fov:34};
   const position=marker.getWorldPosition(new THREE.Vector3()),target=targetMarker.getWorldPosition(new THREE.Vector3());
   const offset=position.clone().sub(target),distance=offset.length();
   const fov=marker.isPerspectiveCamera?marker.fov:34;
   const fitDistance=Number(marker.userData.fitWidth)/(2*Math.tan(THREE.MathUtils.degToRad(fov/2))*camera.aspect);
   // Keep the authored view at wide sizes; pull back along its viewing direction on phones.
   position.copy(target).add(offset.multiplyScalar(Math.max(1,fitDistance/Math.max(distance,.01))));
   return {position,target,fov};
  }
  function setView(){
   viewGroups.forEach(node=>{node.visible=node.userData.visibleIn.split(',').map(v=>v.trim()).includes(currentView);});
   const d=destination(),direction=new THREE.Spherical().setFromVector3(d.position.clone().sub(d.target));
   controls.minAzimuthAngle=direction.theta-.3;controls.maxAzimuthAngle=direction.theta+.3;
   controls.minPolarAngle=Math.max(.01,direction.phi-.25);controls.maxPolarAngle=Math.min(Math.PI-.01,direction.phi+.2);
  }
  function resetView(){
   cancelGlobe();
   cancelAnimationFrame(cameraFrame);controls.enabled=true;setView();const d=destination();
   camera.position.copy(d.position);camera.fov=d.fov;controls.target.copy(d.target);
   camera.far=Math.max(100,d.position.distanceTo(d.target)+40);camera.updateProjectionMatrix();
   scene.fog.near=d.position.distanceTo(d.target)+2;scene.fog.far=scene.fog.near+12;
   controls.update();render();
  }
  function changeView(next){
   if(next===currentView)return;
   cancelGlobe();currentView=next;hovered=-1;active=null;update();cancelAnimationFrame(cameraFrame);
   if(!loaded||!transition.current.animateTransition){travelling=false;resetView();return;}
   if(reduced.matches){resetView();transition.current.onTransitionComplete?.(next);return;}
   flyCamera(destination(),next==='projects',next==='projects'?540:600,()=>{
    transition.current.onTransitionComplete?.(next);
    // Let the splash cover the final teleport frame before restoring the authored view.
    cameraFrame=requestAnimationFrame(()=>{cameraFrame=requestAnimationFrame(()=>{travelling=false;resetView();});});
   });
  }
  function flyCamera(to,entering,duration,onComplete,exactLanding=false){
   travelling=true;
   const from=camera.position.clone(),fromTarget=controls.target.clone(),fromFov=camera.fov,start=performance.now();
   const landing=exactLanding?to.position:entering?to.position.clone().lerp(to.target,.42):to.position.clone().add(to.position.clone().sub(to.target).multiplyScalar(.12));
   controls.enabled=false;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;
   function tick(now){
    const t=Math.min(1,(now-start)/duration),ease=entering?t*t*t:1-Math.pow(1-t,2.5);
    camera.position.lerpVectors(from,landing,ease);controls.target.lerpVectors(fromTarget,to.target,ease);
    camera.fov=THREE.MathUtils.lerp(fromFov,to.fov,ease)+Math.sin(Math.PI*t)*(entering?22:16);
    camera.updateProjectionMatrix();scene.fog.near=camera.position.distanceTo(controls.target)+2;scene.fog.far=scene.fog.near+12;
    controls.update();render();
    if(t<1)cameraFrame=requestAnimationFrame(tick);else onComplete();
   }
   cancelAnimationFrame(cameraFrame);cameraFrame=requestAnimationFrame(tick);
  }
  function cancelGlobe(){
   clearTimeout(globeTimer);
   if(!globeJourney)return;
   globeJourney=false;travelling=false;cancelAnimationFrame(cameraFrame);controls.enabled=true;
   globeCallbacks.current.onGlobePhase?.(null);
   const beacon=element.querySelector('.mauritius-beacon');if(beacon)beacon.hidden=true;
  }
  function startGlobe(){
   if(!loaded||!globe||currentView!=='home'||globeJourney||travelling)return;
   // Prefer an authored Mauritius marker. Otherwise use the described lower-right region.
   const authored=entities.get('mauritius');
   if(authored)globeAnchor=globe.worldToLocal(authored.getWorldPosition(new THREE.Vector3()));
   else{
    const bounds=new THREE.Box3().setFromObject(globe),size=bounds.getSize(new THREE.Vector3());
    const point=bounds.getCenter(new THREE.Vector3());point.y=bounds.max.y-size.y*.29;
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
    const face=camera.position.clone().sub(point).normalize();
    point.addScaledVector(right,size.x*.2).addScaledVector(up,-size.y*.12).addScaledVector(face,size.x*.36);
    globeAnchor=globe.worldToLocal(point);
   }
   globeJourney=true;controls.enabled=false;hovered=-1;active=null;update();
   globeCallbacks.current.onGlobePhase?.('locating');
   globeTimer=setTimeout(()=>{
    if(disposed||!globeJourney)return;
    if(reduced.matches){globeCallbacks.current.onGlobeComplete?.();return;}
    const target=globe.localToWorld(globeAnchor.clone());
    const size=new THREE.Box3().setFromObject(globe).getSize(new THREE.Vector3());
    const position=target.clone().add(camera.position.clone().sub(target).normalize().multiplyScalar(size.y*.22));
    globeCallbacks.current.onGlobePhase?.('flying');
    flyCamera({position,target,fov:32},true,900,()=>globeCallbacks.current.onGlobeComplete?.(),true);
   },4100);
  }
  function escape(event){if(event.key==='Escape'&&globeJourney){cancelGlobe();resetView();}}
  window.addEventListener('keydown',escape);
  const resize=new ResizeObserver(()=>{
   camera.aspect=element.clientWidth/element.clientHeight;renderer.setSize(element.clientWidth,element.clientHeight);if(travelling){camera.updateProjectionMatrix();render();}else resetView();
  });resize.observe(element);
  controls.addEventListener('change',render);
  api.current={choose,globe:startGlobe,view:changeView,reset:resetView,lighting:mode=>{applyLighting(mode,'shop',lightRig);render();},select:value=>{active=value;update();},hover:value=>{hovered=value;update();}};

  function fail(error){failed=true;if(!disposed){console.error('Unable to load music-store.glb:',error);onStatus('error');}}
  const manager=new THREE.LoadingManager();
  manager.onProgress=(_url,done,total)=>{if(!disposed)onProgress?.(done/total);};
  manager.onError=fail;
  manager.onLoad=()=>{if(!disposed&&!failed&&loaded){render();onStatus('ready');}};
  function requireEntity(id){const node=entities.get(id);if(!node)throw new Error(`Missing entityId: ${id}. Restore it in Blender's custom properties.`);return node;}
  new GLTFLoader(manager).load('/models/music-store.glb',gltf=>{
   if(disposed){register(gltf.scene);disposeResources();return;}
   try{
    register(gltf.scene);scene.add(gltf.scene);scene.updateMatrixWorld(true);
    gltf.scene.traverse(node=>{
     const id=node.userData.entityId;
     if(id){if(entities.has(id))throw new Error(`Duplicate entityId: ${id}`);entities.set(id,node);}
     if(typeof node.userData.visibleIn==='string')viewGroups.push(node);
    });
    globe=entities.get('globe');
    globe?.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=true;});
    for(const id of ['camera_home','target_home','camera_projects','target_projects'])requireEntity(id);
    projects.forEach((project,i)=>{
     const node=requireEntity(`guitar_${project.id}`);node.userData.runtimeGuitar=i;
     node.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=true;});
     const entry={node,button:guitarButtons[i],...anchors(node),halos:[],surfaces:[]};instruments[i]=entry;
     const meshes=[];node.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
     meshes.forEach(mesh=>{
      const surface=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(original=>{
       const material=original.clone();materials.add(material);
       if(material.emissive)entry.surfaces.push({material,color:material.emissive.clone(),intensity:material.emissiveIntensity});
       return material;
      });
      mesh.material=Array.isArray(mesh.material)?surface:surface[0];
      const material=new THREE.MeshBasicMaterial({color:'#e9d5a0',side:THREE.BackSide,depthWrite:false});
      materials.add(material);
      const halo=new THREE.Mesh(mesh.geometry,material);halo.scale.setScalar(1.018);halo.visible=false;halo.raycast=()=>{};mesh.add(halo);entry.halos.push(halo);
     });
    });
    recordSlots.forEach((recordId,i)=>{
     const node=requireEntity(`record_${String(i+1).padStart(2,'0')}`);node.userData.runtimeSleeve=i;
     node.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=true;});
     const rest=node.position.clone();
     const lifted=node.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.1,0));
     const lift=node.parent.worldToLocal(lifted).sub(rest);
     sleeves[i]={node,rest,lift,button:sleeveButtons[i],...anchors(node)};
     const record=records.find(r=>r.id===recordId);
     // Covers remain data-driven while Blender owns the cover mesh and its placement.
     if(record?.cover)node.traverse(mesh=>{
      if(!mesh.isMesh||mesh.userData.surface!=='record_cover')return;
      let material=coverMaterials.get(record.cover);
      if(!material){
       const map=textureLoader.load(record.cover,texture=>{if(disposed)texture.dispose();else render();},undefined,fail);
       map.colorSpace=THREE.SRGBColorSpace;textures.add(map);
       material=new THREE.MeshStandardMaterial({map,roughness:.8});materials.add(material);coverMaterials.set(record.cover,material);
      }
      mesh.material=material;
     });
    });
    books.forEach((book,i)=>{
     const node=requireEntity(book.entityId);node.userData.runtimeBook=i;
     node.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=true;});
     const rest=node.position.clone();
     // The Home camera only sees the lower spines, so books slide out toward the room instead of up.
     const lifted=node.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,0,.09));
     const halo=new THREE.MeshBasicMaterial({color:'#e9d5a0',side:THREE.BackSide,transparent:true,opacity:.28,depthWrite:false});
     materials.add(halo);
     const entry={node,rest,lift:node.parent.worldToLocal(lifted).sub(rest),button:bookButtons[i],...anchors(node),halo,surfaces:[]};shelfBooks[i]=entry;
     const meshes=[];node.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});
     meshes.forEach(mesh=>{
      mesh.material=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(original=>{
       const material=original.clone();materials.add(material);
       if(material.emissive)entry.surfaces.push({material});
       return material;
      });
      if(mesh.material.length===1)mesh.material=mesh.material[0];
      // Books are thin, so pad the rim by a fixed distance rather than a uniform scale.
      if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
      const size=mesh.geometry.boundingBox.getSize(new THREE.Vector3());
      const rim=new THREE.Mesh(mesh.geometry,halo);rim.raycast=()=>{};
      rim.scale.set(1+.012/Math.max(size.x,.001),1+.012/Math.max(size.y,.001),1+.012/Math.max(size.z,.001));
      mesh.add(rim);
     });
    });
    loaded=true;resetView();update();
   }catch(error){fail(error);}
  },undefined,fail);
  function disposeResources(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  resetView();
  return()=>{
   disposed=true;clearTimeout(globeTimer);window.removeEventListener('keydown',escape);cancelAnimationFrame(frame);cancelAnimationFrame(cameraFrame);api.current=null;resize.disconnect();controls.dispose();
   Object.entries(events).forEach(([name,fn])=>renderer.domElement.removeEventListener(name,fn));
   disposeResources();renderer.dispose();renderer.domElement.remove();
  };
 },[onStatus,onProgress]);
 return <div ref={host} style={{width:'100%',height:'100%'}}>
  <button hidden={view!=='home'} data-globe className="globe-hit-area" aria-label="Explore Mauritius and my résumé" onClick={()=>api.current?.globe()}/>
  <div className="mauritius-beacon" hidden><span>Mauritius</span></div>
  {projects.map((project,i)=><button key={project.id} data-guitar={i} className="guitar-hit-area" aria-label={view==='home'?`Visit guitar section: ${project.instrument}`:`Explore project: ${project.instrument}`} onFocus={()=>api.current?.hover(100+i)} onBlur={()=>api.current?.hover(-1)} onClick={()=>api.current?.choose(100+i)}/>)}
  {books.map((book,i)=><button key={book.id} data-book={i} className="book-hit-area" aria-label={`Browse ${book.title} by ${book.author}`} onFocus={()=>api.current?.hover(200+i)} onBlur={()=>api.current?.hover(-1)} onClick={()=>api.current?.choose(200+i)}/>)}
  {recordSlots.map((id,i)=><button key={i} data-sleeve={i} className="record-hit-area" aria-label={`Browse ${records.find(r=>r.id===id)?.album}, rack ${Math.floor(i/6)+1}, sleeve ${i%6+1}`} onFocus={()=>api.current?.hover(i)} onBlur={()=>api.current?.hover(-1)} onClick={()=>api.current?.choose(i)}/>)}
 </div>;
}
