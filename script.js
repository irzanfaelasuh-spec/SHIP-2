'use strict';
/* CREATE YOUR OWN SHIP — Created by SHI2Pneverlose3
   Butuh internet untuk memuat Three.js r128 (CDN). Suara = sintesis Web Audio.
   Jarak, waktu, gravitasi & fisika DISEDERHANAKAN untuk gameplay (bukan simulasi akurat). */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pc=v=>Math.round(v*100);
const DS={vol:.7,sfx:.8,mute:0,q:1,sens:1,inv:0,shake:1},S={...DS},G={credits:1500,design:null,done:0};
try{Object.assign(S,JSON.parse(localStorage.getItem('cyos_s')||'{}'));Object.assign(G,JSON.parse(localStorage.getItem('cyos_g')||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem('cyos_s',JSON.stringify(S));localStorage.setItem('cyos_g',JSON.stringify(G))}catch(e){}},
hasSave=()=>{try{return!!localStorage.getItem('cyos_g')}catch(e){return false}};

/* ---------- DATA ---------- */
const CAT={
cockpit:{t:'Cockpit',o:[{n:'Pod Mk1',m:400,c:0,hull:60,col:0xb8c7ff},{n:'Command Mk2',m:700,c:500,hull:110,col:0x9ff0ff}]},
engine:{t:'Mesin',o:[{n:'Chem Rocket',m:900,c:0,thr:90,eff:1,col:0xff9a6b},{n:'Ion Drive',m:1200,c:900,thr:70,eff:2.2,col:0x7fe7ff},{n:'Nuclear NTR',m:1800,c:1800,thr:160,eff:1.6,col:0xc3a6ff}]},
tank:{t:'Tangki BBM',o:[{n:'Tangki S',m:300,c:0,fuel:100,col:0xe4e9ff},{n:'Tangki M',m:600,c:300,fuel:220,col:0xe4e9ff},{n:'Tangki L',m:1100,c:700,fuel:420,col:0xe4e9ff},{n:'Tangki XL',m:2200,c:1400,fuel:900,col:0xe4e9ff}]},
power:{t:'Daya',o:[{n:'Baterai',m:200,c:0,pw:6,col:0xffd27f},{n:'Panel Surya',m:350,c:350,pw:14,wing:1,col:0x4f9bff}]},
life:{t:'Life support',o:[{n:'LS Basic',m:300,c:0,o2:420,col:0x9dffb0},{n:'LS Pro',m:500,c:450,o2:1000,col:0x9dffb0}]},
gear:{t:'Landing gear',o:[{n:'Kaki Standar',m:250,c:150,gear:.4,col:0xcfd6e8},{n:'Kaki Peredam',m:400,c:450,gear:.75,col:0xcfd6e8}]},
shield:{t:'Heat shield',o:[{n:'Ablatif',m:450,c:400,heat:.5,col:0x3a3a44},{n:'Keramik',m:700,c:900,heat:.85,col:0x2a2a33}]},
cargo:{t:'Kargo',o:[{n:'Kargo S',m:250,c:120,cargo:3,col:0xffb86b},{n:'Kargo L',m:500,c:300,cargo:7,col:0xffb86b}]}};
const KEYS=Object.keys(CAT),PRE={Starter:[0,0,1,1,0,0,0,0],Explorer:[1,1,2,1,1,1,0,1],Heavy:[1,2,3,1,1,1,1,1]};
const B=[{n:'Bumi',r:12,g:9.8,atm:1,land:1,col:0x2f6fe0,pos:[0,0,0],gr:0x2f5d3a,sky:0x6aa8e8},
{n:'Bulan',r:6,g:1.6,atm:0,land:1,col:0xb9b9b9,pos:[400,20,-60],rew:700,gr:0x8d8d92,sky:0x000000},
{n:'Mars',r:9,g:3.7,atm:.35,land:1,col:0xc2603a,pos:[-350,-30,-1150],rew:1900,gr:0x9a4f31,sky:0x7a4a33},
{n:'Jupiter (flyby)',r:40,g:24,atm:1.2,land:0,col:0xd9b48f,pos:[900,60,-1500],rew:3200}];
const PN={engine:'Mesin',hull:'Lambung',tank:'Tangki',gear:'Landing gear',power:'Listrik',life:'Life support'};

let design={},dest=1,tab='cockpit',R=null,mode='load',winMode=0,mapOn=0,ren,cam,H,F,Z,scene,star,mk,pv,mdl,gnd,rocks,AC,mg,eng,drag=0,shake=0,hudT=0,last=0;
const ang={a:.7,e:.25,r:12},K={};
const pt=k=>CAT[k].o[design[k]]||null,setD=a=>KEYS.forEach((k,i)=>design[k]=a[i]),
sm=p=>KEYS.map(pt).filter(Boolean).reduce((a,x)=>a+(x[p]||0),0),ENG=()=>pt('engine')||{thr:0,eff:1},
vmx=(m,t)=>cl(t*1000/m*.6,5,40),fwd=(y,p)=>new THREE.Vector3(-Math.cos(p)*Math.sin(y),Math.sin(p),-Math.cos(p)*Math.cos(y));
setD(G.design||PRE.Starter);

/* ---------- UTIL / AUDIO ---------- */
function toast(m,c=''){const t=document.createElement('div');t.className='glass tst '+c;t.textContent=m;const w=$('#toast');w.appendChild(t);while(w.children.length>4)w.firstChild.remove();setTimeout(()=>t.remove(),3400)}
const show=(id,v=true)=>$(id).classList.toggle('hide',!v);
const vol=()=>{if(mg)mg.gain.value=S.mute?0:S.vol};
function audio(){if(AC){AC.state=='suspended'&&AC.resume();return}try{AC=new(window.AudioContext||window.webkitAudioContext)();mg=AC.createGain();mg.connect(AC.destination);const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';f.type='lowpass';g.gain.value=0;o.connect(f);f.connect(g);g.connect(mg);o.start();eng={o,f,g};vol()}catch(e){AC=null}}
function beep(f,d=.1,ty='sine',v=.2,sl=0){if(!AC||S.mute)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t+d);g.gain.setValueAtTime(v*S.sfx+.0001,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(mg);o.start(t);o.stop(t+d)}
const SN={ui:()=>beep(640,.07,'sine',.15),ok:()=>{beep(520,.1,'sine',.18);setTimeout(()=>beep(780,.14,'sine',.18),90)},bad:()=>beep(200,.25,'sawtooth',.16,-80),hit:()=>beep(110,.3,'square',.22,-70),alarm:()=>beep(880,.14,'square',.1),step:()=>beep(rnd(70,100),.07,'triangle',.2)};
const snd=n=>SN[n]&&SN[n]();

/* ---------- BUILDER: statistik, validasi, UI ---------- */
function stats(){const dry=sm('m'),fuel=sm('fuel'),m=Math.max(1,dry+fuel),t=ENG().thr;return{dry,fuel,m,acc:t*1000/m,vmax:vmx(m,t),thr:t,hull:sm('hull'),pw:sm('pw'),o2:sm('o2'),gear:sm('gear'),heat:sm('heat'),cargo:sm('cargo'),cost:sm('c')}}
const fpu=(s,t=.8)=>s.thr*Math.pow(t,.6)/(ENG().eff*30*s.vmax),need=s=>2*B[dest].p.length()*fpu(s)+(B[dest].land?70:25);
function issues(s){const o=[];['cockpit','engine','tank','power','life'].forEach(k=>{if(!pt(k))o.push(['bad','Pasang '+CAT[k].t])});
 if(pt('engine')&&pt('tank')&&s.acc<8)o.push(['bad','Dorong terlalu lemah untuk massa ini']);
 const pre=Object.values(PRE).some(a=>a.every((v,i)=>v===design[KEYS[i]]));
 if(!pre&&s.cost>G.credits)o.push(['bad',`Kredit kurang (${s.cost}/${G.credits})`]);
 if(!pt('gear')&&B[dest].land)o.push(['warn','Tanpa landing gear: pendaratan sangat berisiko']);
 if(!pt('shield'))o.push(['warn','Tanpa heat shield: panas saat meluncur & masuk atmosfer']);
 if(s.fuel&&s.thr&&need(s)>s.fuel)o.push(['warn',`BBM mungkin kurang (butuh ≈${Math.ceil(need(s))}, ada ${s.fuel})`]);
 return o}
function ui(){
 $('#tabs').innerHTML=KEYS.map(k=>`<button class="chip${k==tab?' on':''}" data-t="${k}">${CAT[k].t}</button>`).join('');
 const d=x=>[x.thr&&`Dorong ${x.thr}kN`,x.eff&&`Efisiensi ×${x.eff}`,x.fuel&&`BBM ${x.fuel}`,x.hull&&`Lambung ${x.hull}`,x.pw&&`Daya ${x.pw}kW`,x.o2&&`O₂ ${x.o2}s`,x.gear&&`Peredam ${pc(x.gear)}%`,x.heat&&`Panas −${pc(x.heat)}%`,x.cargo&&`Slot ${x.cargo}`,x.wing&&'Panel surya',`${x.m}kg`,x.c?`${x.c} cr`:'gratis'].filter(Boolean).join(' · ');
 $('#parts').innerHTML=`<button class="opt${design[tab]<0?' on':''}" data-i="-1"><b>— Lepas —</b><small>Kosongkan slot ${CAT[tab].t}</small></button>`+CAT[tab].o.map((x,i)=>`<button class="opt${design[tab]==i?' on':''}" data-i="${i}"><b>${x.n}</b><small>${d(x)}</small></button>`).join('');
 const s=stats(),is=issues(s),ok=!is.some(i=>i[0]=='bad'),rg=s.fuel&&s.thr?s.fuel/fpu(s):0,row=(l,v,p)=>`<div class="row"><span>${l}</span><b>${v}</b>${p!=null?`<i style="--p:${cl(p,0,1)}"></i>`:''}</div>`;
 $('#stats').innerHTML=row('Massa',`${s.m|0} kg`,s.m/12000)+row('Dorong',`${s.thr} kN`,s.thr/160)+row('Kecepatan maks',`${s.vmax.toFixed(1)} u/s`,s.vmax/20)+row('BBM',s.fuel,s.fuel/900)+row('Jangkauan',`${rg|0} u`,rg/4000)+row('Lambung',s.hull,s.hull/200)+row('Daya',`${s.pw} kW`,s.pw/20)+row('Life support',`${s.o2} s`,s.o2/1000)+row('Peredam',`${pc(s.gear)}%`,s.gear)+row('Heat shield',`${pc(s.heat)}%`,s.heat)+row('Kargo',`${s.cargo} slot`,s.cargo/7)+row('Biaya',`${s.cost} / ${G.credits} cr`,null);
 $('#issues').innerHTML=is.length?is.map(i=>`<p class="${i[0]}">${i[0]=='bad'?'✕':'!'} ${i[1]}</p>`).join(''):'<p class="ok">✓ Siap terbang</p>';
 $('#bLaunch').disabled=!ok;$('#preset').value=Object.keys(PRE).find(n=>PRE[n].every((v,i)=>v===design[KEYS[i]]))||'';
 G.design=KEYS.map(k=>design[k]);save();rebuildShip()}

/* ---------- MODEL KAPAL PROSEDURAL ---------- */
function dispose(o){o.traverse(c=>{c.geometry&&c.geometry.dispose();c.material&&c.material.dispose&&c.material.dispose()})}
function buildShip(){
 const g=new THREE.Group(),M=(c,e=0)=>new THREE.MeshStandardMaterial({color:c,roughness:.35,metalness:.6,emissive:c,emissiveIntensity:e}),
 add=(geo,c,x,y,z,e)=>{const m=new THREE.Mesh(geo,M(c,e));m.position.set(x,y,z);g.add(m);return m},C=(a,b,h,s=28)=>new THREE.CylinderGeometry(a,b,h,s),
 en=pt('engine'),tk=pt('tank'),ck=pt('cockpit'),lf=pt('life'),pw=pt('power'),gr=pt('gear'),sh=pt('shield'),cg=pt('cargo'),
 th=tk?(.8+tk.fuel/450):.5;let top=th/2,bot=-th/2,low=bot;
 if(tk)add(C(.8,.8,th),tk.col,0,0,0);else add(C(.15,.15,th,8),0x555566,0,0,0);
 if(cg)add(C(.9,.9,.5),cg.col,0,0,0,.05);
 if(sh)add(C(.95,.8,.22),sh.col,0,bot-.08,0);
 if(en){add(C(.38,.72,1.1),en.col,0,bot-.65,0,.12);low=bot-1.2}
 if(gr){for(let i=0;i<4;i++){const a=i*1.5708+.78,l=add(C(.04,.07,2,6),gr.col,Math.cos(a)*1.1,bot-.2,Math.sin(a)*1.1);l.rotation.z=Math.cos(a)*.45;l.rotation.x=-Math.sin(a)*.45}low=Math.min(low,bot-1.2)}
 if(lf){add(C(.7,.7,.55),lf.col,0,top+.27,0,.18);top+=.55}
 if(ck){add(new THREE.ConeGeometry(.7,1.3,28),ck.col,0,top+.65,0,.1);add(new THREE.SphereGeometry(.2,16,12),0x7fe7ff,0,top+.45,.42,.9);top+=1.3}
 if(pw){if(pw.wing)[-1,1].forEach(s=>add(new THREE.BoxGeometry(2.4,.06,.9),pw.col,s*1.9,0,0,.3));else add(new THREE.BoxGeometry(.35,.8,.35),pw.col,.95,0,0,.3)}
 const fg=new THREE.ConeGeometry(.42,2.4,16);fg.rotateX(Math.PI);fg.translate(0,-1.2,0);
 const fl=new THREE.Mesh(fg,new THREE.MeshBasicMaterial({color:en?en.col:0xffaa66,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));fl.position.y=low;fl.visible=false;g.add(fl);
 const lt=new THREE.PointLight(en?en.col:0xffaa66,0,14);lt.position.y=low-1;g.add(lt);
 const mid=(top+low)/2;g.children.forEach(c=>c.position.y-=mid);g.userData={fl,lt,bottom:low-mid,top:top-mid};return g}
const orient=()=>{if(mdl)mdl.rotation.x=(mode=='builder'||mode=='menu')?0:-Math.PI/2};
function rebuildShip(){if(!pv)return;if(mdl){pv.remove(mdl);dispose(mdl)}mdl=buildShip();pv.add(mdl);orient()}

/* ---------- SCENE 3D ---------- */
function rs(){if(!ren)return;ren.setPixelRatio(Math.min(devicePixelRatio||1,[1,1.5,2][S.q]));ren.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
function mkStars(){if(star){F.remove(star);star.geometry.dispose()}const n=[900,2000,4000][S.q],g=new THREE.BufferGeometry(),a=new Float32Array(n*3);for(let i=0;i<n;i++){const u=rnd(0,6.283),v=rnd(-1,1),r=Math.sqrt(1-v*v);a.set([Math.cos(u)*r*5000,v*5000,Math.sin(u)*r*5000],i*3)}g.setAttribute('position',new THREE.BufferAttribute(a,3));star=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:2.2,sizeAttenuation:false}));F.add(star)}
function initGL(){
 try{ren=new THREE.WebGLRenderer({canvas:$('#gl'),antialias:S.q>0,powerPreference:'high-performance'})}catch(e){throw Error('WebGL tidak tersedia di perangkat/browser ini.')}
 cam=new THREE.PerspectiveCamera(58,1,.1,12000);
 /* Hangar */
 H=new THREE.Scene();H.background=new THREE.Color(0x070b1c);H.fog=new THREE.FogExp2(0x070b1c,.02);H.add(new THREE.HemisphereLight(0x9fc4ff,0x241040,.9));
 [[0x7fe7ff,-7,6,6],[0xb5a4ff,7,3,-7]].forEach(([c,x,y,z])=>{const l=new THREE.PointLight(c,2.4,45);l.position.set(x,y,z);H.add(l)});
 const fl=new THREE.Mesh(new THREE.CylinderGeometry(8,8.4,.4,64),new THREE.MeshStandardMaterial({color:0x151c34,metalness:.8,roughness:.35}));fl.position.y=-4;H.add(fl);
 const rg=new THREE.Mesh(new THREE.TorusGeometry(7.4,.07,8,96),new THREE.MeshBasicMaterial({color:0x7fe7ff}));rg.rotation.x=Math.PI/2;rg.position.y=-3.78;H.add(rg);
 for(let i=0;i<10;i++){const a=i/10*6.283,p=new THREE.Mesh(new THREE.BoxGeometry(.8,16,.8),new THREE.MeshStandardMaterial({color:0x1a2240,metalness:.7,roughness:.4,emissive:0x2a4a88,emissiveIntensity:.7}));p.position.set(Math.cos(a)*15,3,Math.sin(a)*15);H.add(p)}
 /* Ruang angkasa */
 F=new THREE.Scene();F.background=new THREE.Color(0x01020a);F.add(new THREE.AmbientLight(0x7080b0,.55));const sun=new THREE.DirectionalLight(0xfff0dc,2.2);sun.position.set(1,.6,.5);F.add(sun);
 B.forEach((b,i)=>{b.p=new THREE.Vector3(...b.pos);b.m=new THREE.Mesh(new THREE.SphereGeometry(b.r,48,32),new THREE.MeshStandardMaterial({color:b.col,roughness:.9}));b.m.position.copy(b.p);F.add(b.m);
  if(b.atm){const a=new THREE.Mesh(new THREE.SphereGeometry(b.r*1.09,32,24),new THREE.MeshBasicMaterial({color:i==0?0x6db7ff:i==2?0xffb98a:0xffd9a8,transparent:true,opacity:.25,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));a.position.copy(b.p);F.add(a)}});
 const sm_=new THREE.Mesh(new THREE.SphereGeometry(180,24,16),new THREE.MeshBasicMaterial({color:0xfff2c0}));sm_.position.set(4200,2500,2100);F.add(sm_);
 const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.strokeStyle=x.fillStyle='#7fe7ff';x.lineWidth=5;x.beginPath();x.arc(32,32,24,0,6.283);x.stroke();x.beginPath();x.arc(32,32,3,0,6.283);x.fill();
 mk=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));F.add(mk);mkStars();
 /* Permukaan */
 Z=new THREE.Scene();Z.add(new THREE.HemisphereLight(0xffffff,0x555555,.85));const zs=new THREE.DirectionalLight(0xffffff,1.9);zs.position.set(8,12,5);Z.add(zs);
 gnd=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({roughness:1}));gnd.rotation.x=-Math.PI/2;Z.add(gnd);rocks=new THREE.Group();Z.add(rocks);
 pv=new THREE.Group();rebuildShip();scene=H;H.add(pv);rs()}
