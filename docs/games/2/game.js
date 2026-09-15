/* ═══════════════════════════════════════════════════════════════
   КАТИСЬ, ШАРИК! v2 — раннер для малышей 2–3 лет
   Canvas 2D, вся графика и звук процедурные, без зависимостей.

   Системы: биомы (день/закат/ночь/рассвет), 6 звериков с уникальными
   силуэтами, трамплины + прыжок, ускорители + отпрыгивающие зверики,
   режимы магнит/×2/радуга, звёздные паттерны, друзья на обочине,
   бабочки, счёт звёзд, скины шара, музыка, пауза.
   ═══════════════════════════════════════════════════════════════ */
(()=>{
"use strict";

/* ═══════════ КОНФИГ ═══════════ */
const VW=400,VH=720;
const ROAD_W=272,CX=VW/2,SIDE=(VW-ROAD_W)/2;
const BALL_Y=586,BALL_R=31;
const SPD0=195,SPD_MAX=340,BOUNCE_V=-250;
const CYCLE=45,TRANS=4;                          // сек на биом / на переход
const GRAV=1350,JUMP_V=-720;                     // физика прыжка (высокий и дальний)

const clamp01=v=>v<0?0:v>1?1:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const hash=n=>{const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s)};
const laneX=lane=>CX+(lane-1)*ROAD_W/3;

/* ═══════════ ХРАНИЛИЩЕ ═══════════ */
const LS={
 get(k,d){try{const v=localStorage.getItem('br_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem('br_'+k,JSON.stringify(v))}catch(e){}}
};

/* ═══════════ CANVAS ═══════════ */
const cv=document.getElementById('c'),cx=cv.getContext('2d');
let scl=1,offX=0,offY=0,dpr=1;
function resize(){
 dpr=Math.min(2,window.devicePixelRatio||1);
 cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);
 cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';
 scl=Math.min(cv.width/VW,cv.height/VH);
 offX=(cv.width-VW*scl)/2;offY=(cv.height-VH*scl)/2;
}
addEventListener('resize',resize);addEventListener('orientationchange',resize);resize();
const toVirt=(px,py)=>({x:(px*dpr-offX)/scl,y:(py*dpr-offY)/scl});

/* ═══════════ ЦВЕТА ═══════════ */
const hexCache={};
function hex2rgb(h){if(hexCache[h])return hexCache[h];
 const n=parseInt(h.slice(1),16);
 return hexCache[h]=[n>>16&255,n>>8&255,n&255];}
function mix(a,b,t){
 if(t<=0)return a;if(t>=1)return b;
 const A=hex2rgb(a),B=hex2rgb(b);
 return `rgb(${Math.round(lerp(A[0],B[0],t))},${Math.round(lerp(A[1],B[1],t))},${Math.round(lerp(A[2],B[2],t))})`;}

/* ═══════════ БИОМЫ (настроение мира) ═══════════ */
const BIOMES=[
{ // ☀ день
 grass:['#82D07F','#5FB35C','#4E9E4F'],speck:'#2E7D32',tree:'#4E9E50',
 pathE:'#CBB98B',path:['#EBDCB4','#F9F0D2'],dot:'#8a7a55',dash:'rgba(150,130,85,.42)',
 night:0,amb:'petals'},
{ // 🌇 закат
 grass:['#A9CD6F','#84B458','#6FA24C'],speck:'#4C7A33',tree:'#7D5B94',
 pathE:'#D4BC8E',path:['#F2E2B6','#FBF0CC'],dot:'#96824f',dash:'rgba(160,135,80,.45)',
 night:.12,amb:'leaves'},
{ // 🌙 ночь
 grass:['#3E7A5E','#2F6650','#285747'],speck:'#173D30',tree:'#26355E',
 pathE:'#9AA6CE',path:['#C7CFEA','#E2E8F5'],dot:'#7c88b5',dash:'rgba(190,200,235,.4)',
 night:1,amb:'fireflies'},
{ // 🌅 рассвет
 grass:['#8FD489','#6FBF6F','#5CAE5E'],speck:'#3E8E41',tree:'#8A6280',
 pathE:'#D4BC94',path:['#F0E2B8','#FBF2D4'],dot:'#8f7d4f',dash:'rgba(150,130,85,.42)',
 night:.06,amb:'dew'}
];
function blendPal(){
 const ph=G.worldTime/CYCLE;
 const i0=Math.floor(ph)%4,i1=(i0+1)%4,loc=ph-Math.floor(ph);
 const t=loc>CYCLE-TRANS?clamp01((loc-(CYCLE-TRANS))/TRANS):0;
 const A=BIOMES[i0],B=BIOMES[i1],k=t*t*(3-2*t);
 return{
  grass:[mix(A.grass[0],B.grass[0],k),mix(A.grass[1],B.grass[1],k),mix(A.grass[2],B.grass[2],k)],
  speck:mix(A.speck,B.speck,k),tree:mix(A.tree,B.tree,k),
  pathE:mix(A.pathE,B.pathE,k),
  path:[mix(A.path[0],B.path[0],k),mix(A.path[1],B.path[1],k)],
  dot:mix(A.dot,B.dot,k),dash:B.dash,
  night:lerp(A.night,B.night,k),amb:k<.5?A.amb:B.amb};
}

/* ═══════════ ЗВЕРИКИ — 6 видов ═══════════
   Готовые профессиональные ассеты: системные эмодзи-шрифты
   (Noto Color Emoji на Android / Segoe UI Emoji на Windows) —
   рендерятся 1 раз в спрайт-кэш, анимация живая: прыжки,
   покачивание, радостное кувыркание при столкновении. */
const SPECIES={
 bunny:{em:'🐰',size:76,pitch:980,conf:['#FFFDF6','#FFB7C9','#E8E4DC'],hop:true},
 bear:{em:'🐻',size:82,pitch:520,conf:['#E3C8A4','#B98A5F','#FFD93D']},
 fox:{em:'🦊',size:82,pitch:760,conf:['#F08C3C','#FBC98F','#FF6B4A']},
 frog:{em:'🐸',size:80,pitch:1150,conf:['#C8ECB0','#7CC95E','#FFD93D'],hop:true},
 chick:{em:'🐥',size:70,pitch:1350,conf:['#FFF3B0','#FFD54F','#FF9F43']},
 owl:{em:'🦉',size:80,pitch:640,conf:['#D7C8F0','#B39DDB','#FFB300']}
};
const SP_NAMES=Object.keys(SPECIES);

/* ═══════════ СКИНЫ ШАРА ═══════════ */
const SKINS=[
 {main:'#E53935',dark:'#C62828'},
 {main:'#3F8EF7',dark:'#2668C4'},
 {main:'#53B84B',dark:'#3B8F3A'},
 {main:'#F7C948',dark:'#D9A418'},
 {main:'#9C5BD1',dark:'#7A3FB0'},
 null]; // 5 = радужный
const SKIN_THRESH=[25,75,150,250,400];

/* ═══════════ СОСТОЯНИЕ ═══════════ */
const G={run:false,paused:false,vel:SPD0,roadOff:0,progress:0,worldTime:0,
 lane:1,ballX:CX,lean:0,squash:0,shake:0,flash:0,bounceCd:0,
 airY:0,airV:0,                          // прыжок
 boost:0,                                // ускоритель
 mode:null,modeT:0,modeDur:1,            // магнит / золото / радуга
 bonkStreak:0,bonkTimer:0,               // счётчик ударов для автопрыжка
 pops:0,stars:0,lastMile:0,total:LS.get('total',0),skin:LS.get('skin',0),
 diff:1,noBonkDist:0,
 nextPatAt:340,nextFillAt:200,nextModeAt:900,nextFriendAt:6,nextBfly:5,
 obstacles:[],collectibles:[],ramps:[],boosters:[],friends:[],butterflies:[],
 particles:[],sideDecoL:[],sideDecoR:[],amb:[],
 lastT:0,biomeMood:-1,tutT:0};
{ // ?t=сек — промотать время суток (тест биомов)
 const q=new URLSearchParams(location.search).get('t');
 if(q)G.worldTime=parseFloat(q)||0;
}

/* ═══════════ СВЕЧЕНИЯ (предрендер) ═══════════ */
const glowCache=new Map();
function glow(color){
 if(glowCache.has(color))return glowCache.get(color);
 const c=document.createElement('canvas');c.width=c.height=64;
 const g=c.getContext('2d');
 const gr=g.createRadialGradient(32,32,2,32,32,32);
 gr.addColorStop(0,color);gr.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=gr;g.fillRect(0,0,64,64);
 glowCache.set(color,c);return c;
}
function drawGlow(x,y,r,color,a){
 cx.globalAlpha=a;cx.drawImage(glow(color),x-r,y-r,r*2,r*2);cx.globalAlpha=1;
}

/* ═══════════ ЧАСТИЦЫ ═══════════ */
const POWER_COLS=['#FF6B9D','#FFD93D','#6BCB77','#4D96FF','#BB86FC','#FF9F43'];
function pushP(p){if(G.particles.length>220)G.particles.splice(0,20);G.particles.push(p)}
function burst(x,y,col,n){
 for(let i=0;i<n;i++){const a=Math.PI*2*i/n+Math.random()*.4,sp=120+Math.random()*180;
  pushP({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-60,life:.8+Math.random()*.4,max:1.2,
   sz:3+Math.random()*5,c:col,g:320,shape:Math.random()<.4?'star':'circ',
   rot:Math.random()*6,rs:(Math.random()-.5)*8});}}
function confetti(x,y,cols,n){
 for(let i=0;i<n;i++){const a=Math.random()*6.28,sp=150+Math.random()*210;
  pushP({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-80,life:1+Math.random()*.5,max:1.5,
   sz:4+Math.random()*5,c:cols[Math.floor(Math.random()*cols.length)],g:380,shape:'rect',
   rot:Math.random()*6,rs:(Math.random()-.5)*12});}}
function hearts(x,y,n){
 for(let i=0;i<n;i++)pushP({x:x+(Math.random()-.5)*30,y:y-Math.random()*10,
  vx:(Math.random()-.5)*60,vy:-60-Math.random()*80,life:1+Math.random()*.5,max:1.5,
  sz:5+Math.random()*4,c:Math.random()<.5?'#FF6B9D':'#FF9FC4',g:-40,shape:'heart',
  rot:0,rs:(Math.random()-.5)*3});}
function rain(cols,n){
 for(let i=0;i<n;i++)pushP({x:Math.random()*VW,y:-20-Math.random()*60,
  vx:(Math.random()-.5)*70,vy:110+Math.random()*170,life:1.5+Math.random()*.6,max:2.1,
  sz:5+Math.random()*6,c:cols[Math.floor(Math.random()*cols.length)],g:210,shape:'rect',
  rot:Math.random()*6,rs:(Math.random()-.5)*10});}
function dust(x,y,n){
 for(let i=0;i<n;i++)pushP({x:x+(Math.random()-.5)*30,y,
  vx:(Math.random()-.5)*160,vy:-30-Math.random()*60,life:.4+Math.random()*.3,max:.7,
  sz:4+Math.random()*5,c:'rgba(230,220,190,.9)',g:300,shape:'circ',rot:0,rs:0});}

/* ═══════════ ДЕКОР ═══════════ */
function genSideDeco(){
 const mk=side=>({side,y:Math.random()*VH,off:Math.random(),
  type:Math.floor(Math.random()*5),sz:8+Math.random()*9,hue:Math.random()});
 G.sideDecoL=[];G.sideDecoR=[];
 for(let i=0;i<11;i++){G.sideDecoL.push(mk(-1));G.sideDecoR.push(mk(1));}
}
function decoX(d){return CX+d.side*(ROAD_W/2+14+d.off*(SIDE-26));}

/* ═══════════ ОБЪЕКТЫ ═══════════ */
function spawnAnimal(lane){
 let sp;do{sp=SP_NAMES[Math.floor(Math.random()*SP_NAMES.length)]}
 while(sp===G.lastSp&&Math.random()<.7);
 G.lastSp=sp;
 G.obstacles.push({sp,lane,y:-90,dodgeT:0,dodgeFrom:lane,dodgeTo:lane,
  seed:Math.random()*6.28,squash:0,react:0,noHit:0,alive:true});}
function spawnStar(lane,y,type){
 G.collectibles.push({lane,x:laneX(lane),y:y===undefined?-40:y,
  r:type?19:15,type:type||'star',rot:0,pulse:Math.random()*6.28,alive:true});}
function spawnRamp(lane){
 G.ramps.push({lane,y:-70,used:0,animT:0,alive:true});
 // дорожка звёзд в воздухе над трамплином
 for(let i=1;i<=4;i++)spawnStar(lane,-70-58*i);}
function spawnBooster(lane){
 G.boosters.push({lane,y:-60,used:false,alive:true});
 for(let i=1;i<=3;i++)spawnStar(lane,-60-70*i);}
function spawnFriend(){
 const side=Math.random()<.5?-1:1;
 G.friends.push({side,x:CX+side*(ROAD_W/2+16+Math.random()*10),
  y:-70,sp:Math.random()<.5?'bunny':'bear',wave:Math.random()*6.28,
  happy:0,alive:true});}
function spawnButterfly(){
 const dir=Math.random()<.5?1:-1;
 G.butterflies.push({x:dir>0?-30:VW+30,y:120+Math.random()*380,dir,
  vx:(52+Math.random()*40)*dir,ph:Math.random()*6.28,amp:22+Math.random()*16,alive:true});}
function popObstacle(o,byPower){
 o.alive=false;const sp=SPECIES[o.sp];
 confetti(laneX(o.lane),o.y,sp.conf.concat(['#FFD93D','#FF6B9D']),18);
 if(o.sp==='frog')Aud.sfx('croak');else Aud.sfx('pop',sp.pitch);
 vib(15);G.pops++;
 if(G.pops%6===0){Aud.sfx('celebrate');G.flash=.3;rain(POWER_COLS,26);}
}

/* ═══════════ ВИБРАЦИЯ ═══════════ */
function vib(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}

/* ═══════════ ЗВЁЗДЫ / НАГРАДЫ ═══════════ */
const starN=document.getElementById('starN');
function syncStars(){
 starN.textContent=G.stars;
 starN.classList.remove('pop');void starN.offsetWidth;starN.classList.add('pop');
 setTimeout(()=>starN.classList.remove('pop'),150);
}
function addStar(n){
 n=n||1;
 G.stars+=n;G.total+=n;LS.set('total',G.total);syncStars();
 const mile=Math.floor(G.stars/10);
 if(mile>G.lastMile&&G.stars>=10){G.lastMile=mile;milestone(mile*10);}
 let sk=0;
 for(let i=0;i<SKIN_THRESH.length;i++)if(G.total>=SKIN_THRESH[i])sk=i+1;
 if(sk>G.skin){G.skin=sk;LS.set('skin',sk);Aud.sfx('skin');vib([25,40,25]);
  toast('🎉 Новый шарик!');}
}
const bannerEl=document.getElementById('banner'),toastEl=document.getElementById('toast');
let bannerTo=null,toastTo=null;
function milestone(n){
 Aud.sfx('fanfare');vib([30,40,30]);G.flash=.35;
 bannerEl.innerHTML='УРА!<div class="stars">⭐ '+n+'</div>';
 bannerEl.classList.remove('hidden');
 clearTimeout(bannerTo);bannerTo=setTimeout(()=>bannerEl.classList.add('hidden'),1800);
 rain(POWER_COLS,34);burst(CX,300,'#FFD93D',18);
}
function toast(txt){
 toastEl.innerHTML='<span>'+txt+'</span>';
 toastEl.classList.remove('hidden');
 clearTimeout(toastTo);toastTo=setTimeout(()=>toastEl.classList.add('hidden'),2500);
}

/* ═══════════ РЕЖИМЫ (магнит / золото / радуга) ═══════════ */
const modeBadge=document.getElementById('modeBadge'),
 modeIc=document.getElementById('modeIc'),modeBar=document.getElementById('modeBar');
const MODES={
 magnet:{ic:'🧲',dur:6},
 gold:{ic:'✨',dur:8},
 rainbow:{ic:'🌈',dur:5}};
function applyMode(type){
 G.mode=type;G.modeT=MODES[type].dur;G.modeDur=MODES[type].dur;
 modeIc.textContent=MODES[type].ic+(type==='gold'?' ×2':'');
 modeBadge.classList.remove('hidden');
 Aud.sfx(type==='magnet'?'magnet':type==='gold'?'gold':'power');
 G.flash=.2;vib([15,30,15]);
 burst(G.ballX,BALL_Y+G.airY,type==='magnet'?'#4D96FF':type==='gold'?'#FFD93D':'#FF6B9D',22);}
function endMode(){G.mode=null;modeBadge.classList.add('hidden');}

/* ═══════════ ВВОД ═══════════ */
let tS=null;
cv.addEventListener('pointerdown',e=>{e.preventDefault();Aud.init();
 tS={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),moved:false};},{passive:false});
addEventListener('pointermove',e=>{
 if(!tS||e.pointerId!==tS.id||!G.run||G.paused)return;
 const dx=e.clientX-tS.x,dy=e.clientY-tS.y;
 if(dy<-28&&Math.abs(dy)>Math.abs(dx)*1.25){          // свайп вверх — прыжок
  tS.moved=true;tS.x=e.clientX;tS.y=e.clientY;tryJump();}
 else if(Math.abs(dx)>24){
  tS.moved=true;tS.x=e.clientX;tS.y=e.clientY;changeLane(dx>0?1:-1);}});
addEventListener('pointerup',e=>{
 if(!tS||e.pointerId!==tS.id)return;
 const quick=performance.now()-tS.t<400&&!tS.moved;
 tS=null;
 if(!quick||!G.run||G.paused)return;
 const v=toVirt(e.clientX,e.clientY);handleTap(v.x,v.y);});
addEventListener('pointercancel',()=>{tS=null});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
 if(!G.run)return;
 if(e.key==='ArrowLeft')changeLane(-1);
 else if(e.key==='ArrowRight')changeLane(1);
 else if(e.key==='ArrowUp'||e.key===' '||e.key==='w')tryJump();
 else if(e.key==='p'||e.key==='Escape')togglePause();});

