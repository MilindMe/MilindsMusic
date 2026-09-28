import React, {useState, useEffect, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {House, FolderOpen, FileText, Disc3, Gamepad2, Menu, PanelLeftClose, RotateCcw, RefreshCw} from 'lucide-react';
import './styles.css';
import {projects} from './projects';
import {records, recordSlots} from './data';
import ProjectDetails from './ProjectDetails';
import RecordDetails from './RecordDetails';
import MusicPlayer from './MusicPlayer';
const ShopScene = lazy(() => import('./ShopScene'));
const GuitarScene = lazy(() => import('./GuitarScene'));
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
 const [status,setStatus]=useState('loading');
 const [reset,setReset]=useState(0);
 const [attempt,setAttempt]=useState(0);
 const [musicTrack,setMusicTrack]=useState(null);
 const [playRequest,setPlayRequest]=useState(0);
 useEffect(()=>{
  const navigate=()=>{setPage(currentPage());if(currentPage()!=='resume')setStatus('loading');setExpanded(false);setSelected(null);};
  window.addEventListener('hashchange',navigate);
  return()=>window.removeEventListener('hashchange',navigate);
 },[]);
 useEffect(()=>{document.title=`${destinations.find(item=>item.id===page).label} — Side A`;},[page]);
 useEffect(()=>{
  const key=e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){setExpanded(false);setSelected(null);document.activeElement?.blur();}};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[]);
 function retry(){setStatus('loading');setAttempt(v=>v+1);}
 const Scene=page==='memories'?MemoriesScene:page==='projects'?GuitarScene:ShopScene;
 const project=page==='projects'?projects.find(p=>p.id===selected):null;
 const record=page==='home'&&Number.isInteger(selected)?records.find(r=>r.id===recordSlots[selected]):null;
 return <div className={`app-shell ${page==='memories'?'memories-page':''}`}>
  <aside className={`sidebar ${expanded?'is-expanded':''}`} aria-label="Site navigation">
   <button className="sidebar-toggle" aria-label={expanded?'Collapse navigation':'Expand navigation'} aria-expanded={expanded} aria-controls="primary-navigation" onClick={()=>setExpanded(v=>!v)}>{expanded?<PanelLeftClose size={20}/>:<Menu size={20}/>}</button>
   <nav id="primary-navigation" aria-label="Main navigation">{destinations.map(({id,label,Icon})=><a key={id} href={`#${id}`} className={`nav-link ${page===id?'active':''}`} aria-label={label} aria-current={page===id?'page':undefined} onClick={e=>{setExpanded(false);if(e.detail>0)e.currentTarget.blur();}}><Icon size={21} strokeWidth={1.6}/><span className="nav-label" aria-hidden="true">{label}</span><i className="active-dot" aria-hidden="true"/></a>)}</nav>
  </aside>
  <main className="page" aria-label={page==='home'?'Record shop':page==='projects'?'Guitar shop — projects':page==='memories'?'Memories':'Resume — not yet added'}>
   {page!=='resume'?<>
    <div className="scene"><SceneBoundary key={`${page}-${attempt}`} onError={()=>setStatus('error')}><Suspense fallback={null}><Scene onSelect={setSelected} selected={selected} reset={reset} onStatus={setStatus}/></Suspense></SceneBoundary></div>
    {status==='loading'&&<div className="scene-status" role="status" aria-label={`Loading ${page}`}><Disc3 size={26} strokeWidth={1.2}/></div>}
    {status==='error'&&<button className="scene-status retry" onClick={retry} aria-label="Unable to load the shop. Retry"><RefreshCw size={24}/></button>}
    <button className="reset-view" onClick={()=>{setReset(v=>v+1);setSelected(null);}} aria-label="Reset camera view"><RotateCcw size={17} strokeWidth={1.5}/></button>
   </>:<div className="empty-page" role="status" aria-label="Resume content has not been added yet"><FileText size={38} strokeWidth={1}/></div>}
   {project&&<ProjectDetails key={project.id} project={project} onClose={()=>setSelected(null)}/>}
   {record&&<RecordDetails key={record.id} record={record} onClose={()=>setSelected(null)} onPlay={id=>{setMusicTrack(id);setPlayRequest(v=>v+1);setSelected(null);}}/>}
  </main>
  <MusicPlayer tracks={records} selectedTrack={musicTrack} onTrackChange={setMusicTrack} playRequest={playRequest}/>
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