function surf(i){const b=B[i];gnd.material.color.setHex(b.gr);Z.background=new THREE.Color(b.sky);Z.fog=new THREE.Fog(b.sky,40,260);
 while(rocks.children.length){const c=rocks.children[0];rocks.remove(c);c.geometry.dispose();c.material.dispose()}
 for(let k=0;k<[30,60,90][S.q];k++){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(.4,2.2)),new THREE.MeshStandardMaterial({color:b.gr,roughness:1,flatShading:true})),a=rnd(0,6.283),d=rnd(10,140);m.position.set(Math.cos(a)*d,.3,Math.sin(a)*d);m.scale.y=rnd(.5,1);m.rotation.set(rnd(0,3),rnd(0,3),0);rocks.add(m)}
 R.cry=[];if(i&&b.land)for(let k=0;k<3;k++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.7),new THREE.MeshStandardMaterial({color:0x7fe7ff,emissive:0x7fe7ff,emissiveIntensity:.9})),a=rnd(0,6.283),d=rnd(14,44);m.position.set(Math.cos(a)*d,.8,Math.sin(a)*d);rocks.add(m);R.cry.push(m)}}

/* ---------- RUN: kerusakan, item, interaksi ---------- */
const ovr=()=>{const d=R.d;return Math.round(Math.max(d.hull,(d.hull*2+d.engine+d.tank+d.gear+d.power+d.life)/7))};
function tier(){const r=R,o=ovr(),t=o<1?0:o<20?1:o<40?2:o<=60?3:o<100?4:5,w=Object.entries(r.d).sort((a,b)=>b[1]-a[1])[0][0];
 if(t>r.tier){const m=['','Kerusakan ringan: '+PN[w],'Kerusakan sedang — performa menurun','BAHAYA! Perbaiki '+PN[w]+' (R)','KRITIS! Mendaratlah atau perbaiki segera'];toast(m[t]||'',t>2?'bad':t>1?'warn':'');if(t>2)snd('alarm')}r.tier=t}