function tryJump(){
 if(!G.run||G.paused||G.airY!==0)return;
 G.airY=-16;G.airV=JUMP_V;G.squash=.4;
 Aud.sfx('jump');vib(10);dust(G.ballX,BALL_Y+BALL_R*.8,5);
 G.bonkStreak=0;}

const tutEl=document.getElementById('tut');
function changeLane(dir){
 const nl=G.lane+dir;
 if(nl<0||nl>2)return;
 G.lane=nl;Aud.sfx('lane');
 if(tutEl&&!tutEl.classList.contains('hidden')){tutEl.classList.add('hidden');LS.set('tut',1);}
}
function handleTap(vx,vy){
 // 1) зверик — ближайший к тапу
 let best=null,bd=1e9;
 for(const o of G.obstacles){if(!o.alive)continue;
  const d=Math.hypot(vx-ox(o),vy-o.y);
  if(d<bd){bd=d;best=o;}}
 if(best&&bd<74){popObstacle(best,false);return;}
 // 2) друг на обочине
 for(const f of G.friends){if(!f.alive)continue;
  if(Math.hypot(vx-f.x,vy-f.y)<48){
   f.happy=1;Aud.sfx('hello');vib(10);
   hearts(f.x,f.y-20,7);return;}}
 // 3) бабочка
 for(const b of G.butterflies){if(!b.alive)continue;
  if(Math.hypot(vx-b.x,vy-b.y)<46){
   b.alive=false;Aud.sfx('butterfly');vib(12);
   burst(b.x,b.y,'#FF6B9D',12);burst(b.x,b.y,'#FFD93D',8);addStar();return;}}
 // 4) звёздочка/бонус
 for(const c of G.collectibles){if(!c.alive)continue;
  if(Math.hypot(vx-c.x,vy-c.y)<c.r+26){collect(c);return;}}
 // 5) иначе — смена полосы по стороне тапа
 changeLane(vx<CX?-1:1);
}
const ox=o=>o.dodgeT>0?lerp(laneX(o.dodgeFrom),laneX(o.dodgeTo),o.dodgeT):laneX(o.lane);

