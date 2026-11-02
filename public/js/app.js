/* Sikertervező — a tervező maga (nézetek, események). A prototípusból készült; arculat: theme.js,
 * tárolás: store.js, PolyOS-híd: polyos.js, indítás: boot.js. */
(function(){
"use strict";
const ST=(window.ST=window.ST||{});
ST.start=function(ctx){
const BR=ctx.brand, TH=ST.theme, PX=ST.polyos, DEMO=ctx.mode!=="cloud";
/* ---------- utils ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse=s=>{const[a,b,c]=s.split("-").map(Number);return new Date(a,b-1,c)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const T=iso(TODAY);
const ym=d=>d.getFullYear()+"-"+pad(d.getMonth()+1);
const MONTHS=["január","február","március","április","május","június","július","augusztus","szeptember","október","november","december"];
const DAYS=["vasárnap","hétfő","kedd","szerda","csütörtök","péntek","szombat"];
const WD=["H","K","Sze","Cs","P","Szo","V"];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmtDate=s=>{if(!s)return"";const d=parse(s);return MONTHS[d.getMonth()].slice(0,3)+". "+d.getDate()+"."};
const longDate=s=>{const d=parse(s);return cap(MONTHS[d.getMonth()])+" "+d.getDate()+"., "+DAYS[d.getDay()]};
const money=n=>(Math.round(n||0)).toLocaleString("hu-HU")+" "+S.settings.cur;
const diff=s=>Math.round((parse(s)-TODAY)/864e5);
const PILLARS=["Énmárka","Motiváció","Edukáció","Inspiráció","Értékesítés","Online munka"];
const STAGES=["Kapcsolatfelvétel","Beszélgetés","Bemutató","Döntés"];
const FORMATS=["Poszt","Sztori","Reel","Live"];
const CSTATUS=["Ötlet","Kész","Megjelent"];

/* ---------- sample data ---------- */
function sample(){
  const d=n=>iso(addDays(TODAY,n));
  const days={};
  for(let i=-12;i<0;i++){days[d(i)]={tasks:[],note:"",steps:[0,1,2,3,4].map(k=>Math.random()<.7)}}
  days[T]={tasks:[{id:uid(),t:"Hívni Ritát a bemutató időpontja miatt",done:false},{id:uid(),t:"Katalógus-sztori felvétele",done:true},{id:uid(),t:"Csapathívás 19:00",done:false}],note:"",steps:[true,true,false,false,false]};
  days[d(1)]={tasks:[{id:uid(),t:"Csomagok átadása",done:false}],note:"",steps:[false,false,false,false,false]};
  const orders=[];
  const names=["Szabó Edit","Kiss Noémi","Varga Zsófi","Tóth Anikó","Balogh Réka","Fehér Kata"];
  for(let m=5;m>=0;m--){
    const cnt=4+Math.floor(Math.random()*5);
    for(let i=0;i<cnt;i++){const dt=new Date(TODAY.getFullYear(),TODAY.getMonth()-m,1+Math.floor(Math.random()*(m?27:Math.max(1,TODAY.getDate()-1))));
      orders.push({id:uid(),date:iso(dt),client:names[i%names.length],items:["Arcápoló szett","Parfüm","Smink csomag","Vitamin","Testápoló"][i%5],amount:6000+Math.round(Math.random()*24)*1000,paid:m>0||Math.random()<.6});}
  }
  return {
    v:1,
    settings:{name:"Anna",cur:"Ft",steps:["Poszt","Sztori","Új kapcsolat","Utánkövetés","Csapat"]},
    days,
    contacts:[
      {id:uid(),name:"Horváth Rita",src:"Instagram",interest:"Üzlet",stage:2,next:"Bemutató online",nextDate:d(0),note:"Két gyerek, otthonról dolgozna",created:d(-9)},
      {id:uid(),name:"Molnár Petra",src:"Ajánlás (Edit)",interest:"Termék",stage:1,next:"Mintát küldeni",nextDate:d(-2),note:"",created:d(-6)},
      {id:uid(),name:"Nagy Dóra",src:"Facebook csoport",interest:"Mindkettő",stage:0,next:"Első üzenet",nextDate:d(1),note:"",created:d(-1)},
      {id:uid(),name:"Lakatos Bianka",src:"Live",interest:"Üzlet",stage:3,next:"Döntés: belép?",nextDate:d(3),note:"Jövő héten dönt",created:d(-20)},
      {id:uid(),name:"Simon Eszter",src:"Instagram",interest:"Termék",stage:0,next:"Visszaírni a sztorira",nextDate:d(0),note:"",created:d(-3)},
      {id:uid(),name:"Farkas Lili",src:"Személyes",interest:"Termék",stage:1,next:"Kávé szombaton",nextDate:d(5),note:"",created:d(-12)}
    ],
    clients:[
      {id:uid(),name:"Szabó Edit",phone:"+36 30 123 4567",bday:d(2).slice(5),fav:"Arcápoló szett, parfüm",last:d(-27),cycle:30,created:d(-200)},
      {id:uid(),name:"Kiss Noémi",phone:"+36 20 555 1234",bday:"04-12",fav:"Smink",last:d(-12),cycle:45,created:d(-90)},
      {id:uid(),name:"Varga Zsófi",phone:"+36 70 222 3344",bday:"09-03",fav:"Vitaminok",last:d(-33),cycle:30,created:d(-5)},
      {id:uid(),name:"Tóth Anikó",phone:"+36 30 987 6543",bday:"12-19",fav:"Testápolók",last:d(-5),cycle:60,created:d(-150)}
    ],
    orders,
    content:[
      {id:uid(),date:d(0),pillar:0,format:"Sztori",title:"Egy napom a vállalkozásban",status:1},
      {id:uid(),date:d(1),pillar:2,format:"Reel",title:"3 hiba, amit a bőrápolásban elkövetünk",status:0},
      {id:uid(),date:d(2),pillar:1,format:"Poszt",title:"Miért kezdtem el, és miért nem adtam fel",status:0},
      {id:uid(),date:d(-1),pillar:4,format:"Poszt",title:"Őszi kedvenceim (termékbemutató)",status:2},
      {id:uid(),date:d(-3),pillar:5,format:"Live",title:"Kérdezz-felelek: így dolgozom online",status:2},
      {id:uid(),date:d(4),pillar:3,format:"Sztori",title:"Egy csapattag sikertörténete",status:0}
    ],
    ideas:[
      {id:uid(),pillar:0,hook:"Senki nem mondta el, hogy ez lesz a legnehezebb.",main:"Az első év elutasításai és mit tanultam belőlük.",cta:"Neked mi volt a legnehezebb az elején?"},
      {id:uid(),pillar:2,hook:"Ezt a lépést 10-ből 9-en kihagyják.",main:"Az esti bőrápolás 3 lépése, egyszerűen.",cta:"Írd meg kommentben: te hány lépésnél tartasz?"},
      {id:uid(),pillar:5,hook:"Így néz ki egy keddem, ha otthonról dolgozom.",main:"Napi rutin, csapathívás, ügyfelek, család.",cta:"Kíváncsi vagy, hogyan kezdheted? Írj DM-et."}
    ],
    team:[
      {id:uid(),name:"Varga Timi",joined:d(-400),level:"Direktor",phone:"",goal:"Saját autó jövő nyárra",log:"Okt.: új belépő a csapatában",active:true,talk:d(-3)},
      {id:uid(),name:"Kovács Judit",joined:d(-120),level:"Vezető",phone:"",goal:"Havi +100e Ft",log:"",active:true,talk:d(-10)},
      {id:uid(),name:"Pap Ildikó",joined:d(-60),level:"Tanácsadó",phone:"",goal:"Kipróbálni az online munkát",log:"",active:false,talk:d(-25)},
      {id:uid(),name:"Bodnár Vera",joined:d(-8),level:"Tanácsadó",phone:"",goal:"Termékkedvezmény magának",log:"Első lépések megbeszélve",active:true,talk:d(-1)}
    ],
    goals:{},
    stickers:{}
  };
}

/* ---------- storage ---------- */
let S=ctx.state&&ctx.state.v?ctx.state:(DEMO?sample():blank());
function save(){return ST.store.save(S)}
function migrate(){
  if(!S.custom)S.custom=[];
  if(!S.prefs)S.prefs={};
  if(!S.mig2&&!S.blank){
    const dd=S.days[T]||(S.days[T]={tasks:[],note:"",steps:[false,false,false,false,false]});dd.hours=Object.assign({10:"Kávé Farkas Lilivel",14:"Online bemutató: Horváth Rita",19:"Csapathívás"},dd.hours||{});
    const k2=iso(addDays(TODAY,1)),d2=S.days[k2]||(S.days[k2]={tasks:[],note:"",steps:[false,false,false,false,false]});d2.hours=Object.assign({11:"Csomagátadás Szabó Editnek",17:"Live: kérdezz-felelek"},d2.hours||{});
    const tm=["18:00","12:00","19:30","10:00","20:00","17:00"];S.content.forEach((c,i)=>{if(!c.time)c.time=tm[i%tm.length]});
    S.mig2=true;save();
  }
}
migrate();
if(!S.mig3){if(S.blank){S.bp=S.bp||{};S.books=S.books||[]}else{S.bp=S.bp||{};}S.orders.forEach(o=>{if(o.points==null)o.points=Math.round((+o.amount||0)/450)});Object.assign(S.settings,{ptName:S.settings.ptName||"pont",ptGoal:S.settings.ptGoal||300,gpGoal:S.settings.gpGoal||4000,lvlName:S.settings.lvlName||"Vezető"});
  if(!S.blank){let g=1650;for(let i=12;i>=1;i--){const k=iso(addDays(TODAY,-i));if(k.slice(0,7)!==ym(TODAY))continue;g+=Math.round(40+Math.random()*90);S.bp[k]={gp:i%3===0?"":g,sp:i%4===0?12:""}}}
  S.books=S.books||(S.blank?[]:[{id:uid(),title:"Atomi szokások",author:"James Clear",status:"olvasom",progress:40,started:iso(addDays(TODAY,-12)),note:"Nem a célom szintjére emelkedem, hanem a rendszereim szintjére süllyedek."},{id:uid(),title:"Gondolkodj és gazdagodj",author:"Napoleon Hill",status:"szeretnem",progress:0}]);
  S.mig3=true;save()}
if(!S.mig4){if(!S.periods)S.periods=S.blank?[{id:uid(),name:"Aktuális periódus",start:T,end:iso(addDays(TODAY,27))}]:[{id:uid(),name:"Aktuális periódus",start:iso(addDays(TODAY,-12)),end:iso(addDays(TODAY,8))},{id:uid(),name:"Következő periódus",start:iso(addDays(TODAY,9)),end:iso(addDays(TODAY,29))}];
  Object.assign(S.settings,{founder:S.settings.founder!=null?S.settings.founder:(DEMO&&BR.founder.enabled),founderSince:S.settings.founderSince||(DEMO?iso(addDays(TODAY,-20)):"")});
  S.mig4=true;save()}
if(!S.todos&&S.blank){S.todos={};save()}
if(!S.todos){const wk="w:"+iso(addDays(TODAY,-((TODAY.getDay()+6)%7)));S.todos={["m:"+ym(TODAY)]:[{id:uid(),t:"Havi csapattalálkozó megszervezése",done:false},{id:uid(),t:"Új katalógus bemutató-sztori",done:true},{id:uid(),t:"Könyvelőnek a számlák",done:false}],[wk]:[{id:uid(),t:"3 új ajánlás kérése ügyfelektől",done:false},{id:uid(),t:"Heti Live témájának kiválasztása",done:false}]};save()}
if(!S.habits&&S.blank){S.habits=[];save()}
if(!S.habits){const st=iso(addDays(TODAY,-9)),dd={};[0,1,2,3,5,6,7,8].forEach(i=>dd[iso(addDays(TODAY,-9+i))]=true);S.habits=[{id:uid(),name:"30 nap, 30 sztori",start:st,len:30,days:dd},{id:uid(),name:"Napi 2 liter víz",start:iso(addDays(TODAY,-3)),len:30,days:{[iso(addDays(TODAY,-3))]:true,[iso(addDays(TODAY,-2))]:true}}];save()}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
const day=k=>S.days[k]||(S.days[k]={tasks:[],note:"",steps:[false,false,false,false,false]});

/* ---------- stickers ---------- */
const PILLS=[["Új ügyfél",0],["Bemutató",1],["Utánkövetés",4],["Újrarendelés",5],["Új csapattag",0],["Rangemelés",1],["Live",4],["Reel kész",5],["Fókusz",0],["Szülinap",1]];
const HNOTES=["Megcsináltam!","Büszke vagyok magamra.","Ezt ne felejtsd!","Te is képes vagy rá.","Lépésről lépésre.","Hálás vagyok."];
const ICONS={
  polish:'<svg viewBox="0 0 120 300" width="36" height="90"><rect x="44" y="8" width="32" height="74" rx="7" fill="{I}"/><rect x="50" y="14" width="5" height="60" rx="2.5" fill="{P}" opacity=".35"/><rect x="40" y="80" width="40" height="10" rx="3" fill="{GD}"/><rect x="20" y="88" width="80" height="98" rx="24" fill="{A}"/><rect x="20" y="88" width="80" height="98" rx="24" fill="none" stroke="{P}" stroke-opacity=".55" stroke-width="4"/><path d="M80 100 C90 116 90 150 82 170" fill="none" stroke="{AD}" stroke-width="10" stroke-linecap="round" opacity=".6"/><rect x="32" y="104" width="8" height="50" rx="4" fill="{P}" opacity=".45"/><path d="M60 186 C61 214 59 246 60 276" fill="none" stroke="{A}" stroke-width="7" stroke-linecap="round"/><circle cx="60" cy="282" r="7" fill="{A}"/></svg>',
  crown:'<svg viewBox="0 0 28 24" width="50" height="43"><path d="M3 19V7l6 5 5-8 5 8 6-5v12z" fill="{A}" stroke="{P}" stroke-width="1.6" stroke-linejoin="round"/><rect x="3" y="18.6" width="22" height="3.6" rx="1" fill="{HB}" stroke="{P}" stroke-width="1.2"/><circle cx="14" cy="4" r="1.7" fill="{HB}"/></svg>',
  heart:'<svg viewBox="0 0 24 24" width="44" height="44"><path d="M12 21s-7.5-4.6-9.6-9C.9 8.6 3 5 6.6 5c2.2 0 3.7 1.3 5.4 3.1C13.7 6.3 15.2 5 17.4 5 21 5 23.1 8.6 21.6 12 19.5 16.4 12 21 12 21z" fill="{A}" stroke="{P}" stroke-width="1.6"/></svg>',
  star:'<svg viewBox="0 0 24 24" width="44" height="44"><polygon points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6" fill="{HB}" stroke="{P}" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  lipstick:'<svg viewBox="0 0 100 260" width="34" height="88"><rect x="20" y="150" width="60" height="106" rx="5" fill="{GD}"/><rect x="28" y="150" width="8" height="106" fill="{P}" opacity=".28"/><rect x="24" y="116" width="52" height="38" rx="3" fill="{GL}"/><rect x="30" y="116" width="6" height="38" fill="{P}" opacity=".5"/><path d="M30 118 V58 Q30 50 38 46 L70 28 V118 Z" fill="{A}"/><path d="M56 118 V36 L70 28 V118 Z" fill="{AD}"/><rect x="35" y="62" width="5" height="52" rx="2.5" fill="{AL}" opacity=".8"/></svg>',
  phone:'<svg viewBox="0 0 170 360" width="46" height="98"><ellipse cx="80" cy="8" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="17" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="26" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="35" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="44" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="53" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="62" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="71" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="80" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="89" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="98" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="107" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><ellipse cx="80" cy="116" rx="13" ry="6" fill="none" stroke="{AD}" stroke-width="3"/><path d="M80 124 C82 146 100 152 102 176" fill="none" stroke="{AD}" stroke-width="3" stroke-linecap="round"/><rect x="62" y="168" width="70" height="46" rx="22" fill="{A}"/><rect x="62" y="196" width="70" height="18" rx="9" fill="{AD}"/><path d="M104 206 C114 236 116 270 108 300 L90 300 C96 270 94 238 84 206 Z" fill="{A}"/><path d="M104 206 C114 236 116 270 108 300 L100 300 C106 270 106 238 96 206 Z" fill="{AD}"/><rect x="60" y="292" width="70" height="48" rx="22" fill="{A}"/><rect x="60" y="292" width="70" height="16" rx="8" fill="{AD}"/><rect x="70" y="174" width="34" height="6" rx="3" fill="{AL}" opacity=".8"/><rect x="68" y="316" width="30" height="6" rx="3" fill="{AL}" opacity=".7"/></svg>',
  flag:'<svg viewBox="0 0 200 300" width="64" height="96"><rect x="150" y="22" width="9" height="278" rx="2" fill="{GL}"/><rect x="155" y="22" width="4" height="278" fill="{G}"/><circle cx="154.5" cy="18" r="9" fill="{GD}"/><path d="M150 40 C126 52 98 42 70 58 C48 70 26 70 8 76 C38 90 70 100 100 110 C122 117 140 122 150 134 Z" fill="{A}"/><path d="M150 40 C134 66 132 102 150 134 Z" fill="{AD}"/><path d="M70 58 C84 74 92 92 100 110 C86 104 70 98 56 92 C62 82 66 70 70 58 Z" fill="{AD}" opacity=".55"/><path d="M120 56 C108 62 92 60 80 66" fill="none" stroke="{AL}" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>',
  clip:'<svg viewBox="0 0 16 40" width="20" height="50"><path d="M11 9v20a3 3 0 0 1-6 0V7a5 5 0 0 1 10 0v24a7 7 0 0 1-14 0V12" fill="none" stroke="{G}" stroke-width="1.8" stroke-linecap="round"/></svg>',
  binder:'<svg viewBox="0 0 30 30" width="44" height="44"><path d="M8 4 15 15 22 4" fill="none" stroke="{G}" stroke-width="1.8" stroke-linecap="round"/><path d="M4 15h22l-3 12H7z" fill="{A}" stroke="{P}" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="42" height="42"><circle cx="12" cy="12" r="10" fill="{A}" stroke="{P}" stroke-width="1.6"/><path d="M7.5 12.3l3 3 6-6.3" stroke="{P}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  coffee:'<svg viewBox="0 0 28 26" width="46" height="44"><path d="M8 3c-1 2 1 3 0 5M13 3c-1 2 1 3 0 5" stroke="{HD}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M4 10h16v6a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" fill="{P}" stroke="{A}" stroke-width="1.8"/><path d="M20 12h2a3 3 0 0 1 0 6h-2.3" stroke="{A}" stroke-width="1.8" fill="none"/></svg>',
  gift:'<svg viewBox="0 0 24 24" width="44" height="44"><rect x="3" y="9" width="18" height="12" rx="2" fill="{A}" stroke="{P}" stroke-width="1.4"/><rect x="2" y="6.5" width="20" height="4" rx="1.2" fill="{A}" stroke="{P}" stroke-width="1.2"/><rect x="10.8" y="6.5" width="2.4" height="14.5" fill="{HB}"/><path d="M12 6.5C10 3 6.5 3.5 7.5 5.5 8.2 6.7 12 6.5 12 6.5zm0 0c2-3.5 5.5-3 4.5-1-.7 1.2-4.5 1-4.5 1z" fill="{HB}" stroke="{P}" stroke-width=".8"/></svg>',
  circle:'<svg viewBox="0 0 80 40" width="80" height="40"><path d="M42 5C20 3 5 11 6 21s20 15 38 14 31-8 30-17S55 3 34 7" fill="none" stroke="{A}" stroke-width="2.6" stroke-linecap="round"/></svg>',
  arrow:'<svg viewBox="0 0 70 40" width="70" height="40"><path d="M4 32c14-2 30-8 46-24" fill="none" stroke="{A}" stroke-width="2.6" stroke-linecap="round"/><path d="M38 7l13 0 -1 13" fill="none" stroke="{A}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  underline:'<svg viewBox="0 0 90 16" width="90" height="16"><path d="M3 10c20-5 40-6 60-4 8 .8 16 2 24 1" fill="none" stroke="{A}" stroke-width="2.8" stroke-linecap="round"/></svg>'
};
const TAPES=()=>{const P=TH.palette();return [P.hl300,P.hl200,P.accentLight,P.accent]};
const SC=()=>TH.palette().swatches;
const CMAP=[0,1,4,5];
const MKTYPES=[["pill","Címke"],["note","Kézírás"],["banner","Szalag"],["stamp","Pecsét"]];
function pillHTML(t,col){const P=TH.palette();return `<span class="pill" style="background:${col.main};color:${col.fg};border-color:${col.ivory?P.accent:P.paper}">${esc(t)}</span>`}
function noteHTML(t,col){const P=TH.palette();if(!col)return `<span class="hnote">${esc(t)}</span>`;if(col.ivory)return `<span class="hnote" style="background:${P.accent};color:${P.accentInk}">${esc(t)}</span>`;if(col.pale)return `<span class="hnote" style="background:${col.main};color:${col.fg}">${esc(t)}</span>`;return `<span class="hnote" style="color:${col.main}">${esc(t)}</span>`}
function stampHTML(t,col){const P=TH.palette(),bg=col.ivory?P.accent:P.paper,fg=col.ivory?P.accentInk:(col.pale?col.dark:col.main);return `<span class="stamp" style="color:${fg};background:${bg};box-shadow:inset 0 0 0 4px ${bg},inset 0 0 0 5.5px currentColor"><span>${esc(t)}</span></span>`}
function recolorSvg(svg,col){
  const P=TH.palette();if(svg.includes(P.accent))return svg.split(P.accentDeep).join("\u0001").split(P.accentLight).join("\u0002").split(P.accent).join(col.main).split("\u0001").join(col.dark).split("\u0002").join(col.light);
  const m=svg.match(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/);
  return m?svg.split(m[1]).join(col.main):svg;
}
function customCol(c){return c.ci!=null?SC()[c.ci]:SC()[CMAP[c.color||0]]}
function customHTML(c,ov){
  if(c.type==="img")return `<img class="stimg" src="${c.src}" alt="" draggable="false">`;
  const col=ov||customCol(c);
  if(c.type==="note")return noteHTML(c.text,col);
  if(c.type==="banner")return `<span class="banner" style="background:${col.main};color:${col.fg}">${esc(c.text)}</span>`;
  if(c.type==="stamp")return stampHTML(c.text,col);
  return pillHTML(c.text,col);
}
function stInner(k,ci){
  const col=(ci!=null&&ci>=0)?SC()[ci]:null;
  if(k.startsWith("p:")){const p=PILLS[+k.slice(2)];if(!p)return"";return pillHTML(p[0],col||SC()[p[1]])}
  if(k.startsWith("h:"))return noteHTML(HNOTES[+k.slice(2)]||"",col);
  if(k.startsWith("t:")){const i=+k.slice(2),c=TAPES()[i];if(!c)return"";const m=col?col.main:c;return `<span class="tape" style="background:${i===3?`repeating-linear-gradient(90deg,${TH.palette().paper} 0 7px,${m} 7px 10px)`:m}"></span>`}
  if(k.startsWith("c:")){const c=(S.custom||[]).find(x=>x.id===k.slice(2));return c?customHTML(c,col):""}
  if(k.startsWith("a:")){const a=ACH.find(x=>x.id===k.slice(2));return a?achHTML(a):""}
  if(k.startsWith("q:")){return quoteHTML(QUOTES[+k.slice(2)]||"",col,BR.ownerName)}
  if(k.startsWith("mq:")){const q=(S.myquotes||[]).find(x=>x.id===k.slice(3));return q?quoteHTML(q.t,col,q.a):""}
  const svg=TH.svg(ICONS[k]||"");return col?recolorSvg(svg,col):svg;
}
function isImg(k){if(k.startsWith("a:"))return true;if(!k.startsWith("c:"))return false;const c=(S.custom||[]).find(x=>x.id===k.slice(2));return !!(c&&c.type==="img")}
const stTf=s=>`translate(-50%,-50%) rotate(${s.r||0}deg) scale(${s.s||1})`;
function stkHTML(s,bk){const sel=ui.sel&&ui.sel.b===bk&&ui.sel.id===s.id;return `<div class="stk${sel?" sel":""}" data-sid="${s.id}" style="left:${s.x}%;top:${s.y}%;transform:${stTf(s)}">${stInner(s.k,s.c)}</div>`}
function board(key){return `<div class="board" data-board="${esc(key)}">${(S.stickers[key]||[]).map(s=>stkHTML(s,key)).join("")}</div>`}
function allKeys(){return [["Kiérdemelt",ACH.filter(a=>S.unlocked&&S.unlocked[a.id]).map(a=>"a:"+a.id)],["Saját idézetek",(S.myquotes||[]).map(q=>"mq:"+q.id)],["Idézetek",QUOTES.map((_,i)=>"q:"+i)],["Saját",(S.custom||[]).map(c=>"c:"+c.id)],["Címkék",PILLS.map((_,i)=>"p:"+i)],["Kézírás",HNOTES.map((_,i)=>"h:"+i)],["Tárgyak és jelek",Object.keys(ICONS)],["Ragasztószalag",TAPES().map((_,i)=>"t:"+i)]]}
function selSticker(){if(!ui.sel)return null;return (S.stickers[ui.sel.b]||[]).find(z=>z.id===ui.sel.id)||null}
let activeBoard=null, trayOpen=false;
function drawer(){
  const el=$("#drawer");
  if(!activeBoard){el.innerHTML="";return}
  let h="";
  const st=selSticker();
  if(st){
    h+=`<div class="editwrap">${isImg(st.k)?"":`<div class="editcolors" role="group" aria-label="Matrica színe"><span>Szín</span>${SC().map((c,i)=>`<button class="eswatch" data-act="se" data-op="color" data-i="${i}" style="background:${c.main}" aria-label="${c.n}" title="${c.n}" aria-pressed="${st.c===i}"></button>`).join("")}<button class="ereset" data-act="se" data-op="color" data-i="-1" aria-pressed="${st.c==null}">Eredeti</button></div>`}<div class="editbar" role="toolbar" aria-label="Matrica szerkesztése">
      <button data-act="se" data-op="smaller" aria-label="Kisebb">−</button><button data-act="se" data-op="bigger" aria-label="Nagyobb">+</button>
      <button data-act="se" data-op="left" aria-label="Forgatás balra">↺</button><button data-act="se" data-op="right" aria-label="Forgatás jobbra">↻</button>
      <button data-act="se" data-op="front">Előre</button><button data-act="se" data-op="dup">Másolat</button><button data-act="se" data-op="del" class="danger">Törlés</button></div></div>`;
  }
  if(trayOpen){
    h+=`<div class="tray" role="dialog" aria-label="Matricák"><div class="row between"><h3>Matricák</h3><a href="#matricak" class="trlink">Gyűjtemény és készítő</a></div><p class="muted" style="font-size:12px;margin:2px 0 0">Koppints rá, aztán húzd a helyére.</p>`;
    for(const[t,keys] of allKeys()){if(!keys.length)continue;h+=`<div class="set"><div class="set-title">${t}</div>${keys.map(k=>`<button class="s" data-act="stkadd" data-k="${k}"><span class="mini-st">${stInner(k)}</span></button>`).join("")}</div>`}
    h+=`</div>`;
  }
  h+=`<button class="btn gold fab" data-act="tray" aria-expanded="${trayOpen}">${trayOpen?"Kész":"Matricák"}</button>`;
  el.innerHTML=h;
}
function markSel(){document.querySelectorAll(".stk.sel").forEach(z=>z.classList.remove("sel"));if(ui.sel){const b=document.querySelector(`.board[data-board="${CSS.escape(ui.sel.b)}"] .stk[data-sid="${ui.sel.id}"]`);b&&b.classList.add("sel")}}
function bindBoards(){
  document.querySelectorAll(".board").forEach(b=>{
    b.querySelectorAll(".stk").forEach(el=>{
      let sx,sy,moved=false,rect;
      el.addEventListener("pointerdown",e=>{
        rect=b.getBoundingClientRect();sx=e.clientX;sy=e.clientY;moved=false;
        el.setPointerCapture(e.pointerId);e.preventDefault();
      });
      el.addEventListener("pointermove",e=>{
        if(!el.hasPointerCapture(e.pointerId))return;
        if(Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>3)moved=true;
        if(!moved)return;
        const x=Math.min(98,Math.max(2,(e.clientX-rect.left)/rect.width*100));
        const y=Math.min(98,Math.max(2,(e.clientY-rect.top)/rect.height*100));
        el.style.left=x+"%";el.style.top=y+"%";
      });
      el.addEventListener("pointerup",e=>{
        if(!el.hasPointerCapture(e.pointerId))return;
        el.releasePointerCapture(e.pointerId);
        const s=(S.stickers[b.dataset.board]||[]).find(z=>z.id===el.dataset.sid);
        if(moved&&s){s.x=parseFloat(el.style.left);s.y=parseFloat(el.style.top);save();ui.sel={b:b.dataset.board,id:s.id}}
        else{ui.sel=(ui.sel&&ui.sel.id===el.dataset.sid)?null:{b:b.dataset.board,id:el.dataset.sid}}
        markSel();drawer();
      });
    });
  });
}

/* ---------- nav ---------- */
const VIEWS=[["ma","Ma"],["naptar","Naptár"],["szokasok","Szokások"],["terkep","Gondolattérkép"],["olvasas","Olvasás"],["kapcsolatok","Kapcsolatok"],["ugyfelek","Ügyfelek"],["tartalom","Tartalom"],["csapat","Csapat"],["szamok","Számok"],["matricak","Matricák"],["bovitesek","Bővítések"],["beallitasok","Beállítások"]];
let route="ma";
let ui={calMonth:ym(TODAY),selDay:T,calMode:"honap",ccMonth:ym(TODAY),cTab:"naptar",kFilter:"all",pFilter:-1,sel:null,mq:{t:"",a:"",editId:null},mqdel:null,skip:[],hdel:null,mapId:null,mapSel:null,mk:{type:"pill",text:"Bemutató 18:00",color:0,editId:null},cdel:null};

function dueCounts(){
  const f=S.contacts.filter(c=>c.nextDate&&c.nextDate<=T&&c.stage<4).length;
  const r=S.clients.filter(c=>reorderDue(c)<=3).length;
  return {f,r};
}
function reorderDate(c){return c.last?iso(addDays(parse(c.last),+c.cycle||30)):""}
function reorderDue(c){return c.last?diff(reorderDate(c)):999}
function nav(){
  const dc=dueCounts();
  $("#nav").innerHTML=VIEWS.map(([k,l])=>{
    let b="";if(k==="kapcsolatok"&&dc.f)b=`<span class="badge">${dc.f}</span>`;if(k==="ugyfelek"&&dc.r)b=`<span class="badge">${dc.r}</span>`;
    return `<a href="#${k}" ${route===k?'aria-current="page"':""}>${l}${b}</a>`}).join("");
}

/* ---------- views ---------- */
function head(title,sub,right,hand){return `<div class="head"><div class="stack"><div class="eyebrow">${esc(sub)}</div><h1>${esc(title)}${hand?` <span class="hand">${esc(hand)}</span>`:""}</h1></div><div class="row">${right||""}${DEMO?'<span class="proto">Bemutató mód, mintaadatokkal</span>':""}${syncBadge()}</div></div>`}

function stepsHTML(k){
  const dd=day(k);
  return `<div class="steps">${S.settings.steps.map((s,i)=>`<button class="step" data-act="step" data-day="${k}" data-i="${i}" aria-pressed="${!!dd.steps[i]}"><span class="ring">✓</span><span>${esc(s)}</span></button>`).join("")}</div>`;
}
function tasksHTML(k){
  const dd=day(k);
  return `<div class="list">${dd.tasks.map(t=>`<div class="li ${t.done?"done":""}"><button class="cbx" data-act="task" data-day="${k}" data-id="${t.id}" aria-pressed="${t.done}" aria-label="Kész">${t.done?"✓":""}</button><div class="grow t">${esc(t.t)}</div>${pxBtn("task",`data-day="${k}" data-id="${t.id}"`,t)}<button class="iconbtn" data-act="taskdel" data-day="${k}" data-id="${t.id}" aria-label="Törlés">×</button></div>`).join("")||'<div class="empty">Még nincs teendő erre a napra.</div>'}</div>
  <form class="row" data-form="task" data-day="${k}" style="margin-top:8px;flex-wrap:nowrap"><input type="text" id="newtask-${k}" placeholder="Új teendő…" aria-label="Új teendő"><button class="btn small">Hozzáadás</button></form>`;
}
function streak(){let n=0,d=new Date(TODAY);for(;;){const k=iso(d),dd=S.days[k];if(dd&&dd.steps.some(Boolean)){n++;d=addDays(d,-1)}else{if(k===T){d=addDays(d,-1);continue}break}if(n>400)break}return n}
function monthStats(m){
  const inM=s=>s&&s.slice(0,7)===m;
  return {
    contacts:S.contacts.filter(c=>inM(c.created)).length,
    clients:S.clients.filter(c=>inM(c.created)).length,
    team:S.team.filter(t=>inM(t.joined)).length,
    revenue:S.orders.filter(o=>inM(o.date)).reduce((a,o)=>a+(+o.amount||0),0),
    posts:S.content.filter(c=>inM(c.date)&&c.status===2).length
  };
}

function vMa(){
  activeBoard="ma-"+T;
  const dc=S.contacts.filter(c=>c.nextDate&&c.nextDate<=T).sort((a,b)=>a.nextDate.localeCompare(b.nextDate));
  const rc=S.clients.filter(c=>reorderDue(c)<=3).sort((a,b)=>reorderDue(a)-reorderDue(b));
  const bd=S.clients.filter(c=>{if(!c.bday)return false;for(let i=0;i<7;i++){if(iso(addDays(TODAY,i)).slice(5)===c.bday)return true}return false});
  const cont=S.content.filter(c=>c.date===T);
  const st=monthStats(ym(TODAY));
  const done=day(T).steps.filter(Boolean).length;
  return head("Szia,",longDate(T),BR.founder.enabled&&S.settings.founder?'<button class="chip founderchip" data-act="cert" data-id="alapito" title="Alapító oklevél">Alapító tag</button>':"",S.settings.name+"!")+(()=>{const q=quoteOfDay();return `<p class="qday">„${esc(q.t)}”${q.a?` <span class="qday-a">${esc(q.a)}</span>`:""}</p>`})()+nextCard()+`
  <div class="grid herogrid">
  <div class="card hero page"><div class="row between" style="align-items:flex-start"><div class="stack" style="gap:4px;max-width:60ch">
    <div class="eyebrow">A mai napi lépéseid</div><div class="big">${done===5?"Mind az 5 megvan. Büszke lehetsz Magadra!":done?`${done} / 5 kész, így tovább!`:"Ma is közelebb kerülhetsz a céljaidhoz."}</div></div>
    <div class="chip good">${streak()} napos sorozat</div></div>
    <div style="margin-top:14px">${stepsHTML(T)}</div>${board(activeBoard)}</div>
  ${pointsCard()}</div>
  ${bpStrip()}
  <div class="grid g4">
    <div class="card kpi"><div class="v num red">${st.contacts}</div><div class="l">új kapcsolat ebben a hónapban</div></div>
    <div class="card kpi"><div class="v num">${st.clients}</div><div class="l">új ügyfél</div></div>
    <div class="card kpi"><div class="v num">${st.team}</div><div class="l">új csapattag</div></div>
    <div class="card kpi"><div class="v num">${money(st.revenue)}</div><div class="l">bevétel a rendelésekből</div></div>
  </div>
  <div class="grid g3">
    <div class="card"><h3>Kit keress meg ma?</h3><div class="list">${dc.map(c=>`<div class="li"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.next)} · ${STAGES[c.stage]}</div></div>${c.nextDate<T?`<span class="chip warn">${-diff(c.nextDate)} napja</span>`:'<span class="chip">ma</span>'}<button class="iconbtn" data-act="msg" data-k="${c.stage===1?"bemutato":"utankovetes"}" data-type="contact" data-id="${c.id}" aria-label="Üzenetvázlat" title="Üzenetvázlat">${MSGICON}</button><button class="iconbtn" data-act="cdone" data-id="${c.id}" aria-label="Megvolt" title="Megvolt">✓</button></div>`).join("")||'<div class="empty">Mára nincs esedékes utánkövetés.</div>'}</div></div>
    <div class="card"><h3>Újrarendelés, szülinap</h3><div class="list">${rc.map(c=>`<div class="li"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.fav)}</div></div><span class="chip ${reorderDue(c)<0?"warn":""}">${reorderDue(c)<0?-reorderDue(c)+" napja esedékes":reorderDue(c)===0?"ma esedékes":reorderDue(c)+" nap múlva"}</span><button class="iconbtn" data-act="msg" data-k="ujrarendeles" data-type="client" data-id="${c.id}" aria-label="Üzenetvázlat" title="Üzenetvázlat">${MSGICON}</button></div>`).join("")}${bd.map(c=>`<div class="li"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">születésnap a héten</div></div><span class="chip good">Szülinap</span><button class="iconbtn" data-act="msg" data-k="szulinap" data-type="client" data-id="${c.id}" aria-label="Üzenetvázlat" title="Üzenetvázlat">${MSGICON}</button></div>`).join("")}${!rc.length&&!bd.length?'<div class="empty">Nincs teendő az ügyfeleiddel.</div>':""}</div></div>
    <div class="card"><h3>Mai tartalom</h3><div class="list">${cont.map(c=>`<div class="li"><span class="dot" style="background:var(--p${c.pillar+1})"></span><div class="grow"><div class="t">${esc(c.title)}</div><div class="s">${c.format} · ${PILLARS[c.pillar]}</div></div><button class="chip" data-act="cstat" data-id="${c.id}">${CSTATUS[c.status]}</button></div>`).join("")||'<div class="empty">Mára nincs betervezett tartalom.</div>'}</div><div style="margin-top:10px"><a class="btn ghost small" href="#tartalom" style="text-decoration:none">Tartalomnaptár</a></div></div>
  </div>
  <div class="grid g2"><div class="card"><div class="row between" style="margin-bottom:6px"><h3 style="margin:0">Mai beosztás</h3><button class="btn ghost small" data-act="opennap" data-k="${T}">Napi nézet</button></div><div class="list">${hoursOf(T).map(([h,v])=>{const loc=locOf(T,h);return `<div class="li"><span class="num tm ${+h===new Date().getHours()?"now":""}">${pad(h)}:00</span><div class="grow"><div class="t">${esc(v)}</div>${loc?`<div class="s">${esc(loc)}</div>`:""}</div>${apptLinks(T,h,v,loc)}</div>`}).join("")||'<div class="empty">Mára nincs beírt időpont.</div>'}</div></div>
  <div class="card"><h3>Mai teendők</h3>${tasksHTML(T)}</div></div>
  <div class="grid g2">${habitsToday()}${closeHTML(T,true)}</div>`;
}
const MODES=[["honap","Havi"],["het","Heti"],["nap","Napi"]];
const HOURS=[];for(let h=7;h<=21;h++)HOURS.push(h);
function mondayOf(k){const d=parse(k);return addDays(d,-((d.getDay()+6)%7))}
function hoursOf(k){const dd=S.days[k];return dd&&dd.hours?Object.entries(dd.hours).filter(([,v])=>v&&String(v).trim()).sort((a,b)=>+a[0]-+b[0]):[]}
function weekLabel(m){const e=addDays(m,6);return cap(MONTHS[m.getMonth()])+" "+m.getDate()+". – "+(e.getMonth()!==m.getMonth()?MONTHS[e.getMonth()]+" ":"")+e.getDate()+"."}
function dayPanels(sel){
  const dd=day(sel);
  const selContent=S.content.filter(c=>c.date===sel);
  const selFollow=S.contacts.filter(c=>c.nextDate===sel);
  return `<div class="stack" style="gap:18px">
    <div><div class="eyebrow" style="margin-bottom:8px">Napi lépések</div>${stepsHTML(sel)}</div>
    <div><div class="eyebrow" style="margin-bottom:2px">A nap teendői</div>${tasksHTML(sel)}</div>
    ${(()=>{const wk="w:"+iso(mondayOf(sel)),mk="m:"+sel.slice(0,7),wi=todoItems(wk,true),mi=todoItems(mk,true);return `<div class="todomini"><div><div class="eyebrow" style="margin-bottom:2px">A hét nyitott teendői</div>${wi?`<div class="list">${wi}</div>`:'<div class="empty">Nincs nyitott heti teendő.</div>'}</div><div><div class="eyebrow" style="margin-bottom:2px">A hónap nyitott teendői</div>${mi?`<div class="list">${mi}</div>`:'<div class="empty">Nincs nyitott havi teendő.</div>'}</div><button class="chip" data-act="calmode" data-k="het" style="align-self:flex-start">Heti és havi teendők szerkesztése</button></div>`})()}
    ${selFollow.length?`<div><div class="eyebrow">Utánkövetés</div><div class="list">${selFollow.map(c=>`<div class="li"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.next)}</div></div></div>`).join("")}</div></div>`:""}
    ${selContent.length?`<div><div class="eyebrow">Tartalom</div><div class="list">${selContent.map(c=>`<div class="li"><span class="dot" style="background:var(--p${c.pillar+1})"></span><div class="grow"><div class="t">${esc(c.title)}</div><div class="s">${c.time?c.time+" · ":""}${c.format}</div></div></div>`).join("")}</div></div>`:""}
    ${closeHTML(sel,false)}
    <label class="f">Jegyzet<textarea id="note-${sel}" data-note="${sel}" rows="4">${esc(dd.note)}</textarea></label>
  </div>`;
}
function vNaptar(){
  const mode=ui.calMode;
  const ctrls=`<div class="tabs">${MODES.map(([k,l])=>`<button data-act="calmode" data-k="${k}" aria-pressed="${mode===k}">${l}</button>`).join("")}</div><span class="row" style="gap:6px"><button class="iconbtn" data-act="calnav" data-d="-1" aria-label="Előző">‹</button><button class="btn ghost small" data-act="caltoday">Ma</button><button class="iconbtn" data-act="calnav" data-d="1" aria-label="Következő">›</button></span>`;
  let title,body;
  if(mode==="honap"){
    const [Y,M]=ui.calMonth.split("-").map(Number);
    const first=new Date(Y,M-1,1);const start=addDays(first,-((first.getDay()+6)%7));
    activeBoard="honap-"+ui.calMonth;title=cap(MONTHS[M-1])+" "+Y;
    let cells=WD.map(w=>`<div class="wd">${w}</div>`).join("");
    for(let i=0;i<42;i++){
      const d=addDays(start,i),k=iso(d),dd=S.days[k];
      const sc=dd?dd.steps.filter(Boolean).length:0;
      const cs=S.content.filter(c=>c.date===k);
      const hrs=hoursOf(k);
      const tk=dd?dd.tasks.length:0;
      cells+=`<button class="day ${d.getMonth()!==M-1?"out":""} ${k===T?"today":""} ${sc===5?"gold":""}" data-act="opennap" data-k="${k}" ${sc===5?'title="Arany nap: mind az 5 lépés megvolt"':""}>
        <span class="n num">${d.getDate()}</span>${(()=>{const pm=periodMark(k);return pm?`<span class="pmark ${pm}">${pm==="start"?"Kezdet":"Zárás"}</span>`:""})()}${sc===5?`<span class="goldmark" aria-hidden="true">${TH.svg(ICONS.crown).replace(/width="\d+" height="\d+"/,'width="18" height="16"')}</span>`:""}
        <span class="marks">${cs.map(c=>`<span class="dot" style="background:var(--p${c.pillar+1})" title="${esc(c.title)}"></span>`).join("")}</span>
        ${hrs.length?`<span class="mini"><b>${pad(hrs[0][0])}:00</b> ${esc(hrs[0][1])}</span>`:""}${hrs.length>1?`<span class="mini">+${hrs.length-1} időpont</span>`:""}${tk&&hrs.length<2?`<span class="mini">${tk} teendő</span>`:""}
        <span class="meter"><i style="width:${sc*20}%"></i></span></button>`;
      if(i===34&&addDays(start,35).getMonth()!==M-1)break;
    }
    body=`<div class="calrow"><div class="card page"><div class="cal">${cells}</div><div class="row muted" style="font-size:12px;margin-top:12px"><span>Koppints egy napra a napi nézethez.</span><span>·</span><span>Korona: arany nap, mind az 5 lépés megvolt</span><span>·</span><span>Kezdet és Zárás: a periódus határai</span><span>·</span><span>A csík: napi lépések</span><span>·</span><span>Színes pötty: tartalom pillérenként</span></div>${board(activeBoard)}</div>${todoCard("m:"+ui.calMonth,"A hónap teendői","Írd ide, amit ebben a hónapban el akarsz intézni.")}</div>`;
  }else if(mode==="het"){
    const m=mondayOf(ui.selDay);activeBoard="het-"+iso(m);title=weekLabel(m);
    const cols=[0,1,2,3,4,5,6].map(i=>{const d=addDays(m,i),k=iso(d),dd=S.days[k]||{tasks:[],steps:[]};const sc=(dd.steps||[]).filter(Boolean).length;const hrs=hoursOf(k);const cs=S.content.filter(c=>c.date===k);
      return `<div class="wcol ${k===T?"today":""}">
        <button class="whead" data-act="opennap" data-k="${k}"><span class="wd2">${WD[i]}</span><span class="wn">${d.getDate()}</span></button>${(()=>{const pm=periodMark(k);return pm?`<span class="pmark ${pm}" style="align-self:flex-start">${pm==="start"?"Periódus kezdete":"Periódus zárása"}</span>`:""})()}
        <div class="meter" title="Napi lépések: ${sc}/5"><i style="width:${sc*20}%"></i></div>
        ${hrs.map(([h,v])=>{const loc=locOf(k,h);return `<div class="wappt"><span class="num">${pad(h)}:00</span>${esc(v)}${loc?`<a class="wloc" href="${mapURL(loc)}" target="_blank" rel="noopener">${esc(loc)}</a>`:""}</div>`}).join("")}
        ${cs.map(c=>`<div class="wcont"><span class="dot" style="background:var(--p${c.pillar+1})"></span><span>${c.format}: ${esc(c.title)}</span></div>`).join("")}
        ${(dd.tasks||[]).map(t=>`<div class="wtask ${t.done?"done":""}"><button class="cbx" data-act="task" data-day="${k}" data-id="${t.id}" aria-pressed="${t.done}" aria-label="Kész">${t.done?"✓":""}</button><span class="t">${esc(t.t)}</span></div>`).join("")}
        <form class="wform" data-form="task" data-day="${k}"><input type="text" id="newtask-${k}" placeholder="+ teendő" aria-label="Új teendő: ${fmtDate(k)}"></form>
        <button class="wadd" data-act="opennap" data-k="${k}">Megnyitom</button></div>`}).join("");
    body=`<div class="card page"><div class="weekwrap"><div class="week">${cols}</div></div>${board(activeBoard)}</div>${todoCard("w:"+iso(m),"A hét teendői","Ami a héten bármikor belefér, de nincs konkrét naphoz kötve.")}`;
  }else{
    const sel=ui.selDay,dd=day(sel);activeBoard="nap-"+sel;title=longDate(sel);
    const nowH=new Date().getHours();
    const hoursHTML=HOURS.map(h=>{const v=(dd.hours||{})[h]||"",loc=locOf(sel,h);return `<div class="hr ${sel===T&&h===nowH?"now":""}"><label class="hh num" for="hr-${sel}-${h}">${pad(h)}:00</label><input type="text" id="hr-${sel}-${h}" data-hour="${h}" data-day="${sel}" value="${esc(v)}" aria-label="${pad(h)}:00 időpont"><input type="text" class="locin" id="loc-${sel}-${h}" data-loc="${h}" data-day="${sel}" value="${esc(loc)}" aria-label="${pad(h)}:00 helyszín" placeholder="${v?"Helyszín":""}"><span class="hacts" id="hacts-${sel}-${h}">${v?apptLinks(sel,h,v,loc):""}</span></div>`}).join("");
    body=`<div class="card page daypage"><div class="row between dp-top"><div class="row" style="gap:10px"><div class="eyebrow">Időbeosztás</div>${pointsChip(sel)}</div><button class="btn gold small" data-act="tray">Matrica a lapra</button></div><div class="dp-cols"><div><div class="hours">${hoursHTML}</div><p class="muted" style="font-size:12px;margin:10px 0 0">Írd be az időpontot, mellé a helyszínt. A Térkép a Google Térképet nyitja meg, a Naptárba gomb a Google Naptárba teszi az időpontot.</p></div>${dayPanels(sel)}</div>${board(activeBoard)}</div>`;
  }
  return head(title,mode==="nap"?"Napi nézet":mode==="het"?"Heti nézet":"Havi nézet",ctrls)+body;
}

function vKapcsolatok(){
  activeBoard=null;
  const cols=STAGES.map((s,i)=>{
    const items=S.contacts.filter(c=>c.stage===i&&(ui.kFilter==="all"||c.interest===ui.kFilter||c.interest==="Mindkettő"));
    return `<section class="col"><header><span>${i+1}. ${s}</span><span class="chip">${items.length}</span></header>${items.map(c=>`
      <div class="kcard"><button style="all:unset;cursor:pointer;display:flex;flex-direction:column;gap:4px" data-act="edit" data-type="contact" data-id="${c.id}">
        <span class="t">${esc(c.name)}</span><span class="muted" style="font-size:12px">${esc(c.src)}</span></button>
        <div class="row" style="gap:6px"><span class="chip">${esc(c.interest)}</span>${c.nextDate?`<span class="chip ${c.nextDate<T?"warn":c.nextDate===T?"good":""}">${c.nextDate===T?"ma":fmtDate(c.nextDate)}: ${esc(c.next)}</span>`:""}</div>
        <div class="acts"><button class="iconbtn" data-act="stage" data-id="${c.id}" data-d="-1" ${i===0?"disabled":""} aria-label="Vissza">‹</button><button class="chip" data-act="msg" data-k="${c.stage===1?"bemutato":"utankovetes"}" data-type="contact" data-id="${c.id}">Üzenet</button><button class="iconbtn" data-act="stage" data-id="${c.id}" data-d="1" ${i===3?"disabled":""} aria-label="Tovább">›</button></div>
      </div>`).join("")||'<div class="empty">Üres</div>'}</section>`}).join("");
  return head("Kapcsolatok","Folyamat lépésről lépésre",`<button class="btn" data-act="new" data-type="contact">Új kapcsolat</button>`)+`
  <div class="row between"><div class="tabs">${[["all","Mind"],["Termék","Termék iránt"],["Üzlet","Üzlet iránt"]].map(([k,l])=>`<button data-act="kf" data-k="${k}" aria-pressed="${ui.kFilter===k}">${l}</button>`).join("")}</div><span class="muted" style="font-size:12.5px">Az esedékes utánkövetéseket a Ma oldalon is megtalálod.</span></div>
  <div class="kanban">${cols}</div>`;
}

function vUgyfelek(){
  activeBoard=null;
  const rows=S.clients.slice().sort((a,b)=>reorderDue(a)-reorderDue(b)).map(c=>{const d=reorderDue(c);return `<tr class="click" data-act="edit" data-type="client" data-id="${c.id}"><td><strong>${esc(c.name)}</strong><div class="muted" style="font-size:12px">${esc(c.phone)}</div>${c.addr?`<a class="maplink" href="${mapURL(c.addr)}" target="_blank" rel="noopener" data-stop="1">${esc(c.addr)}</a>`:""}</td><td>${esc(c.fav)}</td><td class="num">${c.bday?esc(cap(MONTHS[+c.bday.slice(0,2)-1]).slice(0,3)+". "+(+c.bday.slice(3))+"."):""}</td><td class="num">${fmtDate(c.last)}</td><td><span class="chip ${d<0?"warn":d<=3?"good":""}">${c.last?(d<0?-d+" napja esedékes":d===0?"ma":d+" nap múlva"):"–"}</span></td><td><span class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn small ghost" data-act="msg" data-k="ujrarendeles" data-type="client" data-id="${c.id}">Üzenet</button><button class="btn small ghost" data-act="order" data-id="${c.id}">Rendelés</button></span></td></tr>`}).join("");
  const om=S.orders.filter(o=>o.date.slice(0,7)===ym(TODAY)).sort((a,b)=>b.date.localeCompare(a.date));
  const sum=om.reduce((a,o)=>a+(+o.amount||0),0), unpaid=om.filter(o=>!o.paid).reduce((a,o)=>a+(+o.amount||0),0);
  return head("Ügyfelek","Ügyfélkör és rendelések",`<button class="btn" data-act="new" data-type="client">Új ügyfél</button>`)+`
  <div class="card"><div class="tablewrap"><table><thead><tr><th>Ügyfél</th><th>Kedvencei</th><th>Szülinap</th><th>Utolsó rendelés</th><th>Újrarendelés</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="muted" style="font-size:12px;margin:10px 0 0">Az újrarendelés dátumát az app számolja az utolsó rendelésből és az ügyfél szokásos ciklusából.</p></div>
  <div class="card"><div class="row between"><h3>Rendelések ebben a hónapban</h3><div class="row"><span class="chip">Összesen: ${money(sum)}</span>${unpaid?`<span class="chip warn">Fizetésre vár: ${money(unpaid)}</span>`:""}</div></div>
  <div class="tablewrap"><table><thead><tr><th>Dátum</th><th>Ügyfél</th><th>Termék</th><th style="text-align:right">Összeg</th><th>Fizetve</th></tr></thead><tbody>${om.map(o=>`<tr><td class="num">${fmtDate(o.date)}</td><td>${esc(o.client)}</td><td>${esc(o.items)}</td><td class="num" style="text-align:right">${money(o.amount)}</td><td><span class="row" style="gap:6px;flex-wrap:nowrap"><button class="cbx" data-act="paid" data-id="${o.id}" aria-pressed="${!!o.paid}" aria-label="Fizetve">${o.paid?"✓":""}</button>${pxBtn("order",`data-id="${o.id}"`,o)}</span></td></tr>`).join("")||'<tr><td colspan="5" class="empty">Még nincs rendelés ebben a hónapban.</td></tr>'}</tbody></table></div></div>`;
}

