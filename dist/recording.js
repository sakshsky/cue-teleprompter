'use strict';
(() => {
  const el = id => document.getElementById(id);
  let stream=null, recorder=null, pending=false, opening=false, finalizing=false;
  let elapsedTimer=null, started=0, count=0;
  const urls=[];
  const message=text => { el('record-status').textContent=text; };
  const active=()=>recorder && recorder.state!=='inactive';
  function controls(){
    el('camera').disabled=opening || !!stream || finalizing;
    el('facing').disabled=opening || !!stream || finalizing;
    el('record').disabled=!stream || active() || pending || finalizing;
    el('record-stop').disabled=!(active() || pending);
    el('camera-off').disabled=opening || !stream || finalizing;
  }
  function release(){if(stream)stream.getTracks().forEach(track=>track.stop());stream=null;el('camera-preview').srcObject=null;el('camera-preview').hidden=true;controls();}
  function finish(){
    pending=false;
    if(active()){finalizing=true;recorder.stop();message('Preparing your video…');}
    clearInterval(elapsedTimer); stop(); controls();
  }
  function saveTake(chunks, type){
    if(!chunks.length){message('No video was captured. Please try again.');return;}
    const blob=new Blob(chunks,{type});const url=URL.createObjectURL(blob);urls.push(url);
    const box=document.createElement('article');box.className='take';
    const heading=document.createElement('p');heading.textContent=`Take ${++count} · ${(blob.size/1048576).toFixed(1)} MB`;
    const video=document.createElement('video');video.controls=true;video.playsInline=true;video.src=url;
    const link=document.createElement('a');link.href=url;link.download=`cue-take-${Date.now()}.${type.includes('mp4')?'mp4':'webm'}`;link.textContent='↓ Download video';
    box.append(heading,video,link);el('takes').prepend(box);
    message('Take ready. Preview below and download to keep it.');
  }
  el('camera').addEventListener('click',async()=>{
    if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){message('Recording needs a supported browser on HTTPS or localhost. Open the hosted app in Safari or Chrome.');return;}
    opening=true;controls();message('Allow camera and microphone access in your browser.');
    try{
      const result=await navigator.mediaDevices.getUserMedia({audio:true,video:{facingMode:{ideal:el('facing').value},width:{ideal:1280},height:{ideal:720}}});
      if(document.hidden){result.getTracks().forEach(t=>t.stop());message('Camera request cancelled because the app is hidden.');return;}
      stream=result;el('camera-preview').srcObject=stream;el('camera-preview').hidden=false;
      el('camera-preview').style.transform=el('facing').value==='user'?'scaleX(-1)':'none';
      for(const track of stream.getTracks())track.addEventListener('ended',()=>{finish();release();message('Camera or microphone disconnected. Any captured take will appear below.');});
      await el('camera-preview').play().catch(()=>{});message('Camera ready. Record & read starts after your selected countdown.');
    }catch(error){release();message(error.name==='NotAllowedError'?'Camera or microphone permission denied. Allow both in your browser’s site settings and try again.':'Unable to open camera and microphone. Check that they are connected and not in use by another app.');}
    finally{opening=false;controls();}
  });
  el('record').addEventListener('click',()=>{
    if(!stream || active() || finalizing)return;
    if(!el('script').value.trim()){message('Add a script before recording.');return;}
    stop();pending=true;controls();message('Get ready — recording begins with the scrolling text.');play();
  });
  document.addEventListener('cue:pause',()=>{if(pending){pending=false;message('Recording countdown cancelled.');controls();}});
  document.addEventListener('cue:begin',()=>{
    if(!pending)return;pending=false;
    const chunks=[];
    try{
      const mime=['video/webm;codecs=vp8,opus','video/mp4','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
      const current=new MediaRecorder(stream,mime?{mimeType:mime}:{});recorder=current;
      current.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      current.onstop=()=>{clearInterval(elapsedTimer);finalizing=false;saveTake(chunks,current.mimeType || chunks[0]?.type || 'video/webm');recorder=null;controls();};
      current.onerror=()=>{message('Recording was interrupted. Recovering available video…');finish();};
      current.start(1000);started=Date.now();message('● REC 00:00 — camera and microphone recording');
      elapsedTimer=setInterval(()=>{const seconds=Math.floor((Date.now()-started)/1000);message(`● REC ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')} — camera and microphone recording`);if(seconds>=600)finish();},500);
    }catch{message('This browser could not start recording. Try the app in Safari or Chrome.');}
    controls();
  });
  el('record-stop').addEventListener('click',finish);
  el('camera-off').addEventListener('click',()=>{finish();release();if(!finalizing)message('Camera and microphone are off.');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && stream){finish();release();}});
  window.addEventListener('beforeunload',e=>{if(active() || urls.length){e.preventDefault();e.returnValue='';}});
  window.addEventListener('pagehide',()=>{finish();release();urls.forEach(url=>URL.revokeObjectURL(url));});
  controls();
})();
