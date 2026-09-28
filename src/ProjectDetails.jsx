import React, {useEffect, useRef} from 'react';
import {X, ArrowUpRight} from 'lucide-react';
export default function ProjectDetails({project,onClose}) {
 const dialog=useRef(null);
 useEffect(()=>{dialog.current.showModal();},[]);
 function keepFocus(event){
  if(event.key!=='Tab')return;
  const items=[...dialog.current.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')];
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
 return <dialog onKeyDown={keepFocus} ref={dialog} className="detail-dialog project-dialog" aria-labelledby="project-title" onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)e.currentTarget.close();}}>
  <article className="detail-content">
   <div className="detail-top"><span>{project.instrument}</span><button autoFocus onClick={()=>dialog.current.close()} aria-label="Close project details"><X size={21}/></button></div>
   <div className="detail-body"><p className="detail-category">{project.category}</p><h1 id="project-title">{project.title}</h1><p className="detail-summary">{project.summary}</p><section><h2>The story</h2><p>{project.description}</p></section><section><h2>My role</h2><p>{project.role}</p></section>
   {project.technologies.length>0&&<ul className="project-tags" aria-label="Technologies">{project.technologies.map(t=><li key={t}>{t}</li>)}</ul>}
   {project.links.length>0&&<div className="project-links">{project.links.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={16}/></a>)}</div>}
   </div>
  </article>
 </dialog>;
}