function collect(c){
 c.alive=false;
 if(c.type&&c.type!=='star'&&c.type!=='flower'){applyMode(c.type);return;}
 const gold=G.mode==='gold';
 burst(c.x,c.y,gold?'#FFE566':(c.type==='star'?'#FFD93D':'#FF6B9D'),gold?18:14);
 Aud.sfx('star');vib(8);addStar(gold?2:1);
}

/* ═══════════ СБРОС / МЕНЮ / ПАУЗА ═══════════ */
const menuEl=document.getElementById('menu'),pauseOv=document.getElementById('pauseOv'),
 hudEl=document.getElementById('hud'),hintEl=document.getElementById('hint');
function reset(){
 G.run=true;G.paused=false;G.vel=SPD0;G.progress=0;
 G.lane=1;G.ballX=laneX(1);G.lean=0;G.squash=0;G.shake=0;G.flash=0;G.bounceCd=0;
 G.airY=0;G.airV=0;G.boost=0;endMode();
 G.bonkStreak=0;G.bonkTimer=0;
 G.pops=0;G.stars=0;G.lastMile=0;G.diff=1;G.noBonkDist=0;
 G.nextPatAt=G.progress+340;G.nextFillAt=G.progress+200;
 G.nextModeAt=G.progress+900;G.nextFriendAt=6;G.nextBfly=4;
 G.obstacles=[];G.collectibles=[];G.ramps=[];G.boosters=[];G.friends=[];G.butterflies=[];
 G.particles=[];genSideDeco();
 menuEl.classList.add('hidden');pauseOv.classList.add('hidden');
 hudEl.classList.remove('hidden');
 starN.textContent='0';
 if(!LS.get('tut',0)){tutEl.classList.remove('hidden');G.tutT=0;}
 hintEl.style.opacity='1';
 setTimeout(()=>{if(G.run)hintEl.style.opacity='0'},9000);
 Aud.init();
}
function toMenu(){
 G.run=false;G.paused=false;
 menuEl.classList.remove('hidden');pauseOv.classList.add('hidden');
 hudEl.classList.add('hidden');tutEl.classList.add('hidden');endMode();
 G.obstacles=[];G.collectibles=[];G.ramps=[];G.boosters=[];G.friends=[];G.butterflies=[];
 document.getElementById('totalStars').innerHTML='⭐ <span>'+G.total+'</span>';
}
function showPause(){if(!G.run||G.paused)return;
 G.paused=true;pauseOv.classList.remove('hidden');}
function resume(){G.paused=false;pauseOv.classList.add('hidden');G.lastT=0;}
function togglePause(){G.paused?resume():showPause()}

document.getElementById('playBtn').addEventListener('click',()=>{Aud.init();Aud.sfx('ui');reset();});
document.getElementById('resumeBtn').addEventListener('click',()=>{Aud.sfx('ui');resume();});
document.getElementById('menuBtn').addEventListener('click',()=>{Aud.sfx('ui');toMenu();});
document.getElementById('pauseBtn').addEventListener('click',()=>{Aud.sfx('ui');showPause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)showPause();});

/* звук */
const snd1=document.getElementById('soundBtn'),snd2=document.getElementById('soundBtn2');
let muted=LS.get('muted',false);
function syncSound(){
 const ic=muted?'🔇':'🔊';snd1.textContent=ic;snd2.textContent=ic;
 Aud.setMuted(muted);LS.set('muted',muted);}
[snd1,snd2].forEach(b=>b.addEventListener('click',()=>{muted=!muted;syncSound();}));
syncSound();

/* полноэкранный режим */
const fsBtn=document.getElementById('fsBtn');
if(!document.documentElement.requestFullscreen)fsBtn.style.display='none';
fsBtn.addEventListener('click',()=>{
 if(document.fullscreenElement)document.exitFullscreen();
 else document.documentElement.requestFullscreen().catch(()=>{});});

/* ═══════════ ПАТТЕРНЫ (уровневый дизайн) ═══════════ */
function freeLane(avoid){
 const busy=new Set();
 for(const o of G.obstacles)if(o.alive&&Math.abs(o.y+90)<200)busy.add(o.lane);
 const free=[0,1,2].filter(l=>l!==avoid&&!busy.has(l));
 return free.length?free[Math.floor(Math.random()*free.length)]:avoid;}