function dmg(p,a,cause){const r=R;if(!r||a<=0||mode!='play')return;r.d[p]=cl(r.d[p]+a,0,100);if(p!='hull')r.d.hull=cl(r.d.hull+a*.25,0,100);tier();if(r.d.hull>=100)endGame(cause+' — kapal hancur total')}
function endGame(c,win){if(mode=='over')return;mode='over';winMode=!!win;show('#hud',false);show('#over');$('#oT').textContent=win?'MISI SELESAI':'GAME OVER';$('#oT').className=win?'ok':'bad';$('#oC').textContent=c;$('#bRetry').textContent=win?'HANGAR':'RETRY';
 if(!win){snd('hit');show('#flash');setTimeout(()=>show('#flash',false),900)}else snd('ok')}
function finish(){const r=R,rw=Math.round(B[dest].rew*(.4+.6*r.samples/3)*(1-ovr()/200));G.credits+=rw;G.done++;save();endGame(`Hadiah +${rw} cr · Sampel ${r.samples}/3 · Kerusakan ${ovr()}%`,1)}
const use=(it,q,amt,l)=>{const r=R;if(!r.inv[it]){toast(l+' habis','warn');snd('bad');return}r.inv[it]--;r.v[q]=Math.min(100,r.v[q]+amt);toast(l+' +'+amt,'ok');snd('ok')};
function repair(){const r=R;if(r.rep>0)return;if(!r.inv.kit){toast('Kit perbaikan habis','warn');snd('bad');return}const w=Object.entries(r.d).sort((a,b)=>b[1]-a[1])[0];if(w[1]<=0){toast('Tidak ada kerusakan');return}r.rep=1.5;r.rp=w[0];toast('Memperbaiki '+PN[w[0]]+'…')}
function aim(){const d=B[R.to].p.clone().sub(R.pos).normalize();R.yaw=Math.atan2(-d.x,-d.z);R.pitch=Math.asin(cl(d.y,-1,1))}
function leg(from,to,launch){const r=R;r.from=from;r.to=to;r.thr=0;r.spd=0;r.warp=1;if(launch){r.ph='LAUNCH';r.alt=0;r.pitch=1.5;r.yaw=0;scene=F;F.add(pv);orient();r.pos.copy(B[from].p).y+=B[from].r}else{r.ph='CRUISE';aim()}}
function land(){const r=R,b=B[r.to];r.ph='LANDING';r.alt=60;r.vy=-3;r.thr=0;r.warp=1;surf(r.to);scene=Z;Z.add(pv);orient();if(b.atm)dmg('hull',22*b.atm*(1-r.st.heat),'Panas masuk atmosfer')}
function interact(){const r=R;
 if(r.ph=='ORBIT'){if(B[r.to].land)land();else{toast('Flyby selesai — pulang ke Bumi','ok');leg(r.to,0,false)}}
 else if(r.ph=='SURFACE'){const P=r.P,n=r.cry.find(c=>c.visible&&Math.hypot(c.position.x-P.x,c.position.z-P.z)<4);
  if(n){n.visible=false;r.samples++;toast(`Sampel ${r.samples}/3 terkumpul`,'ok');snd('ok')}
  else if(Math.hypot(P.x,P.z)<7){if(r.fuel<8){toast('BBM tidak cukup untuk lepas landas','bad');snd('bad')}else leg(r.to,0,true)}
  else toast('Tidak ada yang bisa diinteraksi di sini')}}