const FICON={
  Poszt:'<svg viewBox="0 0 16 16" width="15" height="15"><rect x="2" y="2" width="12" height="12" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="6.2" r="1.3" fill="currentColor"/><path d="M3 12.2l3.4-3.4 2.4 2.4 1.8-1.8 2.4 2.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  Sztori:'<svg viewBox="0 0 16 16" width="15" height="15"><rect x="4" y="1.5" width="8" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
  Reel:'<svg viewBox="0 0 16 16" width="15" height="15"><rect x="2" y="2" width="12" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 5.6v4.8L10.4 8z" fill="currentColor"/></svg>',
  Live:'<svg viewBox="0 0 16 16" width="15" height="15"><circle cx="8" cy="8" r="2" fill="currentColor"/><path d="M4.6 4.6a4.8 4.8 0 0 0 0 6.8M11.4 4.6a4.8 4.8 0 0 1 0 6.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
};
function postChip(c){
  const light=c.pillar===3||c.pillar===5;
  return `<button class="post" draggable="true" data-drag="${c.id}" data-act="edit" data-type="content" data-id="${c.id}" title="${esc(c.title)}">
    <span class="th" style="background:var(--p${c.pillar+1});color:${light?"var(--ink)":"var(--paper)"}">${FICON[c.format]||FICON.Poszt}</span>
    <span class="meta"><span class="ttl">${esc(c.title)}</span><span class="sub"><span class="sdot s${c.status}"></span>${c.time?c.time+" · ":""}${c.format}</span></span></button>`;
}
function vTartalom(){
  const m=ui.ccMonth;const[Y,M]=m.split("-").map(Number);
  const items=S.content.filter(c=>c.date.slice(0,7)===m).sort((a,b)=>(a.date+(a.time||"")).localeCompare(b.date+(b.time||"")));
  const counts=PILLARS.map((_,i)=>items.filter(c=>c.pillar===i).length);
  const tot=items.length||1;
  const show=c=>ui.pFilter<0||c.pillar===ui.pFilter;
  activeBoard=ui.cTab==="naptar"?"tartalom-"+m:ui.cTab==="lista"?"tartalomlista-"+m:null;
  const monthNav=`<div class="row" style="gap:6px"><button class="iconbtn" data-act="ccnav" data-d="-1" aria-label="Előző hónap">‹</button><strong class="mlabel">${cap(MONTHS[M-1])} ${Y}</strong><button class="iconbtn" data-act="ccnav" data-d="1" aria-label="Következő hónap">›</button></div>`;
  const balance=`<div class="card"><div class="row between"><h3>Pillér-egyensúly</h3><span class="muted" style="font-size:12px">${items.length} tartalom ${MONTHS[M-1]}ban</span></div>
    <div class="pillbar" aria-hidden="true">${counts.map((n,i)=>n?`<i style="width:${n/tot*100}%;background:var(--p${i+1})"></i>`:"").join("")}</div>
    <div class="row" style="margin-top:10px;gap:8px">${PILLARS.map((p,i)=>`<button class="chip" data-act="pf" data-i="${i}" style="${ui.pFilter===i?"box-shadow:inset 0 0 0 1px var(--accent)":""}"><span class="dot" style="background:var(--p${i+1})"></span>${p} · ${counts[i]}</button>`).join("")}${ui.pFilter>=0?`<button class="chip" data-act="pf" data-i="-1">Szűrés törlése</button>`:""}</div>
    ${counts.some(n=>n===0)?`<p class="muted" style="font-size:12px;margin:8px 0 0">Ebben a hónapban még nincs: ${PILLARS.filter((_,i)=>!counts[i]).join(", ")}.</p>`:""}</div>`;
  let body="";
  if(ui.cTab==="naptar"){
    const first=new Date(Y,M-1,1);const start=addDays(first,-((first.getDay()+6)%7));
    let cells=WD.map(w=>`<div class="wd">${w}</div>`).join("");
    for(let i=0;i<42;i++){
      const d=addDays(start,i),k=iso(d);
      const cs=S.content.filter(c=>c.date===k&&show(c)).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
      cells+=`<div class="ccell ${d.getMonth()!==M-1?"out":""} ${k===T?"today":""}" data-k="${k}"><div class="ch"><span class="n num">${d.getDate()}</span><button class="cadd" data-act="newcontent" data-k="${k}" aria-label="Új tartalom erre a napra">+</button></div>${cs.map(postChip).join("")}</div>`;
      if(i===34&&addDays(start,35).getMonth()!==M-1)break;
    }
    body=`<div class="card page"><div class="row between" style="margin-bottom:12px">${monthNav}<div class="row legend"><span><span class="sdot s0"></span> Ötlet</span><span><span class="sdot s1"></span> Kész</span><span><span class="sdot s2"></span> Megjelent</span></div></div><div class="cal ccal">${cells}</div><p class="muted" style="font-size:12px;margin:12px 0 0">Húzd át a kártyát egy másik napra az átütemezéshez. A + jellel új tartalmat tervezhetsz arra a napra.</p>${board(activeBoard)}</div>`;
  }else if(ui.cTab==="lista"){
    const list=items.filter(show);
    body=`<div class="card page"><div style="margin-bottom:6px">${monthNav}</div><div class="list">${list.map(c=>`<div class="li"><span class="num muted" style="width:92px;font-size:12px">${fmtDate(c.date)}${c.time?" "+c.time:""}</span><span class="dot" style="background:var(--p${c.pillar+1})"></span><div class="grow"><button style="all:unset;cursor:pointer" data-act="edit" data-type="content" data-id="${c.id}"><div class="t">${esc(c.title)}</div><div class="s">${c.format} · ${PILLARS[c.pillar]}</div></button></div><button class="chip ${c.status===2?"good":""}" data-act="cstat" data-id="${c.id}" title="Koppints a státusz váltásához">${CSTATUS[c.status]}</button></div>`).join("")||'<div class="empty">Nincs ilyen tartalom ebben a hónapban.</div>'}</div>${board(activeBoard)}</div>`;
  }else{
    body=`<div class="grid g3">${S.ideas.filter(show).map(x=>`<div class="card idea"><div class="row between"><span class="chip"><span class="dot" style="background:var(--p${x.pillar+1})"></span>${PILLARS[x.pillar]}</span><button class="iconbtn" data-act="edit" data-type="idea" data-id="${x.id}" aria-label="Szerkesztés">✎</button></div>
      <div><div class="lab">Hook</div><p class="hook">${esc(x.hook)}</p></div>
      <div><div class="lab">Fő üzenet</div><p>${esc(x.main)}</p></div><div><div class="lab">CTA</div><p>${esc(x.cta)}</p></div>
      <button class="btn small" data-act="plan" data-id="${x.id}" style="align-self:flex-start">Betervezem</button></div>`).join("")}</div>`;
  }
  return head("Tartalom","Tervezz, ne görcsölj",`<button class="btn" data-act="${ui.cTab==="otlet"?"new":"newcontent"}" data-type="idea" data-k="">${ui.cTab==="otlet"?"Új ötlet":"Új tartalom"}</button>`)+`
  <div class="tabs"><button data-act="ctab" data-k="naptar" aria-pressed="${ui.cTab==="naptar"}">Naptár</button><button data-act="ctab" data-k="lista" aria-pressed="${ui.cTab==="lista"}">Lista</button><button data-act="ctab" data-k="otlet" aria-pressed="${ui.cTab==="otlet"}">Ötletbank · Hook, fő üzenet, CTA</button></div>
  ${balance}${body}`;
}
function vMatricak(){
  activeBoard=null;
  const mk=ui.mk;
  const prev=customHTML({type:mk.type,text:mk.text||"Szöveg",ci:mk.color});
  return head("Matricák","Gyűjtemény és készítő")+`
  <div class="grid mkgrid" id="mkgrid">
    <div class="card stack" style="gap:14px"><h3>${mk.editId?"Matrica szerkesztése":"Saját matrica készítése"}</h3>
      <label class="f">Szöveg<input type="text" id="mk-text" data-mk="text" value="${esc(mk.text)}" maxlength="28"></label>
      <div><div class="lab2">Forma</div><div class="tabs">${MKTYPES.map(([k,l])=>`<button data-act="mktype" data-k="${k}" aria-pressed="${mk.type===k}">${l}</button>`).join("")}</div></div>
      <div><div class="lab2">Szín</div><div class="row">${SC().map((c,i)=>`<button class="swatch" data-act="mkcolor" data-i="${i}" aria-pressed="${mk.color===i}" style="background:${c.main}" aria-label="${c.n}" title="${c.n}"></button>`).join("")}</div></div>
      <div class="row"><button class="btn" data-act="mksave">${mk.editId?"Mentés":"Hozzáadás a gyűjteményhez"}</button>${mk.editId?`<button class="btn ghost" data-act="mkcancel">Mégse</button>`:""}</div>
      <div class="upl"><div class="lab2" style="margin:0">Saját kép matricának</div><p class="muted" style="margin:0;font-size:12.5px">Átlátszó hátterű PNG a legjobb, például egy megvásárolt matricacsomagból.</p><label class="btn ghost small" for="mk-file" style="align-self:flex-start;cursor:pointer">Kép feltöltése</label><input type="file" id="mk-file" accept="image/png,image/jpeg,image/webp" hidden></div>
    </div>
    <div class="card mkprev"><div class="eyebrow">Előnézet</div><div class="mkstage" id="mk-prev">${prev}</div></div>
  </div>
  <div class="card stack" id="myquotes" style="gap:12px"><div class="row between"><h3 style="margin:0">Saját idézetgyűjteményed</h3><span class="muted" style="font-size:12px">${(S.myquotes||[]).length} idézet</span></div>
    <p class="muted" style="margin:0;font-size:12.5px">Gyűjtsd ide a mondatokat, amik erőt adnak. Matricaként a lapjaidra teheted őket, és felbukkannak a Ma oldal napi gondolatai között is.</p>
    <form class="mqform" data-form="mq"><label class="f" style="flex:2;min-width:220px">Idézet<textarea id="mq-text" rows="2" maxlength="180" placeholder="Például: Ma is egy lépéssel közelebb.">${esc(ui.mq.t)}</textarea></label><label class="f" style="flex:1;min-width:160px">Kitől? (nem kötelező)<input type="text" id="mq-a" maxlength="40" value="${esc(ui.mq.a)}" placeholder="Például: Anyukám"></label><span class="row" style="align-self:flex-end;gap:6px"><button class="btn">${ui.mq.editId?"Mentés":"Hozzáadás"}</button>${ui.mq.editId?`<button type="button" class="btn ghost" data-act="mqcancel">Mégse</button>`:""}</span></form>
    ${(S.myquotes||[]).length?`<div class="coll">${S.myquotes.map(q=>`<div class="citem"><button class="cbtn" data-act="toToday" data-k="mq:${q.id}" title="Rátesz a mai lapra">${quoteHTML(q.t,null,q.a)}</button><div class="row" style="gap:4px;justify-content:center">${ui.mqdel===q.id?`<button class="chip warn" data-act="mqdel" data-id="${q.id}">Igen, törlöm</button><button class="chip" data-act="mqdelno">Mégse</button>`:`<button class="iconbtn" data-act="mqedit" data-id="${q.id}" aria-label="Szerkesztés">✎</button><button class="iconbtn" data-act="mqdelask" data-id="${q.id}" aria-label="Törlés">×</button>`}</div></div>`).join("")}</div>`:`<div class="empty">Még nincs saját idézeted. Írd be fent az elsőt.</div>`}</div>
  <div class="card"><div class="row between"><h3>Kiérdemelt matricák</h3><span class="muted" style="font-size:12px">${ACH.filter(a=>S.unlocked&&S.unlocked[a.id]).length} / ${ACH.length} megszerezve</span></div><p class="muted" style="margin:0 0 6px;font-size:12.5px">Ezeket nem lehet elkészíteni, csak megszerezni. A lakatos darabokért még dolgozol.</p>
    <div class="coll">${ACH.map(a=>{const got=S.unlocked&&S.unlocked[a.id];return `<div class="citem"><button class="cbtn" data-act="${got?"toToday":"achinfo"}" data-k="a:${a.id}" title="${esc(a.d)}">${achHTML(a,!got)}</button><div class="achd">${got?"Megszerezve: "+fmtDate(got):esc(a.d)}</div>${got?`<button class="chip" data-act="cert" data-id="${a.id}" style="align-self:center">Oklevél</button>`:""}</div>`}).join("")}</div></div>
  ${allKeys().filter(([t])=>t!=="Kiérdemelt"&&t!=="Saját idézetek").map(([t,keys])=>`<div class="card"><div class="row between"><h3>${t==="Saját"?"Saját matricáid":t}</h3><span class="muted" style="font-size:12px">${keys.length} db</span></div>
    ${keys.length?`<div class="coll">${keys.map(k=>{const cid=k.startsWith("c:")?k.slice(2):null;return `<div class="citem"><button class="cbtn" data-act="toToday" data-k="${k}" title="Rátesz a mai lapra">${stInner(k)}</button>${cid?`<div class="row" style="gap:4px;justify-content:center">${ui.cdel===cid?`<button class="chip warn" data-act="cdel" data-id="${cid}">Igen, törlöm</button><button class="chip" data-act="cdelno">Mégse</button>`:`<button class="iconbtn" data-act="cedit" data-id="${cid}" aria-label="Szerkesztés">✎</button><button class="iconbtn" data-act="cdelask" data-id="${cid}" aria-label="Törlés">×</button>`}</div>`:""}</div>`}).join("")}</div>`:`<div class="empty">Még nincs saját matricád. Készíts egyet fent, vagy tölts fel egy képet.</div>`}</div>`).join("")}
  <p class="muted" style="font-size:12.5px;margin:0">Bármelyik matricára koppintva rákerül a mai lapra. A naptár és a tartalomnaptár lapjain a Matricák gombbal teheted fel őket.</p>`;
}