function spawnPattern(){
 const p=G.progress,bag=[];
 bag.push('animal','animal','starLine','starLine');
 if(p>1000)bag.push('ramp','ramp');
 if(p>1000)bag.push('booster');
 if(p>2200)bag.push('animal2');
 if(p>1500)bag.push('starZig','starFlower');
 const pick=bag[Math.floor(Math.random()*bag.length)];
 let len=0;
 const lane=Math.floor(Math.random()*3);
 if(pick==='animal'){spawnAnimal(lane);}
 else if(pick==='animal2'){
  const l2=freeLane(lane);spawnAnimal(lane);
  if(l2!==lane)spawnAnimal(l2);else spawnAnimal((lane+1)%3);}
 else if(pick==='starLine'){
  const n=3+Math.floor(Math.random()*3);
  for(let i=0;i<n;i++)spawnStar(lane,-40-i*48);
  len=(n-1)*48;}
 else if(pick==='starZig'){
  let l=lane;
  for(let i=0;i<6;i++){spawnStar(l,-40-i*60);
   l=clamp01((l+(Math.random()<.5?-1:1))/2)*2|0;}
  len=5*60;}
 else if(pick==='starFlower'){
  // 5 звёзд «цветком»: центр + 4 вокруг
  const cy=-140;
  spawnStar(lane,cy);
  const dl=[[0,-1],[0,1],[-1,0],[1,0]];
  for(const[dx,dy]of dl){const l2=lane+dx;if(l2>=0&&l2<=2)spawnStar(l2,cy+dy*66);}
  len=140;}
 else if(pick==='ramp'){spawnRamp(lane);len=300;}
 else if(pick==='booster'){spawnBooster(lane);len=270;}
 const spacing=(320+Math.random()*110)*(1+(1-G.diff)*.8);
 G.nextPatAt=G.progress+len+Math.max(240,spacing);}

/* ═══════════ ЛОГИКА ═══════════ */
function doBounce(o){
 G.vel=BOUNCE_V;G.squash=.6;G.shake=5;G.flash=.12;G.bounceCd=.4;
 G.diff=Math.max(.62,G.diff*.9);G.noBonkDist=0;
 G.bonkStreak++;G.bonkTimer=4;
 o.react=1;                                   // зверик радостно кувыркается
 burst(ox(o),o.y-10,'#FFD93D',10);
 Aud.sfx('bonk');Aud.sfx('pop',SPECIES[o.sp].pitch*1.15);
 vib(35);
}
function update(dt){
 G.worldTime+=dt;
 const pal=blendPal();
 const mood=G.worldTime/CYCLE%4|0;
 if(mood!==G.biomeMood){G.biomeMood=mood;Aud.setMood(mood);}

 if(!G.run){ // меню — мир тихо катится
  G.roadOff+=40*dt;
  for(const d of[...G.sideDecoL,...G.sideDecoR]){d.y+=40*dt;
   if(d.y>VH+40){d.y=-40;d.off=Math.random();d.type=Math.floor(Math.random()*5);}}
  updateAmbient(dt,pal);updateParticles(dt);
  return;
 }
 if(G.paused)return;

 const target=Math.min(SPD_MAX,SPD0+G.progress*.008);
 let mul=1;
 if(G.boost>0)mul=1.6;
 else if(G.mode==='rainbow')mul=1.25;
 const cruise=target*mul;
 G.vel+=(cruise-G.vel)*Math.min(1,dt*3);
 const dW=G.vel*dt;
 G.roadOff+=dW;
 if(G.vel>0)G.progress+=dW;
 if(G.bounceCd>0)G.bounceCd-=dt;
 if(G.bonkTimer>0){G.bonkTimer-=dt;if(G.bonkTimer<=0)G.bonkStreak=0;}
 if(G.boost>0){G.boost-=dt;
  // шлейф ускорения
  if(Math.random()<dt*40)pushP({x:G.ballX+(Math.random()-.5)*40,y:BALL_Y+G.airY+20,
   vx:-G.vel*.3,vy:(Math.random()-.5)*30,life:.3,max:.3,sz:3+Math.random()*4,
   c:Math.random()<.5?'#FFE082':'#FFB74D',g:0,shape:'circ',rot:0,rs:0});}
 if(G.mode){G.modeT-=dt;
  modeBar.style.width=Math.max(0,G.modeT/G.modeDur*100)+'%';
  if(G.modeT<=0)endMode();}

 /* прыжок */
 if(G.airY<0||G.airV<0){
  G.airY+=G.airV*dt;G.airV+=GRAV*dt;
  if(G.airY>=0){ // приземление
   G.airY=0;G.airV=0;G.squash=.45;
   dust(G.ballX,BALL_Y+BALL_R*.8,8);Aud.sfx('land');vib(20);}}

 /* адаптивная сложность */
 G.noBonkDist+=Math.max(0,dW);
 if(G.noBonkDist>700){G.noBonkDist=0;G.diff=Math.min(1.25,G.diff*1.03);}

 /* шар */
 const tx=laneX(G.lane),dxl=tx-G.ballX;
 G.ballX+=dxl*Math.min(1,dt*14);
 G.lean=Math.max(-.22,Math.min(.22,dxl*.012));
 G.squash*=Math.pow(.002,dt);
 if(G.shake>0)G.shake=Math.max(0,G.shake-dt*14);
 if(G.flash>0)G.flash-=dt;

 /* зверики */
 for(const o of G.obstacles){o.y+=dW;
  if(o.noHit>0)o.noHit-=dt;
  if(o.squash>0)o.squash*=Math.pow(.01,dt);
  if(o.react>0)o.react=Math.max(0,o.react-dt*2);
  if(o.dodgeT>0&&o.dodgeT<1){
   o.dodgeT=Math.min(1,o.dodgeT+dt*3);
   if(o.dodgeT>=1)o.lane=o.dodgeTo;}}
 /* звёзды + магнит */
 const by=BALL_Y+G.airY;
 for(const c of G.collectibles){c.y+=dW;c.rot+=dt*3;c.pulse+=dt*5;
  c.x=laneX(c.lane);
  if(G.mode==='magnet'){
   const dx=G.ballX-c.x,dy=by-c.y,d=Math.hypot(dx,dy);
   if(d>4){const k=Math.min(1,dt*7);c.x+=dx*k;c.y+=dy*k;c.lane=-1;}}
  else if(G.airY<-20){ // в полёте — лёгкое притяжение
   const dx=G.ballX-c.x,dy=by-c.y;
   if(Math.abs(dy)<90&&Math.abs(dx)<60){c.x+=dx*dt*5;c.y+=dy*dt*5;c.lane=-1;}}}
 /* трамплины */
 for(const r of G.ramps){r.y+=dW;
  if(r.animT>0)r.animT-=dt;
  if(!r.used&&r.lane===G.lane&&Math.abs(BALL_Y-r.y)<26&&G.airY===0){
   r.used=1;r.animT=.4;G.airY=-16;G.airV=JUMP_V*1.15;
   G.squash=.5;Aud.sfx('jump');vib([10,30,10]);
   burst(laneX(r.lane),r.y,'#4D96FF',10);}}
 /* ускорители */
 for(const b of G.boosters){b.y+=dW;
  if(!b.used&&b.lane===G.lane&&Math.abs(BALL_Y-b.y)<26){
   b.used=true;G.boost=2;Aud.sfx('boost');vib([20,20,20]);
   burst(laneX(b.lane),b.y,'#FFE082',14);
   toast('⚡ Ускорение!');}}
 /* друзья */
 for(const f of G.friends){f.y+=dW;f.wave+=dt*5;
  if(f.happy>0)f.happy-=dt*.7;}
 /* бабочки */
 for(const b of G.butterflies){b.ph+=dt*3;b.x+=b.vx*dt;b.y+=Math.sin(b.ph)*b.amp*dt;
  if(b.x<-60||b.x>VW+60)b.alive=false;}

 /* декор */
 const rec=d=>{d.y+=dW;
  if(d.y>VH+40){d.y=-40;d.off=Math.random();d.type=Math.floor(Math.random()*5);}};
 G.sideDecoL.forEach(rec);G.sideDecoR.forEach(rec);

 G.obstacles=G.obstacles.filter(o=>o.alive&&o.y<VH+130);
 G.collectibles=G.collectibles.filter(c=>c.alive&&c.y<VH+90);
 G.ramps=G.ramps.filter(r=>r.y<VH+130);
 G.boosters=G.boosters.filter(b=>b.y<VH+130);
 G.friends=G.friends.filter(f=>f.alive&&f.y<VH+140);
 G.butterflies=G.butterflies.filter(b=>b.alive);

 /* спавн паттернов */
 if(G.progress>=G.nextPatAt)spawnPattern();
 /* филлер-звёздочки — чтобы поток не прерывался */
 if(G.progress>=G.nextFillAt){
  spawnStar(Math.floor(Math.random()*3));
  G.nextFillAt=G.progress+190+Math.random()*160;}
 /* бонусы-режимы */
 if(G.progress>=G.nextModeAt){
  const r=Math.random();
  const type=r<.45?'magnet':r<.8?'gold':'rainbow';
  spawnStar(Math.floor(Math.random()*3),-50,type);
  G.nextModeAt=G.progress+9000+Math.random()*5000;}
 /* друзья на обочине */
 G.nextFriendAt-=dt;
 if(G.nextFriendAt<=0){spawnFriend();G.nextFriendAt=14+Math.random()*10;}
 /* бабочки */
 G.nextBfly-=dt;
 if(G.nextBfly<=0){if(pal.night<.6)spawnButterfly();G.nextBfly=8+Math.random()*6;}

 /* столкновения со звериками */
 const airborne=G.airY<-16;                       // почти сразу после отрыва
 for(const o of G.obstacles){if(!o.alive||o.noHit>0)continue;
  const oxx=ox(o);
  const dx=Math.abs(G.ballX-oxx),dy=Math.abs(BALL_Y-o.y);
  if(dx<42&&dy<44){
   if(G.mode==='rainbow'){popObstacle(o,true);G.shake=Math.max(G.shake,4);}
   else if(airborne)continue;                       // пролетаем сверху
   else if(G.boost>0){                              // на скорости — зверик отпрыгивает
    if(o.dodgeT===0){
     o.dodgeFrom=o.lane;o.dodgeTo=freeLane(o.lane);o.dodgeT=.01;
     Aud.sfx('dodge');}}
   else if(G.bonkStreak>=2){                        // 3-й удар — шар сам перепрыгивает!
    G.bonkStreak=0;G.bonkTimer=0;G.bounceCd=.6;
    G.airY=-16;G.airV=JUMP_V;G.squash=.5;         // уже «в воздухе» — зверик не помешает
    o.noHit=1.5;                                  // этот зверик больше не сталкивается
    o.squash=.7;                                  // радостно приседает (не подпрыгивает!)
    Aud.sfx('jump');vib([10,25,10]);
    hearts(oxx,o.y-SPECIES[o.sp].size*.55,8);
    burst(oxx,o.y,'#FFD93D',12);}
   else if(G.vel>0&&G.bounceCd<=0){doBounce(o);}}}

 /* подбор */
 for(const c of G.collectibles){if(!c.alive)continue;
  const rad=BALL_R+c.r+(G.airY<-20?26:6);
  const dx=G.ballX-c.x,dy=by-c.y;
  if(dx*dx+dy*dy<rad*rad)collect(c);}

 updateAmbient(dt,pal);
 updateParticles(dt);
 if(!tutEl.classList.contains('hidden')){G.tutT+=dt;if(G.tutT>14)tutEl.classList.add('hidden');}
}

