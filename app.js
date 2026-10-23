'use strict';
const $ = id => document.getElementById(id);
const sample = `Every great story starts with a simple idea.

A moment of curiosity. A different perspective. The courage to say something that matters.

You don’t have to be perfect. You just have to be present.

Take a breath. Find your pace. Let the words do their work.

This is your moment.

And you’re ready for it.`;
let running=false, frame=0, last=0, timer=null, wake=null, saveTimer;
const viewport=$('viewport');
try { const saved=JSON.parse(localStorage.getItem('cue-script-v1') || 'null'); $('script').value=typeof saved?.text==='string'?saved.text:sample; if(typeof saved?.title==='string') $('title').value=saved.title; } catch { $('script').value=sample; $('saved').textContent='Device storage unavailable'; }
function notify(text){$('status').textContent=text;}
function persist(){try{localStorage.setItem('cue-script-v1',JSON.stringify({title:$('title').value,text:$('script').value}));$('saved').textContent='Saved on device';}catch{$('saved').textContent='Not saved — export a copy';}}
function progress(){const max=viewport.scrollHeight-viewport.clientHeight;const percent=max>0?Math.min(100,Math.round(viewport.scrollTop/max*100)):0;$('position').textContent=percent+'%';$('progress').style.width=percent+'%';}
function render(){ $('reading').textContent=$('script').value || 'Your words go here. Add a script below to begin.';const words=$('script').value.trim().split(/\s+/).filter(Boolean).length;$('words').textContent=words+' words';$('duration').textContent='~'+Math.max(1,Math.ceil(words/130))+' min at 130 wpm';progress();}
async function acquireWake(){try{if('wakeLock' in navigator){const lock=await navigator.wakeLock.request('screen');if(running)wake=lock;else await lock.release();}}catch{/* Playback works without screen wake lock. */}}
function stop(){document.dispatchEvent(new Event("cue:pause"));running=false;cancelAnimationFrame(frame);clearInterval(timer);timer=null;$('countdown').hidden=true;$('play').textContent='▶ Resume';$('mode').textContent='PAUSED';$('dot').classList.remove('active');if(wake){wake.release().catch(()=>{});wake=null;}}
function step(now){if(!running)return;if(last)viewport.scrollTop+=Number($('speed').value)*Math.min((now-last)/1000,.1);last=now;progress();if(viewport.scrollTop>=viewport.scrollHeight-viewport.clientHeight-1){stop();$('mode').textContent='THAT’S A WRAP';$('play').textContent='↺ Read again';return;}frame=requestAnimationFrame(step);}
function begin(){document.dispatchEvent(new Event("cue:begin"));timer=null;$('countdown').hidden=true;running=true;last=0;$('play').textContent='Ⅱ Pause';$('mode').textContent='YOU’RE ON A ROLL';$('dot').classList.add('active');acquireWake();frame=requestAnimationFrame(step);}
function play(){if(running||timer){stop();return;}if(!$('script').value.trim()){notify('Add a script before starting.');$('script').focus();return;}if(viewport.scrollTop>=viewport.scrollHeight-viewport.clientHeight-1)viewport.scrollTop=0;let n=Number($('delay').value);if(!n){begin();return;}$('countdown').textContent=n;$('countdown').hidden=false;$('play').textContent='■ Cancel';$('mode').textContent='GET READY';timer=setInterval(()=>{n--;if(n<=0){clearInterval(timer);begin();}else $('countdown').textContent=n;},1000);}
$('play').addEventListener('click',play);
$('reset').addEventListener('click',()=>{stop();viewport.scrollTop=0;progress();$('play').textContent='▶ Start reading';$('mode').textContent='READY WHEN YOU ARE';});
$('mirror').addEventListener('click',()=>{const on=$('mirror').getAttribute('aria-pressed')!=='true';$('mirror').setAttribute('aria-pressed',String(on));$('reading').classList.toggle('mirrored',on);});
function focusMode(on){document.body.classList.toggle('focus',on);$('exit').hidden=!on;requestAnimationFrame(progress);}
$('focus').addEventListener('click',()=>focusMode(true));$('exit').addEventListener('click',()=>focusMode(false));
function settings(){const ratio=viewport.scrollTop/Math.max(1,viewport.scrollHeight-viewport.clientHeight);$('reading').style.fontSize=$('size').value+'px';$('size-value').textContent=$('size').value+' px';$('speed-value').textContent=$('speed').value+' px/s';viewport.scrollTop=ratio*(viewport.scrollHeight-viewport.clientHeight);progress();}
for(const id of ['size','speed'])$(id).addEventListener('input',settings);
$('script').addEventListener('input',()=>{stop();render();clearTimeout(saveTimer);saveTimer=setTimeout(persist,250);});$('title').addEventListener('input',persist);
viewport.addEventListener('scroll',progress,{passive:true});viewport.addEventListener('pointerdown',()=>{if(running||timer)stop();});viewport.addEventListener('wheel',()=>{if(running||timer)stop();},{passive:true});
$('import').addEventListener('click',()=>$('file').click());$('file').addEventListener('change',async()=>{const file=$('file').files[0];if(!file)return;if(file.size>500000){notify('Please choose a text file smaller than 500 KB.');$('file').value='';return;}try{const text=await file.text();stop();$('script').value=text;$('title').value=file.name.replace(/\.txt$/i,'');render();viewport.scrollTop=0;persist();notify('Script imported.');}catch{notify('Unable to read this file.');}$('file').value='';});
$('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([$ ('script').value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=($('title').value.replace(/[^a-z0-9 _-]/gi,'').trim()||'cue-script')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){focusMode(false);stop();return;}if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();play();}if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();$('speed').value=Math.max(10,Math.min(120,Number($('speed').value)+(e.key==='ArrowRight'?5:-5)));settings();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||timer))stop();});window.addEventListener('pagehide',persist);window.addEventListener('resize',progress);render();settings();