function newRun(){const st=stats(),cg=st.cargo;
 R={st,from:0,to:dest,ph:'PRE',cd:3,fuel:st.fuel,thr:0,spd:0,yaw:0,pitch:1.5,alt:0,vy:0,warp:1,t:0,samples:0,cut:0,rep:0,tier:0,align:false,err:0,dist:0,pos:new THREE.Vector3(),
 d:{engine:0,hull:0,tank:0,gear:0,power:0,life:0},v:{hp:100,f:100,w:100,o:100},inv:{food:2+cg,water:2+cg,o2:1+(cg>>1),kit:1+(cg>>1)},P:{x:0,z:8,yaw:0,pitch:0,s:0},cry:[]};
 R.pos.copy(B[0].p).y+=B[0].r;mode='play';mapOn=0;scene=F;F.add(pv);orient();pv.position.copy(R.pos);
 ['#builder','#menu','#over','#pause','#map'].forEach(i=>show(i,false));show('#hud');toast('Pra-penerbangan: sistem diperiksa…');snd('ok')}

/* ---------- UPDATE ---------- */
function update(dt){
 if(mode=='menu'||mode=='builder'){if(!drag)ang.a+=dt*(mode=='menu'?.2:.08);return}
 const r=R;if(mode!='play'||!r)return;
 const ph=r.ph,e=ENG(),k=a=>K[a]?1:0;
 if(ph=='PRE'){r.cd-=dt;if(r.cd<=0){r.ph='LAUNCH';toast('Lepas landas! Tahan W untuk throttle','ok')}return}
 r.t+=dt;
 if(ph!='SURFACE'){r.thr=cl(r.thr+(k('KeyW')-k('KeyS'))*dt*.6,0,1);if(K.Space)r.thr=0}
 r.cut=Math.max(0,r.cut-dt);
 const fly=ph=='CRUISE'||ph=='APPROACH',eff=(1-r.d.engine/120)*(r.fuel>0&&!r.cut?1:0),mass=r.st.dry+r.fuel,vm=eff>0?vmx(mass,r.st.thr*eff):0;
 let f=null;r.err=0;r.dist=0;
 if(fly){const sp=1.1*S.sens*dt,iy=S.inv?-1:1;r.yaw+=(k('KeyA')+k('ArrowLeft')-k('KeyD')-k('ArrowRight'))*sp;r.pitch=cl(r.pitch+(k('ArrowUp')-k('ArrowDown'))*sp*iy,-1.2,1.2);
  if(ph=='CRUISE'){r.yaw+=(Math.sin(r.t*.37)+Math.sin(r.t*.91))*.03*dt;r.pitch=cl(r.pitch+Math.cos(r.t*.53)*.03*dt,-1.2,1.2)}
  f=fwd(r.yaw,r.pitch);const td=B[r.to].p.clone().sub(r.pos);r.dist=td.length()-B[r.to].r;r.err=Math.acos(cl(f.dot(td.normalize()),-1,1));r.align=r.err<.15;
  if(!r.align||r.tier>=3||ph!='CRUISE')r.warp=1}
 else r.warp=1;
 const wdt=dt*r.warp;
 if(ph=='LAUNCH'||fly||ph=='ORBIT'){r.spd+=((ph=='ORBIT'?0:vm*r.thr)-r.spd)*Math.min(1,dt*.9);if(ph!='ORBIT')r.fuel=Math.max(0,r.fuel-r.st.thr*Math.pow(r.thr,1.6)/(e.eff*30)*wdt)}
 if(ph=='LAUNCH'){const b=B[r.from];r.alt=Math.max(0,r.alt+(r.spd-b.g*.35)*dt);r.pos.copy(b.p).y+=b.r+r.alt;
  if(b.atm&&r.alt<25)dmg('hull',Math.max(0,r.spd-9)*(1-r.st.heat)*b.atm*.3*dt,'Panas peluncuran');
  if(r.alt>=40){r.ph='CRUISE';aim();toast('Orbit tercapai — arahkan kapal ke cincin ◎','ok')}}
 if(fly){r.pos.addScaledVector(f,r.spd*wdt);const b=B[r.to],cap=b.land?16:60;
  if(ph=='CRUISE'&&r.dist<90){r.ph='APPROACH';toast('Mendekati '+b.n+': kurangi kecepatan ≤ 5.5 u/s','warn')}
  if(ph=='APPROACH'&&r.dist>150)r.ph='CRUISE';
  if(r.dist<cap){if(r.spd<=5.5){r.ph='ORBIT';r.thr=0;if(!b.land)r.samples=3;toast(b.land?'Orbit tercapai — tekan E untuk mendarat':'Flyby selesai! Tekan E untuk pulang','ok');snd('ok')}else dmg('hull',(r.spd-5.5)*.8*dt,'Kecepatan terlalu tinggi saat pendekatan')}
  if(b.land&&r.dist<1.5){dmg('hull',r.spd*6,'Tabrakan dengan '+b.n);r.spd=0;r.thr=0;r.pos.copy(b.p).add(r.pos.clone().sub(b.p).setLength(b.r+4));snd('hit');shake=1}
  if(!b.land&&r.dist<22){dmg('hull',10*dt,'Tekanan atmosfer '+b.n);dmg('engine',3*dt,'Tekanan atmosfer '+b.n);shake=.6}
  if(r.fuel<=0&&r.spd<.4)endGame('Kehabisan bahan bakar — kapal hanyut di ruang angkasa')}
 if(ph=='LANDING'){const g=B[r.to].g*.3,a=Math.max(3.5,r.st.thr*1000/mass*.35)*eff;r.fuel=Math.max(0,r.fuel-r.thr*r.st.thr/(e.eff*30)*.6*dt);r.vy+=(-g+r.thr*a)*dt;r.alt+=r.vy*dt;
  if(r.alt<=0){r.alt=0;const ev=-r.vy*(1-r.st.gear*(1-r.d.gear/100)*.6);if(ev>6){dmg('gear',ev*4,'Pendaratan keras');dmg('hull',(ev-6)*5,'Pendaratan keras');snd('hit');shake=1}
   if(mode=='play'){r.vy=0;r.thr=0;if(r.to==0)finish();else{r.ph='SURFACE';r.P={x:0,z:8,yaw:0,pitch:0,s:0};toast('Mendarat! Kumpulkan 3 sampel (E). Oksigen terkuras cepat di luar kapal.','ok');snd('ok')}}}}
 if(ph=='SURFACE'){const P=r.P,mv=k('KeyW')-k('KeyS'),st=k('KeyD')-k('KeyA'),sp=(K.ShiftLeft||K.ShiftRight)?8:4.5,ls=1.4*S.sens*dt,sx=Math.sin(P.yaw),cz=Math.cos(P.yaw);
  P.yaw+=(k('ArrowLeft')-k('ArrowRight'))*ls;P.pitch=cl(P.pitch+(k('ArrowUp')-k('ArrowDown'))*ls*(S.inv?-1:1),-1.2,1.2);
  if(mv||st){const n=Math.hypot(mv,st);P.x+=(-sx*mv+cz*st)/n*sp*dt;P.z+=(-cz*mv-sx*st)/n*sp*dt;const rr=Math.hypot(P.x,P.z);if(rr>60){P.x*=60/rr;P.z*=60/rr}P.s+=sp*dt;if(P.s>2.4){P.s=0;snd('step')}}}
 /* survival */
 const o2m=(1/cl(r.st.pw*(1-r.d.power/100)/8,.4,1))*(1+r.d.life/50)*(ph=='SURFACE'?3:1),V=r.v;
 V.o-=wdt*100/r.st.o2*o2m;V.f-=wdt*.3;V.w-=wdt*.4;
 ['o','f','w'].forEach(q=>{V[q]=Math.max(0,V[q]);if(V[q]<25&&!r['w'+q]){r['w'+q]=1;toast({o:'Oksigen menipis! (3)',w:'Haus! Minum (2)',f:'Lapar! Makan (1)'}[q],'bad');snd('alarm')}else if(V[q]>=25)r['w'+q]=0});
 const mn=Math.min(V.o,V.f,V.w);if(mn<=0)V.hp-=wdt*4;else if(mn>40)V.hp=Math.min(100,V.hp+dt*.5);
 if(V.hp<=0)endGame(V.o<=0?'Kehabisan oksigen':V.w<=0?'Dehidrasi':'Kelaparan');
 /* bahaya */
 if(ph=='CRUISE'&&Math.random()<dt*r.warp*.03){dmg(['hull','engine','tank','power','life'][Math.random()*5|0],(6+Math.random()*8)*120/(60+r.st.hull),'Hantaman mikrometeoroid');snd('hit');shake=.6}
 if(r.d.tank>40)r.fuel=Math.max(0,r.fuel-r.d.tank*.002*wdt);
 if(r.tier>=4&&Math.random()<dt*.12){r.cut=2;toast('Mesin mati sesaat!','bad')}
 if(!r.fw&&r.fuel<r.st.fuel*.15){r.fw=1;toast('BBM menipis!','bad');snd('alarm')}
 if(r.rep>0){r.rep-=dt;if(r.rep<=0){r.inv.kit--;r.d[r.rp]=Math.max(0,r.d[r.rp]-35);toast('Diperbaiki: '+PN[r.rp],'ok');snd('ok');tier()}}
 r.al=(r.al||0)-dt;if((r.tier>=3||r.fuel<r.st.fuel*.1)&&r.al<=0){snd('alarm');r.al=.9}}

