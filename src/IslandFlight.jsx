import React from 'react';
import './island-flight.css';

export default function IslandFlight(){
 return <div className="island-flight" aria-hidden="true"><svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" focusable="false">
  <g className="vacation-world" transform="translate(600 350)" fill="none" stroke="#91d8c5" strokeWidth="2" opacity=".65"><circle r="210"/><ellipse rx="95" ry="210"/><ellipse rx="170" ry="210"/><ellipse rx="210" ry="75"/><path d="M-182-105H182M-182 105H182M-210 0H210M0-210V210"/></g>
  <g className="vacation-sun" transform="translate(855 170)"><circle r="57"/><g stroke="currentColor" strokeWidth="3">{Array.from({length:12},(_,i)=><path key={i} transform={`rotate(${i*30})`} d="M0-72V-88"/>)}</g></g>
  <g className="vacation-clouds" fill="none" stroke="#fff3d7" strokeWidth="3"><path d="M200 210c-40 0-33-42-6-40-7-46 65-50 74-12 40-8 50 52 7 52Z"/><path d="M820 385c-32 0-30-35-6-34-5-40 54-43 64-10 33-7 42 44 6 44Z"/></g>
  <path className="vacation-route" d="M120 620 C200 200 610 650 650 350 S960 175 1110 100" fill="none" stroke="#fff3d7" strokeWidth="3" strokeDasharray="7 10"/>
  <g className="vacation-plane"><path d="M34 0-10-9-24-32-34-32-25-7-44-9-52-19-59-19-54 0-59 19-52 19-44 9-25 7-34 32-24 32-10 9Z" fill="#fff3d7" stroke="#d88b4d" strokeWidth="2"/></g>
  <g className="vacation-island" transform="translate(700 635)"><ellipse rx="170" ry="43" fill="#e9c888"/><g fill="none" stroke="#78d6c6" strokeWidth="3"><path d="M-230 60q30-22 60 0t60 0t60 0t60 0t60 0t60 0t60 0M-180 82q30-22 60 0t60 0t60 0t60 0t60 0"/></g><path d="M-15 0q37-68 15-135" fill="none" stroke="#f5d59b" strokeWidth="13"/><g fill="none" stroke="#97d5a9" strokeWidth="12" strokeLinecap="round"><path d="M0-135q-62-40-107 18M0-135q-76 0-84 53M0-135q55-62 97-17M0-135q65-8 89 48M0-135q-10-61-48-66"/></g></g>
  <text x="560" y="730" fill="#fff3d7" fontSize="15" letterSpacing="5">NEXT STOP: MAURITIUS</text>
 </svg></div>;
}
