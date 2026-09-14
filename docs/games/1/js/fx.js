'use strict';
/* ===== Частицы, всплывашки, конфетти ===== */
function burst(x,y,list,n=10,pw=1){for(let i=0;i<n;i++){const p=document.createElement('div');p.className='particle';
  p.textContent=pick(list);const a=rnd(0,Math.PI*2),d=rnd(55,120)*pw;
  p.style.cssText=`left:${x}px;top:${y}px;font-size:${rnd(20,34)*pw}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-45}px;--rot:${rnd(-540,540)}deg;--dur:${rnd(.8,1.2)}s;--ps:${rnd(.9,1.4)}`;
  document.body.appendChild(p);setTimeout(()=>p.remove(),1300)}}
function popup(x,y,txt,gold){const p=document.createElement('div');p.className='pop'+(gold?' gold':'');p.textContent=txt;
  p.style.left=x+'px';p.style.top=y+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1050)}
function ringPop(x,y,size){const r=document.createElement('div');r.className='ring';
  r.style.cssText=`left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px`;
  document.body.appendChild(r);setTimeout(()=>r.remove(),400)}
function puffs(rect){for(let i=0;i<3;i++){const p=document.createElement('div');p.className='puff';
  const s=rect.width*rnd(.2,.32);
  p.style.cssText=`left:${rect.left+rect.width*rnd(.2,.7)}px;top:${rect.top+rect.height*rnd(.45,.65)}px;width:${s}px;height:${s*.7}px`;
  document.body.appendChild(p);setTimeout(()=>p.remove(),500)}}
function confetti(n=42){const cols=['#ff6b6b','#ffd93d','#6bcB77','#4d96ff','#ff8ae2','#ffa94d'];
  for(let i=0;i<n;i++){const c=document.createElement('div');c.className='confetti';
    c.style.cssText=`left:${rnd(0,100)}vw;background:${pick(cols)};animation-duration:${rnd(1.8,3)}s;animation-delay:${rnd(0,.6)}s;--cx:${rnd(-60,60)}px;--cr:${rnd(-900,900)}deg;width:${rnd(8,13)}px;height:${rnd(12,18)}px`;
    document.body.appendChild(c);setTimeout(()=>c.remove(),4200)}}
