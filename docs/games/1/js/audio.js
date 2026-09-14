'use strict';
/* ===== Звук: эффекты + генеративная музыка ===== */
let ctx=null,master=null,musicGain=null;
let sndOn=loadBool('krot_snd',true);
let musicOn=loadBool('krot_music',true);

function initAudio(){
  if(!ctx){
    try{
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      master=ctx.createGain();master.gain.value=sndOn?.5:0;master.connect(ctx.destination);
      musicGain=ctx.createGain();musicGain.gain.value=musicOn?.55:0;musicGain.connect(ctx.destination);
    }catch(e){}
    if(ctx){
      mNext=ctx.currentTime+.2;
      setInterval(musicTick,150);
    }
  }
  if(ctx&&ctx.state==='suspended')ctx.resume();
}
document.addEventListener('pointerdown',initAudio,{once:true});
document.addEventListener('pointerdown',()=>{if(ctx&&ctx.state==='suspended')ctx.resume()});

function setSndOn(v){sndOn=v;saveBool('krot_snd',v);if(master)master.gain.value=v?.5:0}
function setMusicOn(v){musicOn=v;saveBool('krot_music',v);if(musicGain)musicGain.gain.value=v?.55:0}

function tone(f1,f2,dur,type,vol,when=0){if(!ctx||!sndOn)return;const t=ctx.currentTime+when;
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(f2,1),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05)}

/* --- эффекты (старые) --- */
const sBoop=()=>tone(250,520,.12,'sine',.14);
const sBoing=()=>{tone(170,640,.13,'sine',.3);tone(640,130,.28,'sine',.28,.12)};
const sGiggle=()=>{[0,.09,.18,.27,.36].forEach((d,i)=>tone([800,950,830,980,1150][i],[850,1000,880,1030,1250][i],.07,'triangle',.13,d))};
const sSparkle=()=>{tone(1500,3000,.25,'sine',.07);tone(2000,3800,.2,'sine',.05,.08)};
const sWhoosh=()=>tone(430,150,.18,'sine',.09);
const sBye=()=>tone(700,950,.1,'triangle',.06);
const sDizzy=()=>{if(!ctx||!sndOn)return;const t=ctx.currentTime;const o=ctx.createOscillator(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();
  o.type='triangle';o.frequency.value=430;l.frequency.value=7;lg.gain.value=70;l.connect(lg);lg.connect(o.frequency);
  g.gain.setValueAtTime(.14,t);g.gain.exponentialRampToValueAtTime(.001,t+.7);o.connect(g);g.connect(master);o.start(t);l.start(t);o.stop(t+.75);l.stop(t+.75)};
const sSpin=()=>{tone(300,950,.22,'sine',.16);tone(950,320,.25,'sine',.14,.22);sSparkle()};
const sGolden=()=>{[659,784,988,1319].forEach((f,i)=>tone(f,f,.14,'triangle',.18,i*.09));sSparkle()};
const sJingle=()=>{[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,f,.16,'triangle',.17,i*.1))};

/* --- эффекты (новые) --- */
const sPop=()=>{tone(590,980,.07,'sine',.18);tone(1200,420,.05,'sine',.1,.02)};
const sBalloon=()=>{tone(640,90,.13,'square',.15);tone(1500,320,.06,'sine',.12,.01)};
const sChime=()=>{tone(1760,1760,.5,'sine',.1);tone(2637,2637,.6,'sine',.07,.06)};
const sFlyZip=()=>tone(500,1500,.18,'sine',.12);
const sHeart=()=>tone(880,1180,.12,'sine',.09);
const sFanfare=()=>{[523,659,784,1047].forEach((f,i)=>tone(f,f,.18,'triangle',.16,i*.13));tone(1319,1319,.4,'triangle',.14,.52)};
function sPurr(){if(!ctx||!sndOn)return;const t=ctx.currentTime;
  const o=ctx.createOscillator(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain(),f=ctx.createBiquadFilter();
  o.type='sawtooth';o.frequency.value=78;f.type='lowpass';f.frequency.value=320;
  l.frequency.value=9;lg.gain.value=.05;l.connect(lg);lg.connect(g.gain);
  g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(.16,t+.12);g.gain.exponentialRampToValueAtTime(.001,t+.95);
  o.connect(f);f.connect(g);g.connect(master);o.start(t);l.start(t);o.stop(t+1);l.stop(t+1)}
function chirp(){if(!ctx||!sndOn)return;const t=ctx.currentTime;
  [0,.08,.16].forEach(d=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=4300+Math.random()*300;
    g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.013,t+d+.01);g.gain.exponentialRampToValueAtTime(.001,t+d+.05);
    o.connect(g);g.connect(master);o.start(t+d);o.stop(t+d+.06)})}

/* ===== Музыка: нежная генеративная мелодия (пентатоника) ===== */
const NOTE=s=>261.63*Math.pow(2,s/12);
const PENT=[0,2,4,7,9,12,14,16,19,21,24];
const PROG=[0,-3,5,7]; /* C — Am — F — G */
let mStep=0,mNext=0,melI=4;

function pluck(f,t,v){
  const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();
  o.type='sine';o.frequency.value=f;
  o2.type='sine';o2.frequency.value=f*2.001;
  const g2=ctx.createGain();g2.gain.value=.3;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.75);
  o.connect(g);o2.connect(g2);g2.connect(g);g.connect(musicGain);
  o.start(t);o2.start(t);o.stop(t+.8);o2.stop(t+.8);
}
function pad(f,t,d){
  [f,f*1.5,f*2].forEach(fr=>{
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.value=fr;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.028,t+.45);g.gain.linearRampToValueAtTime(.014,t+d*.7);g.gain.linearRampToValueAtTime(0,t+d);
    o.connect(g);g.connect(musicGain);o.start(t);o.stop(t+d+.05);
  });
}
function musicTick(){
  if(!ctx)return;
  if(!musicOn||!G.started||G.paused){mNext=Math.max(mNext,ctx.currentTime+.1);return}
  const eighth=60/74/2;
  while(mNext<ctx.currentTime+.4){
    const stepInBar=mStep%8,bar=Math.floor(mStep/8),root=PROG[bar%4];
    if(stepInBar===0)pad(NOTE(root-12),mNext,eighth*8);
    const nightF=(typeof isNight==='function'&&isNight())?1:0;
    if(Math.random()>.42+nightF*.24){
      melI=clamp(melI+(Math.random()<.5?-1:1)*(Math.random()<.25?2:1),0,PENT.length-1);
      const f=NOTE(PENT[melI]+root);
      pluck(f,mNext,.085*(1-nightF*.4));
      if(stepInBar===4&&Math.random()<.3)pluck(f*2,mNext+eighth/2,.045);
    }
    mStep++;mNext+=eighth;
  }
}
