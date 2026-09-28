import React, {useEffect, useRef, useState} from 'react';
import {Disc3, Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward, Volume2, VolumeX} from 'lucide-react';

const formatTime = value => {
 const seconds = Number.isFinite(value) ? Math.floor(value) : 0;
 return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export default function MusicPlayer({tracks, selectedTrack, onTrackChange, playRequest}) {
 const audio = useRef(null);
 const [playing,setPlaying] = useState(false);
 const [time,setTime] = useState(0);
 const [duration,setDuration] = useState(0);
 const [volume,setVolume] = useState(.72);
 const [muted,setMuted] = useState(false);
 const [shuffle,setShuffle] = useState(false);
 const [repeat,setRepeat] = useState(false);
 const [error,setError] = useState('');
 const available = tracks.filter(track => track.audio);
 const index = available.findIndex(track => track.id === selectedTrack);
 const track = tracks.find(track => track.id === selectedTrack) ?? null;
 const pendingPlay=useRef(false);
 const play=()=>audio.current?.play().catch(err=>{if(err.name!=='AbortError')setError('Press play to try again');});

 function choose(nextIndex,autoplay=playing){
  if(!available.length)return;
  const normalized=(nextIndex+available.length)%available.length;
  pendingPlay.current=autoplay;
  if(available[normalized].id===selectedTrack){audio.current.currentTime=0;if(autoplay)play();return;}
  onTrackChange(available[normalized].id);
 }
 function step(direction){
  if(!available.length)return;
  if(shuffle&&available.length>1){
   let next=index;
   while(next===index)next=Math.floor(Math.random()*available.length);
   choose(next,true);
  }else choose(index+direction,true);
 }
 function toggle(){
  if(!track?.audio)return;
  setError('');
  if(audio.current.paused)play();
  else audio.current.pause();
 }
 useEffect(()=>{
  setPlaying(false);setTime(0);setDuration(0);setError('');
  if(track?.audio&&pendingPlay.current)play();
  pendingPlay.current=false;
 },[track?.id,track?.audio]);
 useEffect(()=>{if(playRequest&&track?.audio){setError('');audio.current.currentTime=0;play();}},[playRequest]);
 useEffect(()=>{if(audio.current){audio.current.volume=volume;audio.current.muted=muted;}},[volume,muted]);

 return <section className="music-player" aria-label="Music player">
  <audio ref={audio} src={track?.audio||undefined} preload="metadata" onError={()=>{setPlaying(false);setError('Audio unavailable');}} onPlay={()=>{setPlaying(true);setError('');}} onPause={()=>setPlaying(false)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onLoadedMetadata={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onEnded={()=>{if(repeat){audio.current.currentTime=0;play();}else step(1);}}/>
  <div className="player-track">
    <span className="player-art" aria-hidden="true">
        {track?.cover?<img src={track.cover} alt=""/>:<Disc3 size={19}/>}
        </span>
        <span>
            <strong>{track?.album ?? 'Play me!'}</strong>
            <small aria-live="polite">{error||(track&&!track.audio?'Audio coming soon':track?.artist)}
    </small>
    </span>
    </div>
  <div className="player-center">
   <div className="player-controls">
    <button className={shuffle?'active':''} onClick={()=>setShuffle(v=>!v)} aria-label="Shuffle" aria-pressed={shuffle} disabled={available.length<2}><Shuffle size={14}/></button>
    <button onClick={()=>step(-1)} aria-label="Previous track" disabled={!available.length}><SkipBack size={17}/></button>
    <button className="play-button" onClick={toggle} aria-label={playing?'Pause':'Play'} disabled={!track?.audio}>{playing?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}</button>
    <button onClick={()=>step(1)} aria-label="Next track" disabled={!available.length}><SkipForward size={17}/></button>
    <button className={repeat?'active':''} onClick={()=>setRepeat(v=>!v)} aria-label="Repeat track" aria-pressed={repeat} disabled={!track?.audio}><Repeat2 size={14}/></button>
   </div>
   <div className="player-progress"><span>{formatTime(time)}</span><input type="range" min="0" max={duration||0} step=".1" value={Math.min(time,duration||0)} aria-label="Seek" disabled={!duration||!!error} onChange={e=>{const next=Number(e.target.value);audio.current.currentTime=next;setTime(next);}}/><span>{formatTime(duration)}</span></div>
  </div>
  <div className="player-volume"><button onClick={()=>setMuted(v=>!v)} aria-label={muted?'Unmute':'Mute'}>{muted||volume===0?<VolumeX size={16}/>:<Volume2 size={16}/>}</button><input type="range" min="0" max="1" step=".01" value={volume} aria-label="Volume" onChange={e=>setVolume(Number(e.target.value))}/></div>
 </section>;
}
