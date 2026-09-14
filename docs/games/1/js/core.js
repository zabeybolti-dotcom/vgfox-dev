'use strict';
/* ===== Базовые помощники и состояние ===== */
const $=s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;

/* интерполяция цветов #rrggbb */
function mixColor(c1,c2,k){
  const h=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
  const a=h(c1),b=h(c2);
  return `rgb(${Math.round(lerp(a[0],b[0],k))},${Math.round(lerp(a[1],b[1],k))},${Math.round(lerp(a[2],b[2],k))})`;
}

/* ускоренный цикл дня/ночи для отладки: index.html?fast */
const FAST=/[?&]fast/.test(location.search);

/* настройки (localStorage) */
function loadBool(k,d){try{const v=localStorage.getItem(k);return v===null?d:v==='1'}catch(e){return d}}
function saveBool(k,v){try{localStorage.setItem(k,v?'1':'0')}catch(e){}}

/* общее состояние игры */
const G={started:false,paused:false};