function vCsapat(){
  activeBoard=null;
  const act=S.team.filter(t=>t.active).length;
  return head("Csapat","Akikért felelsz",`<button class="btn" data-act="new" data-type="member">Új csapattag</button>`)+`
  <div class="grid g4">
    <div class="card kpi"><div class="v num">${S.team.length}</div><div class="l">csapattag</div></div>
    <div class="card kpi"><div class="v num">${act} / ${S.team.length}</div><div class="l">aktív ebben a hónapban</div></div>
    <div class="card kpi"><div class="v num">${monthStats(ym(TODAY)).team}</div><div class="l">új belépő a hónapban</div></div>
    <div class="card kpi"><div class="v num">${S.team.filter(t=>t.talk&&diff(t.talk)<-14).length}</div><div class="l">2 hete nem beszéltetek</div></div>
  </div>
  <div class="grid g2">${S.team.map(t=>`<div class="card stack" style="gap:8px"><div class="row between"><div><h3 style="margin:0">${esc(t.name)}</h3><div class="muted" style="font-size:12px">${esc(t.level)} · belépett: ${fmtDate(t.joined)} ${t.joined?parse(t.joined).getFullYear():""}</div></div><span class="row" style="gap:6px"><button class="iconbtn" data-act="msg" data-k="csapattag" data-type="member" data-id="${t.id}" aria-label="Üzenetvázlat" title="Üzenetvázlat">${MSGICON}</button><button class="iconbtn" data-act="edit" data-type="member" data-id="${t.id}" aria-label="Adatlap">✎</button></span></div>
    ${t.goal?`<div><span class="eyebrow">A célja</span><div>${esc(t.goal)}</div></div>`:""}
    <div class="row between"><button class="chip ${t.active?"good":""}" data-act="active" data-id="${t.id}">${t.active?"Aktív ebben a hónapban":"Nem aktív"}</button><span class="row" style="gap:6px"><span class="chip ${t.talk&&diff(t.talk)<-14?"warn":""}">Utolsó beszélgetés: ${t.talk?fmtDate(t.talk):"–"}</span><button class="btn small ghost" data-act="talk" data-id="${t.id}">Ma beszéltünk</button></span></div></div>`).join("")}</div>`;
}