/* атмосферные частицы */
function updateAmbient(dt,pal){
 const type=pal.amb;
 G.amb=G.amb.filter(a=>a.life>0);
 for(const a of G.amb)a.life-=dt*(a.type!==type?.6:0);
 while(G.amb.length<12){
  const a={type,life:3+Math.random()*3,seed:Math.random()*100};
  if(type==='petals'||type==='leaves'){a.x=Math.random()*VW;a.y=-20-Math.random()*VH;
   a.ph=Math.random()*6.28;a.rot=Math.random()*6.28;}
  else if(type==='fireflies'){a.bx=CX+(Math.random()<.5?-1:1)*(ROAD_W/2+20+Math.random()*46);
   a.by=40+Math.random()*(VH-80);a.ph=Math.random()*6.28;}
  else{a.x=Math.random()*VW;a.wy=Math.random()*VH;a.ph=Math.random()*6.28;}
  G.amb.push(a);}
 for(const a of G.amb){
  if(a.type==='petals'||a.type==='leaves'){
   a.y+=(a.type==='petals'?26:34)*dt;a.x+=Math.sin(a.ph+=dt*1.6)*22*dt;a.rot+=dt*2;
   if(a.y>VH+20){a.y=-20;a.x=Math.random()*VW;}}}
}

function updateParticles(dt){
 for(const p of G.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;p.life-=dt;p.rot+=p.rs*dt;}
 G.particles=G.particles.filter(p=>p.life>0);
}

/* ═══════════ РЕНДЕР ═══════════ */
let grassGradD=null,grassKey='',pathGrad=null,pathKey='';
function render(){
 const pal=blendPal();
 const now=performance.now()*.001;

 /* трава на весь экран */
 cx.setTransform(1,0,0,1,0,0);
 const key=pal.grass[1].slice(0,14)+pal.night.toFixed(2);
 if(key!==grassKey){grassKey=key;
  grassGradD=cx.createLinearGradient(0,0,0,cv.height);
  grassGradD.addColorStop(0,pal.grass[0]);grassGradD.addColorStop(.5,pal.grass[1]);grassGradD.addColorStop(1,pal.grass[2]);}
 cx.fillStyle=grassGradD;cx.fillRect(0,0,cv.width,cv.height);

 const shx=G.shake?(Math.random()-.5)*G.shake:0,shy=G.shake?(Math.random()-.5)*G.shake:0;
 cx.setTransform(scl,0,0,scl,offX+shx*scl,offY+shy*scl);

 drawGrass(pal,now);
 drawRoad(pal);

 /* роса (рассвет) */
 if(pal.amb==='dew'){
  cx.fillStyle='#FFFFFF';
  for(let i=0;i<16;i++){
   const y=(hash(i*7.3)*VH+G.roadOff*(.5+hash(i)*.5))%(VH+40)-20;
   const a=.25+.75*Math.abs(Math.sin(now*2.2+i*1.7));
   cx.globalAlpha=a*.6;
   cx.beginPath();cx.arc(hash(i*3.1)*VW,y,1.4+hash(i*5.7)*1.6,0,6.28);cx.fill();}
  cx.globalAlpha=1;}

 /* трамплины и ускорители — декали на дорожке */
 for(const r of G.ramps)drawRamp(r,now);
 for(const b of G.boosters)drawBooster(b,now);

 /* декор по сторонам */
 for(const d of G.sideDecoL)drawDecoItem(d,pal,now);
 for(const d of G.sideDecoR)drawDecoItem(d,pal,now);

 /* друзья */
 for(const f of G.friends)drawFriend(f,now);

 /* светлячки (ночь) */
 if(pal.night>.15)for(const a of G.amb){
  if(a.type!=='fireflies'||a.life<=0)continue;
  const x=a.bx+Math.sin(now*.5+a.ph)*26,y=a.by+Math.sin(now*.4+a.ph*2)*18;
  const fl=.5+.5*Math.sin(now*2.4+a.ph*3);
  drawGlow(x,y,11,'#D9F76C',pal.night*fl*Math.min(1,a.life)*.9);
  cx.fillStyle='#F4FFB0';cx.globalAlpha=pal.night*fl;
  cx.beginPath();cx.arc(x,y,1.6,0,6.28);cx.fill();cx.globalAlpha=1;}

 /* сущности: сортировка по глубине */
 const ents=[];
 for(const o of G.obstacles)if(o.alive)ents.push(o);
 for(const c of G.collectibles)if(c.alive)ents.push(c);
 ents.sort((a,b)=>a.y-b.y);
 let ballDrawn=false;
 for(const e of ents){
  if(!ballDrawn&&e.y>BALL_Y+G.airY){drawBall(now);ballDrawn=true;}
  if(e.sp)drawAnimal(e,now);
  else drawCollectible(e,now);}
 if(!ballDrawn)drawBall(now);

 /* бабочки */
 for(const b of G.butterflies)if(b.alive)drawButterfly(b,now);

 /* частицы */
 for(const p of G.particles){cx.globalAlpha=Math.max(0,p.life/p.max);
  cx.fillStyle=p.c;cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot||0);
  if(p.shape==='circ'){cx.beginPath();cx.arc(0,0,p.sz,0,6.28);cx.fill();}
  else if(p.shape==='star'){starPath(0,0,p.sz,p.sz*.4);cx.fill();}
  else if(p.shape==='heart'){heartPath(0,0,p.sz);cx.fill();}
  else cx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz*.6);
  cx.restore();}
 cx.globalAlpha=1;

 /* лепестки / листья */
 for(const a of G.amb){
  if(a.life<=0)continue;
  if(a.type==='petals'){
   cx.globalAlpha=Math.min(1,a.life)*.8;cx.fillStyle=['#FFB7CE','#FFD9E6','#FFF0F5'][a.seed*3|0];
   cx.save();cx.translate(a.x,a.y);cx.rotate(a.rot);
   cx.beginPath();cx.ellipse(0,0,4.5,2.8,0,0,6.28);cx.fill();cx.restore();}
  else if(a.type==='leaves'){
   cx.globalAlpha=Math.min(1,a.life)*.85;cx.fillStyle=['#FF9E5E','#E5673C','#FFC46B'][a.seed*3|0];
   cx.save();cx.translate(a.x,a.y);cx.rotate(a.rot);
   cx.beginPath();cx.moveTo(-5,0);cx.quadraticCurveTo(0,-5,5,0);cx.quadraticCurveTo(0,5,-5,0);
   cx.fill();cx.restore();}}
 cx.globalAlpha=1;

 /* вспышка */
 if(G.flash>0){cx.fillStyle=`rgba(255,255,255,${Math.min(.5,G.flash)})`;
  cx.fillRect(0,0,VW,VH);}
}

