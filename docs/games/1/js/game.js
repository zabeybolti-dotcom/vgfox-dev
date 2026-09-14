'use strict';
/* ===== Игра: норы, ловля, гладить, прогресс, шарики/пузыри/летуны/звездопад, UI ===== */
const holeLayer=()=>document.getElementById('holeLayer');
const fxLayer=()=>document.getElementById('fxLayer');
const scoreEl=()=>document.getElementById('score');

/* ================= НОРЫ ================= */
const HOLE_CFG=[
 {x:30,y:36,s:22,z:10},{x:70,y:34,s:22,z:10},
 {x:15,y:56,s:26,z:20},{x:50,y:58,s:26,z:20},{x:85,y:55,s:26,z:20},
 {x:26,y:80,s:30,z:30},{x:74,y:78,s:30,z:30}];
const holes=[];
function buildHoles(){
  HOLE_CFG.forEach((cfg,i)=>{
    const h=document.createElement('div');h.className='hole';
    h.style.cssText=`left:${cfg.x}%;top:${cfg.y}%;width:${cfg.s}vmin;aspect-ratio:1/0.72;z-index:${cfg.z}`;
    h.innerHTML=`${holeBack(i)}
     <div class="pet-clip"><div class="pet"></div></div>
     ${holeFront(i)}
     <div class="hit-area"></div>`;
    holeLayer().appendChild(h);
    const st={el:h,pet:h.querySelector('.pet'),isUp:false,isHit:false,petted:false,timer:null,holdT:null,golden:false,sparks:null,species:null};
    holes.push(st);
    h.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();
      hitAnimal(st);
      clearTimeout(st.holdT);
      st.holdT=setTimeout(()=>petAnimal(st),700);});
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>h.addEventListener(ev,()=>clearTimeout(st.holdT)));
  });
}
function headXY(st){const r=st.el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top-r.height*0.2}}

/* ================= СЧЁТ И РАДУГА ================= */
let score=0,spawnCount=0,lastHole=-1,rFill=0;
const RAINBOW_COLORS=['#ff5252','#ff9d47','#ffe066','#69f06d','#5cc9ff','#7c8bff','#c98bff'];

function buildRBar(){
  const bar=document.getElementById('rbar');
  RAINBOW_COLORS.forEach(c=>{
    const d=document.createElement('div');d.className='rdot';d.style.setProperty('--c',c);bar.appendChild(d);
  });
}
function renderRBar(prev,flashAll){
  document.querySelectorAll('#rbar .rdot').forEach((d,i)=>{
    const on=i<rFill;
    d.classList.toggle('on',on);
    if(on&&(i>=prev||flashAll)){d.classList.add('lit');setTimeout(()=>d.classList.remove('lit'),520)}
  });
}
function addScore(pts,x,y,gold){
  score+=pts;
  const se=scoreEl();se.textContent=score;
  se.classList.remove('bump');void se.offsetWidth;se.classList.add('bump');
  const prev=rFill;
  rFill+=pts;
  let n=0;
  while(rFill>=7){rFill-=7;n++}
  renderRBar(prev,n>0);
  if(n>0)celebrateRainbow();
}

function celebrateRainbow(){
  confetti(55);sJingle();sFanfare();showRainbow();
  if(NEW_QUEUE.length){
    const sp=NEW_QUEUE.shift();
    unlocked.push(sp);
    setTimeout(()=>showUnlock(sp),1100);
  }
}
function showUnlock(sp){
  const ov=document.getElementById('unlockOv');
  ov.innerHTML=`<div class="u-pet">${PETS[sp]}</div>
   <div class="u-txt"><div class="u-title">Новый друг! 🎉</div><div class="u-name">${PET_NAMES[sp]}</div></div>`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('show')));
  sSparkle();
  setTimeout(()=>{ov.classList.remove('show');setTimeout(()=>ov.innerHTML='',800)},4200);
}

/* ================= ЛОВЛЯ ЗВЕРЯТ ================= */
const REACTS=['react-giggle','react-boing','react-spin','react-dizzy'];
const EMOJIS={
 'react-giggle':['😄','💖','✨','🎵','⭐','🌸'],
 'react-boing':['⭐','💫','✨','😆','💥'],
 'react-spin':['💫','✨','⭐','🌀','😵‍💫'],
 'react-dizzy':['💫','⭐','😵‍💫','✨','🌟'],
 golden:['✨','⭐','💛','🌟','👑']};

/* мягкая сложность для трёхлетки */
function params(){const s=score;return{
  visible:Math.max(2300,3600-s*28),
  interval:Math.max(950,1500-s*22),
  maxUp:s<4?1:s<12?2:3}}

