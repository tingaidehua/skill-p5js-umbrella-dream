// 仅用于无网络环境下的截图测试：只实现了模板用到的 p5 函数（random/noise/createCanvas 等）。
// 正式渲染请换成真正的 p5.min.js（--shim=/path/to/p5.min.js）。
(function(){
let seed=1; function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
window.TAU=Math.PI*2; window.deltaTime=16.7; window.windowWidth=innerWidth; window.windowHeight=innerHeight;
window.randomSeed=s=>{seed=s*1000+1;}; window.noiseSeed=()=>{};
window.random=(a,b)=>{ if(Array.isArray(a)) return a[Math.floor(rnd()*a.length)]; if(a===undefined) return rnd(); if(b===undefined) return rnd()*a; return a+rnd()*(b-a);};
window.randomGaussian=(m=0,s=1)=>{let u=rnd()||1e-9,v=rnd();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);};
const P=[];for(let i=0;i<512;i++)P.push(Math.floor(Math.abs(Math.sin(i*12.9898)*43758.5453)%256));
const h=(i,j)=>P[(P[i&255]+j)&255]/255; const f=t=>t*t*(3-2*t);
window.noise=(x,y=0,z=0)=>{x+=z*1.7;y-=z*1.3;let s=0,a=0.5,n=0;for(let o=0;o<4;o++){const xi=Math.floor(x),yi=Math.floor(y),xf=f(x-xi),yf=f(y-yi);
 const v=(h(xi,yi)*(1-xf)+h(xi+1,yi)*xf)*(1-yf)+(h(xi,yi+1)*(1-xf)+h(xi+1,yi+1)*xf)*yf; s+=v*a;n+=a;a*=0.5;x*=2;y*=2;} return s/n;};
let pd=1; window.pixelDensity=d=>{pd=d}; window.displayDensity=()=>1;
let cv; window.createCanvas=(w,h)=>{cv=document.createElement('canvas');cv.width=w*pd;cv.height=h*pd;cv.style.width=w+'px';cv.style.height=h+'px';document.body.appendChild(cv);window.drawingContext=cv.getContext('2d');drawingContext.scale(pd,pd);return cv;};
window.resizeCanvas=()=>{};
window.createGraphics=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return {elt:c,pixelDensity(){},drawingContext:c.getContext('2d')};};
let looping=true; window.noLoop=()=>{looping=false}; window.saveCanvas=()=>{}; window.millis=()=>performance.now();
window.addEventListener('load',()=>{setup(); const fr=()=>{ if(looping) draw(); requestAnimationFrame(fr);}; fr();});
})();