/* ---------- KAMERA & RENDER ---------- */
function pose(dt){const r=R,u=mdl.userData,th=['LAUNCH','CRUISE','APPROACH','LANDING'].includes(r.ph)&&r.fuel>0?r.thr:0;
 u.fl.visible=th>.03;u.fl.scale.set(1,.3+th*1.2+rnd(0,.1),1);u.lt.intensity=th*3;cam.up.set(0,1,0);
 if(r.ph=='SURFACE'||r.ph=='LANDING'){pv.rotation.set(1.5708,0,0);
  if(r.ph=='LANDING'){pv.position.set(0,r.alt-u.bottom,0);cam.position.set(15,Math.max(3,r.alt*.5+3),15);cam.lookAt(0,r.alt*.8+1,0)}
  else{pv.position.set(0,-u.bottom,0);cam.position.set(r.P.x,1.8,r.P.z);cam.rotation.set(r.P.pitch,r.P.yaw,0,'YXZ')}}
 else{pv.position.copy(r.pos);pv.rotation.set(r.pitch,r.yaw,0,'YXZ');
  const f=fwd(r.yaw,r.pitch),v=Math.abs(f.y)>.95,sd=f.clone().cross(v?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0)).normalize(),up=sd.clone().cross(f),cp=r.pos.clone().addScaledVector(f,-13).addScaledVector(up,3.5);
  cam.position.lerp(cp,1-Math.pow(.002,dt));cam.up.set(0,v?0:1,v?-1:0);cam.lookAt(r.pos.clone().addScaledVector(f,8));
  star.position.copy(cam.position);const b=B[r.to];mk.position.copy(b.p);mk.scale.setScalar(Math.max(cam.position.distanceTo(b.p)*.05,b.r*2.4))}
 if(S.shake&&shake>0){cam.position.x+=rnd(-.3,.3)*shake;cam.position.y+=rnd(-.3,.3)*shake}shake=Math.max(0,shake-dt*2)}
