const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./tumble-Jrq1b6UK.js","./tumble-Bki9E_rq.js"])))=>i.map(i=>d[i]);
import{a as e,c as t,d as n,f as r,g as i,h as a,i as o,l as s,m as c,n as l,o as u,p as d,r as f,s as p,t as m,u as h}from"./tumble-Bki9E_rq.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function g(e){return Math.min(1,u+a*e)}function _(e){let n=t.reduce((e,t)=>e+t.weight,0),r=e()*n;for(let e of t)if(r-=e.weight,r<0)return e;return t[t.length-1]}function v(){return{spinCount:0,spawnDryStreak:0,fill:0}}function y(e,t=Math.random){let n=(e.spinCount||0)+1,r=e.spawnDryStreak||0,i=e.fill||0,a=t()<g(r),o=null;a?(r=0,o=_(t),i+=o.fill):r+=1;let s=i>=100;s&&(i-=100);let c=Math.min(1,i/100);return{state:{spinCount:n,spawnDryStreak:r,fill:i},bottleSpawned:a,bottleType:o,triggerEvent:s,fill:i,fillFraction:c}}var b=`modulepreload`,x=function(e,t){return new URL(e,t).href},S={},ee=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,new URL(`../../../src/node/plugins/importAnalysisBuild.ts`,import.meta.url)).href}r=o(t.map(t=>{if(t=x(t,n),t=s(t),t in S)return;S[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:b,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function te(e,t){let n=e.reduce((e,t)=>e+t.weight,0),r=t()*n;for(let t of e)if(r-=t.weight,r<0)return t;return e[e.length-1]}function ne(e){let t=s.fill_tiers,n=t[0];for(let r of t)(e||0)>=r.min_fill&&(n=r);return n}function re(e,t,n=Math.random,r={}){let i=!!r.freeSpin,a=ne(t),o=i?h.shot_chance:a.shot_chance,c=new Set,l=[];for(let t of e.steps)for(let e of t.clusters)for(let{row:n,col:r}of e.cells){if(t.grid[n][r]!==`wld`)continue;let e=`${n},${r}`;c.has(e)||(c.add(e),l.push({row:n,col:r}))}let u=[],d=[];for(let{row:e,col:t}of l){let r=n()<o,i=0;r&&(i=te(s.buff_values,n).value,d.push({row:e,col:t,value:i})),u.push({row:e,col:t,shot:r,value:i})}return{tier:a,shotChance:o,freeSpin:i,shots:u,buffed:d,chickenCount:u.length,shotCount:d.length}}function ie(e,t){if(t.length===0)return{win:e.totalWin,boostedClusters:[]};let n=new Map(t.map(e=>[`${e.row},${e.col}`,e.value])),r=new Set,i=0,a=[];return e.steps.forEach((e,t)=>{let o=e.winMultiplier||1;for(let s of e.clusters){let e=l(s),c=0;for(let e of s.cells){let t=`${e.row},${e.col}`,i=n.get(t);i&&!r.has(t)&&(c+=i,r.add(t))}let u=c>0?c:1,d=e*u*o;i+=d,u>1&&a.push({step:t,symbol:s.symbol,size:s.cells.length,baseWin:e,factor:u,win:d})}}),{win:i,boostedClusters:a}}function ae(e,t){let n=new Map(e.map(e=>[`${e.row},${e.col}`,{value:e.value,age:e.age||0}]));for(let e of t){let t=`${e.row},${e.col}`,r=n.get(t);n.set(t,{value:r===void 0?e.value:Math.min(r.value+e.value,c.max_value),age:0})}return Array.from(n,([e,{value:t,age:n}])=>{let[r,i]=e.split(`,`).map(Number);return{row:r,col:i,value:t,age:n}})}function oe(e,t,n,r={}){let i=r.persistFresh!==!1;if(e.length===0)return[];let a=new Set;for(let e of n.steps)for(let t of e.clusters)for(let{row:e,col:n}of t.cells)a.add(`${e},${n}`);let o=new Set(t.map(e=>`${e.row},${e.col}`)),s=[];for(let t of e){let e=`${t.row},${t.col}`;if(i&&o.has(e))s.push({...t,age:0});else if(!a.has(e)){let e=(t.age||0)+1,n=c.ferment_interval>0&&e%c.ferment_interval===0?Math.min(t.value+c.ferment_amount,c.max_value):t.value;s.push({...t,value:n,age:e})}}return s}var se=typeof process<`u`&&process.argv&&process.argv[1];if(se&&decodeURIComponent(import.meta.url).endsWith(se.replace(/\\/g,`/`))){let{createGrid:e,runTumble:t}=await ee(async()=>{let{createGrid:e,runTumble:t}=await import(`./tumble-Jrq1b6UK.js`);return{createGrid:e,runTumble:t}},__vite__mapDeps([0,1]),import.meta.url);for(let n of[0,34,68]){let r=ne(n);console.log(`\n=== fill ${n} → shot chance ${r.shot_chance*100}% per clustered chicken ===`);for(let r=1;r<=4;r+=1){let i=re(t(e(),Math.random,{persistentStickyWilds:!0,temporaryWilds:!0}),n,Math.random);console.log(`  spin #${r}: clustered chickens=${i.chickenCount}, shot=${i.shotCount}`+(i.buffed.length?` [${i.buffed.map(e=>`x${e.value}@${e.row},${e.col}`).join(` `)}]`:``))}}}function ce(){let e=typeof globalThis<`u`&&globalThis.crypto||typeof window<`u`&&window.crypto||typeof self<`u`&&self.crypto;if(!e||!e.subtle)throw Error(`Web Crypto API (crypto.subtle) is not available in this environment.`);return e}function le(e){let t=``;for(let n=0;n<e.length;n+=1)t+=e[n].toString(16).padStart(2,`0`);return t}function ue(e=32){let t=new Uint8Array(e);return ce().getRandomValues(t),le(t)}function de(e=16){let t=new Uint8Array(e);return ce().getRandomValues(t),le(t)}var fe=Object.freeze({IDLE:`IDLE`,SPINNING:`SPINNING`,TUMBLING:`TUMBLING`,RESULT:`RESULT`});function pe(){return{phase:fe.IDLE,bottle:v(),persistentBuffs:[],freeSpins:{remaining:0,total:0,sessionWin:0},seeds:{serverSeed:ue(),clientSeed:de(),nonce:0},spinCount:0,lastResult:null}}function me(e,t){let r=[],i=0;for(let t=0;t<n.rows;t+=1)for(let a=0;a<n.cols;a+=1)e[t][a]===`wld`?i+=1:r.push({row:t,col:a});let a=h.guaranteed_chickens-i;for(;a>0&&r.length>0;){let n=Math.floor(t()*r.length),{row:i,col:o}=r[n];r.splice(n,1),e[i][o]=`wld`,--a}}function he(e,t){let n=e.seeds.nonce+1;return{phase:fe.RESULT,seeds:{...e.seeds,nonce:n},spinCount:e.spinCount+1,lastResult:t}}function ge(e,t=Math.random){let n=e.freeSpins||{remaining:0,total:0,sessionWin:0},i=n.remaining>0,a=o();i&&me(a,t);let s=m(a,t,{persistentStickyWilds:!0,temporaryWilds:!0}),c=re(s,e.bottle.fill,t,{freeSpin:i}),l=ae(e.persistentBuffs,c.buffed),{win:u,boostedClusters:d}=ie(s,l),f=oe(l,c.buffed,s,{persistFresh:!i||h.buffs_persist}),p,g;p=i&&h.meter_frozen?{state:e.bottle,bottleSpawned:!1,bottleType:null,triggerEvent:!1,fill:e.bottle.fill,fillFraction:Math.min(1,(e.bottle.fill||0)/100)}:y(e.bottle,t);let _=Math.min(u,r),v=null;if(i){let e=n.sessionWin;_=Math.min(_,r-e);let t=e+_,i=n.remaining-1;v={index:n.total-n.remaining+1,total:n.total,remaining:i,sessionWin:t},g=i>0?{remaining:i,total:n.total,sessionWin:t}:{remaining:0,total:0,sessionWin:0}}else g=p.triggerEvent?{remaining:h.count,total:h.count,sessionWin:0}:n;let b={serverSeed:e.seeds.serverSeed,clientSeed:e.seeds.clientSeed,nonce:e.seeds.nonce+1},x={baseWin:u,totalWin:_,isFreeSpin:i,seedInfo:b,grid:a,tumble:s,chickenShots:c,boostedClusters:d,freeSpins:v,freeSpinsQueued:!i&&p.triggerEvent?h.count:0,baseWinRaw:s.totalWin,effectiveBuffs:l,persistentBuffs:f,cascadeLevel:s.cascadeLevel,cascadeLog:s.cascadeLog,temporaryWildCount:s.temporaryWildCount,bottle:{spawned:p.bottleSpawned,type:p.bottleType,fill:p.fill,fillFraction:p.fillFraction,meterReset:p.triggerEvent,frozen:i&&h.meter_frozen},phases:[fe.SPINNING,fe.TUMBLING,fe.RESULT]};return{state:{...e,...he(e,x),bottle:p.state,persistentBuffs:f,freeSpins:g},result:x}}var _e=Object.keys(i).filter(e=>e!==`wld`);function ve(e,t){return`${e},${t}`}function ye(e){return e.reduce((e,t)=>e+t,0)/e.length}function be(e){let t=ye(e);return Math.sqrt(ye(e.map(e=>(e-t)**2)))}function xe(e){return{mean:ye(e),sd:be(e),min:Math.min(...e),max:Math.max(...e)}}function Se(){return{bySymbol:Object.fromEntries(_e.map(e=>[e,0])),multiplierWin:0,firstCascadeWin:0,laterCascadeWin:0,clusterCount:0,clusterCells:0,maxClusterSize:0,cascadeCount:0}}function Ce(e,t){let n=new Map((t.effectiveBuffs||[]).map(e=>[ve(e.row,e.col),e.value]));e.cascadeCount+=t.tumble.steps.length,t.tumble.steps.forEach((t,r)=>{for(let i of t.clusters){let t=l(i),a=0;for(let e of i.cells)a+=n.get(ve(e.row,e.col))||0;let o=a>0?a:1,s=t*o;e.bySymbol[i.symbol]+=s,e.multiplierWin+=t*(o-1),r===0?e.firstCascadeWin+=s:e.laterCascadeWin+=s,e.clusterCount+=1,e.clusterCells+=i.cells.length,i.cells.length>e.maxClusterSize&&(e.maxClusterSize=i.cells.length)}})}function we({batches:e,spinsPerBatch:t,rng:n,clearPersistentBuffs:r}){let i=[],a=[],o=0,s=0,c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=Se();for(let b=0;b<e;b+=1){let e=pe(),b=0,x=0,S=new Map,ee=0;for(;ee<t;){let{state:t,result:i}=ge(e,n);if(e=r?{...t,persistentBuffs:[]}:t,b+=i.totalWin,i.isFreeSpin?(l+=1,d+=i.totalWin):(ee+=1,c+=1,x+=i.totalWin,i.freeSpinsQueued>0&&(u+=1)),f+=1,i.totalWin>0&&(o+=1),i.totalWin>s&&(s=i.totalWin),Ce(y,i),i.chickenShots){p+=i.chickenShots.chickenCount,m+=i.chickenShots.shotCount,i.chickenShots.shotCount>0&&(h+=1);let e=r?[]:i.persistentBuffs;g+=e.length;let t=new Set(e.map(e=>ve(e.row,e.col)));for(let[e,n]of S)t.has(e)||(_+=1,n>=2&&(v+=1),S.delete(e));for(let e of t)S.set(e,(S.get(e)||0)+1)}}for(let e of S.values())_+=1,e>=2&&(v+=1);i.push(b/t),a.push(x/t)}return{total:xe(i),base:xe(a),hitRate:o/f,maxWin:s,freeSpins:{triggers:u,spins:l,triggerRate:c?u/c:0,avgWinPerFreeSpin:l?d/l:0,rtpContribution:c?d/c:0},chickenShots:{baseSpins:c,chickensPerSpin:p/f,shotRatePerChicken:p?m/p:0,buffedSpinRate:h/f},persistentBuffs:{avgOnBoard:g/f,survivalRate2Plus:_?v/_:0,lifetimesCompleted:_},breakdown:y}}function Te(e=10,t=1e5,n=Math.random){let r=Date.now(),i=we({batches:e,spinsPerBatch:t,rng:n,clearPersistentBuffs:!1}),a=we({batches:e,spinsPerBatch:t,rng:n,clearPersistentBuffs:!0}),o=Date.now()-r,s=e*t,c={batches:e,spinsPerBatch:t,totalSpins:s,total:i.total,base:i.base,hitRate:i.hitRate,maxWin:i.maxWin,elapsedMs:o,freeSpins:i.freeSpins,chickenShots:i.chickenShots,persistentBuffs:i.persistentBuffs,breakdown:i.breakdown,noPersistentBuffCarry:a.base,persistentBuffDelta:i.base.mean-a.base.mean},l=e=>`${(e*100).toFixed(2)}%`,u=e=>`${(e*100).toFixed(2)} pp`,d=(e,t)=>`${e.padEnd(12)} mean ${l(t.mean).padStart(7)}  sd ${(t.sd*100).toFixed(2).padStart(5)}  range [${l(t.min)} - ${l(t.max)}]`;console.log(`=== Drunk Farmer QA - ${e} x ${t.toLocaleString()} spins (${s.toLocaleString()} total, ${o} ms) ===`),console.log(d(`Total RTP:`,c.total)),console.log(d(`Base RTP:`,c.base)),console.log(`Hit rate:    ${l(c.hitRate)}`),console.log(`Max win:     ${c.maxWin.toFixed(2)}x`);let f=c.freeSpins;console.log(`Free spins:  trigger 1 in ${f.triggerRate?Math.round(1/f.triggerRate).toLocaleString():`∞`} paid spins, ${f.spins.toLocaleString()} free spins played, avg ${f.avgWinPerFreeSpin.toFixed(2)}x per free spin, feature adds ${u(f.rtpContribution)} RTP`);let p=c.chickenShots;console.log(`Chicken shots: ${p.chickensPerSpin.toFixed(2)} clustered chickens/spin, shot ${l(p.shotRatePerChicken)} of them, >=1 buffed cluster on ${l(p.buffedSpinRate)} of base spins`);let m=c.persistentBuffs;console.log(`Persistent buffs: ${m.avgOnBoard.toFixed(3)} avg hot cells/spin, ${l(m.survivalRate2Plus)} of buff lifetimes survive >=2 spins (${m.lifetimesCompleted.toLocaleString()} lifetimes sampled)`),console.log(`
--- Base RTP leak breakdown (uncapped base wins, real engine) ---`),console.log(`RTP by symbol (percentage points of Base RTP):`);let h=Object.entries(c.breakdown.bySymbol).sort((e,t)=>t[1]-e[1]).map(([e,t])=>({symbol:e,pp:t/s}));for(let e of h)console.log(`  ${e.symbol.padEnd(3)} ${u(e.pp).padStart(9)}`);console.log(`
Persistent buff carry control:`),console.log(`  current carry+stack: ${l(c.base.mean)} Base RTP`),console.log(`  clear after spin:    ${l(c.noPersistentBuffCarry.mean)} Base RTP`),console.log(`  isolated delta:      ${u(c.persistentBuffDelta)}`),console.log(`
Chicken-shot multiplier contribution:`),console.log(`  total uplift from buff multipliers: ${u(c.breakdown.multiplierWin/s)}`);let g=c.breakdown.firstCascadeWin+c.breakdown.laterCascadeWin,_=g?c.breakdown.laterCascadeWin/g:0,v=g?c.breakdown.firstCascadeWin/g:0;console.log(`
Cascade payout split:`),console.log(`  first hit: ${u(c.breakdown.firstCascadeWin/s)} (${l(v)} of paid base wins)`),console.log(`  steps 2+:  ${u(c.breakdown.laterCascadeWin/s)} (${l(_)} of paid base wins)`);let y=c.breakdown.clusterCount?c.breakdown.clusterCells/c.breakdown.clusterCount:0;return console.log(`
Cluster/cascade shape:`),console.log(`  avg cluster size: ${y.toFixed(2)} cells`),console.log(`  max cluster size: ${c.breakdown.maxClusterSize} cells`),console.log(`  avg cascades per spin: ${(c.breakdown.cascadeCount/s).toFixed(3)}`),c}Te(2,2e4);var Ee=512,De={10:new URL(``+new URL(`sym-10-CymzfICx.png`,import.meta.url).href,``+import.meta.url).href,J:new URL(``+new URL(`sym-j-DFnwt3JA.png`,import.meta.url).href,``+import.meta.url).href,Q:new URL(``+new URL(`sym-q-fQFtm7Iu.png`,import.meta.url).href,``+import.meta.url).href,K:new URL(``+new URL(`sym-k-Bt0GMjwG.png`,import.meta.url).href,``+import.meta.url).href,A:new URL(``+new URL(`sym-a-DP401Rq4.png`,import.meta.url).href,``+import.meta.url).href,hay:new URL(``+new URL(`sym-haybale-Bq01AyW_.png`,import.meta.url).href,``+import.meta.url).href,cas:new URL(``+new URL(`sym-cas-BAzAgqTw.png`,import.meta.url).href,``+import.meta.url).href,pit:new URL(``+new URL(`sym-pit-5qh8zakK.png`,import.meta.url).href,``+import.meta.url).href,dog:new URL(``+new URL(`sym-dog-B-JuJoCW.png`,import.meta.url).href,``+import.meta.url).href,wld:new URL(``+new URL(`sym-wld-sHCIN2iq.png`,import.meta.url).href,``+import.meta.url).href},Oe=new URL(``+new URL(`bottle-tile-CGp-5Id4.png`,import.meta.url).href,``+import.meta.url).href,ke=new URL(``+new URL(`background-desktop-muted-BZsMot93.png`,import.meta.url).href,``+import.meta.url).href,Ae=new URL(``+new URL(`background-mobile-final-CXT-xjr6.png`,import.meta.url).href,``+import.meta.url).href;function je(e){return new Promise((t,n)=>{let r=new Image;r.onload=()=>t(r),r.onerror=()=>n(Error(`Failed to load asset: ${e}`)),r.src=e})}function Me(e){let t=Math.min(1,Ee/Math.max(e.width,e.height)),n=Math.max(1,Math.round(e.width*t)),r=Math.max(1,Math.round(e.height*t)),i=document.createElement(`canvas`);i.width=n,i.height=r;let a=i.getContext(`2d`,{willReadFrequently:!0});a.drawImage(e,0,0,n,r);let o=a.getImageData(0,0,n,r),s=o.data;if([[1,1],[n-2,1],[1,r-2],[n-2,r-2]].map(([e,t])=>s[(t*n+e)*4+3]).every(e=>e<8))return{canvas:i,w:n,h:r};let c=0,l=0,u=0;for(let[e,t]of[[1,1],[n-2,1],[1,r-2],[n-2,r-2]]){let r=(t*n+e)*4;c+=s[r],l+=s[r+1],u+=s[r+2]}c/=4,l/=4,u/=4;let d=l>140&&l>c*1.6&&l>u*1.6,f=(d?150:70)**2,p=e=>{let t=s[e]-c,n=s[e+1]-l,r=s[e+2]-u;return t*t+n*n+r*r},m=new Uint8Array(n*r);if(d)for(let e=0;e<n*r;e+=1)p(e*4)<f&&(m[e]=1);else{let e=new Int32Array(n*r),t=0,i=0,a=t=>{!m[t]&&p(t*4)<f&&(m[t]=1,e[i++]=t)};for(let e=0;e<n;e+=1)a(e),a((r-1)*n+e);for(let e=0;e<r;e+=1)a(e*n),a(e*n+(n-1));for(;t<i;){let i=e[t++],o=i%n;o>0&&a(i-1),o<n-1&&a(i+1),i>=n&&a(i-n),i<n*(r-1)&&a(i+n)}}for(let e=0;e<n*r;e+=1){let t=e*4;if(m[e]){s[t+3]=0;continue}let i=e%n;if((i>0&&m[e-1]||i<n-1&&m[e+1]||e>=n&&m[e-n]||e<n*(r-1)&&m[e+n])&&(s[t+3]=Math.min(s[t+3],150),d)){let e=Math.max(s[t],s[t+2])+24;s[t+1]>e&&(s[t+1]=e)}}a.putImageData(o,0,0);let h=n,g=r,_=-1,v=-1;for(let e=0;e<r;e+=1)for(let t=0;t<n;t+=1)s[(e*n+t)*4+3]>8&&(t<h&&(h=t),t>_&&(_=t),e<g&&(g=e),e>v&&(v=e));if(_<0)return{canvas:i,w:n,h:r};let y=_-h+1,b=v-g+1,x=document.createElement(`canvas`);return x.width=y,x.height=b,x.getContext(`2d`).drawImage(i,h,g,y,b,0,0,y,b),{canvas:x,w:y,h:b}}function Ne(e){let{canvas:t,w:n,h:r}=e,i=document.createElement(`canvas`);i.width=n,i.height=r;let a=i.getContext(`2d`,{willReadFrequently:!0});a.drawImage(t,0,0);let o=a.getImageData(0,0,n,r),s=o.data;for(let e=0;e<s.length;e+=4){let t=(s[e]*.3+s[e+1]*.59+s[e+2]*.11)*.72;s[e]=t,s[e+1]=t,s[e+2]=t}return a.putImageData(o,0,0),{canvas:i,w:n,h:r}}function Pe(e,[t,n,r],i=.55){let{canvas:a,w:o,h:s}=e,c=document.createElement(`canvas`);c.width=o,c.height=s;let l=c.getContext(`2d`,{willReadFrequently:!0});l.drawImage(a,0,0);let u=l.getImageData(0,0,o,s),d=u.data;for(let e=0;e<d.length;e+=4){let a=(d[e]*.3+d[e+1]*.59+d[e+2]*.11)/255;d[e]=d[e]*(1-i)+t*a*i,d[e+1]=d[e+1]*(1-i)+n*a*i,d[e+2]=d[e+2]*(1-i)+r*a*i}return l.putImageData(u,0,0),{canvas:c,w:o,h:s}}var C={symbols:new Map,bottleTile:null,bottleTileEmpty:null,bottleTileBeer:null,bottleTileWine:null,bottleTileMoonshine:null,bottleTileJug:null,bottleTileBarrel:null};async function Fe(){let e=Object.entries(De),[t,n]=await Promise.all([Promise.all(e.map(([,e])=>je(e))),je(Oe)]);e.forEach(([e],n)=>{C.symbols.set(String(e),Me(t[n]))}),C.bottleTile=Me(n),C.bottleTileEmpty=Ne(C.bottleTile),C.bottleTileBeer=Pe(C.bottleTile,[255,176,46]),C.bottleTileWine=Pe(C.bottleTile,[168,32,72]),C.bottleTileMoonshine=Pe(C.bottleTile,[255,244,200],.7),C.bottleTileJug=Pe(C.bottleTile,[214,128,36],.65),C.bottleTileBarrel=Pe(C.bottleTile,[255,96,24],.75)}function Ie(e){return C.symbols.get(String(e))||null}function Le(e=`closed`){return e===`empty`?C.bottleTileEmpty:e===`beer`?C.bottleTileBeer:e===`wine`?C.bottleTileWine:e===`moonshine`?C.bottleTileMoonshine:e===`jug`?C.bottleTileJug:e===`barrel`?C.bottleTileBarrel:C.bottleTile}function Re(e,t,n,r,i,a,o={}){if(!t)return;let{alpha:s=1,scaleX:c=1,scaleY:l=1,shadow:u=null}=o,d=Math.min(i/t.w,a/t.h),f=t.w*d*c,p=t.h*d*l;e.save(),e.globalAlpha=s,u&&(e.shadowColor=u.color,e.shadowBlur=u.blur,e.shadowOffsetY=u.offsetY||0),e.drawImage(t.canvas,n-f/2,r-p/2,f,p),e.restore()}var ze={gray:{top:`#b89468`,bottom:`#777d84`,text:`#23262a`},amber:{top:`#ffcf5c`,bottom:`#cf7d05`,text:`#4d3100`},green:{top:`#74dd80`,bottom:`#239a33`,text:`#08340f`},purple:{top:`#bd66e0`,bottom:`#67248c`,text:`#ffffff`},orange:{top:`#ffb759`,bottom:`#dd6300`,text:`#4f2400`}},Be={10:{color:`gray`,label:`10`},J:{color:`gray`,label:`J`},Q:{color:`gray`,label:`Q`},K:{color:`gray`,label:`K`},A:{color:`gray`,label:`A`},hay:{color:`amber`,label:`Hay`},cas:{color:`amber`,label:`Cas`},pit:{color:`green`,label:`Pit`},dog:{color:`green`,label:`Dog`},wld:{color:`purple`,label:`CHICK`},hen:{color:`orange`,label:`Hen`}},Ve={haystack:`hay`,cassava:`cas`,pitchfork:`pit`,dog:`dog`,wild:`wld`,chicken:`wld`,hen:`hen`};function He(e){let t=String(e);if(Be[t])return Be[t];let n=Ve[t.toLowerCase()];return n&&Be[n]?Be[n]:{color:`gray`,label:t}}var Ue=null;function We(e){Ue=Math.max(.1,Math.round(e*100)/100)}function Ge(){return Ue??(typeof window<`u`&&window.devicePixelRatio||1)}function Ke(e,t){if(typeof document<`u`&&document.createElement){let n=document.createElement(`canvas`);return n.width=e,n.height=t,n}if(typeof OffscreenCanvas<`u`)return new OffscreenCanvas(e,t);throw Error(`No canvas factory available.`)}function qe(e,t,n,r,i,a){let o=Math.min(a,r/2,i/2);e.beginPath(),e.moveTo(t+o,n),e.arcTo(t+r,n,t+r,n+i,o),e.arcTo(t+r,n+i,t,n+i,o),e.arcTo(t,n+i,t,n,o),e.arcTo(t,n,t+r,n,o),e.closePath()}var Je=new Map;function Ye(e,t,n){let r=Math.max(k,A),i=Math.ceil(r*.2),a=r+i*2,o=Ke(Math.round(a*n),Math.round(a*n)),s=o.getContext(`2d`);s.scale(n,n);let c=He(e),l=ze[c.color]||ze.gray,u=k*.94,d=A*.94,f=Math.min(u,d),p=i+r/2,m=i+r/2,h=String(e),g=Ie(Be[h]?h:Ve[h.toLowerCase()]||h);if(g){let e=c.color===`gray`,t=h===`pit`?1.18:e?.8:1,n=Math.min(u/g.w,d/g.h)*t,r=1.1,l=Math.min(g.w*n*r,u),_=Math.min(g.h*n*r,d);return s.save(),s.shadowColor=`rgba(0,0,0,0.55)`,s.shadowBlur=f*.08,s.shadowOffsetY=f*.03,s.drawImage(g.canvas,p-l/2,m-_/2,l,_),s.restore(),{canvas:o,sprite:a,margin:i}}let _=f*.24;s.font=`700 ${Math.round(_)}px system-ui, sans-serif`,s.textAlign=`center`,s.textBaseline=`middle`;let v=f*.94;return s.save(),s.shadowColor=`rgba(0,0,0,0.35)`,s.shadowBlur=_*.12,s.shadowOffsetY=_*.06,s.lineJoin=`round`,s.lineWidth=Math.max(1,_*.06),s.strokeStyle=`rgba(0,0,0,0.35)`,s.strokeText(c.label,p,m,v),s.restore(),s.fillStyle=l.top,s.fillText(c.label,p,m,v),{canvas:o,sprite:a,margin:i}}function Xe(e,t){let n=Ge(),r=`${e}|${t}|${n}`,i=Je.get(r);return i||(i=Ye(e,t,n),Je.set(r,i)),i}function w(e,t,n,r,i,a={}){if(t==null)return;let{scaleX:o=1,scaleY:s=1,alpha:c=1,removing:l=!1,isWild:u=!1,isSticky:d=!1}=a,f=Xe(t,i),p=f.sprite*o,m=f.sprite*s;e.save(),(c<1||l)&&(e.globalAlpha=(l?.4:1)*c),e.drawImage(f.canvas,n-p/2,r-m/2,p,m),e.restore();let h=i-i*.08*2;if(u){let t=h*.12;e.save(),e.beginPath(),e.arc(n+h/2-t,r-h/2+t,t,0,Math.PI*2),e.fillStyle=ze.purple.bottom,e.fill(),e.lineWidth=1.5,e.strokeStyle=`rgba(255,255,255,0.85)`,e.stroke(),e.restore()}d&&Ze(e,n,r,i,1,!0)}function T(e,t,n){let r=t-k/2,i=n-A/2,a=r+k,o=i+A;e.fillStyle=`#1a1209`,e.fillRect(r-.5,i-.5,k+1,A+1);let s=Math.max(1,Math.round(A*.012)),c=s%2==1?.5:0;e.save(),e.lineWidth=s,e.strokeStyle=`rgba(105,63,28,0.72)`,e.beginPath(),e.moveTo(Math.round(a)+c,i),e.lineTo(Math.round(a)+c,o),e.moveTo(r,Math.round(o)+c),e.lineTo(a,Math.round(o)+c),e.stroke(),e.lineWidth=1,e.strokeStyle=`rgba(235,166,78,0.16)`,e.beginPath(),e.moveTo(Math.round(r)+c,i),e.lineTo(Math.round(r)+c,o),e.moveTo(r,Math.round(i)+c),e.lineTo(a,Math.round(i)+c),e.stroke(),e.restore()}function Ze(e,t,n,r,i=1,a=!1){let o=r-r*.06*2,s=t-o/2,c=n-o/2,l=o*.2;e.save(),e.globalAlpha=i,e.lineWidth=Math.max(3,r*.07),e.strokeStyle=`#ffd700`,e.shadowColor=`rgba(255,215,0,0.85)`,e.shadowBlur=r*.2,a&&e.setLineDash([r*.12,r*.08]),qe(e,s,c,o,o,l),e.stroke(),e.restore()}var E=1672,D=941,Qe=6,$e=6,O={x:452,y:192,w:756,h:618},k=O.w/Qe,A=O.h/$e,j=O.w,M=O.h,et=A,N={x:1216,y:242,w:456,h:700},tt=1,nt={x:0,y:0,w:E,h:D},rt=null;function it(){return rt?rt.clientWidth/E:1}function at(e){let t=typeof e==`string`?document.querySelector(e):e;if(!t)throw Error(`initStage: container element not found.`);rt=t;let n=localStorage.getItem(`tdf-display-mode`),r=n?n===`mobile`:window.innerHeight>window.innerWidth;r&&(E=941,D=1672,Object.assign(O,{x:24,y:485,w:894,h:720}),Object.assign(N,{x:500,y:900,w:456,h:700}),tt=.8),k=O.w/Qe,A=O.h/$e,j=O.w,M=O.h,et=A,Object.assign(nt,{x:0,y:0,w:E,h:D}),t.style.position=`relative`,r?(t.style.backgroundImage=`url(${Ae})`,document.body.style.background=`#11120f`):t.style.backgroundImage=`url(${ke})`,t.style.backgroundSize=`100% 100%`,t.style.overflow=`hidden`,t.classList.add(r?`tdf-mobile`:`tdf-desktop`);function i(){let e=Math.min(window.innerWidth/E,window.innerHeight/D);t.style.width=`${E*e}px`,t.style.height=`${D*e}px`,document.documentElement.style.setProperty(`--tdf-stage-w`,`${Math.round(E*e)}px`),document.documentElement.style.setProperty(`--tdf-stage-h`,`${Math.round(D*e)}px`)}return i(),{stage:t,resizeStage:i}}function ot(e,t){if(!rt)throw Error(`mountStageCanvas: initStage must run first.`);let n=document.createElement(`canvas`);t&&(n.className=t),n.style.position=`absolute`,n.style.left=`${e.x/E*100}%`,n.style.top=`${e.y/D*100}%`,n.style.width=`${e.w/E*100}%`,n.style.height=`${e.h/D*100}%`,rt.appendChild(n);let r=n.getContext(`2d`);function i(){n.style.left=`${e.x/E*100}%`,n.style.top=`${e.y/D*100}%`,n.style.width=`${e.w/E*100}%`,n.style.height=`${e.h/D*100}%`;let t=typeof window<`u`&&window.devicePixelRatio||1,i=it();n.width=Math.max(1,Math.round(e.w*i*t)),n.height=Math.max(1,Math.round(e.h*i*t)),r.setTransform(i*t,0,0,i*t,0,0)}return i(),{canvas:n,ctx:r,resize:i}}function st(e){let{resizeStage:t}=at(e),n=ot(O,`game-grid`);function r(){t(),n.resize();let e=typeof window<`u`&&window.devicePixelRatio||1;We(it()*e)}return r(),{canvas:n.canvas,ctx:n.ctx,cellSize:et,resize:r,resizeStage:t}}function P(e,t){return{x:t*k+k/2,y:e*A+A/2}}function ct(e){return{x:O.x+e.x,y:O.y+e.y}}function lt(e,t,n,r=[],i={}){let a=t.length,o=a>0?t[0].length:0;e.clearRect(0,0,j,M);for(let t=0;t<a;t+=1)for(let r=0;r<o;r+=1){let{x:i,y:a}=P(t,r,n);T(e,i,a,n)}i.drawUnderlay&&i.drawUnderlay(e);for(let r=0;r<a;r+=1)for(let a=0;a<o;a+=1){let{x:o,y:s}=P(r,a,n);(!i.hiddenCells||!i.hiddenCells.has(`${r},${a}`))&&w(e,t[r][a],o,s,n,{})}for(let t of r||[]){let{x:r,y:i}=P(t.row,t.col,n);Ze(e,r,i,n,1)}i.drawOverlay&&i.drawOverlay(e)}var ut=1.03,dt=.96,ft={fall:400,ease:gt,spring:!1,bounce:0,settle:0,squash:0},pt={fall:450,ease:_t,spring:!0,bounce:50,settle:60,squash:70},F={fall:300,ease:_t,spring:!0,bounce:50,settle:60,squash:70},mt=16;function ht(e){return e.fall+(e.spring?e.bounce+e.settle:0)}var I=(e,t,n)=>e+(t-e)*n;function gt(e){return e*e*e}function _t(e){return e*e}function vt(e){return e<.5?2*e*e:1-(-2*e+2)**2/2}function yt(e){return e*(2-e)}function L(e){return 1-(1-e)**3}var bt=()=>typeof performance<`u`&&performance.now?performance.now():Date.now(),xt=e=>typeof requestAnimationFrame<`u`?requestAnimationFrame(e):setTimeout(()=>e(bt()),mt);function R(e,t){return new Promise(n=>{let r=bt();(function i(){let a=Math.min(1,(bt()-r)/e);t(a),a<1?xt(i):n()})()})}function St(e){return new Promise(t=>setTimeout(t,e))}function Ct(e,t,n,r,i,a,o){return{symbol:e,x:t,startY:n,targetY:r,delay:i,cellSize:a,timing:o}}function wt(e,t,n=pt){let{startY:r,targetY:i}=t,{fall:a,bounce:o,settle:s,squash:c,ease:l,spring:u}=n,d=n.overshoot??9,f=n.bounceBack??1,p=n.squashX??1.03,m=n.squashY??.96;if(e<=0)return{y:r,sx:1,sy:1,settled:!1};if(e<a){let t=e/a;return{y:I(r,u?i+d:i,l(t)),sx:1,sy:1,settled:!1}}if(!u)return{y:i,sx:1,sy:1,settled:!0};let h=e-a,g;g=h<o?I(i+d,i-f,yt(h/o)):h<o+s?I(i-f,i,L((h-o)/s)):i;let _=1,v=1;if(h<c){let e=yt(h/c);_=I(p,1,e),v=I(m,1,e)}return{y:g,sx:_,sy:v,settled:h>=o+s}}function Tt(e,{width:t,height:n,drawBackground:r,drawOverlay:i,symbols:a,clip:o=!1,timing:s=pt}){let c=0;for(let e of a){let t=e.delay+ht(e.timing||s);t>c&&(c=t)}let l=(r,c)=>{e.save(),o&&(e.beginPath(),e.rect(0,0,t,n),e.clip()),!c&&i&&i(e,r);for(let t of a){let n=c?{y:t.targetY,sx:1,sy:1}:wt(r-t.delay,t,t.timing||s);t.draw?t.draw(e,t.x,n.y,t.cellSize,{sx:n.sx,sy:n.sy}):w(e,t.symbol,t.x,n.y,t.cellSize,{scaleX:n.sx,scaleY:n.sy})}e.restore()};return new Promise(i=>{let a=bt();(function o(){let s=bt()-a;e.clearRect(0,0,t,n),r&&r(e),l(s,!1),s<c?xt(o):(e.clearRect(0,0,t,n),r&&r(e),l(s,!0),i())})()})}function Et(e,t,n,r=null,i={}){let a=t.length,o=a>0?t[0].length:0;if(a===0||o===0)return Promise.resolve();let s=j,c=M,l=(a+1)*n,u=r?520:0,d=[],f=[];for(let e=0;e<a;e+=1)for(let a=0;a<o;a+=1){let{x:o,y:s}=P(e,a,n);f.push({x:o,y:s});let c=a*70,p=r&&r[e]?r[e][a]:null;p!=null&&d.push(Ct(p,o,s,s+l,c,n,ft));let m=i.cellOverrides?i.cellOverrides.get(`${e},${a}`):null,h=Ct(m&&m.symbol!==void 0?m.symbol:t[e][a],o,s-l,s,c+u,n,pt);m&&m.draw&&(h.draw=m.draw),d.push(h)}return Tt(e,{width:s,height:c,drawBackground:e=>{for(let t of f)T(e,t.x,t.y,n);i.drawUnderlay&&i.drawUnderlay(e)},drawOverlay:i.drawOverlay,symbols:d,clip:!0})}var Dt=120,Ot=100,kt=30;function At(e){return e>=4?{...F,fall:Math.max(230,F.fall-35),bounce:70,settle:70,squash:85,overshoot:17,bounceBack:4,squashX:ut+.04,squashY:dt-.04}:e===3?{...F,fall:Math.max(230,F.fall-45),bounce:62,settle:66,squash:78,overshoot:14,bounceBack:3,squashX:ut+.025,squashY:dt-.025}:e===2?{...F,fall:Math.max(240,F.fall-25),bounce:56,settle:60,squash:74,overshoot:12,bounceBack:2,squashX:ut+.015,squashY:dt-.015}:F}function jt(e){return e>=4?160:e===3?140:e===2?125:Dt}function Mt(e){return e>=4?85:e===3?45:kt}function Nt(e,t,n){if(e<3)return{x:0,y:0};let r=n*(e>=4?.035:.018)*(1-t*.35);return{x:Math.sin(t*Math.PI*12)*r,y:Math.cos(t*Math.PI*10)*r*.55}}function Pt(e,t,n,r,i){if(t<3)return;let a=t>=4?.18:.09;e.save(),e.globalAlpha=a*(.55+.45*Math.sin(n*Math.PI)),e.fillStyle=t>=4?`#8b5cff`:`#ffd35a`,e.fillRect(0,0,r,i),e.restore()}function Ft(t,n){let r=t.map(e=>e.slice());for(let{row:e,col:t}of n)r[e][t]=null;return e(f(r))}async function It(e,t,n,r={}){if(!t||t.length===0)return null;let i=t[0].grid.length,a=t[0].grid[0].length,o=j,s=M,c=e=>{for(let t=0;t<i;t+=1)for(let r=0;r<a;r+=1){let{x:i,y:a}=P(t,r,n);T(e,i,a,n)}},l=null;for(let u=0;u<t.length;u+=1){let d=t[u],f=Number.isFinite(d.cascadeLevel)?d.cascadeLevel:1,p=d.clusters.flatMap(e=>e.cells),m=d.nextGrid||(u+1<t.length?t[u+1].grid:Ft(d.grid,p));l=m;let h=jt(f);await R(h,t=>{e.clearRect(0,0,o,s);let l=Nt(f,t,n);e.save(),e.translate(l.x,l.y),c(e),r.drawUnderlay&&r.drawUnderlay(e,t*h);for(let t=0;t<i;t+=1)for(let i=0;i<a;i+=1){let{x:a,y:o}=P(t,i,n);(!r.hiddenCells||!r.hiddenCells.has(`${t},${i}`))&&w(e,d.grid[t][i],a,o,n,{})}Pt(e,f,t,o,s);let u=.35+.65*Math.abs(Math.sin(t*Math.PI*2));for(let t of p){let{x:r,y:i}=P(t.row,t.col,n);Ze(e,r,i,n,u)}r.drawOverlay&&r.drawOverlay(e,t*h),e.restore()}),r.onStepFlash&&await r.onStepFlash(u,d);let g=Array.from({length:a},()=>new Set);for(let{row:e,col:t}of p)g[t].add(e);let _=[],v=[];for(let e=0;e<a;e+=1){let t=g[e],a=t.size;if(a===0){for(let t=0;t<i;t+=1){let{x:i,y:a}=P(t,e,n);(!r.hiddenCells||!r.hiddenCells.has(`${t},${e}`))&&v.push({symbol:m[t][e],x:i,y:a})}continue}let o=Math.max(...t),s=a*n,c=e*40;for(let t=0;t<i;t+=1){let i=P(t,e,n);t>o?(!r.hiddenCells||!r.hiddenCells.has(`${t},${e}`))&&v.push({symbol:m[t][e],x:i.x,y:i.y}):(!r.hiddenCells||!r.hiddenCells.has(`${t},${e}`))&&_.push(Ct(m[t][e],i.x,i.y-s,i.y,c,n))}}let y=e=>{c(e),r.drawUnderlay&&r.drawUnderlay(e,0);for(let t of v)w(e,t.symbol,t.x,t.y,n,{})},b=p.filter(e=>!r.hiddenCells||!r.hiddenCells.has(`${e.row},${e.col}`)).filter(e=>!r.hiddenWinnerCells||!r.hiddenWinnerCells.has(`${e.row},${e.col}`)).map(e=>{let{x:t,y:r}=P(e.row,e.col,n);return{symbol:d.grid[e.row][e.col],x:t,y:r}});await Tt(e,{width:o,height:s,drawBackground:y,drawOverlay:(e,t)=>{let i=Math.max(0,1-t/Ot);if(i>0){let t=(1-i)*n*.35,r=1-(1-i)*.25;for(let a of b)w(e,a.symbol,a.x,a.y+t,n,{alpha:i,scaleX:r,scaleY:r})}r.drawOverlay&&r.drawOverlay(e,t)},symbols:_,timing:At(f)}),await St(Mt(f))}return l}var Lt=160,Rt=200,zt=140,Bt=400,Vt=520,Ht=90,Ut=`rgba(255,207,92,0.95)`,Wt={beer:`rgba(255,176,46,0.95)`,wine:`rgba(214,60,110,0.95)`,moonshine:`rgba(255,246,214,1)`,jug:`rgba(230,140,40,1)`,barrel:`rgba(255,96,24,1)`};function Gt(e){return`${e.row},${e.col}`}function z(e,t,n,r,i={}){let{variant:a=`closed`,alpha:o=1,scale:s=1,sx:c=1,sy:l=1,glow:u=0}=i,d=r*.9*s;Re(e,Le(a),t,n,d,d,{alpha:o,scaleX:c,scaleY:l,shadow:u>0?{color:Wt[a]||Ut,blur:r*(.1+u*.22)}:{color:`rgba(0,0,0,0.5)`,blur:r*.08,offsetY:r*.03}})}function Kt(e,t,n,r){return r!==t.col||n>t.row?e[n][r]:n===t.row?null:e[n+1][r]}function qt(e,t,n,r,i){let a=t.length,o=a>0?t[0].length:0;for(let t=0;t<a;t+=1)for(let n=0;n<o;n+=1){let{x:r,y:i}=P(t,n);T(e,r,i)}i&&i(e);for(let i=0;i<a;i+=1)for(let a=0;a<o;a+=1){let o=Kt(t,r,i,a);if(o==null)continue;let{x:s,y:c}=P(i,a);w(e,o,s,c,n,{})}}function Jt(e,t,n,r){let i=t.length,a=i>0?t[0].length:0;for(let t=0;t<i;t+=1)for(let n=0;n<a;n+=1){let{x:r,y:i}=P(t,n);T(e,r,i)}r&&r(e);for(let r=0;r<i;r+=1)for(let i=0;i<a;i+=1){let{x:a,y:o}=P(r,i);w(e,t[r][i],a,o,n,{})}}function Yt(e){let t=e.length,n=t>0?e[0].length:0;return{row:Math.floor(Math.random()*t),col:Math.floor(Math.random()*n)}}function Xt(e,t){let n=new Map;for(let r=0;r<t.row;r+=1)n.set(`${r},${t.col}`,{symbol:e[r+1][t.col]});return n.set(Gt(t),{draw:(e,t,n,r,i={})=>z(e,t,n,r,{variant:`closed`,sx:i.sx,sy:i.sy})}),n}function Zt(){let e=ot({x:0,y:0,w:E,h:D},`bottle-fly-layer`);return e.canvas.style.pointerEvents=`none`,e.canvas.style.zIndex=`20`,e}function Qt(e,t,n,r){let i=[],a=M/e.length;for(let o=0;o<=t.row;o+=1){let s=P(o,t.col);i.push(Ct(e[o][t.col],s.x,s.y-a,s.y,r,n,F))}return i}function $t(e,t,n,r,i){let a=t.length,o=a>0?t[0].length:0;for(let t=0;t<a;t+=1)for(let n=0;n<o;n+=1){let{x:r,y:i}=P(t,n);T(e,r,i)}i&&i(e);for(let i=0;i<a;i+=1)for(let a=0;a<o;a+=1){if(a===r.col&&i<=r.row)continue;let{x:o,y:s}=P(i,a);w(e,t[i][a],o,s,n,{})}}function en(e,t,n,r){for(let i of t){let t=wt(n-i.delay,i,F);w(e,i.symbol,i.x,t.y,r,{scaleX:t.sx,scaleY:t.sy})}}async function tn(e,t,n,r,i,a){let o=P(r.row,r.col),s=i===`barrel`?.34:i===`jug`?.28:i===`moonshine`?.22:.14,c=()=>{e.clearRect(0,0,j,M),qt(e,t,n,r,a)};await R(Lt,()=>{c(),z(e,o.x,o.y,n,{variant:`closed`})}),await R(Rt,t=>{c();let r=1+Math.sin(Math.min(1,t)*Math.PI)*s;t<.55&&z(e,o.x,o.y,n,{variant:`closed`,alpha:1-t/.55,scale:r}),z(e,o.x,o.y,n,{variant:i,alpha:Math.min(1,t/.55),scale:r,glow:L(t)})}),await R(zt,()=>{c(),z(e,o.x,o.y,n,{variant:i,glow:1})})}function nn(e,t){let n=e.getBoundingClientRect();return{x:(t.x-n.left)/n.width*j,y:(t.y-n.top)/n.height*M}}function rn(e,t){let n=e.getBoundingClientRect();return{x:(t.x-n.left)/n.width*E,y:(t.y-n.top)/n.height*D}}async function an(e,t,n,r,i,a,o,s=`full`,c=null){let l=P(i.row,i.col),u=nn(t,a),d=o?o.ctx:e,f=o?o.canvas:t,p=o?ct(l):l,m=o?rn(f,a):u,h=o?E:j,g=o?D:M,_=Qt(n,i,r,0);await R(Bt,t=>{e.clearRect(0,0,j,M),$t(e,n,r,i,c),en(e,_,t*Bt,r),o&&d.clearRect(0,0,h,g);let a=vt(t),l=Math.sin(t*Math.PI)*r*.7;z(d,p.x+(m.x-p.x)*a,p.y+(m.y-p.y)*a-l,r,{variant:s,alpha:1-Math.max(0,(t-.82)/.18)*.45,scale:1-L(t)*.3,glow:1-t*.5})}),o&&d.clearRect(0,0,h,g)}async function on(e,t,n,r,i){let a=P(r.row,r.col),o=Qt(t,r,n,Ht);await R(Vt,s=>{let c=s*Vt;e.clearRect(0,0,j,M),$t(e,t,n,r,i),en(e,o,c,n);let l=vt(Math.min(1,c/(Vt*.7)));l<1&&z(e,a.x,a.y,n,{variant:`empty`,alpha:1-l,scale:1-l*.3})})}async function sn(e,t,n,r,i,a={}){let{type:o=`beer`,meterTarget:s=null,flyLayer:c=null,drawUnderlay:l=null}=a;await tn(e,n,r,i,o,l),s?await an(e,t,n,r,i,s,c,o,l):await on(e,n,r,i,l),e.clearRect(0,0,j,M),Jt(e,n,r,l)}var cn=`#dfb54e`,ln=`#f0d078`,un=`#a87e2a`,dn=`#a06a2c`,B=`#f4b585`,fn=`#d9905c`,pn=`#e2673d`,mn=`#e07a52`,hn=`#8a5527`,gn=`#6b3f18`,_n=`#fdf7ea`,vn=`#5a1d0c`,yn=`#bc3620`,bn=`#8c2312`,xn=`#d95a36`,Sn=`#2e6ca8`,Cn=`#1f4d7d`,wn=`#4a8ac2`,Tn=`#b97f35`,En=`#8a5a1e`,Dn=`#7a4418`,On=`#d9a740`,kn=`#a05e24`,An=`#6b3c12`,jn=`#8a8f94`,Mn=`#4a4e52`,Nn=`#8a4f1e`,Pn=`#5f3410`,Fn=`#fff7cf`,In=`#ffb63d`,V=690,H={x:245,y:V},U={x:246,y:272,r:56},W=372,G=478,K={x:278,y:428},Ln=240,Rn=Math.PI-.55,zn={x:168,y:442},Bn={x:214,y:306};function Vn(e){return Math.cos(e)<0?-1:1}function Hn(e,t,n){let r=t-e;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;return e+r*n}function Un(e,t,n,r){e.save(),e.lineCap=`round`,e.lineJoin=`round`,e.lineWidth=n,e.strokeStyle=r,e.beginPath(),e.moveTo(t[0][0],t[0][1]),t.length===3?e.quadraticCurveTo(t[1][0],t[1][1],t[2][0],t[2][1]):e.lineTo(t[1][0],t[1][1]),e.stroke(),e.restore()}function Wn(e,t,n,r){e.save(),e.translate(t,n),e.fillStyle=Tn,e.strokeStyle=En,e.lineWidth=2,e.beginPath();for(let t=0;t<16;t+=1){let n=t/16*Math.PI*2,i=t%2==0?r:r*.55;e.lineTo(Math.cos(n)*i,Math.sin(n)*i)}e.closePath(),e.fill(),e.stroke(),e.restore()}function Gn(e,t,n,r,i,a){e.save(),t(e),e.clip(),e.fillStyle=yn,e.fillRect(n,r,i,a),e.lineWidth=6,e.strokeStyle=bn,e.globalAlpha=.5;for(let t=0;t<=5;t+=1){let o=n+t/5*i;e.beginPath(),e.moveTo(o,r),e.lineTo(o,r+a),e.stroke();let s=r+t/5*a;e.beginPath(),e.moveTo(n,s),e.lineTo(n+i,s),e.stroke()}e.lineWidth=2,e.strokeStyle=xn,e.globalAlpha=.6;for(let t=0;t<=5;t+=1){let o=n+t/5*i+8;e.beginPath(),e.moveTo(o,r),e.lineTo(o,r+a),e.stroke()}e.restore()}function Kn(e,t,n){e.fillStyle=kn,e.strokeStyle=An,e.lineWidth=3,e.beginPath(),e.moveTo(t-18,n-46),e.lineTo(t+20,n-46),e.lineTo(t+22,n-12),e.quadraticCurveTo(t+24,n-2,t+12,n-2),e.lineTo(t-38,n-2),e.quadraticCurveTo(t-52,n-2,t-50,n-14),e.quadraticCurveTo(t-48,n-26,t-26,n-28),e.quadraticCurveTo(t-20,n-36,t-18,n-46),e.closePath(),e.fill(),e.stroke(),e.fillStyle=An,e.beginPath(),e.roundRect?e.roundRect(t-52,n-6,76,8,4):e.rect(t-52,n-6,76,8),e.fill(),e.strokeStyle=An,e.lineWidth=2.5;for(let r=0;r<3;r+=1){let i=n-40+r*9;e.beginPath(),e.moveTo(t-12,i),e.lineTo(t+12,i+5),e.moveTo(t+12,i),e.lineTo(t-12,i+5),e.stroke()}}function qn(e){for(let[t,n]of[[208,0],[282,2]])e.fillStyle=Sn,e.strokeStyle=Cn,e.lineWidth=3,e.beginPath(),e.moveTo(t-24,G-12),e.lineTo(t+24,G-12),e.lineTo(t+21,V-44),e.lineTo(t-21,V-44),e.closePath(),e.fill(),e.stroke(),e.fillStyle=wn,e.beginPath(),e.roundRect?e.roundRect(t-24,V-62+n,48,20,6):e.rect(t-24,V-62+n,48,20),e.fill(),e.stroke();Wn(e,292,V-110,14),Kn(e,204,V),Kn(e,286,V)}function Jn(e){let t=U.x-38/2,n=U.y+U.r*.9,r=W-n-4;e.fillStyle=B,e.strokeStyle=fn,e.lineWidth=2,e.beginPath(),e.roundRect?e.roundRect(t,n,38,r,6):e.rect(t,n,38,r),e.fill(),e.stroke();let i=e=>{e.beginPath(),e.moveTo(172,382),e.quadraticCurveTo(178,W-14,210,W-16),e.lineTo(295,W-16),e.quadraticCurveTo(326,W-12,330,384),e.lineTo(324,484),e.lineTo(180,484),e.closePath()};Gn(e,i,165,W-20,170,130),e.strokeStyle=bn,e.lineWidth=3,i(e),e.stroke(),e.fillStyle=bn,e.beginPath(),e.moveTo(212,W-16),e.lineTo(238,378),e.lineTo(262,W-16),e.closePath(),e.fill(),e.fillStyle=B,e.beginPath(),e.moveTo(226,W-14),e.lineTo(238,W-2),e.lineTo(250,W-14),e.closePath(),e.fill(),e.fillStyle=Sn,e.strokeStyle=Cn,e.lineWidth=3,e.beginPath(),e.roundRect?e.roundRect(216,376,76,G-W-2,8):e.rect(216,376,76,G-W-2),e.fill(),e.stroke(),e.lineWidth=14,e.strokeStyle=Sn,e.beginPath(),e.moveTo(224,384),e.lineTo(206,W-14),e.moveTo(284,384),e.lineTo(300,W-14),e.stroke(),e.strokeStyle=Cn,e.lineWidth=2.5,e.strokeRect(232,398,44,30),Wn(e,272,446,15),e.fillStyle=On,e.strokeStyle=En;for(let t of[226,282])e.beginPath(),e.arc(t,386,6,0,Math.PI*2),e.fill(),e.stroke();e.fillStyle=Sn,e.strokeStyle=Cn,e.lineWidth=3,e.beginPath(),e.moveTo(180,482),e.lineTo(324,482),e.lineTo(320,512),e.lineTo(184,512),e.closePath(),e.fill(),e.stroke(),e.fillStyle=Dn,e.fillRect(180,G-8,144,18),e.strokeStyle=An,e.strokeRect(180,G-8,144,18),e.fillStyle=On,e.beginPath(),e.roundRect?e.roundRect(240,G-12,26,24,4):e.rect(240,G-12,26,24),e.fill(),e.stroke()}function Yn(e,t,n){let{x:r,y:i,r:a}=U,o=t.drunk,s=t.headTilt+Math.sin(n*1.05)*.024+Math.sin(n*.48)*.045+o*Math.sin(n*1.7)*.06;e.save(),e.translate(r,i),e.rotate(s),e.fillStyle=dn,e.strokeStyle=gn,e.lineWidth=2;for(let[t,n,r]of[[-a*.95,-a*.1,a*.3],[a*.95,-a*.15,a*.28],[a*.85,a*.25,a*.22]])e.beginPath(),e.ellipse(t,n,r,r*.8,0,0,Math.PI*2),e.fill();e.fillStyle=B,e.strokeStyle=fn,e.lineWidth=2.5,e.beginPath(),e.ellipse(0,0,a*.95,a,0,0,Math.PI*2),e.fill(),e.stroke(),e.fillStyle=hn,e.strokeStyle=gn,e.lineWidth=2.5,e.beginPath(),e.moveTo(-a*.92,a*.05),e.quadraticCurveTo(-a*1.02,a*.75,-a*.62,a*1.1),e.lineTo(-a*.42,a*1.32),e.lineTo(-a*.26,a*1.14),e.lineTo(-a*.06,a*1.38),e.lineTo(a*.14,a*1.15),e.lineTo(a*.34,a*1.34),e.lineTo(a*.5,a*1.08),e.quadraticCurveTo(a*1.02,a*.72,a*.92,a*.05),e.quadraticCurveTo(a*.55,a*.28,a*.4,a*.3),e.quadraticCurveTo(0,a*.34,-a*.4,a*.3),e.quadraticCurveTo(-a*.55,a*.28,-a*.92,a*.05),e.closePath(),e.fill(),e.stroke();let c=1+o*.25+Math.sin(n*2.1)*.03;e.fillStyle=vn,e.beginPath(),e.ellipse(0,a*.72,a*.34,a*.26*c,0,0,Math.PI*2),e.fill(),e.fillStyle=_n,e.beginPath(),e.ellipse(0,a*.58,a*.3,a*.1,0,0,Math.PI),e.fill(),e.fillStyle=hn,e.strokeStyle=gn,e.lineWidth=2;for(let t of[-1,1])e.beginPath(),e.ellipse(t*a*.3,a*.44,a*.34,a*.13,t*.35,0,Math.PI*2),e.fill(),e.stroke();e.strokeStyle=cn,e.lineWidth=3.5,e.beginPath(),e.moveTo(-a*.3,a*.55),e.lineTo(-a*1.15,a*.28),e.stroke(),e.strokeStyle=un,e.lineWidth=1.5,e.beginPath(),e.moveTo(-a*1.15,a*.28),e.lineTo(-a*1.32,a*.34),e.moveTo(-a*1.15,a*.28),e.lineTo(-a*1.28,a*.2),e.stroke(),e.globalAlpha=.4+o*.4,e.fillStyle=mn;for(let t of[-1,1])e.beginPath(),e.ellipse(t*a*.6,a*.22,a*.2,a*.14,0,0,Math.PI*2),e.fill();e.globalAlpha=1,e.fillStyle=pn,e.strokeStyle=fn,e.lineWidth=2.5,e.beginPath(),e.ellipse(-a*.02,a*.3,a*.26,a*.22,0,0,Math.PI*2),e.fill(),e.stroke(),e.fillStyle=`rgba(255,255,255,0.35)`,e.beginPath(),e.ellipse(-a*.1,a*.24,a*.07,a*.05,0,0,Math.PI*2),e.fill();let l=Math.min(.9,.35+o*.3+t.blink*.6);for(let t of[-1,1]){let n=t*a*.38-a*.02,r=-a*.08,i=a*.22,o=a*.2;e.save(),e.translate(n,r),e.fillStyle=`#fdf6e8`,e.strokeStyle=`#3b2412`,e.lineWidth=2,e.beginPath(),e.ellipse(0,0,i,o,0,0,Math.PI*2),e.fill(),e.fillStyle=`#2a1608`,e.beginPath(),e.arc(-i*.2,o*.35,a*.075,0,Math.PI*2),e.fill(),e.fillStyle=B,e.beginPath(),e.ellipse(0,-o+o*2*l*.5,i*1.05,o*l,0,Math.PI,0),e.fill(),e.strokeStyle=`#3b2412`,e.lineWidth=2.5,e.beginPath(),e.ellipse(0,0,i,o,0,Math.PI+.25,-.25),e.stroke(),e.beginPath(),e.moveTo(-i,-o*(1-l)),e.quadraticCurveTo(0,-o*(1-l)+o*l*.9,i,-o*(1-l)),e.stroke(),e.restore()}e.strokeStyle=dn,e.lineWidth=7,e.lineCap=`round`,e.beginPath(),e.moveTo(-a*.6,-a*.34),e.quadraticCurveTo(-a*.4,-a*.5,-a*.16,-a*.38),e.moveTo(a*.12,-a*.38),e.quadraticCurveTo(a*.36,-a*.52,a*.58,-a*.36),e.stroke(),e.save(),e.rotate(-.05+o*.08),e.fillStyle=cn,e.strokeStyle=un,e.lineWidth=3,e.beginPath(),e.ellipse(0,-a*.6,a*1.55,a*.4,-.04,0,Math.PI*2),e.fill(),e.stroke(),e.fillStyle=cn;for(let[t,n,r]of[[-a*1.5,-a*.62,2.9],[a*1.5,-a*.55,.25],[-a*1.2,-a*.42,2.5],[a*1.25,-a*.75,-.3]])e.save(),e.translate(t,n),e.rotate(r),e.beginPath(),e.moveTo(0,0),e.lineTo(a*.32,-a*.05),e.lineTo(0,a*.09),e.closePath(),e.fill(),e.restore();e.fillStyle=ln,e.beginPath(),e.moveTo(-a*.85,-a*.66),e.quadraticCurveTo(-a*.95,-a*1.5,-a*.1,-a*1.62),e.quadraticCurveTo(a*.75,-a*1.58,a*.82,-a*.62),e.closePath(),e.fill(),e.strokeStyle=un,e.stroke(),e.fillStyle=un,e.fillRect(-a*.88,-a*.92,a*1.72,a*.2),e.restore(),e.restore()}function Xn(e,t,n){e.save(),e.translate(K.x,K.y),e.rotate(t),e.scale(1,Vn(t)),e.translate(-n*14,0),e.fillStyle=Nn,e.strokeStyle=Pn,e.lineWidth=2.5,e.beginPath(),e.moveTo(-16,-8),e.lineTo(-64,2),e.quadraticCurveTo(-80,6,-78,22),e.lineTo(-68,28),e.lineTo(-20,12),e.closePath(),e.fill(),e.stroke(),e.fillStyle=Mn,e.beginPath(),e.roundRect?e.roundRect(-18,-9,52,18,3):e.rect(-18,-9,52,18),e.fill(),e.strokeStyle=Mn,e.lineWidth=4.5,e.beginPath(),e.arc(2,20,11,.25,Math.PI-.25),e.stroke(),e.fillStyle=Nn,e.strokeStyle=Pn,e.lineWidth=2,e.beginPath(),e.roundRect?e.roundRect(34,-4,66,10,4):e.rect(34,-4,66,10),e.fill(),e.stroke(),e.fillStyle=jn,e.fillRect(30,-8,Ln-30,6),e.fillStyle=Mn,e.fillRect(30,-3.5,Ln-30,3),e.fillStyle=jn,e.fillRect(Ln-4,-10,6,10),e.fillRect(Ln-14,-12,4,5),e.restore()}function Zn(e,t,n){if(n<=0)return;let r=K.x+Math.cos(t)*248,i=K.y+Math.sin(t)*248;e.save(),e.translate(r,i),e.rotate(t),e.globalAlpha=n,e.shadowColor=In,e.shadowBlur=26,e.fillStyle=In;let a=20+n*16;e.beginPath();for(let t=0;t<8;t+=1){let n=t/8*Math.PI*2,r=t%2==0?a:a*.38;e.lineTo(Math.cos(n)*r*1.35,Math.sin(n)*r)}e.closePath(),e.fill(),e.fillStyle=Fn,e.beginPath(),e.ellipse(0,0,a*.55,a*.4,0,0,Math.PI*2),e.fill(),e.restore()}function Qn(e,t,n,r){let i=t.recoil*14,a=Math.cos(r),o=Math.sin(r),s=Vn(r),c={x:K.x+a*(-4-i)-o*18*s,y:K.y+o*(-4-i)+a*18*s},l=90+Math.sin(n*1.15)*5*(1-t.aim),u={x:K.x+a*(l-i),y:K.y+o*(l-i)},d=(t,n,r,i)=>{let a=(t+r.x)/2+i.x,o=(n+r.y)/2+i.y;Un(e,[[t,n],[a,o]],30,yn),e.fillStyle=bn,e.beginPath(),e.arc(a,o,16,0,Math.PI*2),e.fill(),Un(e,[[a,o],[r.x,r.y]],22,B),e.fillStyle=B,e.strokeStyle=fn,e.lineWidth=2,e.beginPath(),e.arc(r.x,r.y,14,0,Math.PI*2),e.fill(),e.stroke()};d(322,382,c,{x:10,y:18}),d(182,382,u,{x:-8,y:22})}function $n(e,t){let n=t.bottle;if(!n||n.alpha<=0)return;e.save(),e.translate(n.x,n.y),e.rotate(n.rot||0);let r=104*(n.scale||1);Re(e,Le(n.variant||`full`),0,0,r,r,{alpha:n.alpha,shadow:n.glow?{color:`rgba(255,207,92,0.9)`,blur:14+n.glow*16}:void 0}),e.restore()}function er(e,t,n){if(!(n<=0)){e.save();for(let r=0;r<3;r+=1){let i=(t*.5+r*.37)%1,a=U.x+78+Math.sin((t+r*2.1)*2.4)*12,o=U.y-40-i*120;e.globalAlpha=n*Math.sin(i*Math.PI)*.85,e.strokeStyle=`#fff2c8`,e.lineWidth=2.5,e.beginPath(),e.arc(a,o,6+i*8,0,Math.PI*2),e.stroke()}e.restore()}}function tr(e,t,n){if(t.smoke<=0)return;let r=K.x+Math.cos(n)*250,i=K.y+Math.sin(n)*250,a=1-t.smoke;e.save(),e.globalAlpha=t.smoke*.5,e.fillStyle=`#cfd4d8`;for(let t=0;t<3;t+=1)e.beginPath(),e.arc(r+Math.cos(n)*(10+a*46)+(t-1)*9,i+Math.sin(n)*(10+a*46)-a*22-t*6,6+a*14+t*3,0,Math.PI*2),e.fill();e.restore()}function nr(e){e.save(),e.fillStyle=`#132008`,e.globalAlpha=.26,e.beginPath(),e.ellipse(H.x,694,122,15,0,0,Math.PI*2),e.fill(),e.globalAlpha=.38;for(let t of[190,272])e.beginPath(),e.ellipse(t,693,42,6.5,0,0,Math.PI*2),e.fill();e.restore()}function rr(e,t,n){e.save();let r=t.sway+Math.sin(n*.82)*.016+Math.sin(n*.31)*.024+t.drunk*Math.sin(n*1.1)*.06;e.translate(H.x,H.y),e.rotate(r),e.translate(-H.x,-H.y);let i=t.gunAngle;nr(e),qn(e),e.save(),e.translate(0,t.bob),Jn(e),Yn(e,t,n),Xn(e,i,t.recoil),Qn(e,t,n,i),Zn(e,i,t.flash),tr(e,t,i),$n(e,t),e.restore(),er(e,n,t.drunk),e.restore()}function ir(){let{canvas:e,ctx:t,resize:n}=ot(N,`farmer-actor`);e.style.pointerEvents=`none`;let r=tt,i=(e,t)=>({x:H.x+(e-H.x)*r,y:V+(t-V)*r}),a={bob:0,sway:0,headTilt:0,blink:0,aim:0,gunAngle:Rn,recoil:0,flash:0,smoke:0,drunk:0,bottle:null},o=performance.now(),s=1.5;(function e(){let n=(performance.now()-o)/1e3;a.bob=Math.sin(n*1.9)*2.6*(1+a.drunk*1.2)+Math.sin(n*.42)*1.6,n>s&&(n>s+.14?(a.blink=0,s=n+1.6+Math.random()*2.4):a.blink=Math.sin((n-s)/.14*Math.PI)),t.clearRect(0,0,N.w,N.h),t.save(),t.translate(H.x*(1-r),V*(1-r)),t.scale(r,r),rr(t,a,n),t.restore(),requestAnimationFrame(e)})();function c(e){let t=i(K.x+Math.cos(e)*246,K.y+Math.sin(e)*246);return{x:N.x+t.x,y:N.y+t.y,angle:e}}let l=.7;async function u(e){let t=a.gunAngle,n=i(K.x,K.y),r=Math.atan2(e.y-(N.y+n.y),e.x-(N.x+n.x));return r<0&&r>-Math.PI+l&&(r=-Math.PI+l),await R(240,e=>{let n=vt(e);a.gunAngle=Hn(t,r,n),a.aim=Math.max(a.aim,n),a.headTilt=I(0,-.1,n)}),r}function d(){R(560,e=>{a.flash=e<.22?1-e/.22:0,a.recoil=Math.sin(Math.min(1,e*2.2)*Math.PI)*(1-e*.35),a.smoke=e>.1?1-(e-.1)/.9:0}).then(async()=>{let e=a.gunAngle;await R(280,t=>{a.gunAngle=Hn(e,Rn,L(t)),a.aim=1-t,a.headTilt=I(-.1,0,t)})})}return{canvas:e,resize:n,setDrunk(e){let t=a.drunk,n=typeof e==`number`?Math.max(0,Math.min(1,e)):+!!e;return R(420,e=>{a.drunk=I(t,n,e)})},async shootAt(e){let t=await u(e);return await St(70),d(),c(t)},catchScreenPoint(){let t=e.getBoundingClientRect(),n=i(zn.x,zn.y);return{x:t.left+n.x/N.w*t.width,y:t.top+n.y/N.h*t.height}},chipScreenPoint(){let t=e.getBoundingClientRect(),n=i(75,350);return{x:t.left+n.x/N.w*t.width,y:t.top+n.y/N.h*t.height}},async drinkBottle(){a.bottle={variant:`full`,x:zn.x,y:zn.y,rot:0,scale:1,alpha:1,glow:.6},await R(220,e=>{let t=vt(e);a.bottle.x=I(zn.x,Bn.x,t),a.bottle.y=I(zn.y,Bn.y,t),a.bottle.rot=I(0,1.9,t),a.bottle.glow=.6*(1-t),a.headTilt=I(0,.22,t)}),await R(420,e=>{let t=Math.sin(e*Math.PI*3);a.bottle.rot=1.9+t*.14,a.bottle.y=Bn.y-Math.abs(t)*4,a.headTilt=.22+Math.abs(t)*.04}),a.bottle.variant=`empty`;let e={x:a.bottle.x,y:a.bottle.y,rot:a.bottle.rot};await R(320,t=>{let n=L(t);a.headTilt=I(.24,0,n),a.bottle.x=e.x+n*170,a.bottle.y=e.y-Math.sin(n*Math.PI)*140+n*210,a.bottle.rot=e.rot+n*3.6,a.bottle.alpha=1-Math.max(0,(n-.55)/.45)}),a.bottle=null},async rackRifle(){let e=a.gunAngle;await R(180,t=>{let n=L(t);a.gunAngle=Hn(e,Math.PI-.18,n),a.aim=Math.max(a.aim,n*.7)}),await R(300,e=>{a.recoil=Math.abs(Math.sin(e*Math.PI*2))*.7}),a.recoil=0,await St(220);let t=a.gunAngle;await R(240,e=>{a.gunAngle=Hn(t,Rn,L(e)),a.aim=.7*(1-e)})},setRampage(e){let t=a.gunAngle,n=a.aim;return R(260,r=>{let i=vt(r);a.gunAngle=Hn(t,e?Math.PI-.22:Rn,i),a.aim=I(n,e?.6:0,i)})}}}var ar=380,or=460,sr=`#ff5a2c`,cr=`#ff3030`,lr=`#5c1216`,ur=`#7a1d22`,dr=`#3a0b0e`,fr=`#eccb9c`,pr=`#c9884e`,mr=`#33100a`;function hr(e,t){return ct(P(e,t))}function gr(e,t,n){let r=Math.sin(e*127.1+t*311.7+n*74.7)*43758.5453;return r-Math.floor(r)}function _r(e,t,n,r,i,a){let o=r*.09,s=[],c=[[-r,-r],[r,-r],[r,r],[-r,r]],l=0;for(let e=0;e<4;e+=1){let[r,u]=c[e],[d,f]=c[(e+1)%4];for(let e=0;e<4;e+=1){let c=e/4,p=r+(d-r)*c,m=u+(f-u)*c,h=(gr(i,a,l)-.5)*2*o,g=(gr(i,a,l+100)-.5)*2*o;s.push([t+p+h,n+m+g]),l+=1}}e.beginPath(),e.moveTo(s[0][0],s[0][1]);for(let t=1;t<s.length;t+=1)e.lineTo(s[t][0],s[t][1]);e.closePath()}function vr(e,t,n,r={}){let{alpha:i=1,reveal:a=1,pulse:o=0}=r,{x:s,y:c}=P(t.row,t.col),l=(n/2-n*.055)*(.8+.2*a);e.save(),e.globalAlpha=i*Math.min(1,a*1.6),_r(e,s,c,l,t.row,t.col);let u=e.createLinearGradient(s,c-l,s,c+l);u.addColorStop(0,ur),u.addColorStop(1,lr),e.fillStyle=u,o>0&&(e.shadowColor=sr,e.shadowBlur=n*.16*o),e.fill(),e.shadowBlur=0,e.lineWidth=Math.max(2,n*.035),e.strokeStyle=dr,e.stroke(),e.save(),_r(e,s,c,l,t.row,t.col),e.clip(),e.globalAlpha*=.22,e.fillStyle=dr,e.fillRect(s-l,c-l*.45,l*2,l*.12),e.fillRect(s-l,c+l*.3,l*2,l*.1),e.restore();let d=`x${t.value}`,f=Math.round(n*(d.length>3?.34:.42));e.font=`900 ${f}px system-ui, sans-serif`,e.textAlign=`center`,e.textBaseline=`middle`;let p=e.createLinearGradient(s,c-f/2,s,c+f/2);p.addColorStop(0,fr),p.addColorStop(1,pr),e.lineWidth=Math.max(3,n*.05),e.strokeStyle=mr,e.strokeText(d,s,c+1),e.fillStyle=p,e.fillText(d,s,c+1),e.restore()}function yr(e,t,n,r={}){if(!(!t||t.length===0))for(let i of t)vr(e,i,n,r)}function br(e,t,n,r,i){let a=Math.min(1,i/.62),o=2.3-1.3*L(a),s=(1-L(a))*-.7,c=i>=.62?.65+.35*Math.abs(Math.sin((i-.62)*Math.PI*5.2)):1,l=r*.34*o;e.save(),e.translate(t,n),e.rotate(s),e.globalAlpha=Math.min(1,i*4)*c,e.strokeStyle=cr,e.fillStyle=cr,e.shadowColor=cr,e.shadowBlur=r*.12,e.lineWidth=Math.max(2,r*.035),e.beginPath(),e.arc(0,0,l,0,Math.PI*2),e.stroke(),e.beginPath(),e.arc(0,0,l*.45,0,Math.PI*2),e.stroke();for(let t=0;t<4;t+=1){let n=t*Math.PI/2;e.beginPath(),e.moveTo(Math.cos(n)*l*.78,Math.sin(n)*l*.78),e.lineTo(Math.cos(n)*l*1.22,Math.sin(n)*l*1.22),e.stroke()}e.beginPath(),e.arc(0,0,Math.max(1.5,r*.028),0,Math.PI*2),e.fill(),e.restore()}function xr(e){let t=[];for(let n=0;n<16;n+=1){let r=n%2==0,i=n/16*Math.PI*2+Math.random()*.5;t.push({feather:r,angle:i,dist:e*(.35+Math.random()*.55),size:e*(r?.09+Math.random()*.06:.04+Math.random()*.03),spin:(Math.random()-.5)*7,droop:r?e*(.12+Math.random()*.2):0})}return t}function Sr(e,t,n,r,i,a){e.save(),a<.25&&(e.globalAlpha=(1-a/.25)*.9,e.fillStyle=`#ffffff`,e.beginPath(),e.arc(t,n,r*.4*(1-a*.5),0,Math.PI*2),e.fill());let o=Math.min(1,a/.7);e.globalAlpha=(1-o)*.7,e.strokeStyle=`#ffd35a`,e.lineWidth=Math.max(2,r*.045*(1-o)),e.beginPath(),e.arc(t,n,r*(.2+o*.55),0,Math.PI*2),e.stroke();let s=L(a);for(let r of i){let i=t+Math.cos(r.angle)*r.dist*s,o=n+Math.sin(r.angle)*r.dist*s+r.droop*a*a;e.save(),e.translate(i,o),e.rotate(r.angle+r.spin*a),e.globalAlpha=Math.max(0,1-a*1.15),r.feather?(e.fillStyle=`#fff6e0`,e.beginPath(),e.ellipse(0,0,r.size,r.size*.42,0,0,Math.PI*2),e.fill()):(e.fillStyle=a<.4?`#ffb02e`:sr,e.beginPath(),e.arc(0,0,r.size,0,Math.PI*2),e.fill()),e.restore()}e.restore()}async function Cr(e,t,n,r,i={}){let a=i.farmer||null,o=i.revealed||[],s=i.highlights||[],{x:c,y:l}=P(r.row,r.col),u=o.slice(),d=new Set,f=r=>lt(e,t,n,s,{hiddenCells:d,drawUnderlay:e=>yr(e,u,n),drawOverlay:r});await Promise.all([a?a.shootAt(hr(r.row,r.col)):Promise.resolve(),R(ar,e=>{f(t=>br(t,c,l,n,e))})]),d.add(`${r.row},${r.col}`);let p=xr(n);await R(or,i=>{lt(e,t,n,s,{hiddenCells:d,drawUnderlay:e=>{yr(e,u,n),vr(e,r,n,{reveal:L(Math.max(0,(i-.15)/.85))})},drawOverlay:e=>Sr(e,c,l,n,p,i)})}),o.push({...r}),i.hiddenWinners&&i.hiddenWinners.add(`${r.row},${r.col}`)}var wr=.1,Tr=10,Er=.1,Dr=`drunk-farmer-hud-style`;function Or(e){return Number(e||0).toFixed(2)}function kr(e){let t=Math.round(Number(e||wr)/Er)*Er;return Math.min(Tr,Math.max(wr,Number(t.toFixed(1))))}function Ar(){if(document.getElementById(Dr))return;let e=document.createElement(`style`);e.id=Dr,e.textContent=`
    .game-hud {
      position: fixed;
      inset: 0;
      z-index: 10;
      pointer-events: none;
      font-family: system-ui, sans-serif;
      color: #f6f2df;
    }
    .game-hud__top {
      position: absolute;
      top: max(10px, env(safe-area-inset-top));
      left: max(10px, env(safe-area-inset-left));
      right: max(10px, env(safe-area-inset-right));
      display: grid;
      grid-template-columns: minmax(112px, 1fr) auto minmax(112px, 1fr);
      align-items: start;
      gap: 10px;
    }
    .game-hud__panel,
    .game-hud__bet {
      pointer-events: auto;
      background: rgba(7, 12, 8, 0.74);
      border: 1px solid rgba(255, 211, 90, 0.28);
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
    }
    .game-hud__panel {
      min-width: 112px;
      padding: 8px 11px;
    }
    .game-hud__panel--right {
      justify-self: end;
      text-align: right;
    }
    .game-hud__label {
      display: block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: rgba(246, 242, 223, 0.72);
      text-transform: uppercase;
    }
    .game-hud__value {
      display: block;
      margin-top: 2px;
      font-size: 18px;
      font-weight: 900;
      color: #ffd35a;
      line-height: 1.05;
      white-space: nowrap;
    }
    .game-hud__bet {
      display: grid;
      grid-template-columns: 34px minmax(82px, auto) 34px;
      align-items: center;
      gap: 6px;
      padding: 6px;
      justify-self: center;
    }
    .game-hud__bet-value {
      text-align: center;
      min-width: 82px;
    }
    .game-hud__mode {
      pointer-events: auto;
      justify-self: end;
      display: block;
      cursor: pointer;
    }
    .game-hud__mode input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .game-hud__mode-track {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      width: 74px;
      height: 38px;
      padding: 4px;
      box-sizing: border-box;
      border-radius: 999px;
      background: rgba(54, 50, 70, 0.94);
      border: 1px solid rgba(163, 153, 190, 0.25);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.32);
    }
    .game-hud__mode-track::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      width: 32px;
      height: 28px;
      border-radius: 999px;
      background: #dcae55;
      box-shadow: inset 0 1px rgba(255,255,255,0.22), 0 2px 5px rgba(0,0,0,0.35);
      transition: transform 0.18s ease;
    }
    .game-hud__mode-option {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      color: #c9c4d6;
      transition: color 0.18s ease;
    }
    .game-hud__mode-option svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .game-hud__mode input:not(:checked) + .game-hud__mode-track .game-hud__mode-option--desktop,
    .game-hud__mode input:checked + .game-hud__mode-track .game-hud__mode-option--mobile {
      color: #27222e;
    }
    .game-hud__mode input:checked + .game-hud__mode-track::before {
      transform: translateX(32px);
    }
    .game-hud__icon-btn,
    .game-hud__spin,
    .game-hud__paytable-close {
      border: 0;
      color: #fff;
      cursor: pointer;
      font: inherit;
      font-weight: 900;
    }
    .game-hud__icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(#8fd35f, #4a9427 62%, #3c7d1e);
      border: 1px solid #2c6b17;
      box-shadow: inset 0 2px rgba(255,255,255,0.35), 0 3px 0 #245812, 0 5px 10px rgba(0,0,0,0.35);
      font-size: 24px;
      line-height: 1;
      text-shadow: 0 1px 2px rgba(0,0,0,0.35);
    }
    .game-hud__icon-btn:active {
      transform: translateY(2px);
      box-shadow: inset 0 2px rgba(255,255,255,0.25), 0 1px 0 #245812, 0 3px 6px rgba(0,0,0,0.3);
    }
    .game-hud__buzz {
      position: absolute;
      /* Hug the stage's left edge, not the viewport's, when pillarboxed. */
      left: max(10px, env(safe-area-inset-left), calc(50vw - var(--tdf-stage-w, 100vw) / 2 + 10px));
      top: 50%;
      transform: translateY(-50%);
      display: grid;
      justify-items: center;
      gap: 6px;
      padding: 10px 8px;
      pointer-events: none;
      background: rgba(7, 12, 8, 0.74);
      border: 1px solid rgba(255, 211, 90, 0.28);
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
    }
    .game-hud__buzz-track {
      position: relative;
      width: 16px;
      height: 168px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(255, 211, 90, 0.22);
      overflow: hidden;
    }
    .game-hud__buzz-fill {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      /* Fill fraction lives in --tdf-fill (set by setFillMeter) so vertical
         (desktop) and horizontal (mobile) tracks share the same state. */
      height: var(--tdf-fill, 0%);
      background: linear-gradient(#ffcf5c, #b87810);
      transition: height 0.35s ease, width 0.35s ease;
    }
    .game-hud__buzz-value {
      font-size: 14px;
    }
    .game-hud__bottom {
      position: absolute;
      left: max(12px, env(safe-area-inset-left));
      right: max(12px, env(safe-area-inset-right));
      bottom: max(14px, env(safe-area-inset-bottom));
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: end;
      gap: 12px;
    }
    .game-hud__demo {
      pointer-events: auto;
      grid-column: 1;
      justify-self: start;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: min(360px, 34vw);
    }
    .game-hud__demo-btn {
      border: 1px solid rgba(255, 211, 90, 0.32);
      border-radius: 999px;
      padding: 8px 11px;
      background: rgba(7, 12, 8, 0.78);
      color: #ffd35a;
      box-shadow: 0 3px 10px rgba(0,0,0,0.32);
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      font-weight: 900;
      white-space: nowrap;
    }
    .game-hud__spin {
      pointer-events: auto;
      grid-column: 2;
      min-width: 190px;
      padding: 18px 54px 17px;
      border-radius: 999px;
      background: linear-gradient(#ffcf5c, #b87810);
      box-shadow: 0 5px 0 #7b4b08, 0 10px 24px rgba(0,0,0,0.42);
      font-size: 24px;
      letter-spacing: 0.08em;
      transition: transform 0.05s, filter 0.12s, opacity 0.12s;
    }
    .game-hud__spin:hover,
    .game-hud__icon-btn:hover,
    .game-hud__paytable:hover,
    .game-hud__demo-btn:hover {
      filter: brightness(1.08);
    }
    .game-hud__spin:active {
      transform: translateY(2px);
      box-shadow: 0 3px 0 #7b4b08, 0 7px 18px rgba(0,0,0,0.38);
    }
    .game-hud button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(0.25);
    }
    .game-hud__paytable {
      pointer-events: auto;
      justify-self: end;
      width: 48px;
      height: 48px;
      border: 1px solid rgba(255, 211, 90, 0.35);
      border-radius: 50%;
      background: rgba(7, 12, 8, 0.78);
      color: #ffd35a;
      box-shadow: 0 4px 14px rgba(0,0,0,0.36);
      cursor: pointer;
      font-size: 24px;
      font-weight: 900;
    }
    .game-hud__event {
      position: absolute;
      left: 50%;
      top: 76px;
      transform: translateX(-50%);
      pointer-events: none;
      display: none;
      padding: 8px 18px;
      border-radius: 8px;
      background: rgba(80, 50, 0, 0.84);
      border: 1px solid rgba(255, 211, 90, 0.55);
      color: #ffd35a;
      box-shadow: 0 0 22px rgba(255, 211, 90, 0.2);
      text-align: center;
      font-weight: 900;
    }
    .game-hud__event.is-visible {
      display: block;
    }
    .game-hud__event-spin {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: rgba(246, 242, 223, 0.78);
      text-transform: uppercase;
    }
    .game-hud__control-bar {
      position: absolute;
      left: 50%;
      bottom: max(10px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      width: min(980px, calc(var(--tdf-stage-w, 100vw) - 16px), calc(100vw - 20px));
      min-height: 78px;
      display: grid;
      grid-template-columns: 48px auto 1fr auto 90px;
      align-items: center;
      gap: 12px;
      padding: 8px 14px;
      box-sizing: border-box;
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(54, 57, 64, 0.72) 0%, rgba(38, 40, 46, 0.64) 48%, rgba(26, 28, 33, 0.72) 100%);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px rgba(255,255,255,0.14);
      backdrop-filter: blur(14px) saturate(1.15);
    }
    .game-hud__bar-menu {
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 32px;
      line-height: 1;
      opacity: 0.9;
    }
    .game-hud__control-bar .game-hud__panel,
    .game-hud__control-bar .game-hud__bet {
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
    }
    .game-hud__control-bar .game-hud__panel {
      padding: 6px 14px;
      border-left: 1px solid rgba(255,255,255,0.14);
    }
    .game-hud__control-bar .game-hud__bet {
      grid-column: 4;
      padding: 4px 10px;
    }
    .game-hud__control-bar .game-hud__label {
      color: rgba(226, 229, 235, 0.72);
      letter-spacing: 0.12em;
    }
    .game-hud__control-bar .game-hud__value {
      color: #fff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
    }
    .game-hud__control-bar .game-hud__spin {
      grid-column: 5;
      min-width: 0;
      width: 78px;
      height: 78px;
      padding: 0;
      display: grid;
      place-items: center;
      border: 6px solid #100e17;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 32%, #3a3644, #1d1a24 68%);
      box-shadow: 0 4px 0 #060509, 0 9px 22px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.1);
    }
    .game-hud__control-bar .game-hud__spin svg {
      width: 52px;
      height: 52px;
      fill: none;
      stroke: #fff;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .game-hud__corner {
      position: absolute;
      top: max(10px, env(safe-area-inset-top));
      /* Hug the stage's right edge, not the viewport's, when pillarboxed. */
      right: max(10px, env(safe-area-inset-right), calc(50vw - var(--tdf-stage-w, 100vw) / 2 + 10px));
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: auto;
    }
    .game-hud__corner .game-hud__paytable {
      width: 38px;
      height: 38px;
      color: #e6e0f7;
      border: 1px solid rgba(163, 153, 190, 0.35);
      background: rgba(34, 30, 48, 0.88);
      font-size: 20px;
    }
    .game-hud__demo--hidden {
      display: none;
    }
    .game-hud__overlay {
      position: fixed;
      inset: 0;
      z-index: 30;
      display: none;
      place-items: center;
      padding: 18px;
      background: rgba(0, 0, 0, 0.62);
      pointer-events: auto;
    }
    .game-hud__overlay.is-open {
      display: grid;
    }
    .game-hud__paytable-card {
      width: min(920px, 94vw);
      max-height: min(760px, 86vh);
      overflow: auto;
      border-radius: 8px;
      background: #132016;
      border: 1px solid rgba(255, 211, 90, 0.38);
      box-shadow: 0 18px 50px rgba(0,0,0,0.58);
      color: #f6f2df;
    }
    .game-hud__paytable-head {
      position: sticky;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      background: #192b1c;
      border-bottom: 1px solid rgba(255, 211, 90, 0.24);
    }
    .game-hud__paytable-title {
      margin: 0;
      font-size: 20px;
    }
    .game-hud__paytable-close {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #3b2411;
      font-size: 20px;
    }
    .game-hud__paytable-body {
      padding: 14px 16px 18px;
    }
    .game-hud__paytable-grid {
      display: grid;
      /* minmax(0,1fr): the pay table's min-width must NOT widen the track —
         without this the whole card grows past the viewport on phones and the
         info grid packs into clipped columns; the table scrolls in its own
         wrap instead. */
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
    }
    .game-hud__paytable-section {
      min-width: 0;
      padding: 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(255, 211, 90, 0.14);
    }
    .game-hud__paytable-section h3 {
      margin: 0 0 10px;
      color: #ffd35a;
      font-size: 15px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .game-hud__paytable-table-wrap {
      overflow-x: auto;
    }
    .game-hud__paytable-table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
      font-size: 13px;
    }
    .game-hud__paytable-table th,
    .game-hud__paytable-table td {
      padding: 7px 8px;
      border: 1px solid rgba(255, 211, 90, 0.12);
      text-align: right;
      white-space: nowrap;
    }
    .game-hud__paytable-table th {
      color: rgba(246, 242, 223, 0.78);
      background: rgba(0, 0, 0, 0.18);
      font-weight: 900;
    }
    .game-hud__paytable-table th:first-child,
    .game-hud__paytable-table td:first-child {
      position: sticky;
      left: 0;
      z-index: 1;
      text-align: left;
      background: #1a2a1d;
      color: #ffd35a;
      font-weight: 900;
    }
    .game-hud__info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 10px;
    }
    .game-hud__paytable-row {
      display: block;
      padding: 9px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.055);
      font-size: 14px;
    }
    .game-hud__paytable-symbol {
      display: block;
      margin-bottom: 3px;
      font-weight: 900;
      color: #ffd35a;
    }
    .game-hud__paytable-text {
      color: rgba(246, 242, 223, 0.82);
      line-height: 1.35;
    }
    .game-hud__paytable-note {
      margin: 12px 0 0;
      color: rgba(246, 242, 223, 0.72);
      font-size: 13px;
    }
    /* Desktop now shares mobile's floating-control language: no opaque banner,
       circular steppers/spin button, transparent stats and a horizontal meter. */
    .game-hud--desktop .game-hud__control-bar {
      display: contents;
    }
    .game-hud--desktop .game-hud__bar-menu {
      display: none;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__panel {
      position: absolute;
      left: calc(50vw - var(--tdf-stage-w, 100vw) / 2 + var(--tdf-stage-w, 100vw) * 0.07);
      top: calc(50vh + var(--tdf-stage-h, 100vh) / 2 - 44px);
      min-width: 0;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__panel--win {
      left: calc(50vw - var(--tdf-stage-w, 100vw) / 2 + var(--tdf-stage-w, 100vw) * 0.27);
      text-align: center;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__bet {
      display: contents;
    }
    .game-hud--desktop .game-hud__bet-value {
      position: absolute;
      left: calc(50vw - var(--tdf-stage-w, 100vw) / 2 + var(--tdf-stage-w, 100vw) * 0.66);
      top: calc(50vh + var(--tdf-stage-h, 100vh) / 2 - 44px);
      min-width: 0;
      text-align: center;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__icon-btn {
      position: absolute;
      top: calc(50vh + var(--tdf-stage-h, 100vh) / 2 - 55px);
      transform: translate(-50%, -50%);
      width: 44px;
      height: 44px;
      border: 0;
      background: rgba(20, 20, 26, 0.58);
      box-shadow: none;
      font-weight: 400;
    }
    .game-hud--desktop [data-hud="bet-minus"] { left: 43%; }
    .game-hud--desktop [data-hud="bet-plus"] { left: 57%; }
    .game-hud--desktop .game-hud__control-bar .game-hud__spin {
      position: absolute;
      left: 50%;
      top: calc(50vh + var(--tdf-stage-h, 100vh) / 2 - 55px);
      transform: translate(-50%, -50%);
      width: 82px;
      height: 82px;
      min-width: 0;
      padding: 0;
      border: 0;
      background: rgba(20, 20, 26, 0.48);
      box-shadow: none;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__spin svg {
      width: 60px;
      height: 60px;
      stroke-width: 5;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__label,
    .game-hud--desktop .game-hud__control-bar .game-hud__value {
      color: #fff;
      text-shadow: 0 1px 4px rgba(0,0,0,0.78);
    }
    .game-hud--desktop .game-hud__buzz {
      left: 50%;
      top: calc(50vh - var(--tdf-stage-h, 100vh) / 2 + var(--tdf-stage-h, 100vh) * 0.125);
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 8px;
      width: min(330px, calc(var(--tdf-stage-w, 100vw) * 0.31));
      box-sizing: border-box;
      padding: 6px 10px;
    }
    .game-hud--desktop .game-hud__buzz-track {
      flex: 1;
      width: auto;
      height: 14px;
    }
    .game-hud--desktop .game-hud__buzz-track::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(90deg, transparent calc(34% - 1px), rgba(255, 215, 90, 0.55) calc(34% - 1px), rgba(255, 215, 90, 0.55) calc(34% + 1px), transparent calc(34% + 1px)),
        linear-gradient(90deg, transparent calc(68% - 1px), rgba(255, 215, 90, 0.55) calc(68% - 1px), rgba(255, 215, 90, 0.55) calc(68% + 1px), transparent calc(68% + 1px));
    }
    .game-hud--desktop .game-hud__buzz-fill {
      right: auto;
      top: 0;
      bottom: 0;
      height: 100%;
      width: var(--tdf-fill, 0%);
      background: linear-gradient(90deg, #b87810, #ffcf5c);
    }
    /* Compact HUD: applied by JS when the STAGE (not the viewport) is narrow,
       so a pillarboxed mobile layout in a wide window compacts too. */
    .game-hud--compact .game-hud__control-bar {
      min-height: 66px;
      grid-template-columns: 32px minmax(0, auto) 1fr auto 64px;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 14px;
    }
    .game-hud--compact .game-hud__bar-menu {
      font-size: 24px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__panel {
      min-width: 0;
      padding: 4px 8px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__bet {
      grid-template-columns: 30px minmax(56px, auto) 30px;
      gap: 3px;
      padding: 3px 4px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__icon-btn {
      width: 30px;
      height: 30px;
      font-size: 19px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__spin {
      width: 64px;
      height: 64px;
      min-width: 0;
      padding: 0;
      border-width: 5px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__spin svg {
      width: 43px;
      height: 43px;
    }
    .game-hud--compact .game-hud__value {
      font-size: 15px;
    }
    .game-hud--compact .game-hud__corner .game-hud__mode-track {
      width: 62px;
      height: 32px;
    }
    .game-hud--compact .game-hud__corner .game-hud__mode-track::before {
      width: 26px;
      height: 24px;
    }
    .game-hud--compact .game-hud__corner .game-hud__mode input:checked + .game-hud__mode-track::before {
      transform: translateX(28px);
    }
    .game-hud--compact .game-hud__corner .game-hud__paytable {
      width: 32px;
      height: 32px;
      font-size: 17px;
    }
    .game-hud--compact .game-hud__demo {
      max-width: 33vw;
    }
    .game-hud--compact .game-hud__buzz-track {
      height: 110px;
    }
    .game-hud--compact .game-hud__demo-btn {
      padding: 7px 9px;
      font-size: 11px;
    }
    /* ------------------------------------------------------------------
       Mobile layout (Le Cowboy style): NO bar — controls float straight on
       the scene as translucent dark circles. The bar element becomes
       display:contents so each child positions itself on the viewport. */
    .game-hud--mobile .game-hud__control-bar {
      display: contents;
    }
    /* The bar menu has no function yet — dead UI hidden on mobile until a
       real menu exists; the paytable "?" takes its bottom-left spot. */
    .game-hud--mobile .game-hud__bar-menu {
      display: none;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__panel {
      position: absolute;
      left: max(14px, calc(50vw - var(--tdf-stage-w, 100vw) / 2 + 14px));
      /* Stats line: 0.44 of the stage below center, but never clipped by the
         window edge (short landscape windows put 0.44 past the bottom). */
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.44), calc(100vh - 46px));
      min-width: 0;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      pointer-events: auto;
    }
    /* Win readout: CENTER of the stats line (same line as Balance/Bet) — a
       band-relative spot collided with the bet value whenever the window had
       no letterbox band (mobile layout in a landscape window). */
    .game-hud--mobile .game-hud__control-bar .game-hud__panel--win {
      left: 50%;
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.44), calc(100vh - 46px));
      transform: translateX(-50%);
      text-align: center;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__bet {
      display: contents;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__icon-btn {
      position: absolute;
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.36), calc(100vh - 88px));
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: rgba(20, 20, 26, 0.58);
      box-shadow: none;
      color: #fff;
      font-size: 26px;
      font-weight: 400;
      pointer-events: auto;
    }
    .game-hud--mobile [data-hud="bet-minus"] {
      left: calc(50% - 96px);
    }
    .game-hud--mobile [data-hud="bet-plus"] {
      left: calc(50% + 52px);
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__icon-btn:active {
      transform: translateY(calc(-50% + 2px));
      box-shadow: none;
    }
    /* Bet value sits under its "+" stepper (right of the spin button), so the
       stats line reads Balance | Win | Bet without collisions. */
    .game-hud--mobile .game-hud__bet-value {
      position: absolute;
      left: calc(50% + 74px);
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.44), calc(100vh - 46px));
      transform: translateX(-50%);
      min-width: 0;
      text-align: center;
      pointer-events: auto;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__spin {
      position: absolute;
      left: 50%;
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.36), calc(100vh - 88px));
      transform: translate(-50%, -50%);
      width: 84px;
      height: 84px;
      padding: 0;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: rgba(20, 20, 26, 0.42);
      box-shadow: none;
      pointer-events: auto;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__spin svg {
      width: 62px;
      height: 62px;
      stroke-width: 5;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__spin:active {
      transform: translate(-50%, calc(-50% + 2px));
      box-shadow: none;
    }
    /* Stats text scales with the on-screen stage width so Balance | Win | Bet
       always fit on one line, even heavily pillarboxed in a short window. */
    .game-hud--mobile .game-hud__label {
      color: rgba(255, 255, 255, 0.82);
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
      font-size: clamp(9px, calc(var(--tdf-stage-w, 100vw) * 0.028), 11px);
    }
    .game-hud--mobile .game-hud__value {
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.75);
      font-size: clamp(11px, calc(var(--tdf-stage-w, 100vw) * 0.046), 18px);
    }
    /* Paytable "?" docks TOP-LEFT (mirror of the mode toggle): the farmer
       covered it bottom-right, and on the controls line it collided with the
       "-" stepper in narrow pillarboxed windows. */
    .game-hud--mobile .game-hud__corner .game-hud__paytable {
      position: fixed;
      left: max(10px, env(safe-area-inset-left), calc(50vw - var(--tdf-stage-w, 100vw) / 2 + 10px));
      right: auto;
      top: max(10px, env(safe-area-inset-top));
      transform: none;
      width: 42px;
      height: 42px;
      border: 0;
      background: rgba(20, 20, 26, 0.58);
      font-size: 18px;
    }
    /* Buzz meter: HORIZONTAL bar centered ABOVE the board, filling
       left-to-right — full bar = the farmer shoots more + free spins.
       Tier ticks mark the 34%/68% shot-chance thresholds. */
    .game-hud--mobile .game-hud__buzz {
      left: 50%;
      top: calc(50vh - var(--tdf-stage-h, 100vh) * 0.243);
      bottom: auto;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 7px;
      width: calc(var(--tdf-stage-w, 100vw) * 0.55);
      box-sizing: border-box;
      padding: 6px 10px;
    }
    .game-hud--mobile .game-hud__buzz .game-hud__label {
      font-size: 10px;
      letter-spacing: 0.06em;
    }
    .game-hud--mobile .game-hud__buzz-track {
      flex: 1;
      width: auto;
      height: 14px;
    }
    /* Tier ticks (34% / 68%) drawn ABOVE the fill — dark, so they read as
       notches against BOTH the gold fill and the dark empty track (gold ticks
       vanished once the fill passed them). */
    .game-hud--mobile .game-hud__buzz-track::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(90deg, transparent calc(34% - 1px), rgba(0, 0, 0, 0.45) calc(34% - 1px), rgba(0, 0, 0, 0.45) calc(34% + 1px), transparent calc(34% + 1px)),
        linear-gradient(90deg, transparent calc(68% - 1px), rgba(0, 0, 0, 0.45) calc(68% - 1px), rgba(0, 0, 0, 0.45) calc(68% + 1px), transparent calc(68% + 1px));
    }
    .game-hud--mobile .game-hud__buzz-fill {
      right: auto;
      top: 0;
      bottom: 0;
      height: 100%;
      width: var(--tdf-fill, 0%);
      background: linear-gradient(90deg, #b87810, #ffcf5c);
    }
    .game-hud--mobile .game-hud__buzz-value {
      font-size: 14px;
      min-width: 36px;
      text-align: right;
    }
  `,document.head.appendChild(e)}function jr(){let e=Array.from({length:10},(e,t)=>t+5);return`
    <div class="game-hud__paytable-table-wrap">
      <table class="game-hud__paytable-table">
        <thead><tr><th>Symbol</th>${e.map(e=>`<th>${e===14?`14+`:e}</th>`).join(``)}</tr></thead>
        <tbody>${Object.entries(d).filter(([,e])=>Array.isArray(e)).map(([t,n])=>`<tr><td>${t}</td>${e.map(e=>`<td>${Or(n[e]||0)}x</td>`).join(``)}</tr>`).join(``)}</tbody>
      </table>
    </div>
  `}function Mr(){let e=s.fill_tiers.map(e=>`${e.min_fill}%+: ${Math.round(e.shot_chance*1e3)/10}%`).join(` · `),t=s.buff_values.map(e=>`x${e.value}`).join(`, `),n=p.BOTTLE_TYPES.map(e=>`${(e.label||e.id).toUpperCase()} +${e.fill}%`).join(` · `);return`
    <div class="game-hud__info-grid">
      <div class="game-hud__paytable-row">
        <span class="game-hud__paytable-symbol">Buzz Meter &amp; Free Spins</span>
        <span class="game-hud__paytable-text">Bottles can spawn each spin (base chance ${Math.round(p.BASE_SPAWN_CHANCE*100)}%, rising ${Math.round(p.SPAWN_RISE_PER_DRY_SPIN*100)}% per dry spin). Every bottle contains alcohol — what varies is the drink: ${n} of the Buzz meter. The fuller the meter, the more often the farmer shoots chickens (see below). When the meter tops out you win ${h.count} FREE SPINS where at least ${h.guaranteed_chickens} chickens land on every board and EVERY chicken in a winning cluster is shot — and the overflow carries over into the next meter.</span>
      </div>
      <div class="game-hud__paytable-row">
        <span class="game-hud__paytable-symbol">Chicken Wilds</span>
        <span class="game-hud__paytable-text">Every wild is a chicken and substitutes to help form clusters. When a chicken ends up in a winning cluster, the farmer may shoot it — the chance scales with the Buzz meter (${e}). A SHOT chicken buffs the WHOLE cluster (${t}): the cluster win is multiplied, and several shot cells in one cluster add their values. The buff then STAYS on its cell as a waiting ×badge — however many spins it takes — until a winning cluster covers that cell again: that cluster is multiplied too, and the badge is used up.</span>
      </div>
      <div class="game-hud__paytable-row">
        <span class="game-hud__paytable-symbol">Limits</span>
        <span class="game-hud__paytable-text">MAX WIN: ${r}x. RTP target: 94-96%. Values are placeholders pending balancing.</span>
      </div>
    </div>
  `}function Nr(e){e.className=`game-hud`,e.innerHTML=`
    <div class="game-hud__control-bar">
      <div class="game-hud__bar-menu" aria-hidden="true">☰</div>
      <div class="game-hud__panel">
        <span class="game-hud__label">Balance</span>
        <span class="game-hud__value" data-hud="balance">0.00x</span>
      </div>
      <div class="game-hud__panel game-hud__panel--win">
        <span class="game-hud__label">Win</span>
        <span class="game-hud__value" data-hud="last-win">0.00x</span>
      </div>
      <div class="game-hud__bet" aria-label="Bet amount">
        <button class="game-hud__icon-btn" type="button" data-hud="bet-minus" aria-label="Decrease bet">-</button>
        <div class="game-hud__bet-value">
          <span class="game-hud__label">Bet</span>
          <span class="game-hud__value" data-hud="bet">1.00x</span>
        </div>
        <button class="game-hud__icon-btn" type="button" data-hud="bet-plus" aria-label="Increase bet">+</button>
      </div>
      <button class="game-hud__spin" type="button" data-hud="spin" aria-label="Spin">
        <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M49 19A23 23 0 1 0 54 38"></path><path d="M48 8v13H35"></path></svg>
      </button>
    </div>
    <div class="game-hud__corner">
      <label class="game-hud__mode" aria-label="Switch between desktop and mobile layout">
        <input type="checkbox" data-hud="display-mode">
        <span class="game-hud__mode-track">
          <span class="game-hud__mode-option game-hud__mode-option--desktop" title="Desktop">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path></svg>
          </span>
          <span class="game-hud__mode-option game-hud__mode-option--mobile" title="Mobil">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M11 18h2"></path></svg>
          </span>
        </span>
      </label>
      <button class="game-hud__paytable" type="button" data-hud="paytable" aria-label="Open paytable">?</button>
    </div>
    <div class="game-hud__buzz" aria-label="Farmer fill meter">
      <span class="game-hud__label">Buzz</span>
      <div class="game-hud__buzz-track">
        <div class="game-hud__buzz-fill" data-hud="buzz-fill"></div>
      </div>
      <span class="game-hud__value game-hud__buzz-value" data-hud="buzz-value">0%</span>
    </div>
    <div class="game-hud__event" data-hud="event-win">
      <span class="game-hud__label">Event Win</span>
      <span class="game-hud__value" data-hud="event-win-value">0.00x</span>
      <span class="game-hud__event-spin" data-hud="event-spin"></span>
    </div>
    <div class="game-hud__demo game-hud__demo--hidden" aria-label="Demo controls" aria-hidden="true">
        <button class="game-hud__demo-btn" type="button" data-hud="demo-beer">Small</button>
        <button class="game-hud__demo-btn" type="button" data-hud="demo-wine">Big</button>
        <button class="game-hud__demo-btn" type="button" data-hud="demo-moonshine">Mega</button>
        <button class="game-hud__demo-btn" type="button" data-hud="demo-jug">Ultra</button>
        <button class="game-hud__demo-btn" type="button" data-hud="demo-barrel">Full</button>
    </div>
    <div class="game-hud__overlay" data-hud="overlay" aria-hidden="true">
      <div class="game-hud__paytable-card" role="dialog" aria-modal="true" aria-label="Paytable">
        <div class="game-hud__paytable-head">
          <h2 class="game-hud__paytable-title">Paytable</h2>
          <button class="game-hud__paytable-close" type="button" data-hud="paytable-close" aria-label="Close paytable">x</button>
        </div>
        <div class="game-hud__paytable-body">
          <div class="game-hud__paytable-grid">
            <section class="game-hud__paytable-section">
              <h3>Cluster Pays</h3>
              ${jr()}
              <p class="game-hud__paytable-note">Pays start at 5+ connected symbols. Values are bet multipliers. Wild substitutes and has no direct paytable.</p>
            </section>
            <section class="game-hud__paytable-section">
              <h3>Feature Rules</h3>
              ${Mr()}
            </section>
          </div>
        </div>
      </div>
    </div>
  `}function Pr(e,t={}){let n=typeof e==`string`?document.querySelector(e):e;if(!n)throw Error(`initHud: container element not found.`);Ar(),Nr(n);let r=Number(t.balance??0),i=kr(t.bet??1),a=Number(t.lastWin??0),o=0,s=!1,c=``,l=!1,u={balance:n.querySelector(`[data-hud="balance"]`),lastWin:n.querySelector(`[data-hud="last-win"]`),bet:n.querySelector(`[data-hud="bet"]`),displayMode:n.querySelector(`[data-hud="display-mode"]`),buzzFill:n.querySelector(`[data-hud="buzz-fill"]`),buzzValue:n.querySelector(`[data-hud="buzz-value"]`),eventBox:n.querySelector(`[data-hud="event-win"]`),eventWin:n.querySelector(`[data-hud="event-win-value"]`),eventSpin:n.querySelector(`[data-hud="event-spin"]`),spin:n.querySelector(`[data-hud="spin"]`),betMinus:n.querySelector(`[data-hud="bet-minus"]`),betPlus:n.querySelector(`[data-hud="bet-plus"]`),paytable:n.querySelector(`[data-hud="paytable"]`),demoBeer:n.querySelector(`[data-hud="demo-beer"]`),demoWine:n.querySelector(`[data-hud="demo-wine"]`),demoMoonshine:n.querySelector(`[data-hud="demo-moonshine"]`),demoJug:n.querySelector(`[data-hud="demo-jug"]`),demoBarrel:n.querySelector(`[data-hud="demo-barrel"]`),overlay:n.querySelector(`[data-hud="overlay"]`),paytableClose:n.querySelector(`[data-hud="paytable-close"]`)};function d(){u.balance.textContent=`${Or(r)}x`,u.lastWin.textContent=`${Or(a)}x`,u.bet.textContent=`${Or(i)}x`,u.eventWin.textContent=`${Or(o)}x`,u.eventSpin.textContent=c?`Free Spin ${c}`:``,u.eventBox.classList.toggle(`is-visible`,s),u.spin.disabled=l,u.betMinus.disabled=l||i<=wr,u.betPlus.disabled=l||i>=Tr,u.demoBeer.disabled=l,u.demoWine.disabled=l,u.demoMoonshine.disabled=l,u.demoJug.disabled=l,u.demoBarrel.disabled=l}function f(e){let n=kr(e);n!==i&&(i=n,d(),t.onBetChange&&t.onBetChange(i))}function p(e){u.overlay.classList.toggle(`is-open`,e),u.overlay.setAttribute(`aria-hidden`,e?`false`:`true`)}u.betMinus.addEventListener(`click`,()=>f(i-Er)),u.betPlus.addEventListener(`click`,()=>f(i+Er));let m=localStorage.getItem(`tdf-display-mode`),h=m?m===`mobile`:window.innerHeight>window.innerWidth;u.displayMode.checked=h,u.displayMode.addEventListener(`change`,()=>{localStorage.setItem(`tdf-display-mode`,u.displayMode.checked?`mobile`:`desktop`),window.location.reload()}),u.spin.addEventListener(`click`,()=>{t.onSpin&&t.onSpin()}),u.demoBeer.addEventListener(`click`,()=>{t.onDemoBottle&&t.onDemoBottle(`beer`)}),u.demoWine.addEventListener(`click`,()=>{t.onDemoBottle&&t.onDemoBottle(`wine`)}),u.demoMoonshine.addEventListener(`click`,()=>{t.onDemoBottle&&t.onDemoBottle(`moonshine`)}),u.demoJug.addEventListener(`click`,()=>{t.onDemoBottle&&t.onDemoBottle(`jug`)}),u.demoBarrel.addEventListener(`click`,()=>{t.onDemoBottle&&t.onDemoBottle(`barrel`)}),u.paytable.addEventListener(`click`,()=>p(!0)),u.paytableClose.addEventListener(`click`,()=>p(!1)),u.overlay.addEventListener(`click`,e=>{e.target===u.overlay&&p(!1)}),window.addEventListener(`keydown`,e=>{e.key===`Escape`&&p(!1)});let g=document.querySelector(`#stage`);function _(){let e=!!(g&&g.classList.contains(`tdf-mobile`)),t=g&&g.clientWidth||window.innerWidth;n.classList.toggle(`game-hud--compact`,!e&&Math.min(t,window.innerWidth)<560),n.classList.toggle(`game-hud--mobile`,e),n.classList.toggle(`game-hud--desktop`,!e)}return window.addEventListener(`resize`,_),_(),d(),{spinButton:u.spin,getBet:()=>i,setSpinDisabled(e){l=!!e,d()},setBalance(e){r=Number(e||0),d()},setLastWin(e){a=Number(e||0),d()},setFillMeter(e){let t=Math.max(0,Math.min(1,Number(e)||0));u.buzzFill.style.setProperty(`--tdf-fill`,`${t*100}%`),u.buzzValue.textContent=`${Math.round(t*100)}%`},showEventWin(e=0,t=``){o=Number(e||0),s=!0,c=t,d()},setEventWin(e,t){o=Number(e||0),t!==void 0&&(c=t),d()},hideEventWin(){o=0,s=!1,c=``,d()}}}var Fr=`drunk-farmer-win-celebration-style`,Ir=[{id:`super`,label:`SUPER WIN`,min:100},{id:`mega`,label:`MEGA WIN`,min:50},{id:`big`,label:`BIG WIN`,min:20},{id:`nice`,label:`NICE WIN`,min:5},{id:`win`,label:`WIN`,min:1}],Lr={win:900,nice:1100,big:1500,mega:1900,super:2300},Rr=900,zr=250;function Br(e){return`${Number(e||0).toFixed(2)}x`}function Vr(e,t){let n=t>0?e/t:0;return Ir.find(e=>n>=e.min)||null}function Hr(){if(document.getElementById(Fr))return;let e=document.createElement(`style`);e.id=Fr,e.textContent=`
    .win-celebration {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: grid;
      place-items: center;
      background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.8) 100%);
      pointer-events: none;
      user-select: none;
      opacity: 0;
      transition: opacity ${zr}ms ease;
      font-family: system-ui, sans-serif;
    }
    .win-celebration.is-visible {
      opacity: 1;
    }
    .win-celebration__inner {
      display: grid;
      justify-items: center;
      gap: 2px;
      text-align: center;
      /* Soft plate behind the text: keeps the label/amount readable no matter
         what the board behind looks like (helps desktop, essential mobile). */
      padding: 20px 34px 24px;
      border-radius: 18px;
      background: rgba(8, 10, 5, 0.55);
      box-shadow: 0 0 60px 30px rgba(8, 10, 5, 0.55);
      animation: winCelebrationPop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
    }
    @keyframes winCelebrationPop {
      0% { opacity: 0; transform: scale(0.55); }
      100% { opacity: 1; transform: scale(1); }
    }
    .win-celebration__sub {
      font-size: clamp(13px, 1.6vw, 20px);
      font-weight: 800;
      letter-spacing: 0.22em;
      color: rgba(246, 242, 223, 0.85);
    }
    .win-celebration__label {
      font-weight: 900;
      font-size: clamp(36px, 7vw, 92px);
      letter-spacing: 0.06em;
      white-space: nowrap;
      color: #ffd75e;
      text-shadow: 0 5px 0 #7a2b00, 0 0 30px rgba(255, 140, 0, 0.85);
    }
    .win-celebration__amount {
      font-weight: 900;
      font-size: clamp(30px, 5.4vw, 68px);
      color: #fff3c4;
      text-shadow: 0 3px 0 #5a3a00, 0 0 22px rgba(255, 211, 90, 0.75);
      font-variant-numeric: tabular-nums;
    }
    /* Higher tiers escalate: bigger label, hotter glow, a slow pulse on top. */
    .win-celebration--big .win-celebration__label {
      font-size: clamp(42px, 8vw, 106px);
      text-shadow: 0 5px 0 #7a2b00, 0 0 38px rgba(255, 150, 30, 0.95);
    }
    .win-celebration--mega .win-celebration__label,
    .win-celebration--super .win-celebration__label {
      font-size: clamp(46px, 9vw, 120px);
      text-shadow: 0 6px 0 #7a1d00, 0 0 30px rgba(255, 120, 20, 1), 0 0 70px rgba(255, 90, 0, 0.7);
      animation: winCelebrationPulse 1.1s ease-in-out infinite alternate;
    }
    @keyframes winCelebrationPulse {
      from { transform: scale(1); }
      to { transform: scale(1.05); }
    }
    /* Small-win toast: quick pill over the board, no dim, never blocks input. */
    .win-toast {
      position: fixed;
      left: 50%;
      top: 32%;
      transform: translate(-50%, -50%);
      z-index: 40;
      pointer-events: none;
      padding: 10px 22px;
      border-radius: 999px;
      background: rgba(22, 32, 12, 0.92);
      border: 2px solid #ffd75e;
      color: #ffe9a8;
      font-family: system-ui, sans-serif;
      font-weight: 900;
      font-size: clamp(16px, 2.2vw, 26px);
      letter-spacing: 0.06em;
      white-space: nowrap;
      text-shadow: 0 0 12px rgba(255, 211, 90, 0.6);
      animation: winToast 1.1s ease forwards;
    }
    @keyframes winToast {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
      18% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
      30% { transform: translate(-50%, -50%) scale(1); }
      78% { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%, -62%) scale(1); }
    }
    /* Mobile: 32% of the viewport lands exactly on the Buzz bar — hang the
       toast on the board's top frame edge instead. */
    .win-toast--mobile {
      top: calc(50vh - var(--tdf-stage-h, 100vh) * 0.19);
    }
    /* Mobile: the desktop radial dim is LIGHTEST in the center, but the
       near-full-width mobile board fills the center — flat dim instead so the
       text never sits on bright symbols. */
    .win-celebration--mobile {
      background: rgba(0, 0, 0, 0.72);
    }
  `,document.head.appendChild(e)}function Ur(e){return 1-(1-e)**3}function Wr(){return!!document.querySelector(`#stage.tdf-mobile`)}function Gr(e){let t=document.createElement(`div`);return t.className=`win-toast${Wr()?` win-toast--mobile`:``}`,t.textContent=`WIN ${Br(e)}`,document.body.appendChild(t),setTimeout(()=>t.remove(),1150),new Promise(e=>setTimeout(e,450))}function Kr({win:e,tier:t,label:n,isFreeSpinTotal:r}){return new Promise(i=>{let a=document.createElement(`div`);a.className=`win-celebration win-celebration--${t.id}${Wr()?` win-celebration--mobile`:``}`,a.innerHTML=`
      <div class="win-celebration__inner">
        ${r?`<span class="win-celebration__sub">TOTAL WIN</span>`:``}
        <span class="win-celebration__label"></span>
        <span class="win-celebration__amount">${Br(0)}</span>
      </div>
    `,a.querySelector(`.win-celebration__label`).textContent=n||t.label;let o=a.querySelector(`.win-celebration__amount`);document.body.appendChild(a),requestAnimationFrame(()=>a.classList.add(`is-visible`));let s=Lr[t.id]||1200,c=performance.now(),l=0,u=0,d=!1;function f(t){cancelAnimationFrame(l),o.textContent=Br(e),u=setTimeout(p,t)}function p(){d||(d=!0,clearTimeout(u),a.classList.remove(`is-visible`),setTimeout(()=>{a.remove(),i()},zr))}function m(t){let n=Math.min(1,(t-c)/s);if(o.textContent=Br(e*Ur(n)),n>=1){f(Rr);return}l=requestAnimationFrame(m)}l=requestAnimationFrame(m)})}function qr({win:e=0,bet:t=1,label:n,tier:r,isFreeSpinTotal:i=!1}={}){let a=r||Vr(e,t);return!a||e<=0?Promise.resolve():(Hr(),a.id===`win`&&!i?Gr(e):Kr({win:e,tier:a,label:n,isFreeSpinTotal:i}))}await Fe();var q=1e3,J=pe(),{canvas:Jr,ctx:Y,cellSize:X,resize:Yr}=st(`#stage`),Z=ir(),Xr=Zt(),Q=Pr(`#hud`,{balance:q,bet:1,lastWin:0,onSpin:ui,onDemoBottle:e=>si(e)}),$=o(),Zr=[],Qr=e=>yr(e,Zr,X),$r={drawUnderlay:Qr};lt(Y,$,X,[],$r),Q.setFillMeter(J.bottle.fill/100),window.addEventListener(`resize`,()=>{Yr(),Z.resize(),Xr.resize(),Q.spinButton.disabled||lt(Y,$,X,[],$r)});function ei(e,t=1500){let n=document.createElement(`div`);n.className=`event-banner`,n.textContent=e,document.querySelector(`#stage`).appendChild(n),setTimeout(()=>n.remove(),t)}function ti(e,t=2e3,n=null){let r=document.querySelector(`#stage`),i=document.createElement(`div`);if(i.className=`event-chip`,i.textContent=e,r.appendChild(i),n){let e=r.getBoundingClientRect(),t=i.offsetWidth/2,a=8+t-e.left,o=window.innerWidth-8-t-e.left;i.style.left=`${Math.max(a,Math.min(o,n.x-e.left))}px`,i.style.top=`${Math.max(8-e.top,n.y-e.top-i.offsetHeight)}px`}setTimeout(()=>i.remove(),t)}function ni(e){return`${(e.label||e.id).toUpperCase()} +${e.fill}%`}var ri=-1;function ii(e){let t=e>=68?.65:e>=34?.35:0;t!==ri&&(ri=t,Z.setDrunk(t))}ii(J.bottle.fill);var ai=0;async function oi(e){let n=t.find(t=>t.id===e)||t[0],r=Yt($);await sn(Y,Jr,$,X,r,{type:n.id,meterTarget:Z.catchScreenPoint(),flyLayer:Xr,drawUnderlay:Qr});let i=Z.drinkBottle();ti(ni(n),2e3,Z.chipScreenPoint()),ai+=n.fill,await i,ai>=100&&(ai-=100,ei(`${h.count} FREE SPINS!`),await Z.rackRifle()),Q.setFillMeter(ai/100),lt(Y,$,X,[],$r)}async function si(e){if(!Q.spinButton.disabled){Q.setSpinDisabled(!0);try{await oi(e)}finally{Q.setSpinDisabled(!1)}}}var ci=650,li=e=>new Promise(t=>setTimeout(t,e));async function ui(){let e=Q.getBet();if(!(q<e)){Q.setSpinDisabled(!0);try{q-=e,Q.setBalance(q),Q.setLastWin(0);let t=await fi(e),n=t,r=J.freeSpins.remaining>0;for(;J.freeSpins.remaining>0;)await li(ci),n+=await fi(e);di&&(Z.setRampage(!1),di=!1,Q.hideEventWin()),Q.setLastWin(n),r&&n-t>0&&await qr({win:n-t,bet:e,label:`FREE SPINS WIN`,isFreeSpinTotal:!0})}finally{Q.setSpinDisabled(!1)}}}var di=!1;async function fi(e){J.freeSpins.remaining>0&&(ei(`FREE SPIN ${J.freeSpins.total-J.freeSpins.remaining+1}/${J.freeSpins.total}`,1100),di||=(await Z.setRampage(!0),!0));let{state:t,result:n}=ge(J);J=t;let r=n.bottle,i=r.spawned?Yt(n.grid):null,a=i?{cellOverrides:Xt(n.grid,i)}:{};if(a.drawUnderlay=Qr,await Et(Y,n.grid,X,$,a),r.spawned){await sn(Y,Jr,n.grid,X,i,{type:r.type?r.type.id:`beer`,meterTarget:Z.catchScreenPoint(),flyLayer:Xr,drawUnderlay:Qr});let e=Z.drinkBottle();r.type&&ti(ni(r.type),2e3,Z.chipScreenPoint()),ii(r.fill),await e,r.meterReset&&(ei(`${n.freeSpinsQueued} FREE SPINS!`),await Z.rackRifle())}Q.setFillMeter(r.fillFraction),ii(r.fill);let o=n.chickenShots?n.chickenShots.buffed:[],s=n.effectiveBuffs||[],c=new Set(o.map(e=>`${e.row},${e.col}`)),l=s.filter(e=>!c.has(`${e.row},${e.col}`)).map(e=>({...e})),u=new Map,d=new Map;n.tumble.steps.forEach((e,t)=>{for(let n of e.clusters)for(let e of n.cells){let r=`${e.row},${e.col}`;if(c.has(r)&&!d.has(r)){d.set(r,n.cells.map(e=>({row:e.row,col:e.col})));let e=o.find(e=>`${e.row},${e.col}`===r);u.has(t)||u.set(t,[]),u.get(t).push(e)}}});let f=new Set;$=await It(Y,n.tumble.steps,X,{hiddenWinnerCells:f,drawUnderlay:(e,t)=>yr(e,l,X,{pulse:.5+.5*Math.sin((t||0)/160)}),onStepFlash:async(e,t)=>{let n=u.get(e);if(n)for(let e of n){let n=d.get(`${e.row},${e.col}`)||[];await Cr(Y,t.grid,X,e,{farmer:Z,revealed:l,highlights:n,hiddenWinners:f})}}})||n.grid,Zr=n.persistentBuffs||[],lt(Y,$,X,[],$r);let p=n.totalWin*e;return q+=p,Q.setBalance(q),n.isFreeSpin&&n.freeSpins&&Q.showEventWin(n.freeSpins.sessionWin*e,`${n.freeSpins.index}/${n.freeSpins.total}`),!n.isFreeSpin&&p>0&&await qr({win:p,bet:e}),console.log(`spin`,{isFreeSpin:n.isFreeSpin,spinWin:p,balance:q}),p}