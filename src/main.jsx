import React, {useState, useEffect, useRef, useCallback, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {House, FolderOpen, FileText, Gamepad2, Menu, PanelLeftClose, RotateCcw, RefreshCw, Sun} from 'lucide-react';
import {lightingModes} from './lighting';
import './styles.css';
import {projects} from './projects';
import {records, recordSlots, books} from './data';
import ProjectDetails from './ProjectDetails';
import RecordDetails from './RecordDetails';
import BookDetails from './BookDetails';
import MusicPlayer from './MusicPlayer';
const ShopScene = lazy(() => import('./ShopScene'));
import LoadingScreen from './LoadingScreen';
import PsychedelicFlight from './PsychedelicFlight';
import IslandFlight from './IslandFlight';
import ResumePage from './ResumePage';
const MemoriesScene = lazy(() => import('./MemoriesScene'));
const destinations = [
 {id:'home', label:'Home', Icon:House},
 {id:'projects', label:'Projects', Icon:FolderOpen},
 {id:'memories', label:'Memories', Icon:Gamepad2},
 {id:'resume', label:'Resume', Icon:FileText},
];
const currentPage = () => destinations.some(item => item.id === location.hash.slice(1)) ? location.hash.slice(1) : 'home';
class SceneBoundary extends React.Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){this.props.onError();}
 render(){return this.state.failed?null:this.props.children;}
}
function App(){
 const [page,setPage]=useState(currentPage);
 const [expanded,setExpanded]=useState(false);
 const [selected,setSelected]=useState(null);
 const [attempt,setAttempt]=useState(0);
 const [status,setStatus]=useState('loading');
 const [progress,setProgress]=useState(0);
 const [splash,setSplash]=useState(true);
 const [flying,setFlying]=useState(false);
 const [globePhase,setGlobePhase]=useState(null);
 const beginGlobePhase=useCallback(phase=>{setGlobePhase(phase);if(phase){setSelected(null);setExpanded(false);}},[]);
 const finishGlobeFlight=useCallback(()=>{setGlobePhase(null);location.hash='resume';},[]);
 const pageRef=useRef(page);pageRef.current=page;
 const finishFlight=useCallback(destination=>{
  if(destination!==pageRef.current)return;
  setFlying(false);setProgress(.7);setMinimumElapsed(false);setSplash(true);
 },[]);
 const [minimumElapsed,setMinimumElapsed]=useState(false);
 const reportProgress=useCallback(value=>setProgress(previous=>Math.max(previous,Math.min(.94,value*.94))),[]);
 useEffect(()=>{setMinimumElapsed(false);if(!splash)return;const timer=setTimeout(()=>setMinimumElapsed(true),650);return()=>clearTimeout(timer);},[page,attempt,splash]);
 useEffect(()=>{
  if(status==='error'){setSplash(false);setFlying(false);setGlobePhase(null);return;}
  if(status!=='ready'||!minimumElapsed||!splash||flying)return;
  setProgress(1);const timer=setTimeout(()=>setSplash(false),180);return()=>clearTimeout(timer);
 },[status,minimumElapsed,page,splash,flying]);
 const [reset,setReset]=useState(0);
 const [lightMode,setLightMode]=useState('golden');
 useEffect(()=>{document.getElementById('scene-light-panel')?.hidePopover?.();},[page,splash,flying,globePhase]);
 const [musicTrack,setMusicTrack]=useState(null);
 const [playRequest,setPlayRequest]=useState(0);
 useEffect(()=>{
  const navigate=()=>{
   const next=currentPage();if(next===page)return;
   setGlobePhase(null);
   const shared=['home','projects'].includes(page)&&['home','projects'].includes(next);
   const animate=shared&&status==='ready'&&!splash;
   setFlying(animate);setSplash(!animate);setProgress(shared||next==='resume'?.7:0);setMinimumElapsed(false);
   pageRef.current=next;
   setPage(next);if(next==='resume')setStatus('ready');else if(!shared)setStatus('loading');
   setExpanded(false);setSelected(null);
  };
  window.addEventListener('hashchange',navigate);
  return()=>window.removeEventListener('hashchange',navigate);
 },[page,status,splash]);
 useEffect(()=>{if(page==='resume')setStatus('ready');},[page]);
 useEffect(()=>{document.title=`${destinations.find(item=>item.id===page).label} — Side A`;},[page]);
 useEffect(()=>{
  const key=e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){setExpanded(false);setSelected(null);document.activeElement?.blur();}};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[]);
 function retry(){setSplash(true);setProgress(0);setMinimumElapsed(false);setStatus('loading');setAttempt(v=>v+1);}
 const Scene=page==='memories'?MemoriesScene:ShopScene;
 const project=page==='projects'?projects.find(p=>p.id===selected):null;
 const record=page==='home'&&Number.isInteger(selected)?records.find(r=>r.id===recordSlots[selected]):null;
 const book=page==='home'&&typeof selected==='string'?books.find(b=>`book:${b.id}`===selected):null;
 return <div className={`app-shell ${page==='memories'?'memories-page':''} ${flying||globePhase==='flying'?'is-travelling':''}`}>
  <aside inert={splash||flying||globePhase==='flying'} className={`sidebar ${expanded?'is-expanded':''}`} aria-label="Site navigation">
   <button className="sidebar-toggle" aria-label={expanded?'Collapse navigation':'Expand navigation'} aria-expanded={expanded} aria-controls="primary-navigation" onClick={()=>setExpanded(v=>!v)}>{expanded?<PanelLeftClose size={20}/>:<Menu size={20}/>}</button>
   <nav id="primary-navigation" aria-label="Main navigation">{destinations.map(({id,label,Icon})=><a key={id} href={`#${id}`} className={`nav-link ${page===id?'active':''}`} aria-label={label} aria-current={page===id?'page':undefined} onClick={e=>{setExpanded(false);if(e.detail>0)e.currentTarget.blur();}}><Icon size={21} strokeWidth={1.6}/><span className="nav-label" aria-hidden="true">{label}</span><i className="active-dot" aria-hidden="true"/></a>)}</nav>
  </aside>
  <main inert={splash||flying||globePhase==='flying'} className="page" aria-label={page==='home'?'Record shop':page==='projects'?'Guitar shop — projects':page==='memories'?'Memories':'Résumé and where I’m from'}>
   {page!=='resume'?<>
    <div className="scene"><SceneBoundary key={`${page==='projects'?'home':page}-${attempt}`} onError={()=>setStatus('error')}><Suspense fallback={null}><Scene lightMode={lightMode} onSelect={setSelected} selected={selected} reset={reset} onStatus={setStatus} onProgress={reportProgress} view={page} animateTransition={flying} onTransitionComplete={finishFlight} onGlobePhase={beginGlobePhase} onGlobeComplete={finishGlobeFlight}/></Suspense></SceneBoundary></div>
    {status==='error'&&<button className="scene-status retry" onClick={retry} aria-label="Unable to load the shop. Retry"><RefreshCw size={24}/></button>}
    {page==='projects'&&<a className="guitar-back" href="#home" aria-label="Back to the music store"><span aria-hidden="true">←</span> Back</a>}
    <button className="reset-view" onClick={()=>{setReset(v=>v+1);setSelected(null);}} aria-label="Reset camera view"><RotateCcw size={17} strokeWidth={1.5}/></button>
    <button className="light-toggle" popoverTarget="scene-light-panel" aria-label={`Lighting: ${lightingModes.find(mode=>mode.id===lightMode).label}. Adjust lighting`} title="Adjust lighting"><Sun size={18} strokeWidth={1.5}/></button>
    <div id="scene-light-panel" className="light-panel" popover="auto">
     <div className="light-slider-layout">
      <input type="range" min="0" max="2" step="1" value={lightingModes.findIndex(mode=>mode.id===lightMode)} onChange={event=>setLightMode(lightingModes[Number(event.target.value)].id)} aria-label="Scene lighting mode" aria-valuetext={lightingModes.find(mode=>mode.id===lightMode).label} aria-orientation="vertical" list="light-mode-stops"/>
      <datalist id="light-mode-stops"><option value="0"/><option value="1"/><option value="2"/></datalist>
     
     </div>
    </div>
   </>:<ResumePage/>}
   {project&&<ProjectDetails key={project.id} project={project} onClose={()=>setSelected(null)}/>}
   {record&&<RecordDetails key={record.id} record={record} onClose={()=>setSelected(null)} onPlay={id=>{setMusicTrack(id);setPlayRequest(v=>v+1);setSelected(null);}}/>}
   {book&&<BookDetails key={book.id} book={book} onClose={()=>setSelected(null)}/>}
  </main>
  {globePhase==='flying'&&<IslandFlight/>}
  {flying&&<PsychedelicFlight key={page} direction={page}/>}
  {splash&&<LoadingScreen progress={progress}/>}
  <div inert={splash||flying||globePhase==='flying'}><MusicPlayer tracks={records} selectedTrack={musicTrack} onTrackChange={setMusicTrack} playRequest={playRequest}/></div>
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
