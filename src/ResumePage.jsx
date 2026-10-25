import React from 'react';
import './resume.css';

export default function ResumePage(){
 return <article className="resume-page">
  <a className="resume-back" href="#home">← Back to the store</a>
  <header className="resume-intro"><span className="resume-eyebrow">A little about me / Résumé</span><h1>Every story<br/>starts somewhere.</h1><p>A place for the people, places, and work that have shaped my journey.</p></header>
  <section className="origin-card" aria-labelledby="origin-title">
   <div className="island-postcard" aria-hidden="true"><span>Greetings from</span><strong>Mauritius</strong><svg viewBox="0 0 280 240"><circle cx="207" cy="54" r="29" fill="#ecc581"/><path d="M163 42 181 66 179 88 192 108 174 128 167 151 143 166 123 189 98 195 88 177 97 150 115 134 119 109 140 88 144 62Z" fill="#385e4d" stroke="#f4e8c6" strokeWidth="3"/><g fill="none" stroke="#8aa997" strokeWidth="2"><path d="M28 202q16-12 32 0t32 0m102 0q16-12 32 0t32 0M24 216q16-12 32 0t32 0m110 0q16-12 32 0t32 0"/></g><circle cx="144" cy="136" r="6" fill="#dc6d46"/></svg><small>Indian Ocean · Island roots</small></div>
   <div className="origin-story"><span className="resume-eyebrow">01 / Where I’m from</span><h2 id="origin-title">Mauritius.<br/>A place called home.</h2><p className="resume-placeholder">My story goes here.</p><p>I’ll share more about growing up, the sounds and places I carry with me, and how they’ve shaped what I do today.</p></div>
  </section>
  <div className="resume-sections">{[['02','Experience','The work along the way','Roles, teams, and projects will be added here.'],['03','Education','Things I’ve learned','Education, courses, and milestones will be added here.'],['04','Skills','What I bring','Tools, technologies, and creative interests will be added here.']].map(([number,label,title,copy])=><section key={number}><span className="resume-eyebrow">{number} / {label}</span><h2>{title}</h2><p>{copy}</p><span className="resume-placeholder">Coming soon</span></section>)}</div>
 </article>;
}