function render(){if(mode=='menu'||mode=='builder'){const a=ang;cam.up.set(0,1,0);cam.position.set(Math.sin(a.a)*Math.cos(a.e)*a.r,Math.sin(a.e)*a.r,Math.cos(a.a)*Math.cos(a.e)*a.r);cam.lookAt(0,0,0)}ren.render(scene,cam)}
function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||0);last=t;if(document.hidden)return;update(dt);if(mode=='play'&&R)pose(dt);
 if(eng){const q=mode=='play'&&R&&['LAUNCH','CRUISE','APPROACH','LANDING'].includes(R.ph)&&R.fuel>0?R.thr:0;eng.g.gain.value=q*.2*S.sfx;eng.o.frequency.value=45+q*55;eng.f.frequency.value=140+q*500}
 if(mode=='play'&&R&&(hudT-=dt)<=0){hudT=.12;hud()}render()}

/* ---------- HUD & PETA ---------- */
const bar=(l,v,c)=>`<div class="b"><span>${l}</span><i style="--p:${cl(v,0,100)/100};--c:${v<25?'var(--rd)':v<50?'var(--am)':c||'var(--cy)'}"></i><em>${Math.round(v)}</em></div>`;
function hud(){const r=R,o=ovr(),b=B[r.to],P=r.P;
 $('#vit').innerHTML=bar('HEALTH',r.v.hp,'var(--gn)')+bar('HUNGER',r.v.f)+bar('THIRST',r.v.w)+bar('OXYGEN',r.v.o)+`<p class="sm">[1] Makan ${r.inv.food} · [2] Minum ${r.inv.water} · [3] O₂ ${r.inv.o2} · [R] Kit ${r.inv.kit}</p>`;
 $('#shp').innerHTML=bar('FUEL',r.fuel/r.st.fuel*100)+bar('THROTTLE',r.thr*100,'var(--vi)')+`<p>Kecepatan <b>${r.spd.toFixed(1)}</b> u/s · Warp ×${r.warp}</p><p class="${r.tier>2?'bad':r.tier>1?'warn':''}">Kerusakan <b>${o}%</b></p><p class="chips">${Object.entries(r.d).map(([k,v])=>`<span class="${v>=40?'bad':v>=20?'warn':''}">${k.slice(0,3)} ${v|0}%</span>`).join('')}</p>`;
 $('#obj').textContent={PRE:`Pra-penerbangan… T-${Math.ceil(r.cd)}`,LAUNCH:`Tahan W untuk throttle — altitude ${r.alt|0}/40`,CRUISE:`Menuju ${b.n} · ${r.dist|0} u · deviasi ${(r.err*57.3)|0}°${r.align?'':' — luruskan ke ◎'}`,APPROACH:`Mendekati ${b.n} · ${r.dist|0} u · kecepatan ${r.spd.toFixed(1)} (aman ≤ 5.5)`,ORBIT:`Orbit ${b.n}`,LANDING:`Mendarat · alt ${r.alt|0} · v ${(-r.vy).toFixed(1)} (aman ≤ 6) — W = dorong`,SURFACE:`Sampel ${r.samples}/3 · jarak ke kapal ${Math.hypot(P.x,P.z)|0}`}[r.ph];
 let pm='';if(r.ph=='ORBIT')pm='E — '+(b.land?'Mendarat':'Pulang ke Bumi');else if(r.ph=='SURFACE'){if(r.cry.some(c=>c.visible&&Math.hypot(c.position.x-P.x,c.position.z-P.z)<4))pm='E — Ambil sampel';else if(Math.hypot(P.x,P.z)<7)pm='E — Masuk kapal & lepas landas'}
 const pe=$('#prompt');pe.textContent=pm;pe.classList.toggle('hide',!pm)}
