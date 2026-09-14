/* ═══════════ Катись, шарик! v2 — звук ═══════════
   Всё генерируется WebAudio: нежная фоновая музыка + SFX. Без файлов. */
window.Aud=(()=>{
"use strict";
let AC=null,sfxG=null,musG=null,muted=false,mood=0; // mood: 0 день 1 закат 2 ночь 3 рассвет
let schedTimer=null,nextT=0,step=0,melIdx=4;

// пентатоника C мажор, 2 октавы
const SCALE=[261.63,293.66,329.63,392.00,440.00,523.25,587.33,659.25,783.99,880.00];
const CHORDS=[[130.81,164.81,196.00],[110.00,130.81,164.81],[87.31,110.00,130.81],[98.00,123.47,146.83]];

function init(){
 if(AC){if(AC.state==='suspended')AC.resume();return}
 try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
 sfxG=AC.createGain();sfxG.gain.value=.9;sfxG.connect(AC.destination);
 musG=AC.createGain();musG.gain.value=.55;musG.connect(AC.destination);
 nextT=AC.currentTime+.1;
 schedTimer=setInterval(schedule,60);
}
function setMuted(m){muted=m;
 if(musG)musG.gain.value=m?0:.55;
 if(sfxG)sfxG.gain.value=m?0:.9;}

/* базовый тон */
function tone(f0,f1,d,type,vol,dest){
 if(!AC||muted)return;
 const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
 o.type=type||'sine';
 o.frequency.setValueAtTime(Math.max(20,f0),t);
 o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+d);
 g.gain.setValueAtTime(vol,t);
 g.gain.exponentialRampToValueAtTime(.0008,t+d);
 o.connect(g);g.connect(dest||sfxG);o.start(t);o.stop(t+d+.02);}
function toneAt(t,f0,f1,d,type,vol){
 const o=AC.createOscillator(),g=AC.createGain();
 o.type=type||'sine';
 o.frequency.setValueAtTime(Math.max(20,f0),t);
 o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+d);
 g.gain.setValueAtTime(0,t);
 g.gain.linearRampToValueAtTime(vol,t+.02);
 g.gain.exponentialRampToValueAtTime(.0008,t+d);
 o.connect(g);g.connect(musG);o.start(t);o.stop(t+d+.05);}

/* ── генеративная музыка: мягкое пентатоническое блуждание + пад-аккорды ── */
function schedule(){
 if(!AC||AC.state!=='running')return;
 const STEP=60/72/2;               // 8-я при 72 BPM
 while(nextT<AC.currentTime+.16){
  const night=mood===2,sunset=mood===1;
  const chance=night?.34:sunset?.55:.66;
  if(Math.random()<chance){        // мелодия
   melIdx=Math.max(0,Math.min(SCALE.length-1,melIdx+((Math.random()*5)|0)-2));
   let f=SCALE[melIdx];
   if(night&&Math.random()<.5)f/=2;
   const vol=night?.035:.05;
   toneAt(nextT,f,f*1.001,.5,'sine',vol);
   if(Math.random()<.3)toneAt(nextT+.02,f*1.5,f*1.5,.4,'sine',vol*.5); // квинта
  }
  if(step%8===0){                  // пад каждые 2 такта
   const ch=CHORDS[(step/8)%4|0];
   for(const f of ch)pad(nextT,f,STEP*16);
  }
  step++;nextT+=STEP;
 }}
function pad(t,f,d){
 const o1=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),fl=AC.createBiquadFilter();
 o1.type='triangle';o2.type='triangle';
 o1.frequency.value=f;o2.frequency.value=f*1.004;
 fl.type='lowpass';fl.frequency.value=560;
 g.gain.setValueAtTime(0,t);
 g.gain.linearRampToValueAtTime(.03,t+d*.3);
 g.gain.linearRampToValueAtTime(0,t+d);
 o1.connect(fl);o2.connect(fl);fl.connect(g);g.connect(musG);
 o1.start(t);o2.start(t);o1.stop(t+d+.05);o2.stop(t+d+.05);}

/* ── SFX ── */
const R=(a,b)=>a+Math.random()*(b-a);
const SFX={
 lane(){tone(430,660,.07,'sine',.08)},
 ui(){tone(500,720,.06,'sine',.1)},
 pop(pitch){const p=pitch||900*R(.9,1.1);
  tone(p*.8,p*1.35,.12,'sine',.2);tone(p*1.25,p*1.9,.09,'sine',.1)},
 croak(){tone(300,180,.14,'square',.06);tone(150,90,.16,'sine',.12)},
 bubble(){tone(620,140,.06,'sine',.16);tone(1500,1100,.03,'sine',.07)},
 butterfly(){tone(880,1200,.07,'sine',.14);
  setTimeout(()=>tone(1200,1650,.08,'sine',.12),70)},
 star(){const k=R(.92,1.1);tone(1000*k,1500*k,.09,'sine',.14);
  setTimeout(()=>tone(1450*k,1950*k,.09,'sine',.12),55)},
 power(){tone(600,1600,.25,'sine',.18);setTimeout(()=>tone(900,2000,.2,'sine',.16),100)},
 bonk(){tone(300,90,.15,'square',.16);tone(450,140,.18,'sine',.12)},
 celebrate(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,f*1.02,.16,'sine',.14),i*80))},
 fanfare(){[523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>tone(f,f*1.01,.2,'triangle',.16),i*90))},
 skin(){[659,784,988,1319].forEach((f,i)=>setTimeout(()=>tone(f,f*1.02,.14,'sine',.15),i*70))},
 jump(){tone(320,950,.32,'sine',.18);tone(480,1200,.3,'sine',.08)},
 land(){tone(170,70,.09,'sine',.2)},
 boost(){tone(240,1300,.3,'sawtooth',.06);tone(380,1600,.3,'sine',.09)},
 magnet(){tone(440,448,.45,'sine',.1);tone(660,655,.45,'triangle',.05);
  setTimeout(()=>tone(880,860,.3,'sine',.06),120)},
 gold(){[880,1108,1318,1760].forEach((f,i)=>setTimeout(()=>tone(f,f*1.01,.1,'sine',.12),i*60))},
 dodge(){tone(1200,1650,.07,'sine',.1)},
 hello(){tone(1000,1400,.08,'sine',.12);setTimeout(()=>tone(1300,1750,.09,'sine',.1),80)},
};
return{init,setMuted,
 get muted(){return muted},
 setMood(m){mood=m},
 sfx(n,arg){if(!muted)SFX[n](arg)}};
})();