function vSzamok(){
  activeBoard=null;
  const m=ym(TODAY),st=monthStats(m);
  const g=S.goals[m]||(S.goals[m]={szem:{cel:400000,teny:260000},csop:{cel:2500000,teny:1800000},bev:{cel:150000},kap:{cel:20},ugy:{cel:5},tag:{cel:2}});
  const rows=[["szem","Személyes forgalom",g.szem.teny,true,true],["csop","Csoportforgalom",g.csop.teny,true,true],["bev","Bevétel a rendelésekből",st.revenue,false,true],["kap","Új kapcsolatok",st.contacts,false,false],["ugy","Új ügyfelek",st.clients,false,false],["tag","Új csapattagok",st.team,false,false]];
  const months=[];for(let i=5;i>=0;i--){const d=new Date(TODAY.getFullYear(),TODAY.getMonth()-i,1);months.push([ym(d),MONTHS[d.getMonth()].slice(0,3)])}
  const vals=months.map(([k])=>S.orders.filter(o=>o.date.slice(0,7)===k).reduce((a,o)=>a+(+o.amount||0),0));
  const max=Math.max(...vals,1);const stp=[5e3,1e4,2e4,25e3,5e4,1e5,2e5,25e4,5e5,1e6,2e6,5e6].find(x=>x*4>=max)||1e7;const nice=stp*4;
  const W=560,H=200,pl=52,pb=26,pt=10,bw=(W-pl-10)/6;
  let svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Bevétel az elmúlt 6 hónapban">`;
  for(let i=0;i<=4;i++){const v=nice/4*i,y=H-pb-(H-pb-pt)*i/4;svg+=`<line x1="${pl}" x2="${W-6}" y1="${y}" y2="${y}" stroke="var(--soft2)" stroke-dasharray="${i?"3 4":"0"}"/><text x="${pl-8}" y="${y+4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${Math.round(v/1000)}e</text>`}
  vals.forEach((v,i)=>{const h=(H-pb-pt)*v/nice,x=pl+i*bw+bw*.2;svg+=`<rect x="${x}" y="${H-pb-h}" width="${bw*.6}" height="${h}" rx="5" fill="${i===5?"var(--accent)":"var(--gold-300)"}"/><text x="${x+bw*.3}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--muted)">${months[i][1]}.</text>`;if(i===5)svg+=`<text x="${x+bw*.3}" y="${H-pb-h-6}" text-anchor="middle" font-size="13" font-family="Gloock,Georgia,serif" fill="var(--accent)">${Math.round(v/1000)}e</text>`});
  svg+="</svg>";
  return head("Számok",cap(MONTHS[TODAY.getMonth()])+" "+TODAY.getFullYear())+`
  <div class="grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:start" id="numgrid">
    <div class="card"><h3>A hónap céljai</h3><div class="stack" style="gap:14px">${rows.map(([k,l,v,manual,isMoney])=>{const cel=+g[k].cel||0,p=cel?Math.min(100,v/cel*100):0;return `<div class="stack" style="gap:6px">
      <div class="row between"><strong style="font-weight:500">${l}</strong><span class="chip ${manual?"":"good"}">${manual?"Te írod be":"automatikus"}</span></div>
      <div class="row" style="flex-wrap:nowrap;gap:8px"><label class="f" style="flex:1">Cél<input type="number" id="goal-${k}" data-goal="${k}" value="${cel}"></label>
      ${manual?`<label class="f" style="flex:1">Tény<input type="number" id="act-${k}" data-act-in="${k}" value="${v}"></label>`:`<div class="f" style="flex:1;font-size:12px;color:var(--muted)">Tény<div class="num" style="font-size:15px;color:var(--ink);padding:7px 0">${isMoney?money(v):v}</div></div>`}</div>
      <div class="prog ${p>=100?"ok":""}"><i style="width:${p}%"></i></div><div class="muted num" style="font-size:12px">${Math.round(p)}% · ${isMoney?money(Math.max(0,cel-v)):Math.max(0,cel-v)} hiányzik</div></div>`}).join("")}</div></div>
    <div class="card"><h3>Bevétel az elmúlt 6 hónapban</h3>${svg}<p class="muted" style="font-size:12px;margin:6px 0 0">A rendelésekből számolva, ${S.settings.cur}-ban.</p></div>
  </div>${bpSection()}`;
}

function vBeall(){
  activeBoard=null;
  return head("Beállítások","Egyszer beírod, mindenhol ott lesz")+accountCard()+brandCard()+`
  <div class="grid g2">
    <div class="card stack"><h3>Rólad</h3>
      <label class="f">A neved<input type="text" id="set-name" data-set="name" value="${esc(S.settings.name)}"></label>
      <label class="f">Pénznem<input type="text" id="set-cur" data-set="cur" value="${esc(S.settings.cur)}"></label></div>
    <div class="card stack"><h3>Pontrendszer</h3><p class="muted" style="margin:0;font-size:12.5px">Minden cégnél másképp hívják. Írd be, nálad hogy szerepel, és mik a havi céljaid.</p>
      <label class="f">A pont neve a cégednél (pl. BP, PV, CC)<input type="text" id="set-ptname" data-set="ptName" value="${esc(S.settings.ptName||"")}" placeholder="pont"></label>
      <div class="row" style="flex-wrap:nowrap;gap:8px"><label class="f" style="flex:1">Havi személyes cél<input type="number" id="set-ptgoal" data-set="ptGoal" value="${esc(S.settings.ptGoal||"")}"></label><label class="f" style="flex:1">Havi csoportcél<input type="number" id="set-gpgoal" data-set="gpGoal" value="${esc(S.settings.gpGoal||"")}"></label></div>
      <label class="f">A következő szinted neve (nem kötelező)<input type="text" id="set-lvl" data-set="lvlName" value="${esc(S.settings.lvlName||"")}" placeholder="Például: Vezető"></label></div>
    <div class="card stack"><h3>Az 5 napi lépésed</h3><p class="muted" style="margin:0;font-size:12.5px">Ezeket pipálod ki minden nap a Ma oldalon és a naptárban.</p>
      ${S.settings.steps.map((s,i)=>`<label class="f">${i+1}. lépés<input type="text" id="set-step-${i}" data-step="${i}" value="${esc(s)}"></label>`).join("")}</div>
  </div>
  <div class="grid g2">
    <div class="card stack"><h3>Esti kérdéseid</h3><p class="muted" style="margin:0;font-size:12.5px">Ezekkel zárod a napot a Ma oldalon és a napi nézetben.</p>
      ${questions().map((q,i)=>`<label class="f">${i+1}. kérdés<input type="text" id="set-q-${i}" data-qset="${i}" value="${esc(q)}"></label>`).join("")}</div>
    <div class="card stack"><h3>Naptár és térkép</h3>
      <p style="margin:0">Az időpontokhoz helyszínt írhatsz. A <strong>Térkép</strong> megnyitja a Google Térképet, a <strong>Naptárba</strong> pedig a Google Naptárba teszi az időpontot. Ha az iPhone-od naptára a Google-fiókodat mutatja, ott is megjelenik.</p>
      <p class="muted" style="margin:0;font-size:12.5px">Automatikus, kétirányú naptárszinkront és foglalási linket a PolyOS Naptár és Foglalás modulja ad (Bővítések).</p></div>
  </div>
  <div class="card stack"><h3>Üzenetvázlataid</h3><p class="muted" style="margin:0;font-size:12.5px">A {nev} helyére az ember keresztneve, a {termek} helyére a kedvenc terméke, a {sajat} helyére a Te neved kerül.</p>
    <div class="grid g2">${Object.keys(TPL_DEFAULT).map(k=>`<label class="f">${esc(TPL_DEFAULT[k][0])}<textarea id="tpl-${k}" data-tpl="${k}" rows="4">${esc(tpl(k))}</textarea>${S.tpl&&S.tpl[k]!=null?`<button type="button" class="chip" data-act="tplreset" data-k="${k}" style="align-self:flex-start">Eredeti szöveg visszaállítása</button>`:""}</label>`).join("")}</div></div>
  ${periodsCard()}
  <div class="grid g2" style="align-items:start">${remindersCard()}
    ${BR.founder.enabled?`<div class="card stack"><h3>Tagság</h3>${S.settings.founder?`<div class="row" style="gap:18px;flex-wrap:nowrap;align-items:center">${achHTML(FOUNDER)}<div class="stack" style="gap:6px"><b>Alapító tag vagy${S.settings.founderSince?" "+fmtDate(S.settings.founderSince)+" óta":""}.</b><span style="font-size:13px">${esc(BR.founder.perk)}</span><button class="btn small" data-act="cert" data-id="alapito" style="align-self:flex-start">Alapító oklevél</button></div></div>`:`<p style="margin:0">Nem vagy alapító tag.</p>`}
      ${DEMO?`<button class="chip" data-act="foundertoggle" style="align-self:flex-start">Bemutatóhoz: alapító tagság ${S.settings.founder?"kikapcsolása":"bekapcsolása"}</button>`:""}</div>`:""}</div>`;
}

/* ---------- kiérdemelt matricák ---------- */
const MSGICON='<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
function habitCount(h){return Object.keys(h.days||{}).filter(k=>h.days[k]&&k>=h.start&&k<iso(addDays(parse(h.start),h.len))).length}
function monthGoalHit(){const m=ym(TODAY),g=S.goals[m];if(!g)return false;const st=monthStats(m);const act={szem:g.szem&&g.szem.teny,csop:g.csop&&g.csop.teny,bev:st.revenue,kap:st.contacts,ugy:st.clients,tag:st.team};return Object.keys(act).some(k=>g[k]&&+g[k].cel>0&&+act[k]>=+g[k].cel)}
function closedDays(){return Object.values(S.days).filter(d=>d.close&&(d.close.mood!=null||(d.close.a||[]).some(x=>x&&String(x).trim()))).length}
const ACH=[
  {id:"elso-lepes",t:"Első lépés",n:"1",d:"Kipipáltad az első napi lépésed.",test:()=>Object.values(S.days).some(d=>d.steps&&d.steps.some(Boolean))},
  {id:"tokeletes-nap",t:"Tökéletes nap",n:"5/5",d:"Egy nap alatt mind az 5 napi lépés.",test:()=>Object.values(S.days).some(d=>d.steps&&d.steps.filter(Boolean).length===5)},
  {id:"sorozat-7",t:"7 napos sorozat",n:"7",d:"Egy héten át minden nap léptél.",test:()=>streak()>=7},
  {id:"sorozat-30",t:"30 napos sorozat",n:"30",d:"Egy hónapon át minden nap léptél.",test:()=>streak()>=30},
  {id:"kapcsolat-10",t:"10 kapcsolat",n:"10",d:"10 ember a kapcsolatlistádon.",test:()=>S.contacts.length>=10},
  {id:"kapcsolat-50",t:"50 kapcsolat",n:"50",d:"50 ember a kapcsolatlistádon.",test:()=>S.contacts.length>=50},
  {id:"elso-ugyfel",t:"Első ügyfél",n:"1",d:"Megvan az első ügyfeled.",test:()=>S.clients.length>=1},
  {id:"elso-csapattag",t:"Első csapattag",n:"1",d:"Megvan az első csapattagod.",test:()=>S.team.length>=1},
  {id:"csapat-5",t:"5 fős csapat",n:"5",d:"Öt csapattag dolgozik Veled.",test:()=>S.team.length>=5},
  {id:"tartalom-10",t:"10 megjelent tartalom",n:"10",d:"Tíz tartalmad jelent meg.",test:()=>S.content.filter(c=>c.status===2).length>=10},
  {id:"esti-7",t:"7 esti zárás",n:"7",d:"Hét napot zártál le esti kérdésekkel.",test:()=>closedDays()>=7},
  {id:"kihivas",t:"Kihívás teljesítve",n:"30",d:"Végigvittél egy 30 napos kihívást.",test:()=>(S.habits||[]).some(h=>habitCount(h)>=h.len)},
  {id:"pont-100",t:"100-as lendület",n:"100",d:"Egy nap alatt összegyűjtöttél 100 lendületpontot.",test:()=>Object.keys(Object.assign({},S.days,S.pts||{})).some(k=>scoreOf(k).total>=100)},
  {id:"elso-konyv",t:"Első elolvasott könyv",n:"1",d:"Elolvastál egy könyvet a listádról.",test:()=>(S.books||[]).some(b=>b.status==="kesz")},
  {id:"pontcel",t:"Pontcél teljesítve",n:"★",d:"Elérted a periódus személyes pontcélját.",test:()=>+S.settings.ptGoal>0&&bpPeriod().personal>=+S.settings.ptGoal},
  {id:"havi-cel",t:"Elért havi cél",n:"★",d:"Teljesítettél egy havi célt a Számoknál.",test:()=>monthGoalHit()}
];
function achHTML(a,locked){return `<span class="medal${locked?" locked":""}${a.founder?" founder":""}"><span class="m-c"><span class="m-n">${esc(a.n)}</span>${locked?'<span class="m-lock" aria-hidden="true"><svg viewBox="0 0 16 16" width="14" height="14"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span>':""}</span><span class="m-cap">${esc(a.t)}</span></span>`}
let celebQ=[];
function checkAch(silent){
  if(!S.unlocked)S.unlocked={};
  const nw=[];ACH.forEach(a=>{let ok=false;try{ok=!!a.test()}catch(e){}if(ok&&!S.unlocked[a.id]){S.unlocked[a.id]=T;nw.push(a)}});
  if(nw.length){save();if(!silent){celebQ.push(...nw);showCeleb()}}
}
function showCeleb(){
  const el=$("#celeb");if(!celebQ.length){el.innerHTML="";return}
  const a=celebQ[0];
  el.innerHTML=`<div class="modal celebrate"><div class="sheet cbox" role="dialog" aria-label="Új matrica"><div class="eyebrow" style="justify-content:center">Új matricát szereztél</div><div class="cmedal">${achHTML(a)}</div><p class="chand">${esc(a.d)}</p><div class="row" style="justify-content:center"><button class="btn" data-act="celgo">Rárakom a mai lapra</button><button class="btn ghost" data-act="cert" data-id="${a.id}">Oklevél</button><button class="btn ghost" data-act="celok">Köszönöm</button></div></div></div>`;
}
function crownPop(){
  const d=document.createElement("div");d.className="crownpop";d.innerHTML=`${TH.svg(ICONS.crown).replace(/width="\d+" height="\d+"/,'width="72" height="62"')}<span>Mind az 5 megvan!</span>`;
  document.body.appendChild(d);setTimeout(()=>d.remove(),2400);
}

/* ---------- üzenetvázlatok ---------- */
const TPL_DEFAULT={
  utankovetes:["Utánkövetés","Szia {nev}! Eszembe jutottál, és kíváncsi vagyok, hogy vagy. Volt időd átgondolni, amiről beszéltünk? Ha kérdésed van, szívesen segítek. Ölel: {sajat}"],
  bemutato:["Bemutató egyeztetése","Szia {nev}! Nagyon örültem a beszélgetésünknek. Mikor lenne jó Neked egy 20 perces online találkozó? Megmutatom, hogyan dolgozom, tukmálás nélkül, aztán Te döntesz. {sajat}"],
  ujrarendeles:["Újrarendelés","Szia {nev}! Arra gondoltam, hogy a kedvenceid ({termek}) mostanra fogyhatnak el. Összekészítsem Neked a következőt? Ha kíváncsi vagy egy újdonságra is, szólj, és mutatok. {sajat}"],
  szulinap:["Születésnap","Boldog születésnapot, {nev}! Nagyon sok szeretettel gondolok Rád ma. Legyen olyan éved, amilyet megálmodtál. {sajat}"],
  csapattag:["Csapattag","Szia {nev}! Rég beszéltünk, hogy haladsz? Van a héten 15 perced egy rövid hívásra? Szívesen segítek a következő lépésben. {sajat}"],
  udvozles:["Üdvözlés a csapatban","Szia {nev}! Üdv a csapatban, nagyon örülök Neked! Holnap küldöm az első lépéseket. Ha bármi kérdésed van, írj bátran. {sajat}"]
};
const tpl=k=>(S.tpl&&S.tpl[k]!=null?S.tpl[k]:TPL_DEFAULT[k][1]);
const firstName=n=>{const p=String(n||"").trim().split(/\s+/);return p.length>1?p[p.length-1]:p[0]||""};
function fillTpl(k,v){return tpl(k).replace(/\{nev\}/g,v.nev||"").replace(/\{termek\}/g,v.termek||"a kedvenc termékeid").replace(/\{sajat\}/g,S.settings.name||"")}
function openMsg(k,v,done){
  $("#layer").innerHTML=`<div class="modal" data-act="close"><div class="sheet" role="dialog" aria-label="Üzenet"><div class="row between"><div><div class="eyebrow">Üzenetvázlat</div><h2>${esc(TPL_DEFAULT[k][0])}${v.full?": "+esc(v.full):""}</h2></div><button type="button" class="iconbtn" data-act="close" aria-label="Bezárás">×</button></div>
  <label class="f">Igazítsd a saját szavaidra, aztán másold be Messengerbe vagy SMS-be.<textarea id="msgtext" rows="6">${esc(fillTpl(k,v))}</textarea></label>
  <div class="row between"><span class="muted" style="font-size:12px">A sablonokat a Beállításokban írhatod át.</span><span class="row"><button class="btn" data-act="msgcopy">Másolás</button>${done?`<button class="btn ghost" data-act="${done.act}" data-id="${done.id}">${esc(done.label)}</button>`:""}</span></div></div></div>`;
}

/* ---------- következő lépés ---------- */
function suggestions(){
  const out=[];
  S.contacts.filter(c=>c.nextDate&&c.nextDate<=T).sort((a,b)=>a.nextDate.localeCompare(b.nextDate)).forEach(c=>{
    const late=-diff(c.nextDate);
    out.push({id:"c"+c.id,eyebrow:"Utánkövetés",title:`Keresd meg ${c.name} kapcsolatodat.`,sub:`${c.next||"Következő lépés"} · ${late?late+" napja esedékes":"ma esedékes"}`,
      msg:{k:c.stage>=1&&c.stage<2?"bemutato":"utankovetes",v:{nev:firstName(c.name),full:c.name},done:{act:"cdone",id:c.id,label:"Megvolt"}},done:{act:"cdone",id:c.id,label:"Megvolt"}});
  });
  S.clients.filter(c=>reorderDue(c)<=0).forEach(c=>out.push({id:"r"+c.id,eyebrow:"Újrarendelés",title:`${c.name} kedvencei mostanra fogyhatnak el.`,sub:`${c.fav} · ${-reorderDue(c)?(-reorderDue(c))+" napja esedékes":"ma esedékes"}`,
    msg:{k:"ujrarendeles",v:{nev:firstName(c.name),full:c.name,termek:c.fav}},done:{act:"order",id:c.id,label:"Rendelés rögzítése"}}));
  S.clients.forEach(c=>{if(!c.bday)return;for(let i=0;i<4;i++){if(iso(addDays(TODAY,i)).slice(5)===c.bday){out.push({id:"b"+c.id,eyebrow:"Születésnap",title:i?`${c.name} ${i} nap múlva ünnepel.`:`Ma van ${c.name} születésnapja.`,sub:"Egy kedves üzenet többet ér minden akciónál.",msg:{k:"szulinap",v:{nev:firstName(c.name),full:c.name}}});break}}});
  S.team.filter(t=>t.talk&&diff(t.talk)<-14).forEach(t=>out.push({id:"t"+t.id,eyebrow:"Csapat",title:`${-diff(t.talk)} napja nem beszéltél ${t.name} csapattagoddal.`,sub:t.goal?"A célja: "+t.goal:"Egy rövid hívás sokat jelent.",msg:{k:"csapattag",v:{nev:firstName(t.name),full:t.name},done:{act:"talk",id:t.id,label:"Ma beszéltünk"}},done:{act:"talk",id:t.id,label:"Ma beszéltünk"}}));
  const m=mondayOf(T),wk=[0,1,2,3,4,5,6].map(i=>iso(addDays(m,i)));
  if(!S.content.some(c=>wk.includes(c.date)&&c.date>=T)){out.push({id:"content",eyebrow:"Tartalom",title:"Erre a hétre még nincs betervezett tartalmad.",sub:"Válassz egy ötletet az Ötletbankból, és tedd be a naptárba.",go:{label:"Tartalomnaptár",href:"tartalom"}})}
  if(new Date().getHours()>=17&&!(S.days[T]&&S.days[T].close&&S.days[T].close.mood!=null))out.push({id:"close",eyebrow:"Esti zárás",title:"Zárd le a napot két perc alatt.",sub:"Három kérdés és a hangulatod: így látod, mennyit haladtál.",anchor:"estizaras"});
  const cp=curPeriod();if(cp){const c=cdParts(cp.end);if(c&&c.d<3){const b=bpPeriod(cp),pg=+S.settings.ptGoal||0,miss=Math.max(0,pg-b.personal);out.unshift({id:"per-"+cp.id,eyebrow:"Periódus zárása",title:`Még ${cdText(cp.end)} a zárásig.`,sub:miss?`A személyes célodhoz még ${nfmt(miss)} ${ptName()} hiányzik.`:"A személyes célod megvan. Segíts a csapatodnak is!",go:{label:"Napi állás",href:"szamok"}})}}
  return out.filter(x=>!ui.skip.includes(x.id));
}
function nextCard(){
  const list=suggestions();
  if(!list.length)return `<div class="card nextcard calm"><div class="eyebrow">A következő lépésed</div><div class="nc-title">Mára mindent elintéztél.</div><div class="nc-sub">Pihenj, vagy tervezd meg a holnapot a naptárban.</div></div>`;
  const s=list[0];
  return `<div class="card nextcard"><div class="row between"><div class="eyebrow">A következő lépésed · ${esc(s.eyebrow)}</div><span class="nc-count">${list.length>1?"még "+(list.length-1)+" javaslat":""}</span></div>
  <div class="nc-title">${esc(s.title)}</div><div class="nc-sub">${esc(s.sub)}</div>
  <div class="row nc-acts">${s.msg?`<button class="btn nc-main" data-act="ncmsg">Üzenet megírása</button>`:""}${s.go?`<a class="btn nc-main" href="#${s.go.href}">${esc(s.go.label)}</a>`:""}${s.anchor?`<button class="btn nc-main" data-act="ncanchor" data-k="${s.anchor}">Lezárom a napot</button>`:""}${s.done?`<button class="btn nc-ghost" data-act="${s.done.act}" data-id="${s.done.id}">${esc(s.done.label)}</button>`:""}<button class="nc-skip" data-act="ncskip" data-k="${s.id}">Kihagyom most</button></div></div>`;
}

/* ---------- szokások ---------- */
const HABIT_PRESETS=["30 nap, 30 sztori","Napi 1 új kapcsolat","Reggeli 10 perc tervezés","Napi 15 perc önfejlesztés","Napi 2 liter víz","Esti hála: 3 dolog"];
function habitGrid(h){
  let cells="";
  for(let i=0;i<h.len;i++){const d=addDays(parse(h.start),i),k=iso(d),on=!!(h.days||{})[k],fut=k>T;
    cells+=`<button class="hcell${on?" on":""}${k===T?" today":""}" data-act="habit" data-id="${h.id}" data-k="${k}" ${fut?"disabled":""} aria-pressed="${on}" aria-label="${i+1}. nap, ${fmtDate(k)}"><span class="hi">${i+1}</span><span class="hd">${d.getDate()}.</span></button>`}
  return `<div class="hgrid">${cells}</div>`;
}
function vSzokasok(){
  activeBoard="szokasok";
  const hs=S.habits||[];
  return head("Szokások","30 napos kihívások")+`
  <div class="card stack" style="gap:12px"><h3 style="margin:0">Új kihívás indítása</h3>
    <form class="row" data-form="habit" style="flex-wrap:nowrap"><input type="text" id="habit-name" placeholder="Például: napi 3 új kapcsolat" aria-label="A kihívás neve"><button class="btn">Indítás ma</button></form>
    <div class="row" style="gap:6px"><span class="muted" style="font-size:12px">Kész kihívások:</span>${HABIT_PRESETS.map(p=>`<button class="chip" data-act="habitpreset" data-k="${esc(p)}">${esc(p)}</button>`).join("")}</div></div>
  <div class="page stack" style="gap:18px">${hs.map(h=>{const n=habitCount(h),dayNo=Math.min(h.len,Math.max(1,diff(h.start)*-1+1));return `<div class="card stack" style="gap:12px">
    <div class="row between"><div><h3 style="margin:0">${esc(h.name)}</h3><div class="muted" style="font-size:12.5px">Indult: ${fmtDate(h.start)} · ma a ${dayNo}. nap</div></div>
    <div class="row">${n>=h.len?'<span class="chip good">Teljesítve</span>':""}<span class="hcount"><b class="num">${n}</b> / ${h.len} nap</span>${ui.hdel===h.id?`<button class="chip warn" data-act="habitdel" data-id="${h.id}">Igen, törlöm</button><button class="chip" data-act="habitdelno">Mégse</button>`:`<button class="iconbtn" data-act="habitdelask" data-id="${h.id}" aria-label="Kihívás törlése">×</button>`}</div></div>
    <div class="prog ${n>=h.len?"ok":""}"><i style="width:${n/h.len*100}%"></i></div>${habitGrid(h)}</div>`}).join("")||'<div class="card empty">Még nincs kihívásod. Indíts egyet fent.</div>'}${board(activeBoard)}</div>`;
}
function habitsToday(){
  return habitsCardInner()}
