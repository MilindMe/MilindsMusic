import React, {useEffect, useRef} from 'react';
import {X} from 'lucide-react';

export default function BookDetails({book,onClose}) {
 const dialog=useRef(null);
 useEffect(()=>{dialog.current.showModal();},[]);
 return <dialog ref={dialog} className="detail-dialog book-dialog" aria-labelledby="book-title" onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)e.currentTarget.close();}}>
  <article className="detail-content">
   <div className="detail-top"><span>{book.title}</span><button autoFocus onClick={()=>dialog.current.close()} aria-label="Close book details"><X size={21}/></button></div>
   <div className="book-visual" style={{'--book-color':book.color}} aria-hidden="true">{book.cover?<img src={book.cover} alt=""/>:<div className="book-cover"><strong>{book.title}</strong><span>{book.author}</span></div>}</div>
   <div className="detail-body"><p className="detail-category">{book.tag}</p><h1 id="book-title">{book.title}</h1><p className="detail-summary">{book.author} · {book.year}</p><span className="detail-pill">{book.genre}</span><section><h2>Reading notes</h2><h3>{book.review}</h3><p>{book.prompt}</p></section></div>
  </article>
 </dialog>;
}