function spawnOne(){
  const free=holes.map((h,i)=>({h,i})).filter(o=>!o.h.isUp&&o.i!==lastHole);
  if(!free.length)return;
  const o=pick(free),st=o.h;lastHole=o.i;
  spawnCount++;
  const golden=spawnCount%9===5;
  st.golden=golden;st.isHit=false;st.petted=false;st.isUp=true;
  st.species=pick(unlocked);
  st.pet.innerHTML=PETS[st.species];
  const svg=st.pet.querySelector('svg');
  svg.style.setProperty('--bd',`-${rnd(0,4).toFixed(2)}s`);
  svg.style.setProperty('--bd2',`-${rnd(0,4).toFixed(2)}s`);
  svg.style.animationDuration=rnd(2.4,3.3).toFixed(2)+'s';
  st.pet.classList.toggle('golden',golden);
  if(golden){st.sparks=setInterval(()=>{const{x,y}=headXY(st);burst(x+rnd(-30,30),y+rnd(-15,20),['✨','⭐'],1,.6)},300)}
  requestAnimationFrame(()=>requestAnimationFrame(()=>st.el.classList.add('up')));
  sBoop();
  const p=params();
  const vt=golden?p.visible*.75:p.visible*rnd(.9,1.2);
  st.timer=setTimeout(()=>escapeAnimal(st),vt);
}

function escapeAnimal(st){
  if(!st.isUp||st.isHit)return;
  const svg=st.pet.querySelector('svg');
  if(svg)svg.classList.add('wave');
  sBye();sWhoosh();
  st.timer=setTimeout(()=>sink(st),560);
}

function sink(st){
  st.isUp=false;clearInterval(st.sparks);st.sparks=null;clearTimeout(st.holdT);
  st.el.classList.remove('up');
  puffs(st.el.getBoundingClientRect());sWhoosh();
  st.timer=setTimeout(()=>{st.pet.innerHTML='';st.pet.classList.remove('golden')},420);
}

function hitAnimal(st){
  if(!st.isUp||st.isHit)return;
  st.isHit=true;initAudio();
  const svg=st.pet.querySelector('svg');if(!svg)return;
  const react=pick(REACTS);
  svg.classList.add('happy',react);

  const{x,y}=headXY(st);
  const pts=st.golden?5:1;
  const list=st.golden?EMOJIS.golden:EMOJIS[react];
  burst(x,y,list,st.golden?16:11,st.golden?1.35:1);
  popup(x,y-10,st.golden?'+5 ⭐':'+1 ⭐',st.golden);

  if(react==='react-boing'){sBoing();setTimeout(sGiggle,120)}
  else if(react==='react-giggle'){sGiggle();sBoing()}
  else if(react==='react-spin'){sSpin()}
  else{sDizzy();setTimeout(sSparkle,200)}
  if(st.golden){setTimeout(sGolden,150);confetti(25)}

  addScore(pts,x,y,st.golden);
  if(navigator.vibrate)try{navigator.vibrate(st.golden?[25,40,25]:22)}catch(e){}

  clearTimeout(st.timer);
  st.timer=setTimeout(()=>sink(st),react==='react-dizzy'?1150:950);
}

/* гладим зверёнка: палец держим ~0.7с после тапа */
function petAnimal(st){
  if(!st.isUp||st.petted)return;
  const svg=st.pet.querySelector('svg');if(!svg)return;
  st.petted=true;
  svg.classList.add('happy');
  const{x,y}=headXY(st);
  burst(x,y,['❤️','💖','💗','💕'],8,.9);
  popup(x,y-34,'+1 ⭐');
  sPurr();sHeart();
  addScore(1,x,y,false);
}

function scheduleSpawn(){
  if(G.paused){setTimeout(scheduleSpawn,400);return}
  const up=holes.filter(h=>h.isUp).length;
  const p=params();
  if(up<p.maxUp)spawnOne();
  if(up<p.maxUp-1&&Math.random()<.3)setTimeout(()=>{if(!G.paused)spawnOne()},250);
  setTimeout(scheduleSpawn,p.interval*rnd(.8,1.25));
}

/* ================= ОСОБЫЕ СОБЫТИЯ: шарики, пузыри, летуны, звездопад ================= */
let specActive=0;
const canSpec=()=>G.started&&!G.paused&&specActive<8;
function trackSpec(el,durS){specActive++;setTimeout(()=>{if(el.parentNode)el.remove();specActive--},durS*1000+200)}

function spawnBalloon(){
  if(!canSpec())return;
  const el=document.createElement('div');el.className='balloon';
  const dur=rnd(13,19);
  el.style.cssText=`left:${rnd(8,80)}vw;--dur:${dur.toFixed(1)}s`;
  el.innerHTML=`<div class="sway">${balloonSVG(pick(BALLOON_COLORS))}</div>`;
  fxLayer().appendChild(el);
  trackSpec(el,dur);
  el.addEventListener('animationend',()=>el.remove());
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(el._p)return;el._p=1;
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.42;
    sBalloon();burst(cx,cy,['🎉','✨','🎊'],9,1);confetti(10);
    popup(cx,cy-8,'+2 ⭐');addScore(2,cx,cy,false);
    el.classList.add('popped');setTimeout(()=>el.remove(),260);
  });
}