function drawGrass(pal,now){
 const g=cx.createLinearGradient(0,0,0,VH);
 g.addColorStop(0,pal.grass[0]);g.addColorStop(.5,pal.grass[1]);g.addColorStop(1,pal.grass[2]);
 cx.fillStyle=g;cx.fillRect(0,0,VW,VH);
 /* качающиеся травинки */
 cx.globalAlpha=.14;cx.fillStyle=pal.speck;
 const off=((G.roadOff%38)+38)%38;
 for(let y=-38+off;y<VH+38;y+=38)
  for(let x=14;x<VW-10;x+=30){
   if(Math.abs(x-CX)<ROAD_W/2)continue;
   const sw=Math.sin(now*1.8+x*.31+y*.05)*2.2;
   cx.beginPath();cx.moveTo(x+((y/38)%2)*15,y);
   cx.quadraticCurveTo(x+sw,y-4,x+((y/38)%2)*15+sw*2,y-7);
   cx.lineWidth=2;cx.strokeStyle=pal.speck;cx.stroke();}
 cx.globalAlpha=1;
}

function drawRoad(pal){
 const X=CX-ROAD_W/2;
 cx.fillStyle=pal.pathE;cx.fillRect(X-6,0,ROAD_W+12,VH);
 const k2=pal.path[1].slice(0,14)+pal.night.toFixed(2);
 if(k2!==pathKey){pathKey=k2;
  pathGrad=cx.createLinearGradient(X,0,X+ROAD_W,0);
  pathGrad.addColorStop(0,pal.path[0]);pathGrad.addColorStop(.5,pal.path[1]);pathGrad.addColorStop(1,pal.path[0]);}
 cx.fillStyle=pathGrad;cx.fillRect(X,0,ROAD_W,VH);
 /* мягкая тень по краям */
 const egL=cx.createLinearGradient(X,0,X+26,0);
 egL.addColorStop(0,'rgba(90,70,40,.16)');egL.addColorStop(1,'rgba(90,70,40,0)');
 cx.fillStyle=egL;cx.fillRect(X,0,26,VH);
 const egR=cx.createLinearGradient(X+ROAD_W,0,X+ROAD_W-26,0);
 egR.addColorStop(0,'rgba(90,70,40,.16)');egR.addColorStop(1,'rgba(90,70,40,0)');
 cx.fillStyle=egR;cx.fillRect(X+ROAD_W-26,0,26,VH);
 /* крапинки */
 cx.globalAlpha=.06;cx.fillStyle=pal.dot;
 const off=((G.roadOff%34)+34)%34;
 for(let y=-34+off;y<VH+34;y+=34)
  for(let i=0;i<5;i++){
   const sx=X+12+((i*57+y*13)%(ROAD_W-24));
   cx.beginPath();cx.arc(sx,y,2,0,6.28);cx.fill();}
 cx.globalAlpha=1;
 /* бегущие разделители */
 cx.fillStyle=pal.dash;
 const dper=46,dl=20,doff=((G.roadOff%dper)+dper)%dper;
 for(let li=1;li<3;li++){const x=X+ROAD_W/3*li-2;
  for(let y=-dper+doff;y<VH+dper;y+=dper)cx.fillRect(x,y,4,dl);}
}

/* ── трамплин: батут-подушка ── */
function drawRamp(r,now){
 const x=laneX(r.lane);
 // подушка сплющивается при ударе и подпрыгивает обратно
 let sy=1;
 if(r.used)sy=r.animT>.28?.55:lerp(.55,.82,1-r.animT/.28);
 const wob=r.animT>0?Math.sin((0.4-r.animT)*18)*.08*(r.animT/.4):0;
 cx.save();cx.translate(x,r.y);cx.rotate(wob);
 /* тень */
 cx.fillStyle='rgba(0,0,0,.18)';
 cx.beginPath();cx.ellipse(0,14,42,7,0,0,6.28);cx.fill();
 /* ножки-стойки */
 cx.strokeStyle='#546E7A';cx.lineWidth=5;cx.lineCap='round';
 cx.beginPath();cx.moveTo(-26,10);cx.lineTo(-26,-4);cx.stroke();
 cx.beginPath();cx.moveTo(26,10);cx.lineTo(26,-4);cx.stroke();
 /* подушка */
 cx.fillStyle='#42A5F5';
 cx.beginPath();
 cx.moveTo(-40,-4*sy-16*sy);
 cx.quadraticCurveTo(0,-4*sy-30*sy,40,-4*sy-16*sy);   // выпуклый верх
 cx.lineTo(40,2);
 cx.quadraticCurveTo(0,10,-40,2);
 cx.closePath();cx.fill();
 cx.strokeStyle='#1565C0';cx.lineWidth=3.5;cx.stroke();
 /* блик */
 cx.fillStyle='rgba(255,255,255,.35)';
 cx.beginPath();cx.ellipse(-16,-14*sy,14,4.5,-.12,0,6.28);cx.fill();
 /* крупная стрелка вверх */
 cx.fillStyle='#FFFFFF';
 const ay=-18*sy;
 cx.beginPath();
 cx.moveTo(0,ay-11);cx.lineTo(10,ay+2);cx.lineTo(4,ay+2);cx.lineTo(4,ay+10);
 cx.lineTo(-4,ay+10);cx.lineTo(-4,ay+2);cx.lineTo(-10,ay+2);
 cx.closePath();cx.fill();
 if(!r.used)drawGlow(0,-12,30+Math.sin(now*4)*4,'#64B5F6',.45);
 cx.restore();
}

/* ── ускоритель ── */
function drawBooster(b,now){
 const x=laneX(b.lane);
 cx.save();cx.translate(x,b.y);
 /* светящаяся дорожка */
 drawGlow(0,0,40,'#FFE082',b.used?.15:.4);
 cx.fillStyle='#FFCA28';
 roundRect(-34,-58,68,116,14);cx.fill();
 cx.strokeStyle='#F57F17';cx.lineWidth=3;cx.stroke();
 /* бегущие шевроны */
 const t=(now*90)%34;
 cx.fillStyle='#FFFFFF';
 for(let i=-1;i<3;i++){
  const y=-46+((i*34+t)%116);
  chevron(0,y,22);}
 cx.restore();
}
function chevron(x,y,w){
 cx.beginPath();
 cx.moveTo(x-w,y+8);cx.lineTo(x,y-2);cx.lineTo(x+w,y+8);
 cx.lineTo(x+w,y+3);cx.lineTo(x,y-7);cx.lineTo(x-w,y+3);
 cx.closePath();cx.fill();
}
function roundRect(x,y,w,h,r){
 cx.beginPath();
 cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);
 cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath();
}