function habitsCardInner(){
  const hs=(S.habits||[]).filter(h=>T>=h.start&&T<iso(addDays(parse(h.start),h.len)));
  return `<div class="card"><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">Kihívásaid ma</h3><a class="btn ghost small" href="#szokasok">Szokások</a></div>
  ${hs.length?`<div class="list">${hs.map(h=>{const on=!!(h.days||{})[T];return `<div class="li"><button class="cbx" data-act="habit" data-id="${h.id}" data-k="${T}" aria-pressed="${on}" aria-label="Kész">${on?"✓":""}</button><div class="grow"><div class="t">${esc(h.name)}</div><div class="s">${habitCount(h)} / ${h.len} nap</div></div></div>`}).join("")}</div>`:'<div class="empty">Nincs futó kihívásod. Indíts egyet a Szokások oldalon.</div>'}${readingLine()}</div>`;
}

/* ---------- esti zárás ---------- */
const MOODS=["Fáradt","Nyugodt","Jó","Lelkes","Csúcs"];
const Q_DEFAULT=["Kinek segítettem ma?","Mi vitt ma közelebb a célomhoz?","Mire vagyok ma büszke?"];
const questions=()=>S.settings.questions||Q_DEFAULT;
function closeHTML(k,card){
  const dd=day(k),c=dd.close||{};
  const inner=`<div class="stack" style="gap:10px">${questions().map((q,i)=>`<label class="f">${esc(q)}<input type="text" id="close-${k}-${i}" data-close="${k}" data-q="${i}" value="${esc((c.a||[])[i]||"")}"></label>`).join("")}
    <div><div class="lab2">Milyen volt a napod?</div><div class="moods">${MOODS.map((m,i)=>`<button class="mood m${i}" data-act="mood" data-day="${k}" data-i="${i}" aria-pressed="${c.mood===i}">${m}</button>`).join("")}</div></div></div>`;
  return card?`<div class="card" id="estizaras"><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">Esti zárás</h3>${c.mood!=null?'<span class="chip good">Lezártad a napot</span>':""}</div>${inner}</div>`:`<div id="estizaras"><div class="eyebrow" style="margin-bottom:8px">Esti zárás</div>${inner}</div>`;
}

/* ---------- naptár és térkép ---------- */
const enc=encodeURIComponent;
function apptLinks(k,h,v,loc){return `${loc?`<a class="alink" href="${mapURL(loc)}" target="_blank" rel="noopener">Térkép</a>`:""}<a class="alink" href="${gcalURL(k,h,v,loc)}" target="_blank" rel="noopener">Naptárba</a>${PX.canPush("event")?`<button type="button" class="alink" data-act="pxpush" data-kind="event" data-day="${k}" data-h="${h}">${((S.days[k]||{}).px||{})[h]?"PolyOS ✓":"PolyOS"}</button>`:""}`}
function gcalURL(k,h,t,loc){const d=k.replace(/-/g,"");return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(t)}&dates=${d}T${pad(h)}0000/${d}T${pad(+h+1)}0000&ctz=Europe/Budapest${loc?"&location="+enc(loc):""}&details=${enc(BR.productName)}`}
const mapURL=loc=>`https://www.google.com/maps/search/?api=1&query=${enc(loc)}`;
const locOf=(k,h)=>((S.days[k]||{}).locs||{})[h]||"";

