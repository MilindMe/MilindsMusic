import React from 'react';
import './psychedelic-flight.css';

const inks=['#ffc44f','#ff704a','#f478c6','#81e2cc','#fff0bc'];
const guitar='M-12-235 L17-241 L25-188 L12-176 L14-51 C44-77 76-54 62-20 C51 5 100 29 91 75 C84 119 48 139 0 135 C-49 133-86 105-87 64 C-88 27-48 10-57-19 C-70-53-39-74-14-51 L-12-176 L-23-188 Z';

// Uneven concentric contours evoke hand-printed concert posters, not perfect rings.
function contour(index){
 const points=Array.from({length:97},(_,i)=>{
  const angle=i/96*Math.PI*2;
  const radius=175+index*30+Math.sin(angle*5+index*.7)*19+Math.cos(angle*3-index)*14;
  return `${i?'L':'M'}${(Math.cos(angle)*radius*1.65).toFixed(1)},${(Math.sin(angle)*radius).toFixed(1)}`;
 });
 return points.join(' ')+' Z';
}
const contours=Array.from({length:7},(_,i)=>contour(i));
const ribbons=[
 'M-100 120 C240-100 70 540 370 290 S480 610 720 380 S1100-100 1540 190',
 'M-100 720 C180 940 100 330 420 590 S620 170 920 490 S1320 940 1540 640',
 'M180-100 C-40 230 510 120 300 420 S650 490 530 1000',
 'M1250-100 C1480 290 900 120 1130 430 S780 660 1030 1000',
];

export default function PsychedelicFlight({direction}){
 return <div className={`psychedelic-flight ${direction==='home'?'is-outbound':''}`} aria-hidden="true">
  <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
   <g className="psych-tunnel" transform="translate(720 430)">
    {contours.map((d,i)=><g key={i} className="psych-contour" style={{'--i':i}}><path d={d} stroke={inks[i%inks.length]} strokeWidth={i%2?3:6}/></g>)}
   </g>
   <g className="psych-ribbons">
    {ribbons.map((d,i)=><g key={i} style={{'--i':i}}>
     <path className="psych-ribbon shadow" d={d} stroke="#62234e" strokeWidth="15" pathLength="1"/>
     <path className="psych-ribbon" d={d} stroke={inks[i]} strokeWidth="5" pathLength="1"/>
     <path className="psych-ribbon fine" d={d} transform={`translate(${i%2?12:-12} 13)`} stroke="#fff0bc" strokeWidth="2" pathLength="1"/>
    </g>)}
   </g>
   {[0,1].map(side=><g key={side} transform={`translate(${side?830:610} 490) rotate(${side?18:-19})`}>
    {[0,1,2,3].map(i=><g key={i} className="psych-guitar" style={{'--i':i,'--lean':`${side?14:-14}deg`}}>
     <path d={guitar} stroke={inks[(i+side)%inks.length]} strokeWidth={i===0?4:2.5} pathLength="1"/>
     {i===0&&<g stroke="#fff0bc" strokeWidth="2"><circle cy="27" r="20"/><path d="M-20 92 H22 M-4-175 V90 M4-175 V90"/></g>}
    </g>)}
   </g>)}
   <g transform="translate(720 430)">
    {Array.from({length:24},(_,i)=><g key={i} transform={`rotate(${i*15+4})`}>
     <path className="psych-ray" style={{'--i':i%5}} d={`M${200+(i%3)*45} 0 Q430 ${i%2?35:-35} 900 ${i%2?65:-65}`} stroke={inks[i%inks.length]} strokeWidth={i%3===0?5:2} pathLength="1"/>
    </g>)}
   </g>
   {[[400,190],[1040,220],[520,730],[970,690],[710,120]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}>
    <path className="psych-star" style={{'--i':i}} d="M0-39 Q5-5 35-19 Q12 0 40 14 Q6 8 0 43 Q-5 9-37 20 Q-12 0-39-15 Q-7-5 0-39Z" stroke={inks[i]} strokeWidth="3"/>
   </g>)}
  </svg>
 </div>;
}