function drawDecoItem(d,pal,now){
 const x=decoX(d),y=d.y,type=d.type,sz=d.sz;
 const sway=Math.sin(now*1.6+d.hue*9)*.05; // всё качается
 const nightGlow=pal.night*.5;
 if(type===0){ // цветок
  if(nightGlow>.05)drawGlow(x,y-sz*.3,sz*1.8,'#B4FF7A',nightGlow);
  const cols=['#FF6B9D','#FFD93D','#BB86FC','#FF9F43','#4D96FF'];
  const c=cols[Math.floor(d.hue*cols.length)%cols.length];
  cx.save();cx.translate(x,y-sz*.3);cx.rotate(sway);
  cx.fillStyle='#3E8E41';cx.fillRect(-1,sz*.3,2,sz*.7);
  cx.fillStyle=c;
  for(let i=0;i<5;i++){const a=Math.PI*2*i/5+Math.sin(now*2+d.hue*7)*.1;
   cx.beginPath();cx.arc(Math.cos(a)*sz*.5,Math.sin(a)*sz*.5,sz*.35,0,6.28);cx.fill();}
  cx.fillStyle='#FFE566';cx.beginPath();cx.arc(0,0,sz*.26,0,6.28);cx.fill();
  cx.restore();}
 else if(type===1){ // куст — дышит
  const br=1+Math.sin(now*2+d.hue*8)*.04;
  cx.save();cx.translate(x,y);cx.scale(br,br);
  cx.fillStyle=pal.speck;
  cx.beginPath();cx.arc(0,0,sz,0,6.28);cx.fill();
  cx.beginPath();cx.arc(-sz*.6,2,sz*.7,0,6.28);cx.fill();
  cx.beginPath();cx.arc(sz*.6,2,sz*.7,0,6.28);cx.fill();
  cx.fillStyle='rgba(255,255,255,.18)';
  cx.beginPath();cx.arc(-sz*.3,-sz*.3,sz*.35,0,6.28);cx.fill();
  cx.restore();}
 else if(type===2){ // дерево — верхушка гнётся
  cx.save();cx.translate(x,y);cx.rotate(sway*.7);
  cx.fillStyle='#8D6E63';cx.fillRect(-sz*.15,-sz*.2,sz*.3,sz*.9);
  cx.fillStyle=pal.tree;
  cx.beginPath();cx.arc(0,-sz*.55,sz*.72,0,6.28);cx.fill();
  cx.beginPath();cx.arc(-sz*.5,-sz*.25,sz*.5,0,6.28);cx.fill();
  cx.beginPath();cx.arc(sz*.5,-sz*.25,sz*.5,0,6.28);cx.fill();
  cx.fillStyle='rgba(255,255,255,.16)';
  cx.beginPath();cx.arc(-sz*.2,-sz*.65,sz*.32,0,6.28);cx.fill();
  cx.restore();}
 else if(type===3){ // камень
  cx.fillStyle='#9E9E9E';cx.beginPath();cx.ellipse(x,y,sz*.7,sz*.5,0,0,6.28);cx.fill();
  cx.fillStyle='rgba(255,255,255,.3)';
  cx.beginPath();cx.ellipse(x-sz*.2,y-sz*.15,sz*.3,sz*.2,0,0,6.28);cx.fill();}
 else{ // пучок травы
  cx.strokeStyle=pal.speck;cx.lineWidth=2;cx.lineCap='round';
  for(let i=-1;i<=1;i++){
   const b=Math.sin(now*2.2+x*.1+i)*2;
   cx.beginPath();cx.moveTo(x+i*3,y);
   cx.quadraticCurveTo(x+i*3+i*2+b,y-sz*.7,x+i*4+b,y-sz);cx.stroke();}}
}

/* ── зверик-друг на обочине ── */
function drawFriend(f,now){
 const spr=animalSprite(f.sp==='bear'?'bear':'bunny');
 const hop=f.happy>0?Math.abs(Math.sin(now*10))*16:0;
 const bob=Math.sin(now*2.2+f.wave)*2.5;
 const sz=46,dw=sz*spr.W/spr.H;
 cx.save();cx.translate(f.x,f.y+bob-hop);
 cx.fillStyle='rgba(0,0,0,.16)';
 cx.beginPath();cx.ellipse(0,20,12,4,0,0,6.28);cx.fill();
 cx.drawImage(spr.img,-dw/2,-sz/2,dw,sz);
 cx.restore();
}

/* ── ЗВЕРИКИ: готовые эмодзи-ассеты, кэш спрайтов 2x ── */
const spriteCache={};
const EMOJI_FONT='"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
function animalSprite(sp){
 if(spriteCache[sp])return spriteCache[sp];
 const S=SPECIES[sp],FS=150;
 const m=document.createElement('canvas').getContext('2d');
 m.font=FS+'px '+EMOJI_FONT;
 const w=Math.max(FS,Math.ceil(m.measureText(S.em).width));
 const c=document.createElement('canvas');
 c.width=w*2;c.height=(FS+8)*2;
 const g=c.getContext('2d');g.scale(2,2);
 g.font=m.font;g.textAlign='center';g.textBaseline='middle';
 g.fillText(S.em,w/2,(FS+8)/2+FS*.04);
 spriteCache[sp]={img:c,W:w,H:FS+8};
 return spriteCache[sp];
}

function drawAnimal(o,now){
 const S=SPECIES[o.sp],spr=animalSprite(o.sp);
 const x=ox(o);
 const hopY=S.hop?Math.abs(Math.sin(now*3.4+o.seed))*7:0; // зайка и лягушонок в движении
 const dodgeLift=o.dodgeT>0&&o.dodgeT<1?Math.sin(Math.PI*o.dodgeT)*40:0;
 const rLift=o.react>0?Math.sin(o.react*Math.PI)*14:0;    // радостный подскок после удара
 const tilt=o.react>0?Math.sin(o.react*16)*.3*o.react:0;  // кувыркается от удовольствия
 const br=1+Math.sin(now*2.6+o.seed)*.028;                // дыхание
 const s=(o.squash||0)*.22;                               // приседание (в т.ч. при автопрыжке)
 const sz=S.size,dw=sz*spr.W/spr.H;
 /* тень на земле */
 cx.fillStyle='rgba(0,0,0,.16)';
 cx.beginPath();cx.ellipse(x,o.y+sz*.44,dw*.4,6,0,0,6.28);cx.fill();
 cx.save();cx.translate(x,o.y-hopY-dodgeLift-rLift);
 cx.rotate(tilt+Math.sin(now*1.4+o.seed)*.045);
 cx.scale((1+s)*br,(1-s)*br);
 cx.drawImage(spr.img,-dw/2,-sz/2,dw,sz);
 cx.restore();
}
/* ── звёзды/цветы/бонусы ── */
function drawCollectible(c,now){
 cx.save();cx.translate(c.x,c.y);
 const p=1+Math.sin(c.pulse)*.12;cx.scale(p,p);cx.rotate(c.rot);
 if(c.type==='magnet'){
  // большой чёткий магнит-подкова
  drawGlow(0,0,c.r*1.9,'#4D96FF',.6);
  cx.save();cx.translate(0,2);
  cx.strokeStyle='#2E6FD8';cx.lineWidth=9;cx.lineCap='butt';
  cx.beginPath();cx.arc(0,-2,9,Math.PI,0);cx.stroke();
  cx.beginPath();cx.moveTo(-9,-2);cx.lineTo(-9,8);cx.stroke();
  cx.beginPath();cx.moveTo(9,-2);cx.lineTo(9,8);cx.stroke();
  cx.strokeStyle='#FF5252';cx.lineWidth=9;
  cx.beginPath();cx.moveTo(-9,5);cx.lineTo(-9,10);cx.stroke();
  cx.beginPath();cx.moveTo(9,5);cx.lineTo(9,10);cx.stroke();
  cx.restore();
 }else if(c.type==='gold'){
  drawGlow(0,0,c.r*2.1,'#FFD93D',.8);
  cx.fillStyle='#FFC400';cx.strokeStyle='#fff';cx.lineWidth=2.5;
  starPath(0,0,c.r,c.r*.45);cx.fill();cx.stroke();
  cx.fillStyle='#7a5800';cx.font='bold '+Math.round(c.r*.95)+'px sans-serif';
  cx.textAlign='center';cx.textBaseline='middle';cx.fillText('×2',0,1);
 }else if(c.type==='rainbow'){
  const hue=(now*140+c.pulse*40)%360;
  const hq=Math.round(hue/30)*30%360;
  drawGlow(0,0,c.r*2.3,`hsl(${hq},100%,62%)`,.8);
  cx.fillStyle=`hsl(${hue},100%,60%)`;cx.strokeStyle='#fff';cx.lineWidth=2.5;
  starPath(0,0,c.r,c.r*.45);cx.fill();cx.stroke();
 }else if(c.type==='star'){
  drawGlow(0,0,c.r*1.8,'#FFEB5E',.55);
  cx.fillStyle='#FFD93D';cx.strokeStyle='#fff';cx.lineWidth=2;
  starPath(0,0,c.r,c.r*.42);cx.fill();cx.stroke();
  cx.fillStyle='rgba(255,255,255,.6)';
  cx.beginPath();cx.arc(-c.r*.25,-c.r*.25,c.r*.22,0,6.28);cx.fill();
 }else{
  const fc=['#FF6B9D','#BB86FC','#4D96FF'][Math.floor(c.pulse)%3];
  cx.fillStyle=fc;
  for(let i=0;i<6;i++){const a=Math.PI*2*i/6;
   cx.beginPath();
   cx.ellipse(Math.cos(a)*c.r*.5,Math.sin(a)*c.r*.5,c.r*.42,c.r*.25,a,0,6.28);cx.fill();}
  cx.fillStyle='#FFD93D';cx.beginPath();cx.arc(0,0,c.r*.3,0,6.28);cx.fill();}
 cx.restore();
}