/* ---------- bónuszpontok: napi állás periódusokra (márkafüggetlen) ---------- */
const ptName=()=>(S.settings.ptName||"pont").trim()||"pont";
const nfmt=n=>Math.round(+n||0).toLocaleString("hu-HU");
const dayDiff=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
function periods(){return (S.periods||[]).slice().sort((a,b)=>a.start.localeCompare(b.start))}
function curPeriod(k){k=k||T;return periods().find(p=>p.start<=k&&k<=p.end)||null}
function periodMark(k){for(const p of periods()){if(p.start===k)return "start";if(p.end===k)return "end"}return null}
function cdParts(end){const e=parse(end);e.setHours(23,59,59,999);const ms=e-new Date();if(ms<=0)return null;return {d:Math.floor(ms/864e5),h:Math.floor(ms%864e5/36e5),m:Math.floor(ms%36e5/6e4)}}
function cdText(end){const c=cdParts(end);return c?`${c.d} nap ${c.h} óra ${c.m} perc`:"Lezárult"}
function bpPeriod(p){
  p=p||curPeriod();if(!p)return {daily:[],personal:0,group:0,left:0,n:1,p:null};
  const bp=S.bp||{},n=dayDiff(p.start,p.end)+1,daily=[];let cum=0,lastGp=0;
  for(let i=0;i<n;i++){const k=iso(addDays(parse(p.start),i));if(k>T)break;
    const ord=S.orders.filter(o=>o.date===k).reduce((a,o)=>a+(+o.points||0),0);
    const man=+(bp[k]&&bp[k].sp)||0;cum+=ord+man;const g=bp[k]&&bp[k].gp!=null&&bp[k].gp!==""?+bp[k].gp:null;if(g!=null)lastGp=g;
    daily.push({k,day:ord+man,cum,gp:g,gpCum:lastGp})}
  const left=T>=p.start&&T<=p.end?dayDiff(T,p.end)+1:0;
  return {daily,personal:cum,group:lastGp,left,n,p};
}
function needLine(have,goal,left){if(!goal)return"";const miss=Math.max(0,goal-have);if(!miss)return"Megvan a cél!";if(!left)return`${nfmt(miss)} hiányzott.`;return`Még ${nfmt(miss)}, naponta kb. ${nfmt(Math.ceil(miss/left))}.`}
function periodHead(p){return p?`${esc(p.name)} · ${fmtDate(p.start)} – ${fmtDate(p.end)}`:"Nincs aktív periódus"}
function countdownHTML(p,big){if(!p)return `<span class="muted">Adj meg periódust a Beállításokban.</span>`;const c=cdParts(p.end),urgent=c&&c.d<3;return `<span class="cd${big?" big":""}${urgent?" urgent":""}" data-countdown="${p.end}">${cdText(p.end)}</span>`}
function bpStrip(){
  const b=bpPeriod(),p=b.p,pg=+S.settings.ptGoal||0,gg=+S.settings.gpGoal||0,pn=ptName();
  const pp=pg?Math.min(100,b.personal/pg*100):0,gp=gg?Math.min(100,b.group/gg*100):0;
  return `<div class="card bpstrip"><div class="row between" style="gap:12px"><div class="eyebrow">Napi állás · ${periodHead(p)}</div><a class="btn ghost small" href="#szamok" data-act="toallas">Mai állás rögzítése</a></div>
  <div class="bpgrid"><div><div class="bpl">Személyes ${esc(pn)}</div><div class="bpv"><span class="num">${nfmt(b.personal)}</span>${pg?` <small>/ ${nfmt(pg)}</small>`:""}</div><div class="prog ${pp>=100?"ok":""}"><i style="width:${pp}%"></i></div><div class="bps">${needLine(b.personal,pg,b.left)}</div></div>
  <div><div class="bpl">Csoport ${esc(pn)}</div><div class="bpv"><span class="num">${nfmt(b.group)}</span>${gg?` <small>/ ${nfmt(gg)}</small>`:""}</div><div class="prog ${gp>=100?"ok":""}"><i style="width:${gp}%"></i></div><div class="bps">${needLine(b.group,gg,b.left)}</div></div>
  <div><div class="bpl">Zárásig</div><div class="bpv cdwrap">${countdownHTML(p)}</div><div class="bps">${S.settings.lvlName?`Cél: ${esc(S.settings.lvlName)}`:""}</div></div></div></div>`;
}
function bpSection(){
  const b=bpPeriod(),p=b.p,pg=+S.settings.ptGoal||0,gg=+S.settings.gpGoal||0,pn=ptName(),today=(S.bp||{})[T]||{};
  const W=560,H=210,pl=46,pb=24,pt=12,max=Math.max(pg,b.personal,1)*1.08,N=Math.max(2,b.n);
  const x=i=>pl+i/(N-1)*(W-pl-10),y=v=>H-pb-(H-pb-pt)*v/max;
  let svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Személyes ${esc(pn)} a periódusban, a cél vonalával">`;
  for(let i=0;i<=4;i++){const v=max/4*i;svg+=`<line x1="${pl}" x2="${W-6}" y1="${y(v)}" y2="${y(v)}" stroke="var(--soft2)" stroke-dasharray="${i?"3 4":"0"}"/><text x="${pl-8}" y="${y(v)+4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${nfmt(v)}</text>`}
  if(p){const ticks=[0,Math.round((N-1)/3),Math.round((N-1)*2/3),N-1];ticks.forEach(i=>svg+=`<text x="${x(i)}" y="${H-6}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${fmtDate(iso(addDays(parse(p.start),i)))}</text>`)}
  if(pg)svg+=`<line x1="${x(0)}" y1="${y(0)}" x2="${x(N-1)}" y2="${y(pg)}" stroke="var(--gold-500)" stroke-width="2" stroke-dasharray="6 5"/><text x="${x(N-1)-4}" y="${y(pg)-8}" text-anchor="end" font-size="11" fill="var(--gold-500)">cél ${nfmt(pg)}</text>`;
  if(b.daily.length){const pts=b.daily.map((d,i)=>`${x(i)},${y(d.cum)}`).join(" ");const last=b.daily[b.daily.length-1],li=b.daily.length-1;
    svg+=`<polygon points="${x(0)},${y(0)} ${pts} ${x(li)},${y(0)}" fill="var(--accent)" opacity=".08"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round"/><circle cx="${x(li)}" cy="${y(last.cum)}" r="4.5" fill="var(--accent)"/><text x="${x(li)}" y="${y(last.cum)-10}" text-anchor="middle" font-size="12.5" font-family="Gloock,Georgia,serif" fill="var(--accent)">${nfmt(last.cum)}</text>`}
  svg+="</svg>";
  const rows=b.daily.slice(-10).reverse();
  return `<div class="grid allas" id="allas">
    <div class="card stack" style="gap:12px"><div><div class="eyebrow">Napi állás</div><h3 style="margin:4px 0 0">${p?esc(p.name):"Mai állás rögzítése"}</h3><div class="muted" style="font-size:12.5px">${p?`Kezdet: ${fmtDate(p.start)} · Zárás: ${fmtDate(p.end)} · ${b.n} napos`:""}</div></div>
      <div class="cdbox"><div class="bpl">Visszaszámlálás a zárásig</div>${countdownHTML(p,true)}</div>
      <p class="muted" style="margin:0;font-size:12.5px">A rendelésekhez írt ${esc(pn)} magától beszámít. Ide azt írd, ami rendelés nélkül jött, és a csoportod mai összesített állását a céges felületről.</p>
      <label class="f">Mai személyes ${esc(pn)} (rendelésen felül)<input type="number" id="bp-sp" data-bp="sp" value="${today.sp!=null?esc(today.sp):""}" placeholder="0"></label>
      <label class="f">Csoport ${esc(pn)} mai állása (összesen)<input type="number" id="bp-gp" data-bp="gp" value="${today.gp!=null?esc(today.gp):""}" placeholder="${nfmt(b.group)}"></label>
      <div class="bpgrid two"><div><div class="bpl">Személyes</div><div class="bpv"><span class="num">${nfmt(b.personal)}</span>${pg?` <small>/ ${nfmt(pg)}</small>`:""}</div><div class="bps">${needLine(b.personal,pg,b.left)}</div></div><div><div class="bpl">Csoport</div><div class="bpv"><span class="num">${nfmt(b.group)}</span>${gg?` <small>/ ${nfmt(gg)}</small>`:""}</div><div class="bps">${needLine(b.group,gg,b.left)}</div></div></div>
      <a class="chip" href="#beallitasok" style="align-self:flex-start;text-decoration:none">Periódusok, célok, a pont neve</a></div>
    <div class="card stack" style="gap:10px"><h3 style="margin:0">Személyes ${esc(pn)} a periódusban</h3>${svg}
      <div class="tablewrap"><table><thead><tr><th>Nap</th><th style="text-align:right">Mai ${esc(pn)}</th><th style="text-align:right">Összesen</th><th style="text-align:right">Csoport állás</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="num">${fmtDate(r.k)}</td><td class="num" style="text-align:right">${r.day?"+"+nfmt(r.day):"–"}</td><td class="num" style="text-align:right">${nfmt(r.cum)}</td><td class="num" style="text-align:right">${r.gp!=null?nfmt(r.gp):`<span class="muted">${r.gpCum?nfmt(r.gpCum):"–"}</span>`}</td></tr>`).join("")||'<tr><td colspan="4" class="empty">A periódus még nem kezdődött el.</td></tr>'}</tbody></table></div></div>
  </div>`;
}
function periodsCard(){
  const ps=periods();
  return `<div class="card stack" id="periodusok"><h3>Periódusok</h3><p class="muted" style="margin:0;font-size:12.5px">Nem kell a hónaphoz igazodnia. Add meg, nálad mikor kezdődik és mikor zárul egy időszak (katalógus, kampány, elszámolás). A napi állás és a visszaszámlálás ehhez igazodik, a naptárban pedig jelölve lesz a kezdet és a zárás.</p>
  ${ps.map(p=>`<div class="prow${curPeriod()&&curPeriod().id===p.id?" cur":""}"><label class="f" style="flex:1.4;min-width:140px">Név<input type="text" id="pn-${p.id}" data-per="${p.id}" data-pf="name" value="${esc(p.name)}"></label><label class="f" style="flex:1;min-width:130px">Kezdet<input type="date" id="ps-${p.id}" data-per="${p.id}" data-pf="start" value="${p.start}"></label><label class="f" style="flex:1;min-width:130px">Zárás<input type="date" id="pe-${p.id}" data-per="${p.id}" data-pf="end" value="${p.end}"></label><button class="iconbtn" data-act="perdel" data-id="${p.id}" aria-label="Periódus törlése" style="align-self:flex-end;margin-bottom:6px">×</button></div>`).join("")||'<div class="empty">Még nincs periódus.</div>'}
  <div class="row"><button class="btn small" data-act="peradd">Következő periódus hozzáadása</button><span class="muted" style="font-size:12px">Ugyanolyan hosszú lesz, mint az előző, és az előző zárása utáni napon indul.</span></div></div>`;
}
setInterval(()=>document.querySelectorAll("[data-countdown]").forEach(el=>{el.textContent=cdText(el.dataset.countdown)}),30000);

/* ---------- oklevél és alapító tagság ---------- */
const FOUNDER={id:"alapito",t:"Alapító tag",n:"A",d:`A ${BR.productName} első tagjai között vagy.`,founder:true,test:()=>BR.founder.enabled&&!!S.settings.founder};
ACH.unshift(FOUNDER);
async function drawCert(a){
  const P=TH.palette(),F=TH.canvasFont;
  try{await Promise.all([F("display",60),F("script",60),F("italic",30),F("body",26)].map(f=>document.fonts.load(f)))}catch(e){}
  const W=2000,H=1414,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  x.fillStyle=P.paper;x.fillRect(0,0,W,H);
  x.strokeStyle=P.accent;x.lineWidth=14;x.strokeRect(48,48,W-96,H-96);
  x.strokeStyle=P.hl500;x.lineWidth=3;x.strokeRect(80,80,W-160,H-160);
  // logó: a márka saját logója (data-URL), különben a semleges jel — idegen domainről nem rajzolunk (a vászon „szennyeződne")
  const src=BR.logo&&/^data:image\//.test(BR.logo)?BR.logo:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(TH.svg(MARK_SVG));
  const img=new Image();await new Promise(r=>{img.onload=r;img.onerror=r;img.src=src});
  try{if(img.naturalWidth){const sc=Math.min(240/img.naturalWidth,184/img.naturalHeight);const w=img.naturalWidth*sc,h=img.naturalHeight*sc;x.drawImage(img,W/2-w/2,130+(184-h)/2,w,h)}}catch(e){}
  x.textAlign="center";x.fillStyle=P.ink;
  x.font=F("display",120);x.fillText(a.founder?"ALAPÍTÓ TAG":"OKLEVÉL",W/2,440);
  x.font=F("body",34);x.fillStyle=P.muted;x.fillText("Ezt az oklevelet",W/2,540);
  x.font=F("script",128);x.fillStyle=P.accent;x.fillText(S.settings.name||"",W/2,690);
  x.strokeStyle=P.hl500;x.lineWidth=2;x.beginPath();x.moveTo(W/2-420,720);x.lineTo(W/2+420,720);x.stroke();
  x.font=F("body",34);x.fillStyle=P.muted;x.fillText(a.founder?`kapja, mint a ${BR.productName} alapító tagja.`:"kapja elismerésül:",W/2,800);
  if(!a.founder){x.font=F("display",76);x.fillStyle=P.ink;x.fillText(a.t,W/2,910)}
  x.font=F("italic",36);x.fillStyle=P.ink;x.fillText(a.d,W/2,a.founder?900:990);
  const got=a.founder?(S.settings.founderSince||T):(S.unlocked&&S.unlocked[a.id])||T;const gd=parse(got);
  x.textAlign="left";x.font=F("body",30);x.fillStyle=P.muted;x.fillText("Kelt: "+gd.getFullYear()+". "+MONTHS[gd.getMonth()]+" "+gd.getDate()+".",220,1180);
  x.textAlign="center";x.font=F("script",74);x.fillStyle=P.accent;x.fillText(BR.ownerName||BR.productName,W-520,1150);
  x.strokeStyle=P.ink;x.lineWidth=2;x.beginPath();x.moveTo(W-760,1175);x.lineTo(W-280,1175);x.stroke();
  if(BR.ownerName){x.font=F("body",26);x.fillStyle=P.muted;x.fillText(BR.productName,W-520,1218)}
  return c;
}
async function openCert(id){
  const a=id==="alapito"?FOUNDER:ACH.find(x=>x.id===id);if(!a)return;
  $("#layer").innerHTML=`<div class="modal" data-act="close"><div class="sheet certsheet" role="dialog" aria-label="Oklevél"><div class="row between"><div><div class="eyebrow">Oklevél</div><h2>${esc(a.t)}</h2></div><button type="button" class="iconbtn" data-act="close" aria-label="Bezárás">×</button></div><div class="certprev" id="certprev"><span class="muted">Készül az oklevél…</span></div><div class="row between"><span class="muted" style="font-size:12px" id="certnote">Kinyomtathatod, vagy megoszthatod a közösségi oldaladon.</span><button class="btn" id="certdl" data-act="certdl" data-id="${a.id}" hidden>Letöltés (PNG)</button></div></div></div>`;
  const c=await drawCert(a);const url=c.toDataURL("image/png");const pv=$("#certprev");if(!pv)return;pv.innerHTML=`<img src="${url}" alt="Oklevél: ${esc(a.t)}">`;
  window.__cert=c;const btn=$("#certdl");if(btn)btn.hidden=false;
}
function downloadCert(id){
  const c=window.__cert;if(!c)return;
  c.toBlob(blob=>{if(!blob){toast("Nem sikerült letölteni. Próbáld újra.");return}const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="oklevel-"+id+".png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast("Oklevél letöltve.")},"image/png");
}

/* ---------- emlékeztetők (beállítás) ---------- */
const REMINDERS=[["reggel","Reggeli összefoglaló","Minden reggel: mai időpontok, kit keress meg, mai lépések."],["esti","Esti zárás","Este emlékeztet, hogy zárd le a napot."],["utan","Utánkövetés","Amikor valakit esedékes megkeresni."],["zaras","Periódus zárása","3 nappal és 1 nappal a zárás előtt, a hiányzó pontokkal."],["szulinap","Születésnap","Reggel, ha egy ügyfeled ünnepel."]];
function remindersCard(){const r=S.reminders||(S.reminders={reggel:true,esti:true,utan:true,zaras:true,szulinap:true,reggelIdo:"07:30",estiIdo:"20:30",push:true,email:false});
  return `<div class="card stack"><h3>Emlékeztetők</h3><p class="muted" style="margin:0;font-size:12.5px">A beállításaidat elmentjük. Az értesítések kiküldése (telefonos értesítés és e-mail) a következő fejlesztési lépésben indul.</p>
  <div class="list">${REMINDERS.map(([k,l,d])=>`<div class="li"><button class="cbx" data-act="rem" data-k="${k}" aria-pressed="${!!r[k]}" aria-label="${esc(l)}">${r[k]?"✓":""}</button><div class="grow"><div class="t">${esc(l)}</div><div class="s">${esc(d)}</div></div>${k==="reggel"||k==="esti"?`<input type="time" class="remtime" id="rem-${k}" data-remt="${k}Ido" value="${r[k+"Ido"]}" aria-label="${esc(l)} időpontja">`:""}</div>`).join("")}</div>
  <div class="row" style="gap:6px"><span class="lab2" style="margin:0">Hogyan?</span><button class="mood" data-act="rem" data-k="push" aria-pressed="${!!r.push}">Értesítés a telefonra</button><button class="mood" data-act="rem" data-k="email" aria-pressed="${!!r.email}">E-mail</button></div></div>`}

/* ---------- olvasás, könyvajánló ---------- */
const BOOK_RECS_DEFAULT=[["Atomi szokások","James Clear","Apró változások, amelyekből nagy eredmény lesz."],["Hogyan szerezzünk barátokat és befolyásoljuk az embereket","Dale Carnegie","Kapcsolatépítés tukmálás nélkül."],["Gondolkodj és gazdagodj","Napoleon Hill","A célok és a kitartás klasszikusa."],["Gazdag papa, szegény papa","Robert T. Kiyosaki","Pénzügyi gondolkodás vállalkozóknak."],["A kiemelkedően sikeres emberek 7 szokása","Stephen R. Covey","Önvezetés és prioritások."],["Szemléletváltás","Carol S. Dweck","A fejlődési szemlélet ereje."]];
const BOOK_RECS=BR.books.length?BR.books:BOOK_RECS_DEFAULT;
const BSTAT=[["olvasom","Most olvasom"],["szeretnem","Szeretném elolvasni"],["kesz","Elolvastam"]];
function coverHTML(b){let h=0;for(const ch of b.title)h=(h*31+ch.charCodeAt(0))>>>0;const P=TH.palette(),cs=[P.accent,P.ink,P.hl500,P.accentDeep,P.grayDark,P.hl300],c=cs[h%6];const fg=TH.util.readableOn(c,P.ink,P.paper);return `<span class="bcover" style="background:${c};color:${fg}" aria-hidden="true"><span>${esc(b.title)}</span></span>`}
function vOlvasas(){
  activeBoard="olvasas";
  const bs=S.books||[],by=s=>bs.filter(b=>b.status===s);
  const reading=by("olvasom"),wish=by("szeretnem"),done=by("kesz").sort((a,b)=>(b.finished||"").localeCompare(a.finished||""));
  const has=t=>bs.some(b=>b.title.toLowerCase()===t.toLowerCase());
  return head("Olvasás","Mit olvasol?")+`
  <div class="card stack" style="gap:10px"><h3 style="margin:0">Könyv hozzáadása</h3>
    <form class="bform" data-form="book"><label class="f" style="flex:2;min-width:200px">Cím<input type="text" id="book-title" placeholder="A könyv címe"></label><label class="f" style="flex:1;min-width:150px">Szerző<input type="text" id="book-author" placeholder="Szerző"></label><label class="f" style="min-width:170px">Hová?<select id="book-status">${BSTAT.map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select></label><button class="btn" style="align-self:flex-end">Hozzáadás</button></form></div>
  <div class="page stack" style="gap:18px">
  <div class="card stack" style="gap:14px"><div class="row between"><h3 style="margin:0">Most olvasom</h3><span class="muted" style="font-size:12px">${reading.length} könyv</span></div>
    ${reading.map(b=>`<div class="bnow">${coverHTML(b)}<div class="stack" style="gap:8px;min-width:0;flex:1"><div><div class="btitle">${esc(b.title)}</div><div class="muted" style="font-size:12.5px">${esc(b.author||"")}${b.started?" · elkezdve: "+fmtDate(b.started):""}</div></div>
      <div class="row" style="gap:8px;flex-wrap:nowrap"><button class="iconbtn" data-act="bprog" data-id="${b.id}" data-d="-10" aria-label="Kevesebb">−</button><div class="prog" style="flex:1"><i style="width:${b.progress||0}%"></i></div><button class="iconbtn" data-act="bprog" data-id="${b.id}" data-d="10" aria-label="Több">+</button><span class="num bpct">${b.progress||0}%</span></div>
      <label class="f">A legfontosabb gondolat, amit viszek belőle<textarea id="bnote-${b.id}" data-bnote="${b.id}" rows="2">${esc(b.note||"")}</textarea></label>
      <div class="row" style="gap:6px"><button class="btn small" data-act="bdone" data-id="${b.id}">Elolvastam</button><button class="btn ghost small" data-act="bquote" data-id="${b.id}">Gondolat az idézeteim közé</button><button class="chip" data-act="bdel" data-id="${b.id}">Törlés</button></div></div></div>`).join("")||'<div class="empty">Most nem olvasol semmit. Válassz egyet a listádról vagy az ajánlóból.</div>'}</div>
  <div class="grid g2">
    <div class="card"><div class="row between" style="margin-bottom:6px"><h3 style="margin:0">Szeretném elolvasni</h3><span class="muted" style="font-size:12px">${wish.length}</span></div><div class="list">${wish.map(b=>`<div class="li">${coverHTML(b).replace('class="bcover"','class="bcover sm"')}<div class="grow"><div class="t">${esc(b.title)}</div><div class="s">${esc(b.author||"")}</div></div><button class="btn small ghost" data-act="bstart" data-id="${b.id}">Elkezdem</button><button class="iconbtn" data-act="bdel" data-id="${b.id}" aria-label="Törlés">×</button></div>`).join("")||'<div class="empty">Üres a listád.</div>'}</div></div>
    <div class="card"><div class="row between" style="margin-bottom:6px"><h3 style="margin:0">Elolvastam</h3><span class="muted" style="font-size:12px">${done.length} könyv</span></div><div class="list">${done.map(b=>`<div class="li">${coverHTML(b).replace('class="bcover"','class="bcover sm"')}<div class="grow"><div class="t">${esc(b.title)}</div><div class="s">${esc(b.author||"")}${b.finished?" · "+fmtDate(b.finished):""}</div>${b.note?`<div class="bnote">„${esc(b.note)}”</div>`:""}</div></div>`).join("")||'<div class="empty">Az első elolvasott könyvért matrica jár.</div>'}</div></div>
  </div>
  <div class="card"><div class="row between" style="margin-bottom:4px"><h3 style="margin:0">Könyvajánló</h3></div>
    <div class="recs">${BOOK_RECS.map(([t,a,w])=>`<div class="rec">${coverHTML({title:t})}<div class="stack" style="gap:4px;min-width:0"><div class="btitle sm">${esc(t)}</div><div class="muted" style="font-size:12px">${esc(a)}</div><div style="font-size:12.5px">${esc(w)}</div>${has(t)?'<span class="chip good" style="align-self:flex-start">A listádon</span>':`<button class="chip" data-act="brec" data-t="${esc(t)}" data-a="${esc(a)}" style="align-self:flex-start">Az olvasólistámra</button>`}</div></div>`).join("")}</div></div>
  ${board(activeBoard)}</div>`;
}
function readingLine(){const r=(S.books||[]).filter(b=>b.status==="olvasom");if(!r.length)return"";const b=r[0];return `<a class="readline" href="#olvasas">${coverHTML(b).replace('class="bcover"','class="bcover sm"')}<span class="grow"><span class="s">Most olvasod</span><span class="t">${esc(b.title)}</span></span><span class="num">${b.progress||0}%</span></a>`}

/* ---------- teendőlisták (hét, hónap) ---------- */
const todosOf=k=>((S.todos||{})[k]||[]);
function todoItems(k,onlyOpen){const list=todosOf(k).filter(t=>!onlyOpen||!t.done);return list.map(t=>`<div class="li ${t.done?"done":""}"><button class="cbx" data-act="todo" data-k="${k}" data-id="${t.id}" aria-pressed="${!!t.done}" aria-label="Kész">${t.done?"✓":""}</button><div class="grow t">${esc(t.t)}</div>${onlyOpen?"":`<button class="iconbtn" data-act="tododel" data-k="${k}" data-id="${t.id}" aria-label="Törlés">×</button>`}</div>`).join("")}
function todoCard(k,title,empty){
  const open=todosOf(k).filter(t=>!t.done).length;
  return `<div class="card todo"><div class="row between" style="margin-bottom:4px"><h3 style="margin:0">${esc(title)}</h3><span class="muted" style="font-size:12px">${open} nyitott</span></div>
  <div class="list">${todoItems(k)||`<div class="empty">${esc(empty)}</div>`}</div>
  <form class="row" data-form="todo" data-k="${k}" style="flex-wrap:nowrap;margin-top:8px"><input type="text" id="todo-${k}" placeholder="Új teendő…" aria-label="${esc(title)}: új teendő"><button class="btn small">Hozzáadás</button></form></div>`;
}

/* ---------- motivációs idézetek ---------- */
const QUOTES_DEFAULT=[
  "Minden nap egy új esély, hogy közelebb kerülj ahhoz az élethez, amit megálmodtál.",
  "Nem számít, honnan indulsz. Az számít, hogy elindulsz.",
  "Hittel és alázattal menj tovább, akkor is, amikor nehéz.",
  "A kis lépések is lépések.",
  "Nem kell tukmálni. Elég, ha hiteles vagy.",
  "A saját márkád a legjobb befektetésed.",
  "Ma is lesz valaki, akinek Te leszel a jó hír.",
  "A siker nem sprint, hanem napi rutin.",
  "Higgy Magadban akkor is, amikor más még nem.",
  "Lépésről lépésre, a saját utadon."
];
const QUOTES=BR.quotes.length?BR.quotes:QUOTES_DEFAULT;
function quoteHTML(t,col,sig){
  const P=TH.palette();let bg=P.paper,fg=P.ink,mk=P.accent;
  if(col){if(col.ivory){bg=P.paper;fg=P.ink;mk=P.accent}else if(col.pale){bg=col.main;fg=P.ink;mk=P.accentDeep}else{bg=col.main;fg=col.fg;mk=P.hlBright}}
  return `<span class="qcard" style="background:${bg};color:${fg}"><span class="qm" style="color:${mk}">„</span>${esc(t)}${sig?`<span class="qsig" style="color:${mk}">${esc(sig)}</span>`:""}</span>`;
}
const dayOfYear=()=>Math.floor((TODAY-new Date(TODAY.getFullYear(),0,0))/864e5);
function quotePool(){return QUOTES.map(t=>({t,a:BR.ownerName})).concat((S.myquotes||[]).map(q=>({t:q.t,a:q.a})))}
const quoteOfDay=()=>{const p=quotePool();return p[dayOfYear()%p.length]};

/* ---------- napi pontok ---------- */
const PTS={step:10,all5:20,task:5,close:15,habit:5,follow:10,talk:10,publish:10,order:15,contact:5};
const DAILY_GOAL=100;
function logPt(kind,k){k=k||T;S.pts=S.pts||{};const d=S.pts[k]||(S.pts[k]={});d[kind]=(d[kind]||0)+1}
function scoreOf(k){
  const dd=S.days[k]||{},p=(S.pts||{})[k]||{};
  const steps=(dd.steps||[]).filter(Boolean).length,tasks=(dd.tasks||[]).filter(t=>t.done).length;
  const closed=dd.close&&dd.close.mood!=null?1:0,habits=(S.habits||[]).filter(h=>(h.days||{})[k]).length;
  const parts=[["Napi lépések",steps*PTS.step],["Arany nap bónusz",steps===5?PTS.all5:0],["Sorozat bónusz",k===T&&steps>0?Math.min(streak(),10)*2:0],["Teendők",(tasks+(p.todo||0))*PTS.task],["Esti zárás",closed*PTS.close],["Kihívások",habits*PTS.habit],["Utánkövetés",(p.follow||0)*PTS.follow],["Csapat",(p.talk||0)*PTS.talk],["Megjelent tartalom",(p.publish||0)*PTS.publish],["Rendelés",(p.order||0)*PTS.order],["Új kapcsolat",(p.contact||0)*PTS.contact]];
  return {total:parts.reduce((a,b)=>a+b[1],0),parts:parts.filter(x=>x[1]>0)};
}
const pointsChip=k=>`<span class="chip ptchip" title="Napi lendület">${scoreOf(k).total} lendületpont</span>`;
function pointsCard(){
  const sc=scoreOf(T),pct=Math.min(1,sc.total/DAILY_GOAL);
  const yest=scoreOf(iso(addDays(TODAY,-1))).total;
  const days=[6,5,4,3,2,1,0].map(i=>{const k=iso(addDays(TODAY,-i));return [k,scoreOf(k).total]});
  const mx=Math.max(DAILY_GOAL,...days.map(d=>d[1]));
  const R=42,C=2*Math.PI*R;
  return `<div class="card ptcard"><div class="eyebrow">Napi lendület</div>
  <div class="row" style="gap:16px;flex-wrap:nowrap;margin-top:6px"><div class="ring"><svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true"><circle cx="50" cy="50" r="${R}" fill="none" stroke="var(--soft2)" stroke-width="9"/><circle cx="50" cy="50" r="${R}" fill="none" stroke="${pct>=1?"var(--gold-500)":"var(--accent)"}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C*pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)"/></svg><div class="ring-v"><span class="num">${sc.total}</span><small>/ ${DAILY_GOAL}</small></div></div>
  <div class="stack" style="gap:4px;min-width:0"><div class="pt-msg">${sc.total>=DAILY_GOAL?"Megvan a napi célod!":sc.total>=60?"Mindjárt megvan!":sc.total?"Jó úton jársz.":"Az első lépés 10 lendületpont."}</div><div class="muted" style="font-size:12.5px">Tegnap: ${yest} lendületpont</div></div></div>
  <div class="ptparts">${sc.parts.map(([l,v])=>`<span class="ptp${/bónusz/.test(l)?" bonus":""}">${esc(l)} <b>+${v}</b></span>`).join("")||'<span class="muted" style="font-size:12.5px">Pipálj ki egy napi lépést, és jönnek a lendületpontok.</span>'}</div>
  <div class="ptweek" aria-label="Az elmúlt 7 nap pontjai">${days.map(([k,v])=>`<div class="ptw${k===T?" now":""}"><span class="ptb" style="height:${Math.max(3,v/mx*100)}%"></span><span class="ptl">${WD[(parse(k).getDay()+6)%7]}</span></div>`).join("")}<span class="ptgoal" style="bottom:calc(${DAILY_GOAL/mx*100}% * .78 + 18px)"></span></div>
  <p class="muted" style="font-size:11.5px;margin:6px 0 0">Lendületpontok: napi lépés 10, teendő 5, esti zárás 15, utánkövetés 10, rendelés 15 pont. Mind az 5 lépésért +20 bónusz.</p></div>`;
}

/* ---------- gondolattérkép ---------- */
const MAP_W=1400,MAP_H=900;
const curMap=()=>(S.maps||[]).find(m=>m.id===ui.mapId)||(S.maps||[])[0];
function sampleMap(){
  const r=uid(),a=uid(),b=uid(),c=uid(),d=uid();
  return {id:uid(),title:"A márkám jövőre",nodes:[
    {id:r,x:700,y:430,t:"A márkám jövőre",p:null},
    {id:a,x:430,y:250,t:"Kinek segítek?",p:r},{id:uid(),x:250,y:160,t:"Kisgyerekes anyukák",p:a},{id:uid(),x:240,y:300,t:"Mellékállást keresők",p:a},
    {id:b,x:980,y:250,t:"Tartalom",p:r},{id:uid(),x:1170,y:160,t:"Heti 3 Reel",p:b},{id:uid(),x:1180,y:300,t:"Napi sztori",p:b},
    {id:c,x:440,y:620,t:"Csapat",p:r},{id:uid(),x:250,y:700,t:"5 új vezető",p:c},
    {id:d,x:970,y:620,t:"Bevétel",p:r},{id:uid(),x:1170,y:700,t:"Havi 500 000 Ft",p:d}]};
}
function nodeLevel(m,n){let l=0,cur=n;while(cur&&cur.p&&l<9){cur=m.nodes.find(x=>x.id===cur.p);l++}return l}
function edgePath(a,b){const mx=(a.x+b.x)/2;return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`}
function mapLines(m){return m.nodes.filter(n=>n.p).map(n=>{const p=m.nodes.find(x=>x.id===n.p);if(!p)return"";const l=nodeLevel(m,n);return `<path data-e="${n.id}" d="${edgePath(p,n)}" fill="none" stroke="${l<=1?TH.palette().accent:TH.palette().hl500}" stroke-width="${l<=1?3.5:2.2}" stroke-linecap="round" opacity="${l<=1?.85:.9}"/>`}).join("")}
function nodeStyle(m,n){const l=nodeLevel(m,n);if(n.c!=null&&n.c>=0){const c=SC()[n.c];return `background:${c.main};color:${c.fg};border-color:${c.ivory?TH.palette().accent:c.main}`}return l===0?"":l===1?"":""}
function vTerkep(){
  if(!S.maps||!S.maps.length)S.maps=[sampleMap()];
  const m=curMap();ui.mapId=m.id;activeBoard="terkep-"+m.id;
  const sel=ui.mapSel&&m.nodes.find(n=>n.id===ui.mapSel);
  const nodes=m.nodes.map(n=>{const l=nodeLevel(m,n);return `<div class="mnode l${Math.min(l,2)}${sel&&sel.id===n.id?" sel":""}" data-nid="${n.id}" style="left:${n.x}px;top:${n.y}px;${nodeStyle(m,n)}" tabindex="0" role="button" aria-label="${esc(n.t)}"><span class="mt">${esc(n.t)||"…"}</span></div>`}).join("");
  return head("Gondolattérkép","Ötletek, célok, tervek egy lapon",`<button class="btn" data-act="mapnew">Új térkép</button>`)+`
  <div class="tabs">${S.maps.map(x=>`<button data-act="mapsel" data-id="${x.id}" aria-pressed="${x.id===m.id}">${esc(x.title||"Névtelen térkép")}</button>`).join("")}</div>
  <div class="card stack" style="gap:12px">
    <div class="row between"><label class="f" style="flex:1;min-width:220px">A térkép címe<input type="text" id="map-title" data-mtitle="1" value="${esc(m.title)}"></label>
      <span class="row" style="gap:6px;align-self:flex-end"><button class="btn ghost small" data-act="mcenter">Középre</button>${ui.mapdel===m.id?`<button class="chip warn" data-act="mapdel" data-id="${m.id}">Igen, törlöm a térképet</button><button class="chip" data-act="mapdelno">Mégse</button>`:`<button class="btn ghost small" data-act="mapdelask" data-id="${m.id}">Térkép törlése</button>`}</span></div>
    <div class="mtools">${sel?`<label class="f" style="flex:1;min-width:200px">Kijelölt ág szövege<input type="text" id="mnode-${sel.id}" data-mnode="${sel.id}" value="${esc(sel.t)}"></label>
      <span class="row" style="gap:6px;align-self:flex-end"><button class="btn small" data-act="mchild">Új ág innen</button>${sel.p?`<button class="btn ghost small" data-act="msib">Új testvér</button>`:""}
      <span class="row" style="gap:4px">${SC().map((c,i)=>`<button class="eswatch light" data-act="mcolor" data-i="${i}" style="background:${c.main}" aria-label="${c.n}" title="${c.n}" aria-pressed="${sel.c===i}"></button>`).join("")}<button class="chip" data-act="mcolor" data-i="-1">Alap</button></span>
      ${sel.p?`<button class="btn ghost small" data-act="mdel">Ág törlése</button>`:""}<button class="iconbtn" data-act="mdesel" aria-label="Kijelölés megszüntetése">×</button></span>`:`<span class="muted" style="font-size:13px">Koppints egy ágra a szerkesztéshez, húzd, ahová szeretnéd. Új ágat a kijelölt ágból indíthatsz.</span><button class="btn small" data-act="mchild">Új ág a középpontból</button>`}</div>
    <div class="mapwrap" id="mapwrap"><div class="mapcanvas page" id="mapcanvas" style="width:${MAP_W}px;height:${MAP_H}px"><svg class="mlines" width="${MAP_W}" height="${MAP_H}" viewBox="0 0 ${MAP_W} ${MAP_H}" aria-hidden="true">${mapLines(m)}</svg>${nodes}${board(activeBoard)}</div></div>
  </div>`;
}
function redrawEdges(m){const svg=document.querySelector(".mlines");if(svg)svg.innerHTML=mapLines(m)}
let mapCentered=null;
function bindMap(){
  if(route!=="terkep")return;
  const m=curMap(),cv=$("#mapcanvas"),wrap=$("#mapwrap");if(!cv||!m)return;
  if(mapCentered!==m.id){mapCentered=m.id;const r=m.nodes.find(n=>!n.p);if(r){wrap.scrollLeft=r.x-wrap.clientWidth/2;wrap.scrollTop=r.y-wrap.clientHeight/2}}
  cv.querySelectorAll(".mnode").forEach(el=>{
    let sx,sy,ox,oy,moved=false;const n=m.nodes.find(x=>x.id===el.dataset.nid);
    el.addEventListener("pointerdown",e=>{sx=e.clientX;sy=e.clientY;ox=n.x;oy=n.y;moved=false;el.setPointerCapture(e.pointerId);e.preventDefault()});
    el.addEventListener("pointermove",e=>{if(!el.hasPointerCapture(e.pointerId))return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(!moved)return;
      n.x=Math.min(MAP_W-40,Math.max(40,ox+dx));n.y=Math.min(MAP_H-24,Math.max(24,oy+dy));el.style.left=n.x+"px";el.style.top=n.y+"px";redrawEdges(m)});
    el.addEventListener("pointerup",e=>{if(!el.hasPointerCapture(e.pointerId))return;el.releasePointerCapture(e.pointerId);if(moved){save()}else{ui.mapSel=n.id;render();const i=document.getElementById("mnode-"+n.id);i&&i.focus()}});
    el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();ui.mapSel=n.id;render()}});
  });
}
function addMapNode(m,par){
  const root=m.nodes.find(n=>!n.p);const kids=m.nodes.filter(n=>n.p===par.id).length;let x,y;
  if(!par.p){const a=(-90+kids*55)*Math.PI/180;x=par.x+260*Math.cos(a);y=par.y+180*Math.sin(a)}
  else{const base=Math.atan2(par.y-root.y,par.x-root.x),off=(kids%2?1:-1)*Math.ceil(kids/2)*.5,a=base+off;x=par.x+190*Math.cos(a);y=par.y+120*Math.sin(a)}
  const n={id:uid(),x:Math.round(Math.min(MAP_W-80,Math.max(80,x))),y:Math.round(Math.min(MAP_H-30,Math.max(30,y))),t:"Új ág",p:par.id};
  m.nodes.push(n);return n;
}

/* ---------- forms ---------- */
const FORMS={
  contact:{title:"Kapcsolat",coll:"contacts",fields:[["name","Név","text"],["src","Honnan ismered?","text"],["interest","Érdeklődés","select",["Termék","Üzlet","Mindkettő"]],["stage","Hol tartotok?","select",STAGES.map((s,i)=>[i,s])],["next","Következő lépés","text"],["nextDate","Mikor?","date"],["note","Megjegyzés","textarea"]]},
  client:{title:"Ügyfél",coll:"clients",fields:[["name","Név","text"],["phone","Telefon, e-mail","text"],["bdayFull","Születésnap","date"],["fav","Kedvenc termékei","text"],["addr","Cím (átadáshoz, szállításhoz)","text"],["last","Utolsó rendelés","date"],["cycle","Újrarendelési ciklus (nap)","number"]]},
  order:{title:"Rendelés",coll:"orders",fields:[["date","Dátum","date"],["client","Ügyfél","text"],["items","Termékek","text"],["amount","Összeg","number"],["points","Pont (a cég pontrendszere szerint)","number"]]},
  content:{title:"Tartalom",coll:"content",fields:[["title","Téma, cím","text"],["date","Megjelenés","date"],["time","Időpont","time"],["pillar","Pillér","select",PILLARS.map((s,i)=>[i,s])],["format","Formátum","select",FORMATS],["status","Állapot","select",CSTATUS.map((s,i)=>[i,s])]]},
  idea:{title:"Ötlet",coll:"ideas",fields:[["pillar","Pillér","select",PILLARS.map((s,i)=>[i,s])],["hook","Hook: a mondat, ami megállít","textarea"],["main","Fő üzenet","textarea"],["cta","CTA: kérdés vagy felhívás","textarea"]]},
  member:{title:"Csapattag",coll:"team",fields:[["name","Név","text"],["level","Szint, rang","text"],["joined","Belépés","date"],["phone","Elérhetőség","text"],["goal","A célja, a miértje","textarea"],["log","Beszélgetéseink, jegyzetek","textarea"]]}
};
const NUMERIC=new Set(["stage","pillar","status","cycle","amount","points"]);
function openForm(type,item,preset){
  const F=FORMS[type];item=item||Object.assign({},preset||{});
  if(type==="client"&&item.bday&&!item.bdayFull)item.bdayFull=TODAY.getFullYear()+"-"+item.bday;
  const fl=F.fields.map(([k,l,t,opt])=>{
    const v=item[k]==null?"":item[k];const id="fm-"+type+"-"+k;const full=t==="textarea"||k==="name"||k==="title"?"full":"";
    if(t==="select")return `<label class="f ${full}">${l}<select id="${id}" name="${k}">${opt.map(o=>{const[ov,ol]=Array.isArray(o)?o:[o,o];return `<option value="${ov}" ${String(ov)===String(v)?"selected":""}>${esc(ol)}</option>`}).join("")}</select></label>`;
    if(t==="textarea")return `<label class="f ${full}">${l}<textarea id="${id}" name="${k}" rows="3">${esc(v)}</textarea></label>`;
    return `<label class="f ${full}">${l}<input type="${t}" id="${id}" name="${k}" value="${esc(v)}"></label>`;
  }).join("");
  $("#layer").innerHTML=`<div class="modal" data-act="close"><form class="sheet" data-form="item" data-type="${type}" data-id="${item.id||""}"><div class="row between"><h2>${item.id?F.title+" szerkesztése":"Új "+F.title.toLowerCase()}</h2><button type="button" class="iconbtn" data-act="close" aria-label="Bezárás">×</button></div><div class="fg">${fl}</div>
  <div class="row between"><span class="row" style="gap:6px"><span id="delrow">${item.id?`<button type="button" class="btn ghost small" data-act="delask">Törlés</button>`:""}</span>${pxFormBtn(type,item)}</span><button class="btn">Mentés</button></div></form></div>`;
  const first=$("#layer input,#layer textarea");if(first)first.focus();
}
function closeForm(){$("#layer").innerHTML=""}

