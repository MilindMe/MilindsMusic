import React, {useEffect, useRef} from 'react';
import {Disc3, Play, X} from 'lucide-react';

export default function RecordDetails({record,onClose,onPlay}) {
 const dialog=useRef(null);
 useEffect(()=>{dialog.current.showModal();},[]);
 return <dialog ref={dialog} className="detail-dialog record-dialog" aria-labelledby="record-title" onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)e.currentTarget.close();}}>
  <article className="detail-content">
   <div className="detail-top"><span>{record.name}</span><button autoFocus onClick={()=>dialog.current.close()} aria-label="Close record details"><X size={21}/></button></div>
   <div className="record-visual" style={{'--record-color':record.color}} aria-hidden="true">{record.cover?<img src={record.cover} alt=""/>:<><Disc3 size={150} strokeWidth={.7}/><i/></>}</div>
   <div className="detail-body"><p className="detail-category">{record.tag}</p><h1 id="record-title">{record.album}</h1><p className="detail-summary">{record.artist} · {record.year}</p><span className="detail-pill">{record.genre}</span><button className="listen-button" onClick={()=>onPlay(record.id)}><Play size={15} fill="currentColor"/> Play me</button><section><h2>Listening notes</h2><h3>{record.review}</h3><p>{record.prompt}</p></section></div>
  </article>
 </dialog>;
}
