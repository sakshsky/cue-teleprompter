const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(deny=false){
 const nodes=new Map(),events={};let stopped=0,recordings=0;
 function node(){return {value:'hello',hidden:false,style:{},children:[],addEventListener(n,fn){this[n]=fn;},append(...v){this.children.push(...v);},prepend(v){this.children.unshift(v);},play:async()=>{}};}
 const document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node,addEventListener(n,fn){events[n]=fn;}};
 const track={stop(){stopped++;},addEventListener(){}};
 const stream={getTracks:()=>[track,track]};
 class Recorder{static isTypeSupported(t){return t.includes('webm');}constructor(){this.state='inactive';this.mimeType='video/webm';}start(){this.state='recording';recordings++;}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['video'])});this.onstop();}}
 const context={document,window:{isSecureContext:true,MediaRecorder:Recorder,addEventListener(){}},navigator:{mediaDevices:{getUserMedia:async()=>{if(deny)throw {name:'NotAllowedError'};return stream;}}},MediaRecorder:Recorder,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Date,setInterval:()=>1,clearInterval(){},stop(){events['cue:pause']?.();},play(){events['cue:begin']?.();}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/dist/recording.js','utf8'),context);
 return {nodes,events,document,get stopped(){return stopped;},get recordings(){return recordings;}};
}
test('camera, recording, preview and download lifecycle',async()=>{const s=setup();await s.nodes.get('camera').click();assert.equal(s.nodes.get('record').disabled,false);s.nodes.get('record').click();assert.equal(s.recordings,1);s.nodes.get('record-stop').click();const take=s.nodes.get('takes').children[0];assert.equal(take.children[2].download.endsWith('.webm'),true);assert.equal(s.nodes.get('record-stop').disabled,true);s.nodes.get('camera-off').click();assert.equal(s.stopped,2);});
test('denied camera access leaves recording disabled with actionable message',async()=>{const s=setup(true);await s.nodes.get('camera').click();assert.match(s.nodes.get('record-status').textContent,/permission denied/);assert.equal(s.nodes.get('record').disabled,true);});
test('hiding the page finalizes a take and releases camera and microphone',async()=>{const s=setup();await s.nodes.get('camera').click();s.nodes.get('record').click();s.document.hidden=true;s.events.visibilitychange();assert.equal(s.nodes.get('takes').children.length,1);assert.equal(s.stopped,2);});