/* ---------- üres terv (valódi, belépett felhasználó első indulása) ---------- */
function blank(){return {v:1,blank:true,settings:{name:(ctx.user&&ctx.user.name)||"",cur:"Ft",steps:["Poszt","Sztori","Új kapcsolat","Utánkövetés","Csapat"]},days:{},contacts:[],clients:[],orders:[],content:[],ideas:[],team:[],goals:{},stickers:{},prefs:{}}}
function syncBadge(){return ""}
/* a semleges alap-logó (white label csomagban a márka saját logója váltja) */
const MARK_SVG=TH.MARK;

/* ---------- PolyOS: upsell-sáv a nézetek alján ---------- */
const VIEW_UPSELL={ma:["projects","bookings"],naptar:["bookings","calendar"],kapcsolatok:["crm"],ugyfelek:["crm","cashflow"],tartalom:["campaign"],szamok:["cashflow"]};
function upStrip(view){
  const keys=VIEW_UPSELL[view];if(!keys)return "";
  const hide=(S.prefs&&S.prefs.upHide)||{};
  for(const k of keys){
    const m=PX.byKey(k);if(!m||hide[k])continue;
    if(PX.has(k)){
      const hint=m.push.length?"A tételeknél a ↗ gombbal egy kattintással átküldheted.":"A PolyOS-fiókodban már elérhető.";
      return `<div class="card upstrip"><span class="ic" aria-hidden="true">${m.icon}</span><div class="grow"><span class="t">${esc(m.label)} a PolyOS-ben</span><span class="s">${esc(hint)}</span></div><a class="btn small ghost" href="${esc(PX.openUrl(k))}" target="_blank" rel="noopener">Megnyitás</a></div>`;
    }
    if(!BR.upsell)continue;
    return `<div class="card upstrip"><span class="ic" aria-hidden="true">${m.icon}</span><div class="grow"><span class="t">Következő szint: ${esc(m.label)}</span><span class="s">${esc(m.pitch)}</span></div><a class="btn small" href="#bovitesek">Megnézem</a><button class="nc-skip" style="color:var(--muted)" data-act="uphide" data-k="${k}">Elrejtés</button></div>`;
  }
  return "";
}
/* ---------- PolyOS: Bővítések nézet ---------- */
function vBovitesek(){
  activeBoard=null;
  const c=PX.cfg();
  let st;
  if(!c.enabled)st=`<div class="status"><span class="ic">🔌</span><div class="grow"><b>A PolyOS-kapcsolat ezen a telepítésen még nincs bekapcsolva.</b><div class="muted" style="font-size:12.5px">A modulokat már most megnézheted; az összekapcsolás az üzemeltető beállítása után érhető el.</div></div></div>`;
  else if(DEMO&&!c.mock)st=`<div class="status"><span class="ic">🔒</span><div class="grow"><b>Az összekapcsoláshoz lépj be.</b><div class="muted" style="font-size:12.5px">A bemutató mód adatai csak ebben a böngészőben vannak, ezeket nem küldjük tovább.</div></div><button class="btn small" data-act="authshow">Belépés</button></div>`;
  else if(c.linked)st=`<div class="status"><span class="ic">✅</span><div class="grow"><b>Összekapcsolva${c.tenantName?": "+esc(c.tenantName):""}</b>${c.mock?' <span class="chip">fejlesztői szimuláció</span>':""}<div class="muted" style="font-size:12.5px">A tervezőből a bekapcsolt modulokba küldhetsz adatot. Az átküldés mindig a te kattintásodra történik.</div></div><a class="btn small ghost" href="${esc(c.baseUrl)}" target="_blank" rel="noopener">PolyOS megnyitása</a>${ui.pxdel?`<button class="chip warn" data-act="pxdisconnect">Igen, leválasztom</button><button class="chip" data-act="pxdelno">Mégse</button>`:`<button class="chip" data-act="pxdelask">Leválasztás</button>`}</div>`;
  else st=`<div class="status"><span class="ic">🔗</span><div class="grow"><b>Van már PolyOS-fiókod?</b><div class="muted" style="font-size:12.5px">Kapcsold össze, és a kapcsolataidat, teendőidet, időpontjaidat egy kattintással átküldheted. Ha még nincs, a modulkártyáról kipróbálhatod.</div></div><button class="btn small" data-act="pxconnect">Összekapcsolás</button></div>`;
  const cards=PX.MODULES.map(m=>{const on=PX.has(m.key);return `<div class="card upcard"><div class="row" style="gap:12px;flex-wrap:nowrap"><span class="ic" aria-hidden="true">${m.icon}</span><div><h3 style="margin:0">${esc(m.label)}</h3>${on?'<span class="chip on">Bekapcsolva</span>':""}</div></div><p style="margin:0">${esc(m.pitch)}</p><ul class="feat">${m.feats.map(f=>`<li>${esc(f)}</li>`).join("")}</ul><div class="acts">${on?`<a class="btn small" href="${esc(PX.openUrl(m.key))}" target="_blank" rel="noopener">Megnyitás</a>`:BR.upsell?`<a class="btn small" href="${esc(PX.upsellUrl(m.key,BR.slug))}" target="_blank" rel="noopener">Kipróbálom</a>`:""}</div></div>`}).join("");
  return head("Bővítések","A tervező a PolyOS része")+`<p class="qday" style="margin:0">A Sikertervező a napi rutinod. Ha a vállalkozásod kinövi, a PolyOS-ben folytathatod: ugyanazok az adatok, több eszköz.</p>${st}<div class="ups">${cards}</div>`;
}
/* ---------- PolyOS: átküldés (↗) ---------- */
const PXICON='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function pxBtn(kind,attrs,item){if(!PX.canPush(kind))return "";const done=item&&item.px;return `<button type="button" class="iconbtn" data-act="pxpush" data-kind="${kind}" ${attrs} title="${done?"Frissítés a PolyOS-ben":"Küldés a PolyOS-be"}" aria-label="${done?"Frissítés a PolyOS-ben":"Küldés a PolyOS-be"}" ${done?'style="background:var(--accent-tint)"':""}>${done?"✓":PXICON}</button>`}
function pxFormBtn(type,item){if(!item.id||!PX.canPush(type))return "";const m=PX.byKey(PX.KIND_MODULE[type]);return `<button type="button" class="btn ghost small" data-act="pxpush" data-kind="${type}" data-id="${item.id}">${item.px?"Frissítés":"Küldés"}: PolyOS ${esc(m.label)}</button>`}
function pxPayload(kind,b){
  const id=b.dataset.id;
  if(kind==="contact"){const c=S.contacts.find(x=>x.id===id);return c&&[c,{external_id:c.id,name:c.name,source:c.src,interest:c.interest,stage:STAGES[c.stage],next_step:c.next,next_date:c.nextDate,note:c.note}]}
  if(kind==="client"){const c=S.clients.find(x=>x.id===id);return c&&[c,{external_id:c.id,name:c.name,phone:c.phone,birthday:c.bday,favorites:c.fav,address:c.addr,last_order:c.last,reorder_cycle_days:+c.cycle||null}]}
  if(kind==="content"){const c=S.content.find(x=>x.id===id);return c&&[c,{external_id:c.id,title:c.title,date:c.date,time:c.time,pillar:PILLARS[c.pillar],format:c.format,status:CSTATUS[c.status]}]}
  if(kind==="idea"){const c=S.ideas.find(x=>x.id===id);return c&&[c,{external_id:c.id,pillar:PILLARS[c.pillar],hook:c.hook,main:c.main,cta:c.cta}]}
  if(kind==="order"){const o=S.orders.find(x=>x.id===id);return o&&[o,{external_id:o.id,date:o.date,client:o.client,items:o.items,amount:+o.amount||0,currency:S.settings.cur,paid:!!o.paid}]}
  if(kind==="task"){const t=day(b.dataset.day).tasks.find(x=>x.id===id);return t&&[t,{external_id:t.id,title:t.t,due_date:b.dataset.day,done:!!t.done}]}
  if(kind==="event"){const k=b.dataset.day,h=+b.dataset.h,dd=day(k),v=(dd.hours||{})[h];if(!v)return null;dd.px=dd.px||{};const holder=dd.px[h]||(dd.px[h]={});return [holder,{external_id:k+"T"+pad(h),title:v,date:k,start:pad(h)+":00",end:pad(Math.min(23,h+1))+":00",location:locOf(k,h)}]}
  return null;
}
async function pxPush(b){
  const kind=b.dataset.kind,p=pxPayload(kind,b);if(!p)return;
  const m=PX.byKey(PX.KIND_MODULE[kind]);b.disabled=true;
  try{const r=await PX.push(kind,p[1]);p[0].px={id:r.id||"",at:T};save();toast(`Átküldve: PolyOS ${m.label}`);if(b.closest("#layer"))closeForm();render()}
  catch(e){b.disabled=false;toast(e.status===409?"Előbb kapcsold össze a PolyOS-fiókodat a Bővítéseknél.":e.status===403?`A ${m.label} modul nincs benne a PolyOS-csomagodban.`:e.status===401?"Lépj be újra.":"Nem sikerült átküldeni. Próbáld újra később.")}
}
/* ---------- arculat ---------- */
function bgPrefs(){S.prefs=S.prefs||{};return Object.assign({},TH.DEFAULT_PREFS,BR.defaultBg?{bgColor:BR.defaultBg}:{},S.prefs.bg||{})}
function repaint(){TH.apply(ui.brand||ctx.brandRaw,bgPrefs());if(ctx.paintChrome)ctx.paintChrome(ui.brand||ctx.brandRaw)}
function brandCard(){
  const bp=bgPrefs(),ink=TH.palette().ink;
  const pats=Object.entries(TH.BG_PATTERNS).map(([k,p])=>`<button class="bgopt" data-act="bgpat" data-k="${k}" aria-pressed="${bp.bgPattern===k}" style="background-color:${bp.bgColor};background-image:${p.image(`color-mix(in srgb,${ink} ${k==="pont"?16:7}%,transparent)`)};--sz:${p.size}"><span>${esc(p.label)}</span></button>`).join("");
  const cols=TH.BG_COLORS.map(([n,c])=>`<button class="swatch" data-act="bgcol" data-c="${c}" aria-pressed="${bp.bgColor.toUpperCase()===c.toUpperCase()}" style="background:${c}" aria-label="${n}" title="${n}"></button>`).join("");
  let wl="";
  if(BR.plan==="whitelabel"&&(ctx.brandAdmin||DEMO)){
    const d=ui.brand||(ui.brand=JSON.parse(JSON.stringify(ctx.brandRaw||{})));d.colors=d.colors||{};const e=TH.effectiveBrand(d);
    wl=`<div class="card stack" id="markaszerk" style="gap:14px"><div class="row between"><h3 style="margin:0">Márka (white label)</h3><span class="chip on">${ctx.brandAdmin?"Te kezeled":"Bemutató"}</span></div>
      <p class="muted" style="margin:0;font-size:12.5px">Ez minden felhasználódnál megjelenik: név, logó, kiemelőszínek, betűk. A háttérmintát mindenki maga választja.</p>
      <div class="grid g2"><label class="f">A tervező neve<input type="text" data-brand="productName" value="${esc(d.productName||"")}" placeholder="Sikertervező" maxlength="40"></label><label class="f">Alcím<input type="text" data-brand="tagline" value="${esc(d.tagline||"")}" maxlength="60"></label>
      <label class="f full">A márka gazdája (oklevél aláírása, idézetek szerzője)<input type="text" data-brand="ownerName" value="${esc(d.ownerName||"")}" maxlength="40"></label></div>
      <div class="row" style="gap:14px"><span class="logoprev">${e.logo?`<img src="${esc(e.logo)}" alt="Logó">`:TH.svg(MARK_SVG)}</span><div class="stack" style="gap:6px"><label class="btn ghost small" for="brand-logo" style="cursor:pointer;align-self:flex-start">Logó feltöltése</label><input type="file" id="brand-logo" accept="image/png,image/svg+xml,image/webp,image/jpeg" hidden>${e.logo?'<button class="chip" data-act="brandlogodel" style="align-self:flex-start">Logó törlése</button>':""}<span class="muted" style="font-size:12px">Átlátszó hátterű PNG vagy SVG, legfeljebb 300 KB.</span></div></div>
      <div class="colorrow"><label class="f">Kiemelőszín<input type="color" data-brandc="accent" value="${e.accent}"></label><label class="f">Kiemelés (érmek, arany nap)<input type="color" data-brandc="highlight" value="${e.highlight}"></label><label class="f">Alap háttérszín<input type="color" data-brandc="background" value="${TH.util.isHex(d.colors.background)?d.colors.background:"#F4F4F1"}"></label></div>
      <div><div class="lab2">Oldalsáv</div><div class="tabs">${[["dark","Sötét"],["accent","Kiemelőszín"],["light","Világos"]].map(([k,l])=>`<button data-act="brandside" data-k="${k}" aria-pressed="${e.sidebar===k}">${l}</button>`).join("")}</div></div>
      <div><div class="lab2">Betűk</div><div class="tabs">${Object.entries(TH.FONTS).map(([k,f])=>`<button data-act="brandfont" data-k="${k}" aria-pressed="${e.fonts===k}">${esc(f.label)}</button>`).join("")}</div></div>
      <div class="stack" style="gap:8px"><button class="cbx" data-act="brandfounder" aria-pressed="${!!(d.founder&&d.founder.enabled)}" aria-label="Alapító tagság" style="display:none"></button><label class="row" style="gap:8px;font-size:13px"><button type="button" class="cbx" data-act="brandfounder" aria-pressed="${!!(d.founder&&d.founder.enabled)}">${d.founder&&d.founder.enabled?"✓":""}</button>Alapító tagsági program (oklevél, külön érem)</label>
      ${d.founder&&d.founder.enabled?`<label class="f">Az alapító tagok kedvezménye<input type="text" data-brandf="perk" value="${esc(d.founder.perk||"")}" maxlength="200" placeholder="Például: örökre a mostani áron használod a tervezőt."></label>`:""}</div>
      <label class="f">Saját idézetek a napi gondolatokhoz (soronként egy; üresen a beépítettek)<textarea data-brandq="1" rows="4">${esc((d.quotes||[]).join("\n"))}</textarea></label>
      <div class="row"><button class="btn" data-act="brandsave">Márka mentése</button><button class="btn ghost" data-act="brandreset">Elvetés</button></div></div>`;
  }else if(BR.plan!=="whitelabel"&&BR.upsell){
    wl=`<div class="card stack lockcard"><h3 style="margin:0">Saját márkával szeretnéd?</h3><p style="margin:0;font-size:13px">A <b>white label</b> csomagban a tervező a te nevedet, logódat, színeidet és betűidet viseli, és így adhatod tovább a csapatodnak, ügyfeleidnek.</p><a class="btn small ghost" style="align-self:flex-start" href="${esc(PX.upsellUrl("whitelabel",BR.slug))}" target="_blank" rel="noopener">Érdekel a white label</a></div>`;
  }
  return `<div class="grid g2" style="align-items:start" id="arculat"><div class="card stack" style="gap:14px"><h3 style="margin:0">Háttér</h3><p class="muted" style="margin:0;font-size:12.5px">Csak nálad látszik, bármikor visszaváltható.</p><div class="bgpick">${pats}</div><div class="colorrow">${cols}<input type="color" data-bgc="1" value="${bp.bgColor}" aria-label="Saját háttérszín"></div></div>${wl}</div>`;
}
function accountCard(){
  if(DEMO)return `<div class="card stack"><h3>Bemutató mód</h3><p class="muted" style="margin:0">Most belépés nélkül, mintaadatokkal próbálod a tervezőt: amit beírsz, csak ebben a böngészőben marad meg. Fiókkal minden eszközödön ugyanazt látod.</p>
  <div class="row">${ctx.cloud?'<button class="btn" data-act="authshow">Fiókot hozok létre</button>':""}<span id="resetrow" class="row"><button class="btn ghost" data-act="resetask">Mintaadatok visszaállítása</button></span></div>
  <div class="row" style="gap:6px"><span class="lab2" style="margin:0">Csomag a bemutatóban:</span><button class="mood" data-act="demoplan" data-k="alap" aria-pressed="${BR.plan!=="whitelabel"}">Alap</button><button class="mood" data-act="demoplan" data-k="whitelabel" aria-pressed="${BR.plan==="whitelabel"}">White label</button></div></div>`;
  return `<div class="card stack"><h3>Fiók</h3><div class="row between"><div><b>${esc((ctx.user&&ctx.user.email)||"")}</b><div class="muted" style="font-size:12.5px">A terved a fiókodhoz van mentve, minden eszközödön ugyanaz.</div></div><span class="row"><button class="btn ghost small" data-act="export">Adataim letöltése</button><button class="btn ghost small" data-act="logout">Kijelentkezés</button></span></div></div>`;
}

