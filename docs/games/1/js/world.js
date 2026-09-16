'use strict';
/* ===== Живой мир: цикл дня и ночи, звёзды, светлячки, листочки ===== */
const CYCLE=210;             /* полный цикл, секунд */
const CYCLE_MULT=FAST?14:1;  /* ускорение для отладки (?fast) */
let cycleT=0.05;             /* 0..1, старт — утро */
let curStars=0;

/* опорные точки неба: t, цвет верха, цвет низа, затемнение, звёзды */
/* ночь короткая и мягкая: лёгкие сумерки, экран не темнеет сильно */
const SKY_STOPS=[
  {t:0.00,s1:'#7ec8f2',s2:'#d7eefb',tint:0,   stars:0},
  {t:0.60,s1:'#8ecdf2',s2:'#eaf7fe',tint:0,   stars:0},
  {t:0.66,s1:'#ff9d6f',s2:'#ffe0b0',tint:.06, stars:.05},
  {t:0.72,s1:'#5f6fba',s2:'#9aa8e6',tint:.18, stars:.9},
  {t:0.75,s1:'#5767b2',s2:'#8d9ce0',tint:.20, stars:1},
  {t:0.82,s1:'#5767b2',s2:'#8d9ce0',tint:.20, stars:1},
  {t:0.88,s1:'#8fb0e8',s2:'#ffd3dd',tint:.10, stars:.3},
  {t:1.00,s1:'#7ec8f2',s2:'#d7eefb',tint:0,   stars:0}
];

function skyState(t){
  let a=SKY_STOPS[0],b=SKY_STOPS[SKY_STOPS.length-1];
  for(let i=0;i<SKY_STOPS.length-1;i++){
    if(t>=SKY_STOPS[i].t&&t<=SKY_STOPS[i+1].t){a=SKY_STOPS[i];b=SKY_STOPS[i+1];break}
  }
  const k=(t-a.t)/Math.max(b.t-a.t,1e-6);
  return{s1:mixColor(a.s1,b.s1,k),s2:mixColor(a.s2,b.s2,k),tint:lerp(a.tint,b.tint,k),stars:lerp(a.stars,b.stars,k)};
}

const isNight=()=>curStars>.5;

function buildStars(){
  const box=$('#stars');
  for(let i=0;i<44;i++){
    const s=document.createElement('div');s.className='star';
    const sz=rnd(1.6,3.4);
    s.style.cssText=`left:${rnd(0,100)}%;top:${rnd(0,72)}%;width:${sz}px;height:${sz}px;--td:${rnd(1.8,3.6).toFixed(1)}s;--bd:-${rnd(0,3).toFixed(1)}s`;
    box.appendChild(s);
  }
  for(let i=0;i<5;i++){
    const s=document.createElement('div');s.className='star spark';
    const sz=rnd(10,17);
    s.style.cssText=`left:${rnd(4,94)}%;top:${rnd(3,45)}%;width:${sz}px;height:${sz}px;--td:${rnd(2.4,4).toFixed(1)}s;--bd:-${rnd(0,3).toFixed(1)}s`;
    box.appendChild(s);
  }
}

/* --- светлячки --- */
let firefliesOn=false;
function makeFireflies(){
  const layer=$('#fxLayer');
  for(let i=0;i<9;i++){
    const f=document.createElement('div');f.className='firefly';
    const pt=()=>`${rnd(-70,70).toFixed(0)}px`;
    f.style.cssText=`left:${rnd(4,94)}%;top:${rnd(26,88)}%;--fd:${rnd(6,11).toFixed(1)}s;--fb:-${rnd(0,1.6).toFixed(1)}s;--x1:${pt()};--y1:${pt()};--x2:${pt()};--y2:${pt()};--x3:${pt()};--y3:${pt()};--x4:${pt()};--y4:${pt()}`;
    layer.appendChild(f);
  }
  firefliesOn=true;
}
function clearFireflies(){
  document.querySelectorAll('.firefly').forEach(f=>f.remove());
  firefliesOn=false;
}

function updateScenery(){
  cycleT=(cycleT+0.4/CYCLE*CYCLE_MULT)%1;
  const st=skyState(cycleT);
  curStars=st.stars;
  const R=document.documentElement.style;
  R.setProperty('--sky1',st.s1);
  R.setProperty('--sky2',st.s2);
  R.setProperty('--tintOp',st.tint.toFixed(2));
  R.setProperty('--starsOp',st.stars.toFixed(2));

  /* солнце: день 0..0.65 */
  const sun=$('#sun');
  if(cycleT<0.65){
    const p=cycleT/0.65;
    sun.style.left=(8+84*p)+'%';
    sun.style.top=(30-Math.sin(p*Math.PI)*24)+'%';
    sun.style.opacity=clamp(Math.sin(p*Math.PI)*4,0,1);
  }else sun.style.opacity=0;

  /* луна: ночь 0.68..0.90 */
  const moon=$('#moon');
  if(cycleT>0.68&&cycleT<0.90){
    const p=(cycleT-0.68)/0.22;
    moon.style.left=(10+78*p)+'%';
    moon.style.top=(32-Math.sin(p*Math.PI)*24)+'%';
    moon.style.opacity=clamp(Math.sin(p*Math.PI)*4,0,1)*clamp(st.stars*1.2,0,1);
  }else moon.style.opacity=0;

  if(st.stars>.6&&!firefliesOn)makeFireflies();
  if(st.stars<.45&&firefliesOn)clearFireflies();

  /* сверчки ночью */
  if(st.stars>.7&&Math.random()<.4&&G.started)chirp();
}

function initScenery(){updateScenery();setInterval(updateScenery,400)}

/* --- кружащиеся листочки (днём) --- */
let leafCount=0;
function spawnLeaf(){
  if(leafCount>=6)return;
  leafCount++;
  const el=document.createElement('div');el.className='leaf';
  const dur=rnd(8,13);
  el.style.cssText=`left:${rnd(3,94)}vw;--dur:${dur.toFixed(1)}s`;
  el.innerHTML=`<div class="sway">${leafSVG(pick(LEAF_COLORS))}</div>`;
  $('#fxLayer').appendChild(el);
  el.addEventListener('animationend',()=>{el.remove();leafCount--});
  setTimeout(()=>{if(el.parentNode){el.remove();leafCount--}},(dur+1)*1000);
}
function startLeafLoop(){
  const go=()=>{if(G.started&&!G.paused&&!isNight())spawnLeaf();setTimeout(go,rnd(6,13)*1000)};
  setTimeout(go,3000);
}