function drawButterfly(b,now){
 const flap=.3+.7*Math.abs(Math.sin(b.ph*4.2));
 const cols=['#FF6B9D','#4D96FF','#FF9F43','#BB86FC'];
 const c=cols[Math.floor(b.ph*7)%4];
 cx.save();cx.translate(b.x,b.y);
 cx.rotate(Math.sin(b.ph)*.2);
 cx.save();cx.scale(flap,1);          // машем крылышками
 cx.fillStyle=c;
 cx.beginPath();cx.ellipse(-7,-4,8.5,6.5,-.45,0,6.28);cx.fill();
 cx.beginPath();cx.ellipse(-6.5,4,7,5.2,.35,0,6.28);cx.fill();
 cx.fillStyle='rgba(255,255,255,.5)';
 cx.beginPath();cx.ellipse(-7,-4,3.6,2.6,-.45,0,6.28);cx.fill();
 cx.beginPath();cx.ellipse(-6.5,4,3,2.1,.35,0,6.28);cx.fill();
 cx.restore();
 cx.fillStyle='#5D4037';              // тельце
 cx.beginPath();cx.ellipse(0,0,2.3,7.5,0,0,6.28);cx.fill();
 cx.beginPath();cx.arc(0,-7.5,2.7,0,6.28);cx.fill();
 cx.strokeStyle='#5D4037';cx.lineWidth=1.1;cx.lineCap='round'; // усики
 cx.beginPath();cx.moveTo(-1,-9.5);cx.quadraticCurveTo(-4,-13.5,-6,-13.5);cx.stroke();
 cx.beginPath();cx.moveTo(1,-9.5);cx.quadraticCurveTo(4,-13.5,6,-13.5);cx.stroke();
 cx.restore();
}

/* ── шар ── */
function ballBand(p1,p2,color,r){const TAU=Math.PI*2;
 const norm=a=>((a%TAU)+TAU)%TAU;
 const a1=norm(p1),a2=norm(p2);
 const segs=a1<=a2?[[a1,a2]]:[[a1,TAU],[0,a2]];
 for(const[s0,e0]of segs){const s=Math.max(s0,0),e=Math.min(e0,Math.PI);
  if(e-s<1e-3)continue;const ST=14;
  cx.beginPath();
  for(let k=0;k<=ST;k++){const x=-r+(2*r*k)/ST;
   const h=Math.sqrt(Math.max(0,r*r-x*x));const y=-h*Math.cos(s);
   k===0?cx.moveTo(x,y):cx.lineTo(x,y);}
  for(let k=ST;k>=0;k--){const x=-r+(2*r*k)/ST;
   const h=Math.sqrt(Math.max(0,r*r-x*x));cx.lineTo(x,-h*Math.cos(e));}
  cx.closePath();cx.fillStyle=color;cx.fill();}}

function drawBall(now){
 const bx=G.ballX,by=BALL_Y+G.airY,r=BALL_R;
 const skin=G.skin>=5?null:SKINS[G.skin]||SKINS[0];
 const main=skin?skin.main:`hsl(${(now*95)%360},85%,58%)`;
 const dark=skin?skin.dark:`hsl(${(now*95+35)%360},80%,45%)`;
 const shK=Math.max(.6,1-Math.abs(G.squash)*.4);
 /* тень на земле (уменьшается в полёте) */
 const airF=clamp01(1+G.airY/220);
 cx.fillStyle='rgba(0,0,0,'+(.22*airF+.06)+')';
 cx.beginPath();cx.ellipse(bx+1,BALL_Y+r*.82,r*.85*shK*airF,r*.3*shK*airF,0,0,6.28);cx.fill();
 cx.save();cx.translate(bx,by);
 const stretch=G.boost>0?[1.12,.92]:[1+G.squash*.3,1-G.squash*.3];
 cx.scale(stretch[0],stretch[1]);
 cx.rotate(G.lean);
 if(G.flash>0)cx.globalAlpha=.6+Math.sin(G.flash*40)*.25;
 /* аура режима */
 if(G.mode==='magnet'){
  drawGlow(0,0,r+22,'#4D96FF',.65);
  // искры по кругу
  for(let i=0;i<5;i++){const a=now*4+i*1.257;
   cx.fillStyle='#9ECEFF';
   cx.beginPath();cx.arc(Math.cos(a)*(r+13),Math.sin(a)*(r+13),3,0,6.28);cx.fill();}}
 else if(G.mode==='gold'){
  drawGlow(0,0,r+22,'#FFD93D',.7);
  if(Math.random()<.3)pushP({x:bx+(Math.random()-.5)*r*2,y:by-r,
   vx:0,vy:-40,life:.5,max:.5,sz:2.5,c:'#FFE566',g:-30,shape:'star',rot:0,rs:3});}
 else if(G.mode==='rainbow'){
  const hue=(now*130)%360;
  const gr=cx.createRadialGradient(0,0,r*.5,0,0,r+18);
  gr.addColorStop(0,`hsla(${hue},100%,60%,0)`);
  gr.addColorStop(1,`hsla(${hue},100%,60%,.55)`);
  cx.fillStyle=gr;cx.beginPath();cx.arc(0,0,r+18,0,6.28);cx.fill();
  if(Math.random()<.5)pushP({x:bx+(Math.random()-.5)*26,y:by+r*.7,
   vx:(Math.random()-.5)*60,vy:50+Math.random()*50,life:.5,max:.5,sz:3+Math.random()*3,
   c:POWER_COLS[Math.floor(Math.random()*6)],g:60,shape:'circ',rot:0,rs:0});}
 cx.save();cx.beginPath();cx.arc(0,0,r,0,6.28);cx.clip();
 cx.fillStyle=main;cx.fillRect(-r,-r,r*2,r*2);
 const rot=G.roadOff/r,N=5,period=Math.PI*2/N,whiteW=period*.26;
 for(let i=0;i<N;i++){const base=i*period-rot;
  ballBand(base+whiteW,base+period,dark,r);
  ballBand(base,base+whiteW,'#FFFFFF',r);}
 cx.restore();
 const sh=cx.createRadialGradient(-r*.35,-r*.35,r*.08,r*.08,r*.08,r*1.15);
 sh.addColorStop(0,'rgba(255,255,255,.45)');sh.addColorStop(.4,'rgba(255,255,255,.05)');
 sh.addColorStop(.78,'rgba(0,0,0,.08)');sh.addColorStop(1,'rgba(0,0,0,.42)');
 cx.fillStyle=sh;cx.beginPath();cx.arc(0,0,r,0,6.28);cx.fill();
 cx.fillStyle='rgba(255,255,255,.8)';
 cx.beginPath();cx.ellipse(-r*.34,-r*.38,r*.17,r*.11,-.6,0,6.28);cx.fill();
 cx.strokeStyle='rgba(0,0,0,.25)';cx.lineWidth=1.5;
 cx.beginPath();cx.arc(0,0,r-.75,0,6.28);cx.stroke();
 cx.globalAlpha=1;cx.restore();
 /* линии скорости */
 if(G.vel>SPD0+20||G.boost>0){
  cx.strokeStyle=G.boost>0?'rgba(255,224,130,.65)':'rgba(255,255,255,.3)';
  cx.lineWidth=G.boost>0?3:2;cx.lineCap='round';
  for(let i=0;i<2;i++){const lx=bx+(i===0?-r*.4:r*.4);
   const ly=by+r+6+((now*40*(3+i))%14);
   cx.beginPath();cx.moveTo(lx,ly);cx.lineTo(lx,ly+6);cx.stroke();}}
}

function starPath(x,y,outer,inner){cx.beginPath();
 for(let i=0;i<10;i++){const r=i%2===0?outer:inner;
  const a=Math.PI*2*i/10-Math.PI/2;
  i===0?cx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r):cx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}
 cx.closePath();}
function heartPath(x,y,s){cx.beginPath();
 cx.moveTo(x,y+s*.35);
 cx.bezierCurveTo(x-s,y-s*.45,x-s*.5,y-s*1.1,x,y-s*.35);
 cx.bezierCurveTo(x+s*.5,y-s*1.1,x+s,y-s*.45,x,y+s*.35);
 cx.closePath();}

/* ═══════════ ЦИКЛ ═══════════ */
function loop(t){
 if(!G.lastT)G.lastT=t;
 const dt=Math.min(.05,(t-G.lastT)/1000);G.lastT=t;
 update(dt);render();requestAnimationFrame(loop);}

genSideDeco();
document.getElementById('totalStars').innerHTML='⭐ <span>'+G.total+'</span>';
requestAnimationFrame(loop);
})();