/* ---------- render ---------- */
const RENDER={ma:vMa,bovitesek:vBovitesek,olvasas:vOlvasas,szokasok:vSzokasok,terkep:vTerkep,matricak:vMatricak,naptar:vNaptar,kapcsolatok:vKapcsolatok,ugyfelek:vUgyfelek,tartalom:vTartalom,csapat:vCsapat,szamok:vSzamok,beallitasok:vBeall};
function render(){
  const y=window.scrollY;
  $("#view").innerHTML=RENDER[route]()+upStrip(route);
  nav();drawer();bindBoards();bindMap();
  window.scrollTo(0,y);
  checkAch(false);
}
function go(){const h=(location.hash||"").slice(1);route=RENDER[h]?h:"ma";trayOpen=false;ui.sel=null;render();window.scrollTo(0,0)}
window.addEventListener("hashchange",go);

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  if(e.target.closest("a[data-stop]"))return;
  const b=e.target.closest("[data-act]");if(!b)return;
  if(b.classList.contains("modal")&&e.target!==b)return;
  const a=b.dataset.act,id=b.dataset.id;
  const find=(coll)=>S[coll].find(x=>x.id===id);
  switch(a){
    case"step":{const dd=day(b.dataset.day);const was=dd.steps.filter(Boolean).length;dd.steps[+b.dataset.i]=!dd.steps[+b.dataset.i];save();render();if(was<5&&dd.steps.filter(Boolean).length===5)crownPop();break}
    case"msg":{const ty=b.dataset.type;let v={},done=null;
      if(ty==="contact"){const c=find("contacts");v={nev:firstName(c.name),full:c.name};done={act:"cdone",id:c.id,label:"Megvolt"}}
      else if(ty==="client"){const c=find("clients");v={nev:firstName(c.name),full:c.name,termek:c.fav}}
      else{const t=find("team");v={nev:firstName(t.name),full:t.name};done={act:"talk",id:t.id,label:"Ma beszéltünk"}}
      openMsg(b.dataset.k,v,done);break}
    case"ncmsg":{const s=suggestions()[0];if(s&&s.msg)openMsg(s.msg.k,s.msg.v,s.msg.done);break}
    case"ncskip":ui.skip.push(b.dataset.k);render();break;
    case"ncanchor":{const el=document.getElementById(b.dataset.k);if(el){el.scrollIntoView({behavior:"smooth",block:"center"});const i=el.querySelector("input");i&&setTimeout(()=>i.focus(),400)}break}
    case"msgcopy":{const ta=$("#msgtext");const txt=ta.value;const fb=()=>{ta.focus();ta.select();toast("Jelöld ki a szöveget, és másold ki.")};try{navigator.clipboard.writeText(txt).then(()=>toast("Kimásolva. Illeszd be az üzenetbe."),fb)}catch(err){fb()}break}
    case"celok":celebQ.shift();showCeleb();break;
    case"celgo":{const a=celebQ.shift();const k="ma-"+T,arr=S.stickers[k]||(S.stickers[k]=[]);arr.push({id:uid(),k:"a:"+a.id,x:80,y:40,r:-6,s:1});save();showCeleb();if(route!=="ma")location.hash="ma";else render();toast("Rátettem a mai lapra.");break}
    case"achinfo":{const a=ACH.find(x=>"a:"+x.id===b.dataset.k);toast("Még nincs meg: "+a.d);break}
    case"habit":{const h=(S.habits||[]).find(x=>x.id===id);if(!h)break;h.days=h.days||{};const k=b.dataset.k;if(h.days[k])delete h.days[k];else h.days[k]=true;save();render();break}
    case"habitpreset":{const inp=$("#habit-name");if(inp){inp.value=b.dataset.k;inp.focus()}break}
    case"habitdelask":ui.hdel=id;render();break;
    case"habitdelno":ui.hdel=null;render();break;
    case"habitdel":S.habits=S.habits.filter(h=>h.id!==id);ui.hdel=null;save();toast("Kihívás törölve.");render();break;
    case"mqedit":{const q=(S.myquotes||[]).find(x=>x.id===id);if(!q)break;ui.mq={t:q.t,a:q.a||"",editId:q.id};render();const el=$("#mq-text");if(el){el.scrollIntoView({block:"center"});el.focus()}break}
    case"mqcancel":ui.mq={t:"",a:"",editId:null};render();break;
    case"mqdelask":ui.mqdel=id;render();break;
    case"mqdelno":ui.mqdel=null;render();break;
    case"mqdel":S.myquotes=S.myquotes.filter(q=>q.id!==id);ui.mqdel=null;save();toast("Idézet törölve.");render();break;
    case"peradd":{const ps=periods(),last=ps[ps.length-1];let st,len;if(last){len=dayDiff(last.start,last.end);st=iso(addDays(parse(last.end),1))}else{len=27;st=T}S.periods=S.periods||[];S.periods.push({id:uid(),name:"Periódus "+(ps.length+1),start:st,end:iso(addDays(parse(st),len))});save();render();break}
    case"perdel":S.periods=(S.periods||[]).filter(p=>p.id!==id);save();render();break;
    case"cert":openCert(id);break;
    case"certdl":downloadCert(id);break;
    case"foundertoggle":S.settings.founder=!S.settings.founder;if(S.settings.founder&&!S.settings.founderSince)S.settings.founderSince=T;save();render();break;
    case"rem":{const r=S.reminders;r[b.dataset.k]=!r[b.dataset.k];save();render();break}
    case"toallas":{if(route==="szamok"){e.preventDefault();const el=$("#allas");el&&el.scrollIntoView({behavior:"smooth"})}else{e.preventDefault();location.hash="szamok";setTimeout(()=>{const el=$("#allas");el&&el.scrollIntoView({behavior:"smooth"});const i=$("#bp-gp");i&&i.focus()},350)}break}
    case"bprog":{const bk=(S.books||[]).find(x=>x.id===id);if(!bk)break;bk.progress=Math.max(0,Math.min(100,(bk.progress||0)+ +b.dataset.d));if(bk.progress===100){bk.status="kesz";bk.finished=T;toast("Elolvastad! Gratulálok.")}save();render();break}
    case"bdone":{const b=S.books.find(x=>x.id===id);b.status="kesz";b.progress=100;b.finished=T;save();toast("Elolvastad! Gratulálok.");render();break}
    case"bstart":{const b=S.books.find(x=>x.id===id);b.status="olvasom";b.started=T;b.progress=b.progress||0;save();render();break}
    case"bdel":S.books=S.books.filter(x=>x.id!==id);save();toast("Könyv törölve.");render();break;
    case"brec":S.books=S.books||[];S.books.push({id:uid(),title:b.dataset.t,author:b.dataset.a,status:"szeretnem",progress:0});save();toast("Felkerült az olvasólistádra.");render();break;
    case"bquote":{const bk=S.books.find(x=>x.id===id);if(!bk||!(bk.note||"").trim()){toast("Előbb írd be a gondolatot.");break}S.myquotes=S.myquotes||[];S.myquotes.unshift({id:uid(),t:bk.note.trim(),a:bk.author||bk.title});save();toast("Bekerült a saját idézeteid közé.");break}
    case"todo":{const list=todosOf(b.dataset.k),t=list.find(x=>x.id===id);if(!t)break;t.done=!t.done;if(t.done)logPt("todo");else{const d=(S.pts||{})[T];if(d&&d.todo)d.todo--}save();render();break}
    case"tododel":{S.todos[b.dataset.k]=todosOf(b.dataset.k).filter(x=>x.id!==id);save();render();break}
    case"mood":{const dd=day(b.dataset.day);dd.close=dd.close||{};const i=+b.dataset.i;dd.close.mood=dd.close.mood===i?null:i;save();render();break}
    case"tplreset":{if(S.tpl)delete S.tpl[b.dataset.k];save();render();toast("Visszaállítva az eredeti szövegre.");break}
    case"mapnew":{const r=uid();const m={id:uid(),title:"Új térkép",nodes:[{id:r,x:MAP_W/2,y:MAP_H/2,t:"Központi gondolat",p:null}]};S.maps.push(m);ui.mapId=m.id;ui.mapSel=r;mapCentered=null;save();render();const i=document.getElementById("mnode-"+r);i&&i.select();break}
    case"mapsel":ui.mapId=id;ui.mapSel=null;mapCentered=null;render();break;
    case"mapdelask":ui.mapdel=id;render();break;
    case"mapdelno":ui.mapdel=null;render();break;
    case"mapdel":{S.maps=S.maps.filter(m=>m.id!==id);if(!S.maps.length)S.maps=[sampleMap()];ui.mapId=S.maps[0].id;ui.mapdel=null;ui.mapSel=null;mapCentered=null;save();toast("Térkép törölve.");render();break}
    case"mchild":{const m=curMap();const par=m.nodes.find(n=>n.id===ui.mapSel)||m.nodes.find(n=>!n.p);const n=addMapNode(m,par);ui.mapSel=n.id;save();render();const i=document.getElementById("mnode-"+n.id);if(i){i.focus();i.select()}break}
    case"msib":{const m=curMap();const cur=m.nodes.find(n=>n.id===ui.mapSel);if(!cur||!cur.p)break;const par=m.nodes.find(n=>n.id===cur.p);const n=addMapNode(m,par);ui.mapSel=n.id;save();render();const i=document.getElementById("mnode-"+n.id);if(i){i.focus();i.select()}break}
    case"mcolor":{const m=curMap();const n=m.nodes.find(x=>x.id===ui.mapSel);if(!n)break;const i=+b.dataset.i;if(i<0)delete n.c;else n.c=i;save();render();break}
    case"mdel":{const m=curMap();const kill=new Set([ui.mapSel]);let grow=true;while(grow){grow=false;m.nodes.forEach(n=>{if(n.p&&kill.has(n.p)&&!kill.has(n.id)){kill.add(n.id);grow=true}})}m.nodes=m.nodes.filter(n=>!kill.has(n.id));ui.mapSel=null;save();render();toast(kill.size>1?`Törölve ${kill.size} ág.`:"Ág törölve.");break}
    case"mdesel":ui.mapSel=null;render();break;
    case"mcenter":{const m=curMap(),w=$("#mapwrap"),r=m.nodes.find(n=>!n.p);if(w&&r)w.scrollTo({left:r.x-w.clientWidth/2,top:r.y-w.clientHeight/2,behavior:"smooth"});break}

    case"task":{const t=day(b.dataset.day).tasks.find(x=>x.id===id);t.done=!t.done;save();render();break}
    case"taskdel":{const dd=day(b.dataset.day);dd.tasks=dd.tasks.filter(x=>x.id!==id);save();render();break}
    case"opennap":{const k=b.dataset.k;ui.selDay=k;ui.calMonth=k.slice(0,7);ui.calMode="nap";if(route!=="naptar")location.hash="naptar";else{render();window.scrollTo(0,0)}break}
    case"calmode":ui.calMode=b.dataset.k;if(ui.calMode==="honap")ui.calMonth=ui.selDay.slice(0,7);render();break;
    case"calnav":{const d=+b.dataset.d;if(ui.calMode==="honap"){const[Y,M]=ui.calMonth.split("-").map(Number);ui.calMonth=ym(new Date(Y,M-1+d,1))}else{ui.selDay=iso(addDays(parse(ui.selDay),ui.calMode==="het"?7*d:d));ui.calMonth=ui.selDay.slice(0,7)}ui.sel=null;render();break}
    case"caltoday":ui.selDay=T;ui.calMonth=ym(TODAY);ui.sel=null;render();break;
    case"ccnav":{const[Y,M]=ui.ccMonth.split("-").map(Number);ui.ccMonth=ym(new Date(Y,M-1+ +b.dataset.d,1));render();break}
    case"newcontent":openForm("content",null,{date:b.dataset.k||T,time:"18:00",pillar:ui.pFilter>=0?ui.pFilter:0,format:"Poszt",status:0,title:""});break;
    case"se":{const st=selSticker();if(!st)break;const arr=S.stickers[ui.sel.b];const op=b.dataset.op;
      if(op==="color"){const i=+b.dataset.i;if(i<0)delete st.c;else st.c=i}
      if(op==="smaller")st.s=Math.max(.4,+((st.s||1)-.15).toFixed(2));
      if(op==="bigger")st.s=Math.min(3,+((st.s||1)+.15).toFixed(2));
      if(op==="left")st.r=(st.r||0)-10;
      if(op==="right")st.r=(st.r||0)+10;
      if(op==="front"){arr.splice(arr.indexOf(st),1);arr.push(st)}
      if(op==="dup"){const c=Object.assign({},st,{id:uid(),x:Math.min(95,st.x+5),y:Math.min(95,st.y+5)});arr.push(c);ui.sel.id=c.id}
      if(op==="del"){S.stickers[ui.sel.b]=arr.filter(z=>z!==st);ui.sel=null}
      save();render();break}
    case"mktype":ui.mk.type=b.dataset.k;render();break;
    case"mkcolor":ui.mk.color=+b.dataset.i;render();break;
    case"mksave":{const t=(ui.mk.text||"").trim();if(!t){toast("Írj szöveget a matricára.");break}
      if(ui.mk.editId){const c=S.custom.find(x=>x.id===ui.mk.editId);if(c){Object.assign(c,{type:ui.mk.type,text:t,ci:ui.mk.color});delete c.color}ui.mk.editId=null;toast("Matrica mentve.")}
      else{S.custom.push({id:uid(),type:ui.mk.type,text:t,ci:ui.mk.color});toast("Hozzáadva a saját matricáidhoz.")}
      save();render();break}
    case"mkcancel":ui.mk.editId=null;render();break;
    case"cedit":{const c=S.custom.find(x=>x.id===id);if(!c)break;if(c.type==="img"){toast("A feltöltött képet a lapon tudod méretezni és forgatni.");break}ui.mk={type:c.type,text:c.text,color:c.ci!=null?c.ci:CMAP[c.color||0],editId:c.id};render();window.scrollTo({top:0,behavior:"smooth"});break}
    case"cdelask":ui.cdel=id;render();break;
    case"cdelno":ui.cdel=null;render();break;
    case"cdel":S.custom=S.custom.filter(x=>x.id!==id);ui.cdel=null;save();toast("Matrica törölve.");render();break;
    case"toToday":{const k="ma-"+T,arr=S.stickers[k]||(S.stickers[k]=[]);arr.push({id:uid(),k:b.dataset.k,x:40+Math.random()*25,y:35+Math.random()*30,r:Math.round(Math.random()*12-6),s:1});save();toast("Rátettem a mai lapra (Ma oldal).");break}
    case"cdone":{const c=find("contacts");c.nextDate="";c.next="";logPt("follow");save();closeForm();toast("Megvolt. Add meg a következő lépést a Kapcsolatoknál.");render();break}
    case"stage":{const c=find("contacts");c.stage=Math.max(0,Math.min(3,c.stage+ +b.dataset.d));save();render();break}
    case"kf":ui.kFilter=b.dataset.k;render();break;
    case"cstat":{const c=find("content");c.status=(c.status+1)%3;if(c.status===2)logPt("publish");save();render();break}
    case"ctab":ui.cTab=b.dataset.k;render();break;
    case"pf":ui.pFilter=+b.dataset.i===ui.pFilter?-1:+b.dataset.i;render();break;
    case"plan":{const x=find("ideas");openForm("content",null,{title:x.hook,pillar:x.pillar,date:T,format:"Poszt",status:0});break}
    case"paid":{const o=find("orders");o.paid=!o.paid;save();render();break}
    case"order":{const c=find("clients");openForm("order",null,{date:T,client:c.name,items:c.fav,_cid:c.id});break}
    case"active":{const t=find("team");t.active=!t.active;save();render();break}
    case"talk":{const t=find("team");t.talk=T;logPt("talk");save();closeForm();toast("Rögzítve: ma beszéltetek.");render();break}
    case"new":openForm(b.dataset.type);break;
    case"edit":{const F=FORMS[b.dataset.type];openForm(b.dataset.type,S[F.coll].find(x=>x.id===id));break}
    case"pxpush":pxPush(b);break;
    case"pxconnect":ctx.polyosConnect();break;
    case"pxdelask":ui.pxdel=true;render();break;
    case"pxdelno":ui.pxdel=false;render();break;
    case"pxdisconnect":ui.pxdel=false;ctx.polyosDisconnect().then(()=>{toast("Leválasztva a PolyOS-ről.");render()},()=>toast("Nem sikerült. Próbáld újra."));break;
    case"uphide":S.prefs=S.prefs||{};S.prefs.upHide=Object.assign({},S.prefs.upHide,{[b.dataset.k]:true});save();render();break;
    case"authshow":ctx.showAuth();break;
    case"logout":ctx.logout();break;
    case"export":{const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"}),u=URL.createObjectURL(blob),a2=document.createElement("a");a2.href=u;a2.download="sikertervezo-adataim-"+T+".json";document.body.appendChild(a2);a2.click();a2.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);break}
    case"demoplan":ctx.setDemoPlan(b.dataset.k);break;
    case"bgpat":S.prefs=S.prefs||{};S.prefs.bg=Object.assign({},bgPrefs(),{bgPattern:b.dataset.k});save();repaint();render();break;
    case"bgcol":S.prefs=S.prefs||{};S.prefs.bg=Object.assign({},bgPrefs(),{bgColor:b.dataset.c});save();repaint();render();break;
    case"brandside":ui.brand.colors=Object.assign({},ui.brand.colors,{sidebar:b.dataset.k});repaint();render();break;
    case"brandfont":ui.brand.fonts=b.dataset.k;repaint();render();break;
    case"brandfounder":ui.brand.founder=Object.assign({perk:""},ui.brand.founder,{enabled:!(ui.brand.founder&&ui.brand.founder.enabled)});render();break;
    case"brandlogodel":ui.brand.logo="";repaint();render();break;
    case"brandreset":ui.brand=null;repaint();render();toast("Visszaállítva a mentett márkára.");break;
    case"brandsave":{const d=ui.brand;if(!d)break;b.disabled=true;ctx.saveBrand(d).then(()=>{toast("Márka mentve. Újratöltöm…");setTimeout(()=>location.reload(),700)},e=>{b.disabled=false;toast(e&&e.message==="forbidden"?"Ehhez nincs jogosultságod.":"Nem sikerült menteni. Próbáld újra.")});break}
    case"close":closeForm();break;
    case"delask":$("#delrow").innerHTML=`<span class="row" style="gap:6px"><span class="muted" style="font-size:12.5px">Biztosan törlöd?</span><button type="button" class="btn small" data-act="del">Igen, törlöm</button><button type="button" class="btn small ghost" data-act="delno">Mégse</button></span>`;break;
    case"delno":$("#delrow").innerHTML=`<button type="button" class="btn ghost small" data-act="delask">Törlés</button>`;break;
    case"del":{const f=b.closest("form"),F=FORMS[f.dataset.type];S[F.coll]=S[F.coll].filter(x=>x.id!==f.dataset.id);save();closeForm();toast("Törölve.");render();break}
    case"tray":trayOpen=!trayOpen;drawer();break;
    case"stkadd":{if(!activeBoard)break;const arr=S.stickers[activeBoard]||(S.stickers[activeBoard]=[]);const bd=document.querySelector(`.board[data-board="${CSS.escape(activeBoard)}"]`);let x=50,y=50;if(bd){const r=bd.getBoundingClientRect();const vy=(Math.min(innerHeight,r.bottom)+Math.max(0,r.top))/2;const vx=(Math.min(innerWidth,r.right)+Math.max(0,r.left))/2;x=Math.min(90,Math.max(10,(vx-r.left)/r.width*100+(Math.random()*10-5)));y=Math.min(95,Math.max(5,(vy-r.top)/r.height*100+(Math.random()*6-3)))}const n={id:uid(),k:b.dataset.k,x,y,r:Math.round(Math.random()*12-6),s:1};arr.push(n);ui.sel={b:activeBoard,id:n.id};save();render();trayOpen=true;drawer();break}
    case"resetask":$("#resetrow").innerHTML=`<span class="muted">Minden beírt adatod törlődik.</span><button class="btn" data-act="reset">Igen, visszaállítom</button><button class="btn ghost" data-act="resetno">Mégse</button>`;break;
    case"resetno":render();break;
    case"reset":S=sample();migrate();S.unlocked={};checkAch(true);S.maps=[sampleMap()];save();toast("Mintaadatok visszaállítva.");render();break;
  }
});
document.addEventListener("pointerdown",e=>{if(ui.sel&&!e.target.closest(".stk")&&!e.target.closest(".drawer")){ui.sel=null;markSel();drawer()}});
document.addEventListener("dragstart",e=>{const p=e.target.closest&&e.target.closest("[data-drag]");if(!p)return;e.dataTransfer.setData("text/plain",p.dataset.drag);e.dataTransfer.effectAllowed="move"});
document.addEventListener("dragover",e=>{const c=e.target.closest&&e.target.closest(".ccell[data-k]");if(!c)return;e.preventDefault();document.querySelectorAll(".ccell.over").forEach(x=>{if(x!==c)x.classList.remove("over")});c.classList.add("over")});
document.addEventListener("dragleave",e=>{const c=e.target.closest&&e.target.closest(".ccell");if(c&&!c.contains(e.relatedTarget))c.classList.remove("over")});
document.addEventListener("drop",e=>{const c=e.target.closest&&e.target.closest(".ccell[data-k]");if(!c)return;e.preventDefault();const it=S.content.find(x=>x.id===e.dataTransfer.getData("text/plain"));if(it&&it.date!==c.dataset.k){it.date=c.dataset.k;save();toast("Átütemezve: "+fmtDate(it.date));}render()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeForm();if(trayOpen||ui.sel){trayOpen=false;ui.sel=null;markSel();drawer()}}});
document.addEventListener("submit",e=>{
  e.preventDefault();const f=e.target;
  if(f.dataset.form==="book"){const t=$("#book-title").value.trim(),a=$("#book-author").value.trim(),st=$("#book-status").value;if(!t){toast("Írd be a könyv címét.");return}S.books=S.books||[];S.books.unshift({id:uid(),title:t,author:a,status:st,progress:st==="kesz"?100:0,started:st==="olvasom"?T:"",finished:st==="kesz"?T:""});save();toast("Könyv hozzáadva.");render();return}
  if(f.dataset.form==="todo"){const k=f.dataset.k,inp=f.querySelector("input"),v=inp.value.trim();if(!v)return;S.todos=S.todos||{};(S.todos[k]=S.todos[k]||[]).push({id:uid(),t:v,done:false});save();render();const n=document.getElementById("todo-"+k);n&&n.focus();return}
  if(f.dataset.form==="mq"){const t=$("#mq-text").value.trim(),a=$("#mq-a").value.trim();if(!t){toast("Írd be az idézetet.");return}S.myquotes=S.myquotes||[];
    if(ui.mq.editId){const q=S.myquotes.find(x=>x.id===ui.mq.editId);if(q){q.t=t;q.a=a}toast("Idézet mentve.")}else{S.myquotes.unshift({id:uid(),t,a});toast("Hozzáadva a gyűjteményedhez.")}
    ui.mq={t:"",a:"",editId:null};save();render();return}
  if(f.dataset.form==="habit"){const v=$("#habit-name").value.trim();if(!v){toast("Adj nevet a kihívásnak.");return}S.habits=S.habits||[];S.habits.unshift({id:uid(),name:v,start:T,len:30,days:{}});save();toast("Elindult a kihívás. Ma van az 1. nap.");render();return}
  if(f.dataset.form==="task"){const inp=f.querySelector("input"),v=inp.value.trim();if(!v)return;day(f.dataset.day).tasks.push({id:uid(),t:v,done:false});save();render();const n=document.getElementById("newtask-"+f.dataset.day);n&&n.focus();return}
  if(f.dataset.form==="item"){
    const type=f.dataset.type,F=FORMS[type],fd=new FormData(f),obj={};
    for(const[k,v]of fd.entries())obj[k]=NUMERIC.has(k)?(v===""?0:+v):v;
    if(type==="client"){obj.bday=obj.bdayFull?obj.bdayFull.slice(5):"";delete obj.bdayFull}
    if(f.dataset.id){Object.assign(S[F.coll].find(x=>x.id===f.dataset.id),obj)}
    else{obj.id=uid();obj.created=T;if(type==="member"){obj.active=true;obj.talk=T}if(type==="order"){obj.paid=false;logPt("order")}if(type==="contact")logPt("contact");S[F.coll].push(obj);
      if(type==="order"){const c=S.clients.find(c=>c.name===obj.client);if(c&&obj.date>(c.last||""))c.last=obj.date}}
    save();closeForm();toast("Mentve.");render();
  }
});
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.dataset.hour||t.dataset.loc){const k=t.dataset.day,h=t.dataset.hour||t.dataset.loc,dd=day(k);
    if(t.dataset.hour){dd.hours=dd.hours||{};if(t.value.trim())dd.hours[h]=t.value;else delete dd.hours[h]}
    else{dd.locs=dd.locs||{};if(t.value.trim())dd.locs[h]=t.value;else delete dd.locs[h]}
    save();const v=(dd.hours||{})[h]||"",loc=locOf(k,h);const ac=document.getElementById(`hacts-${k}-${h}`);if(ac)ac.innerHTML=v?apptLinks(k,h,v,loc):"";const li=document.getElementById(`loc-${k}-${h}`);if(li)li.placeholder=v?"Helyszín":""}
  else if(t.dataset.per){const pp=(S.periods||[]).find(x=>x.id===t.dataset.per);if(pp&&t.value){pp[t.dataset.pf]=t.value;save()}}
  else if(t.dataset.remt){S.reminders[t.dataset.remt]=t.value;save()}
  else if(t.dataset.bgc){S.prefs=S.prefs||{};S.prefs.bg=Object.assign({},bgPrefs(),{bgColor:t.value});save();repaint()}
  else if(t.dataset.brand){ui.brand[t.dataset.brand]=t.value;repaint()}
  else if(t.dataset.brandc){ui.brand.colors=Object.assign({},ui.brand.colors,{[t.dataset.brandc]:t.value});repaint()}
  else if(t.dataset.brandf){ui.brand.founder=Object.assign({},ui.brand.founder,{[t.dataset.brandf]:t.value})}
  else if(t.dataset.brandq){ui.brand.quotes=t.value.split("\n").map(x=>x.trim()).filter(Boolean)}
  else if(t.dataset.bnote){const b=(S.books||[]).find(x=>x.id===t.dataset.bnote);if(b){b.note=t.value;save()}}
  else if(t.dataset.bp){S.bp=S.bp||{};const d=S.bp[T]||(S.bp[T]={});d[t.dataset.bp]=t.value;save()}
  else if(t.id==="mq-text"){ui.mq.t=t.value}
  else if(t.id==="mq-a"){ui.mq.a=t.value}
  else if(t.dataset.close){const dd=day(t.dataset.close);dd.close=dd.close||{};dd.close.a=dd.close.a||[];dd.close.a[+t.dataset.q]=t.value;save()}
  else if(t.dataset.tpl){S.tpl=S.tpl||{};S.tpl[t.dataset.tpl]=t.value;save()}
  else if(t.dataset.qset!=null){S.settings.questions=S.settings.questions||Q_DEFAULT.slice();S.settings.questions[+t.dataset.qset]=t.value;save()}
  else if(t.dataset.mnode){const m=curMap();const n=m&&m.nodes.find(x=>x.id===t.dataset.mnode);if(n){n.t=t.value;save();const el=document.querySelector(`.mnode[data-nid="${n.id}"] .mt`);if(el)el.textContent=n.t||"…"}}
  else if(t.dataset.mtitle!=null){const m=curMap();if(m){m.title=t.value;save()}}
  else if(t.dataset.mk){ui.mk.text=t.value;const pv=document.getElementById("mk-prev");if(pv)pv.innerHTML=customHTML({type:ui.mk.type,text:t.value||"Szöveg",ci:ui.mk.color})}
  else if(t.dataset.note){day(t.dataset.note).note=t.value;save()}
  else if(t.dataset.set){S.settings[t.dataset.set]=t.value;save();nav()}
  else if(t.dataset.step){S.settings.steps[+t.dataset.step]=t.value;save()}
});
document.addEventListener("change",e=>{
  const t=e.target,m=ym(TODAY);
  if(t.dataset.bp||t.dataset.per){render();return}
  if(t.id==="brand-logo"&&t.files&&t.files[0]){const f=t.files[0];if(f.size>300*1024){toast("A logó legfeljebb 300 KB lehet.");return}const r=new FileReader();r.onload=()=>{ui.brand.logo=String(r.result);repaint();render()};r.readAsDataURL(f);return}
  if(t.id==="mk-file"&&t.files&&t.files[0]){const f=t.files[0];const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const mx=360,sc=Math.min(1,mx/Math.max(img.width,img.height));const cv=document.createElement("canvas");cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);const src=cv.toDataURL(f.type==="image/jpeg"?"image/jpeg":"image/png",.9);S.custom.push({id:uid(),type:"img",src});if(save()){toast("Kép hozzáadva a saját matricáidhoz.")}else{S.custom.pop();toast("Ez a kép túl nagy a prototípusnak. Próbálj kisebbet.")}render()};img.onerror=()=>toast("Ezt a képet nem tudtam megnyitni.");img.src=r.result};r.readAsDataURL(f);return}
  if(t.dataset.goal){S.goals[m][t.dataset.goal].cel=+t.value||0;save();render()}
  else if(t.dataset.actIn){S.goals[m][t.dataset.actIn].teny=+t.value||0;save();render()}
});

if(!S.unlocked){S.unlocked={};checkAch(true)}
if(!S.maps){S.maps=[S.blank?{id:uid(),title:"Első térképem",nodes:[{id:uid(),x:700,y:450,t:"A céljaim",p:null}]}:sampleMap()];save()}
go();
return {render,replace(st){S=st&&st.v?st:S;migrate();render()},get state(){return S}};
};
})();