function mapBuild(){const r=R,xs=B.map(b=>4+b.p.length()/1800*90),f=r.from,t=r.to,done=['ORBIT','LANDING','SURFACE'].includes(r.ph),rem=r.pos.distanceTo(B[t].p),
 pr=r.ph=='PRE'||r.ph=='LAUNCH'?0:done?1:cl(1-rem/B[f].p.distanceTo(B[t].p),0,1),rg=r.fuel/fpu({thr:r.st.thr,vmax:vmx(r.st.dry+r.fuel,r.st.thr)});
 $('#mapT').innerHTML=B.map((b,i)=>`<em class="${i==t?'on':''}" style="left:${xs[i]}%">${b.n}</em>`).join('')+`<u style="left:${xs[f]+(xs[t]-xs[f])*pr}%"></u>`;
 $('#mapI').innerHTML=`<p>Tujuan: <b>${B[t].n}</b> · jarak ${done?0:rem|0} u</p><p>BBM ${r.fuel|0} · jangkauan ≈ ${rg|0} u</p><p>Fase: ${r.ph} · Sampel ${r.samples}/3</p><p class="dim">Skala jarak & waktu disederhanakan untuk gameplay.</p>`}
function toggleMap(){if(mapOn){mapOn=0;show('#map',false);mode='play';return}if(mode!='play'||!R)return;mapOn=1;mapBuild();show('#map');mode='pause'}
const pause=()=>{mode='pause';show('#pause')},resume=()=>{mode='play';show('#pause',false)};

/* ---------- INPUT ---------- */
function act(c){audio();
 if(c=='Escape'){const m=$$('.modal:not(.hide)').filter(x=>!['pause','over','map'].includes(x.id)).pop();if(m){m.classList.add('hide');return}if(mapOn){toggleMap();return}if(mode=='play')pause();else if(mode=='pause')resume();return}
 if(c=='KeyM'||c=='Tab'){if(mode=='play'||mapOn)toggleMap();return}
 const r=R;if(mode!='play'||!r)return;
 if(c=='KeyE')interact();else if(c=='KeyR')repair();
 else if(c=='KeyX'){if(r.ph=='CRUISE'&&r.align&&r.tier<3)r.warp=r.warp==1?3:r.warp==3?8:1;else{r.warp=1;toast('Warp hanya saat CRUISE, arah lurus & kerusakan < 40%','warn')}}
 else if(c=='Digit1')use('food','f',45,'Makan');else if(c=='Digit2')use('water','w',45,'Minum');else if(c=='Digit3')use('o2','o',40,'Tabung O₂')}