function makeBubble(xvw){
  const el=document.createElement('div');el.className='bubble';
  const s=rnd(9,17),dur=rnd(9,14);
  el.style.cssText=`left:${xvw}vw;width:${s}vmin;height:${s}vmin;--dur:${dur.toFixed(1)}s`;
  el.innerHTML='<div class="bub-in"></div>';
  fxLayer().appendChild(el);
  trackSpec(el,dur);
  el.addEventListener('animationend',()=>el.remove());
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(el._p)return;el._p=1;
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    ringPop(cx,cy,r.width*1.5);sPop();
    burst(cx,cy,['✨','💧','🌟'],5,.7);popup(cx,cy,'+1 ⭐');
    addScore(1,cx,cy,false);
    el.remove();
  });
}
function spawnBubbles(){
  if(!canSpec()||isNight())return;
  const bx=rnd(12,78),n=4+Math.floor(rnd(0,3));
  for(let i=0;i<n;i++){
    setTimeout(()=>{if(G.started&&!G.paused)makeBubble(clamp(bx+rnd(-9,9),2,92))},i*rnd(280,650));
  }
}

function spawnFlyer(){
  if(!canSpec())return;
  const dir=Math.random()<.5?1:-1;
  const el=document.createElement('div');el.className='flyer';
  const dur=rnd(8,12);
  el.style.cssText=`top:${rnd(8,50)}vh;--dur:${dur.toFixed(1)}s;--x0:${dir===1?'-22vw':'108vw'};--x1:${dir===1?'108vw':'-22vw'}`;
  el.innerHTML=`<div class="bob"><div class="flip${dir===1?'':' fl'}">${FLYERS[pick(['bee','dragonfly','bird'])]}</div></div>`;
  fxLayer().appendChild(el);
  trackSpec(el,dur);
  el.addEventListener('animationend',()=>el.remove());
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(el._p)return;el._p=1;
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    sFlyZip();burst(cx,cy,['✨','💫','⭐'],7,.85);popup(cx,cy,'+1 ⭐');
    addScore(1,cx,cy,false);
    el.classList.add('caught');setTimeout(()=>el.remove(),380);
  });
}

function spawnFallingStar(){
  if(!canSpec()||!isNight())return;
  const el=document.createElement('div');el.className='fstar';
  const dur=rnd(6.5,9.5);
  el.style.cssText=`left:${rnd(6,88)}vw;--dur:${dur.toFixed(1)}s`;
  el.innerHTML=`<div class="sway">${STAR_SVG}</div>`;
  fxLayer().appendChild(el);
  trackSpec(el,dur);
  el.addEventListener('animationend',()=>el.remove());
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(el._p)return;el._p=1;
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    sChime();burst(cx,cy,['✨','⭐','🌟'],8,.9);popup(cx,cy,'+1 ⭐');
    addScore(1,cx,cy,false);
    el.classList.add('caught');setTimeout(()=>el.remove(),340);
  });
}

function startSpecials(){
  const loop=(fn,min,max,first)=>{const go=()=>{if(canSpec())fn();setTimeout(go,rnd(min,max)*1000)};setTimeout(go,first*1000)};
  loop(spawnBalloon,26,42,16);
  loop(spawnBubbles,20,36,9);
  loop(spawnFlyer,15,28,7);
  loop(spawnFallingStar,8,15,4);
}

/* ================= UI ================= */
function wireUI(){
  const musicBtn=document.getElementById('musicBtn'),sndBtn=document.getElementById('sndBtn'),fsBtn=document.getElementById('fsBtn');
  musicBtn.classList.toggle('off',!musicOn);
  sndBtn.classList.toggle('off',!sndOn);
  musicBtn.addEventListener('pointerdown',e=>{e.stopPropagation();initAudio();setMusicOn(!musicOn);musicBtn.classList.toggle('off',!musicOn)});
  sndBtn.addEventListener('pointerdown',e=>{e.stopPropagation();initAudio();setSndOn(!sndOn);sndBtn.classList.toggle('off',!sndOn)});
  fsBtn.addEventListener('pointerdown',e=>{
    e.stopPropagation();
    try{
      if(!document.fullscreenElement&&!document.webkitFullscreenElement){
        (document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen||function(){}).call(document.documentElement);
      }else{
        (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);
      }
    }catch(err){}
  });
}

document.addEventListener('visibilitychange',()=>{G.paused=document.hidden});

/* ================= СТАРТ (без стартового экрана — игра идёт сразу) ================= */
buildDecor();
buildStars();
buildHoles();
buildRBar();
initScenery();
wireUI();
G.started=true;
document.getElementById('intro').classList.add('run');
setTimeout(scheduleSpawn,700);
startSpecials();
startLeafLoop();
