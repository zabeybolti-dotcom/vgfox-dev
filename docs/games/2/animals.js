/* ═══════════════════════════════════════════════════════════════
   ANIMALS.JS — кавии-зверята для «Катись, шарик!»
   Всё рисуется процедурно каждый кадр — поэтому всё живое:
   машущие ручки, шевелящиеся ушки, вилюющий хвостик, моргание,
   шагающие лапки, хлопающие крылышки, открытая радостная улыбка.
   Animals.draw(ctx, species, t, state) — центр зверя в (0,0),
   высота ~92px, лапки у y≈+46.
   state: {react:0..1, look:-1..1}
   ═══════════════════════════════════════════════════════════════ */
window.Animals=(()=>{
"use strict";
const TAU=Math.PI*2;
const EYE='#43302B',MOUTH='#8C5044',TONGUE='#FF97AC',BLUSH='rgba(255,110,135,.33)';

const PAL={
 bunny:{m:'#FFF8EF',d:'#F1E2CF',in:'#FFC3D4',out:'#E0C7B2',nose:'#FF8FA5'},
 bear:{m:'#C89468',d:'#B07E4F',l:'#F6DFC0',out:'#9A6B41',nose:'#5D4037'},
 fox:{m:'#F59E4C',d:'#DD7A2B',w:'#FFF6E9',out:'#C96A22',nose:'#4E342E'},
 frog:{m:'#8CD26B',d:'#6FBA4E',l:'#E6F8D2',out:'#57A23A'},
 chick:{m:'#FFD84D',d:'#F5BC33',l:'#FFF3B8',out:'#DFA02C',beak:'#FF9432'},
 owl:{m:'#BBA3E8',d:'#9F82D6',l:'#F1E9FC',out:'#8163BE',beak:'#FFB300'}
};

/* ── примитивы ── */
function ell(g,x,y,rx,ry,rot){g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,TAU);}
function circle(g,x,y,r){g.beginPath();g.arc(x,y,Math.max(.1,r),0,TAU);}
function shape(g,fill,out,lw){
 if(fill){g.fillStyle=fill;g.fill();}
 if(out){g.strokeStyle=out;g.lineWidth=lw||2.8;g.lineJoin='round';g.stroke();}}
function eye(g,x,y,r,blink,look){
 if(blink){g.strokeStyle=EYE;g.lineWidth=2.6;g.lineCap='round';
  g.beginPath();g.arc(x,y+2,r*.8,Math.PI*.12,Math.PI*.88);g.stroke();return;}
 const ex=x+look*r*.3;
 g.fillStyle=EYE;circle(g,ex,y,r);g.fill();
 g.fillStyle='#FFFFFF';circle(g,ex-r*.32,y-r*.36,r*.36);g.fill();
 circle(g,ex+r*.3,y+r*.3,r*.17);g.fill();}
function bigEye(g,x,y,r,blink,look,iris){
 const ex=x+look*r*.3;
 g.fillStyle='#FFFFFF';circle(g,x,y,r);g.fill();
 g.strokeStyle='rgba(67,48,43,.22)';g.lineWidth=1.5;g.stroke();
 if(blink){g.strokeStyle=EYE;g.lineWidth=2.8;g.lineCap='round';
  g.beginPath();g.arc(x,y,r*.72,Math.PI*.15,Math.PI*.85);g.stroke();return;}
 g.fillStyle=iris||EYE;circle(g,ex,y,r*.52);g.fill();
 g.fillStyle='#FFFFFF';circle(g,ex-r*.2,y-r*.22,r*.17);g.fill();
 circle(g,ex+r*.22,y+r*.24,r*.1);g.fill();}
function smile(g,x,y,w,open){
 if(open>0){const h=w*(.5+.4*Math.min(1,open));
  g.fillStyle=MOUTH;g.beginPath();
  g.moveTo(x-w*.5,y);g.quadraticCurveTo(x,y-2,x+w*.5,y);
  g.quadraticCurveTo(x+w*.58,y+h*.85,x,y+h);
  g.quadraticCurveTo(x-w*.58,y+h*.85,x-w*.5,y);g.fill();
  g.fillStyle=TONGUE;ell(g,x,y+h*.68,w*.26,h*.3);g.fill();}
 else{g.strokeStyle=EYE;g.lineWidth=2.6;g.lineCap='round';
  g.beginPath();g.arc(x,y-w*.35,w*.55,Math.PI*.15,Math.PI*.85);g.stroke();}}
function blush(g,x,y){g.fillStyle=BLUSH;
 ell(g,x,y,6,4);g.fill();ell(g,-x,y,6,4);g.fill();}
function armWave(g,sx,sy,side,ang0,amp,ph,len,w,col){
 const a=ang0+Math.sin(ph)*amp;
 g.save();g.translate(sx,sy);g.scale(side,1);g.rotate(a);
 g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';
 g.beginPath();g.moveTo(0,0);g.lineTo(len,0);g.stroke();
 g.fillStyle=col;circle(g,len,0,w*.55);g.fill();
 g.restore();}
function foot(g,x,y,rx,ry,rot,fill,out){ell(g,x,y,rx,ry,rot);shape(g,fill,out,2.2);}
/* ручки: обычно мило машут, при react — подняты и хлопают восторженно */
function arms(g,t,st,dy,P){
 const ex=st.react>0;
 const base=ex?-1.05:.5,amp=ex?.5:.32,sp=ex?14:5;
 armWave(g,-20,dy,-1,base,amp,t*sp,12,10.5,P.m);
 armWave(g,20,dy,1,base,amp,t*sp+1.4,12,10.5,P.m);}
function stepLift(g,s,t){return Math.max(0,Math.sin(t*6+(s>0?0:Math.PI)))*3;}

/* ═════════ ЗАЙКА ═════════ */
function bunny(g,t,st){
 const P=PAL.bunny;
 for(const s of[-1,1]){                      // ушки качаются
  g.save();g.translate(s*12,-31);g.rotate(s*(.16+Math.sin(t*2.6)*.06));
  ell(g,0,-16,9.5,17);shape(g,P.m,P.out);
  ell(g,0,-15,4.7,11.5);g.fillStyle=P.in;g.fill();
  g.restore();}
 for(const s of[-1,1]){                      // лапки шагают
  const l=stepLift(g,s,t);
  foot(g,s*10,42-l,9,6,s*.12,P.m,P.out);}
 ell(g,0,21,20,17);shape(g,P.m,P.out);       // тельце
 ell(g,0,26,11,9);g.fillStyle='#FFFDF8';g.fill();
 arms(g,t,st,12,P);
 circle(g,0,-9,27);shape(g,P.m,P.out);       // голова
 g.fillStyle=P.nose;ell(g,0,-6,4,3);g.fill();// носик
 g.fillStyle='#FFFFFF';g.strokeStyle='rgba(67,48,43,.35)';g.lineWidth=1;
 if(st.react>0){                              // смеётся: открытый ротик + зубки
  smile(g,0,3,16,1);
  g.fillRect(-3.8,0,3.6,6);g.strokeRect(-3.8,0,3.6,6);
  g.fillRect(.2,0,3.6,6);g.strokeRect(.2,0,3.6,6);}
 else{                                        // зубки растут из улыбки
  g.fillRect(-3.8,1,3.6,7);g.strokeRect(-3.8,1,3.6,7);
  g.fillRect(.2,1,3.6,7);g.strokeRect(.2,1,3.6,7);
  g.strokeStyle=EYE;g.lineWidth=2.6;g.lineCap='round';
  g.beginPath();g.moveTo(-9,5);g.quadraticCurveTo(0,10.5,9,5);g.stroke();}
 eye(g,-11,-13,5.8,(t%3.7)<.13,st.look);
 eye(g,11,-13,5.8,(t%3.7)<.13,st.look);
 blush(g,17,-3);}

/* ═════════ МИШКА ═════════ */
function bear(g,t,st){
 const P=PAL.bear;
 for(const s of[-1,1]){                      // круглые ушки
  circle(g,s*23,-29,11);shape(g,P.m,P.out);
  circle(g,s*23,-29,5.5);g.fillStyle=P.l;g.fill();}
 for(const s of[-1,1]){
  const l=stepLift(g,s,t);
  foot(g,s*12,42-l,10,6.5,s*.1,P.m,P.out);}
 ell(g,0,21,23,17);shape(g,P.m,P.out);       // тельце
 ell(g,0,25,12,9);g.fillStyle=P.l;g.fill();
 arms(g,t,st,12,P);
 circle(g,0,-8,28);shape(g,P.m,P.out);       // голова
 ell(g,0,4,15,11);g.fillStyle=P.l;g.fill();  // мордочка
 g.fillStyle=P.nose;ell(g,0,-1,4.5,3.4);g.fill();
 smile(g,0,4,13,st.react>0?1:0);
 eye(g,-12,-13,5.6,(t%4.1)<.13,st.look);
 eye(g,12,-13,5.6,(t%4.1)<.13,st.look);
 blush(g,19,-3);}

/* ═════════ ЛИСЁНОК ═════════ */
function fox(g,t,st){
 const P=PAL.fox;
 g.save();g.translate(20,25);g.rotate(.55+Math.sin(t*6)*.2);   // хвост виляет
 g.lineCap='round';
 g.strokeStyle=P.out;g.lineWidth=24;
 g.beginPath();g.moveTo(0,-4);g.lineTo(0,24);g.stroke();
 g.strokeStyle=P.m;g.lineWidth=18;
 g.beginPath();g.moveTo(0,-4);g.lineTo(0,24);g.stroke();
 circle(g,0,25,11);shape(g,P.w,P.out,2.4);   // пушистый кончик
 g.restore();
 for(const s of[-1,1]){                      // острые ушки
  g.save();g.translate(s*16,-30);g.rotate(s*(.24+Math.sin(t*2.4)*.05));
  g.beginPath();g.moveTo(-10.5,7);g.quadraticCurveTo(0,-23,10.5,7);
  g.quadraticCurveTo(0,11,-10.5,7);g.closePath();shape(g,P.m,P.out);
  g.beginPath();g.moveTo(-4.5,1);g.quadraticCurveTo(0,-13,4.5,1);
  g.quadraticCurveTo(0,4,-4.5,1);g.closePath();g.fillStyle=P.w;g.fill();
  g.restore();}
 for(const s of[-1,1]){
  const l=stepLift(g,s,t);
  foot(g,s*11,42-l,9.5,6,s*.14,P.m,P.out);}
 ell(g,0,21,21,16);shape(g,P.m,P.out);       // тельце
 ell(g,0,25,11,9);g.fillStyle=P.w;g.fill();  // белая грудка
 arms(g,t,st,12,P);
 ell(g,0,-8,29,26);shape(g,P.m,P.out);       // голова
 ell(g,0,3,14,10);g.fillStyle=P.w;g.fill();  // белая мордочка
 g.fillStyle=P.nose;ell(g,0,-2,4,3.2);g.fill();
 smile(g,0,4,13,st.react>0?1:0);
 eye(g,-11,-14,5.6,(t%3.5)<.13,st.look);
 eye(g,11,-14,5.6,(t%3.5)<.13,st.look);
 blush(g,18,-5);}

/* ═════════ ЛЯГУШОНОК ═════════ */
function frog(g,t,st){
 const P=PAL.frog;
 for(const s of[-1,1]){                      // глазки на макушке
  circle(g,s*14,-30,10.5);shape(g,P.m,P.out);}
 foot(g,-16,38,10.5,5.5,-.25,P.d,P.out);     // лапки-ласты
 foot(g,16,38,10.5,5.5,.25,P.d,P.out);
 ell(g,0,7,33,27);shape(g,P.m,P.out);        // тело-голова
 ell(g,0,13,21,14);g.fillStyle=P.l;g.fill(); // брюшко
 arms(g,t,st,10,P);
 g.fillStyle='rgba(67,48,43,.4)';            // ноздри-точечки
 circle(g,-6.5,-11,1.2);g.fill();circle(g,6.5,-11,1.2);g.fill();
 if(st.react>0)smile(g,0,4,22,1);
 else{g.strokeStyle=EYE;g.lineWidth=2.8;g.lineCap='round';
  g.beginPath();g.arc(0,-2,15,Math.PI*.2,Math.PI*.8);g.stroke();}
 bigEye(g,-14,-31,6.3,(t%4.3)<.13,st.look,'#41541F');
 bigEye(g,14,-31,6.3,(t%4.3)<.13,st.look,'#41541F');
 blush(g,23,0);}

/* ═════════ ЦЫПЛЁНОК ═════════ */
function chick(g,t,st){
 const P=PAL.chick;
 g.strokeStyle='#F5A623';g.lineWidth=2.4;g.lineCap='round';   // хохолок
 for(const i of[-1,0,1]){
  g.beginPath();g.moveTo(i*4,-33);
  g.quadraticCurveTo(i*8,-44,i*11,-40);g.stroke();}
 for(const s of[-1,1]){                      // лапки шагают
  const l=stepLift(g,s,t),fy=41-l;
  g.strokeStyle=P.beak;g.lineWidth=2.8;g.lineCap='round';
  g.beginPath();g.moveTo(s*8,33);g.lineTo(s*9,fy);g.stroke();
  for(const k of[-1,0,1]){g.beginPath();g.moveTo(s*9,fy);
   g.lineTo(s*9+k*4.5,fy+4);g.stroke();}}
 circle(g,0,3,30);shape(g,P.m,P.out);        // круглый пухлик
 ell(g,0,15,15,10);g.fillStyle=P.l;g.fill();
 for(const s of[-1,1]){                      // крылышки хлопают
  g.save();g.translate(s*27,3);g.rotate(s*(.35+Math.sin(t*9)*.5));
  ell(g,0,9,7.5,12);g.fillStyle=P.d;g.fill();g.restore();}
 g.fillStyle=P.beak;                         // клювик-ромбик с приоткрытой нижней створкой
 g.beginPath();g.moveTo(-8,2);g.lineTo(0,-2.5);g.lineTo(8,2);g.lineTo(0,8.5);
 g.closePath();g.fill();
 g.strokeStyle='rgba(67,48,43,.25)';g.lineWidth=1.2;g.stroke();
 g.fillStyle='#F5821E';
 g.beginPath();g.moveTo(-5,8.5);g.lineTo(5,8.5);g.lineTo(0,13.5);g.closePath();g.fill();
 g.fillStyle='rgba(255,255,255,.4)';         // блик
 g.beginPath();g.moveTo(-5,1.4);g.lineTo(-1.5,-.6);g.lineTo(-1.5,2);g.closePath();g.fill();
 eye(g,-10,-7,5.4,(t%3.9)<.13,st.look);
 eye(g,10,-7,5.4,(t%3.9)<.13,st.look);
 blush(g,17,0);}

/* ═════════ СОВЁНОК ═════════ */
function owl(g,t,st){
 const P=PAL.owl;
 for(const s of[-1,1]){                      // кисточки
  g.save();g.translate(s*17,-37);g.rotate(s*(.3+Math.sin(t*2.2)*.06));
  g.beginPath();g.moveTo(-5.5,5);g.quadraticCurveTo(0,-13,5.5,5);
  g.quadraticCurveTo(0,8,-5.5,5);g.closePath();shape(g,P.d,P.out,2.4);g.restore();}
 for(const s of[-1,1]){                      // крылышки машут
  g.save();g.translate(s*26,5);g.rotate(s*(.2+Math.sin(t*7)*.35));
  ell(g,s*3,9,7.5,14);shape(g,P.d,P.out,2.4);g.restore();}
 for(const s of[-1,1]){                      // лапки-пальчики
  g.strokeStyle=P.beak;g.lineWidth=2.8;g.lineCap='round';
  const l=stepLift(g,s,t);
  for(const k of[-1,0,1]){g.beginPath();g.moveTo(s*8,34-l);
   g.lineTo(s*8+k*4,41-l);g.stroke();}}
 ell(g,0,2,28,33);shape(g,P.m,P.out);        // пушистое тельце
 ell(g,0,13,17,18);g.fillStyle=P.l;g.fill(); // брюшко
 g.strokeStyle=P.d;g.lineWidth=1.8;g.lineCap='round';         // узор «ёлочкой»
 for(let r=0;r<3;r++)for(let c=0;c<3;c++){
  const bx=-6+c*6+(r%2)*3,by=10+r*6.5;
  g.beginPath();g.arc(bx,by,3,Math.PI*.25,Math.PI*.75);g.stroke();}
 bigEye(g,-11,-11,9.5,(t%4.5)<.13,st.look,'#6B4FA0');
 bigEye(g,11,-11,9.5,(t%4.5)<.13,st.look,'#6B4FA0');
 g.fillStyle=P.beak;                         // клювик
 g.beginPath();g.moveTo(-4.5,-1);g.lineTo(4.5,-1);g.lineTo(0,7);g.closePath();g.fill();
 g.strokeStyle='#E08A00';g.lineWidth=1.2;g.stroke();
 blush(g,18,1);}

const FNS={bunny,bear,fox,frog,chick,owl};

function draw(g,sp,t,st){
 st=st||{};
 const fn=FNS[sp];if(!fn)return;
 g.save();
 const br=Math.sin(t*2.4)*.018;              // дыхание
 g.scale(1+br,1-br);
 fn(g,t,st);
 g.restore();
}
return{draw,PAL};
})();