const toMenu=()=>{mode='menu';R=null;mapOn=0;scene=H;H.add(pv);pv.position.set(0,0,0);pv.rotation.set(0,0,0);orient();ang.r=13;['#builder','#hud','#over','#pause','#map','#flash'].forEach(i=>show(i,false));show('#menu');show('#bCont',hasSave());$('#bPlay').textContent=hasSave()?'New Game':'Play'},
toBuilder=()=>{mode='builder';R=null;scene=H;H.add(pv);pv.position.set(0,0,0);pv.rotation.set(0,0,0);orient();ang.r=12;['#menu','#hud','#over','#pause','#map'].forEach(i=>show(i,false));show('#builder');ui()};
function wire(){
 $('#preset').innerHTML='<option value="">Kustom</option>'+Object.keys(PRE).map(n=>`<option>${n}</option>`).join('');
 $('#dest').innerHTML=B.slice(1).map((b,i)=>`<option value="${i+1}">${b.n}</option>`).join('');$('#dest').value=dest;
 const cv=$('#gl');let lx=0,ly=0,ptr=null;
 cv.addEventListener('pointerdown',e=>{audio();drag=1;ptr=e.pointerId;lx=e.clientX;ly=e.clientY;try{cv.setPointerCapture(ptr)}catch(_){}});
 const end=e=>{if(e.pointerId===ptr){drag=0;ptr=null}};['pointerup','pointercancel','lostpointercapture'].forEach(t=>cv.addEventListener(t,end));
 cv.addEventListener('pointermove',e=>{if(e.pointerId!==ptr)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;
  if(mode=='builder'||mode=='menu'){ang.a-=dx*.01;ang.e=cl(ang.e+dy*.01,-.3,1.2)}
  else if(mode=='play'&&R){const s=.004*S.sens,iy=S.inv?-1:1;if(R.ph=='SURFACE'){R.P.yaw-=dx*s;R.P.pitch=cl(R.P.pitch-dy*s*iy,-1.2,1.2)}else if(R.ph=='CRUISE'||R.ph=='APPROACH'){R.yaw-=dx*s;R.pitch=cl(R.pitch-dy*s*iy,-1.2,1.2)}}});
 cv.addEventListener('wheel',e=>{ang.r=cl(ang.r+e.deltaY*.01,6,22)},{passive:true});
 addEventListener('keydown',e=>{audio();if(e.repeat)return;const c=e.code;if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(c))e.preventDefault();K[c]=1;act(c)});
 addEventListener('keyup',e=>{K[e.code]=0});
 const rel=()=>{for(const c in K)K[c]=0;if(mode=='play')pause()};addEventListener('blur',rel);document.addEventListener('visibilitychange',()=>{if(document.hidden)rel()});
 $$('[data-k]').forEach(b=>{const c=b.dataset.k,off=()=>{K[c]=0};b.addEventListener('pointerdown',e=>{e.preventDefault();audio();K[c]=1;try{b.setPointerCapture(e.pointerId)}catch(_){}});['pointerup','pointercancel','lostpointercapture','pointerleave'].forEach(t=>b.addEventListener(t,off))});
 $$('[data-a]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();act(b.dataset.a)}));
 $$('[data-open]').forEach(b=>b.onclick=()=>{audio();snd('ui');show('#'+b.dataset.open)});
 $$('[data-close]').forEach(b=>b.onclick=()=>{snd('ui');b.closest('.modal').classList.add('hide')});
 $('#bPlay').onclick=()=>{audio();snd('ok');Object.assign(G,{credits:1500,design:null,done:0});setD(PRE.Starter);save();toBuilder()};
 $('#bCont').onclick=()=>{audio();snd('ok');setD(G.design||PRE.Starter);toBuilder()};
 $('#bMenu').onclick=()=>{snd('ui');toMenu()};$('#bView').onclick=()=>{Object.assign(ang,{a:.7,e:.25,r:12});snd('ui')};$('#bLaunch').onclick=()=>{audio();newRun()};
 $('#tabs').onclick=e=>{const b=e.target.closest('[data-t]');if(b){tab=b.dataset.t;snd('ui');ui()}};
 $('#parts').onclick=e=>{const b=e.target.closest('[data-i]');if(b){design[tab]=+b.dataset.i;snd('ok');ui()}};
 $('#preset').onchange=e=>{if(PRE[e.target.value]){setD(PRE[e.target.value]);snd('ok');ui()}};
 $('#dest').onchange=e=>{dest=+e.target.value;snd('ui');ui()};
 $('#bMap').onclick=()=>act('KeyM');$('#bPause').onclick=()=>act('Escape');$('#bMapX').onclick=()=>act('KeyM');
 $('#bRes').onclick=resume;$('#bPSet').onclick=()=>show('#settings');$('#bPMenu').onclick=()=>{show('#pause',false);toMenu()};
 $('#bRetry').onclick=()=>{snd('ui');winMode?toBuilder():newRun()};$('#bOMenu').onclick=()=>toMenu();
 const bind=(id,k,fn)=>{const el=$(id),ck=el.type=='checkbox';el[ck?'checked':'value']=S[k];el.oninput=()=>{S[k]=ck?+el.checked:+el.value;fn&&fn();vol();save()}},
 bindAll=()=>{bind('#sVol','vol');bind('#sSfx','sfx');bind('#sSens','sens');bind('#sMute','mute');bind('#sInv','inv');bind('#sShake','shake');bind('#sQ','q',()=>{rs();mkStars()})};
 bindAll();$('#bReset').onclick=()=>{Object.assign(S,DS);bindAll();rs();mkStars();vol();save();snd('ok')};
 addEventListener('resize',rs);addEventListener('orientationchange',rs)}

/* ---------- BOOT ---------- */
async function boot(){const set=p=>$('#prog').style.width=p+'%',tk=()=>new Promise(r=>requestAnimationFrame(r));
 $('#tip').textContent=['Tip: tangki besar menambah massa — dorong harus seimbang.','Tip: throttle rendah hemat BBM, tapi makan & oksigen terus berkurang.','Tip: Jupiter tidak punya permukaan padat — hanya flyby.','Tip: heat shield melindungi saat meluncur dan masuk atmosfer.'][Math.random()*4|0];
 try{set(10);await tk();if(!window.THREE)throw Error('Three.js gagal dimuat dari CDN — periksa koneksi internet.');set(35);await tk();initGL();set(70);await tk();wire();set(100);await tk();show('#loading',false);toMenu();requestAnimationFrame(loop)}
 catch(e){$('#err').textContent=e.message;show('#bReload')}}
$('#bReload').onclick=()=>location.reload();boot();
