/* Sikermaker — a tervező maga (nézetek, események). A prototípusból készült; arculat: theme.js,
 * tárolás: store.js, PolyOS-híd: polyos.js, indítás: boot.js. */
(function(){
"use strict";
const ST=(window.ST=window.ST||{});
ST.start=function(ctx){
const SIGNUP_CTA=ctx.signupOpen?"Regisztrálok és elkezdem":"Feliratkozom a várólistára";
const BR=ctx.brand, TH=ST.theme, PX=ST.polyos, DEMO=ctx.mode!=="cloud";
// csomag: ingyenes / pro. A white label márka felhasználói Pro-t kapnak.
const PRO=ctx.plan==="pro"||BR.plan==="whitelabel";
const PRO_VIEWS=["tartalom","kapcsolatok","ugyfelek","szamok"];
// márkánként bekapcsolható funkciók (a superadmin kapcsolja be egy white label márkának); alapból kikapcsolva
const FEAT=k=>!!(BR.features&&BR.features[k]);
// bemutatóban a Pro funkciókat egy kis „PRO” címke jelöli, hogy egyértelmű legyen, mi tartozik a Pro csomaghoz
const SHOWPRO=DEMO&&PRO;
const proTag=(cls)=>SHOWPRO?`<span class="protag${cls?" "+cls:""}" title="A Pro csomag része">PRO</span>`:"";
const PRO_PRICE="1 990 Ft / hó";
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
    v:1,seed:2,
    settings:{name:"Anna",cur:"Ft",steps:["Poszt","Sztori","Új kapcsolat","Utánkövetés",FEAT("csapat")?"Csapat":"Tanulás"]},
    days,
    contacts:[
      {id:uid(),name:"Horváth Rita",src:"Instagram",interest:"Üzlet",stage:2,next:"Bemutató online",nextDate:d(0),note:"Két gyerek, otthonról dolgozna",created:d(-9)},
      {id:uid(),name:"Minta Kata",src:"Ajánlás (Edit)",interest:"Termék",stage:1,next:"Mintát küldeni",nextDate:d(-2),note:"",created:d(-6)},
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
// bemutató: ha a böngészőben egy régebbi mintaadat-készlet van elmentve, az újra cseréljük (a mintaadatok változtak)
const DEMO_SEED=2;
if(DEMO&&(S.seed||0)<DEMO_SEED){S=sample();S.unlocked={};S.maps=[sampleMap()];setTimeout(save,0)}
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
// szépségipari matricák: csak annál a márkánál, ahol a superadmin bekapcsolta (FEAT "matricak")
const BEAUTY_ICONS=["polish","lipstick","phone"];
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
function allKeys(){return [["Kiérdemelt",ACH.filter(a=>S.unlocked&&S.unlocked[a.id]).map(a=>"a:"+a.id)],["Saját idézetek",(S.myquotes||[]).map(q=>"mq:"+q.id)],["Idézetek",QUOTES.map((_,i)=>"q:"+i)],["Saját",(S.custom||[]).map(c=>"c:"+c.id)],["Címkék",PILLS.map((_,i)=>"p:"+i)],["Kézírás",HNOTES.map((_,i)=>"h:"+i)],["Tárgyak és jelek",Object.keys(ICONS).filter(k=>FEAT("matricak")||!BEAUTY_ICONS.includes(k))],["Ragasztószalag",TAPES().map((_,i)=>"t:"+i)]]}
function selSticker(){if(!ui.sel)return null;return (S.stickers[ui.sel.b]||[]).find(z=>z.id===ui.sel.id)||null}
let activeBoard=null, trayOpen=false, revOpenPanel=false;
function drawer(){
  const el=$("#drawer");
  // a heti/havi értékelő itt „telik be" (nem felugró ablak): egy fül a matrica-gomb fölött, minden oldalon
  const due=(DEMO||S.onboarded)?dueReviews():[];
  if(!activeBoard&&!due.length){el.innerHTML="";return}
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
  if(due.length){
    if(revOpenPanel)h+=`<div class="tray revtray" role="dialog" aria-label="Értékelések"><div class="row between"><h3>Értékelő vár</h3><a href="#ertekelesek" class="trlink" data-act="revpanel">Összes értékelés</a></div>${due.map(r=>`<div class="li"><div class="grow"><div class="t">${r.type==="het"?"Heti értékelő":"Havi értékelő"}</div><div class="s">${esc(revLabel(r.key))}${r.state==="missed"?' · <span style="color:var(--warn)">kimaradt</span>':""}</div></div><button class="btn small" data-act="revopen" data-k="${r.key}">Kitöltöm</button></div>`).join("")}</div>`;
    h+=`<button class="btn revfab" data-act="revpanel" aria-expanded="${revOpenPanel}" aria-label="Értékelő vár: ${due.length}"><span class="fi" aria-hidden="true">📝</span><span class="fl">${due.some(r=>r.state==="missed")?"Kimaradt értékelő":"Értékelő vár"}</span><i class="tbadge">${due.length}</i></button>`;
  }
  if(activeBoard)h+=`<button class="btn gold fab" data-act="tray" aria-expanded="${trayOpen}" aria-label="${trayOpen?"Kész":"Matricák"}"><span class="fi" aria-hidden="true">${trayOpen?"✓":"★"}</span><span class="fl">${trayOpen?"Kész":"Matricák"}</span></button>`;
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
        // a Vezérlőpulton a matrica a teljes tartalmi területen mozoghat (a blokkokon kívül is), máshol a táblán belül
        const free=b.parentNode&&b.parentNode.id==="dash",area=free?(document.querySelector(".main")||b).getBoundingClientRect():rect;
        const xmin=free?(area.left+12-rect.left)/rect.width*100:2,xmax=free?(area.right-12-rect.left)/rect.width*100:98;
        const ymin=free?(area.top+12-rect.top)/rect.height*100:2,ymax=free?(Math.max(area.bottom,rect.bottom)-12-rect.top)/rect.height*100:98;
        const x=Math.min(xmax,Math.max(xmin,(e.clientX-rect.left)/rect.width*100));
        const y=Math.min(ymax,Math.max(ymin,(e.clientY-rect.top)/rect.height*100));
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
const VIEWS=[["ma","Vezérlőpult"],["naptar","Naptár"],["szokasok","Szokások"],["terkep","Gondolattérkép"],["olvasas","Olvasás"],["kapcsolatok","Kapcsolatok"],["ugyfelek","Ügyfelek"],["tartalom","Tartalom"],["csapat","Csapat"],["szamok","Számok"],["ertekelesek","Értékelések"],["matricak","Matricák"],["bovitesek","Bővítések"],["beallitasok","Beállítások"]];
[["csapat","csapat"],["szamok","szamok"]].forEach(([v,f])=>{if(!FEAT(f)){const i=VIEWS.findIndex(x=>x[0]===v);if(i>=0)VIEWS.splice(i,1)}});
// kikapcsolt PolyOS-ajánlónál (Admin → Márkák) a Bővítések menüpont sem látszik, hacsak nincs már összekapcsolt PolyOS-modul
if(!BR.upsell&&!PX.MODULES.some(m=>PX.has(m.key))){const i=VIEWS.findIndex(x=>x[0]==="bovitesek");if(i>=0)VIEWS.splice(i,1)}
if(BR.plan==="whitelabel"&&(ctx.brandAdmin||ctx.mode!=="cloud"))VIEWS.push(["markam","Márkám"]);
if(ctx.superadmin)VIEWS.push(["admin","Admin"]);
let route="ma";
let ui={calMonth:ym(TODAY),selDay:T,calMode:"honap",ccMonth:ym(TODAY),cTab:"naptar",kFilter:"all",pFilter:-1,sel:null,mq:{t:"",a:"",editId:null},mqdel:null,skip:[],hdel:null,mapId:null,mapSel:null,mk:{type:"pill",text:"Bemutató 18:00",color:0,editId:null},cdel:null};

function dueCounts(){
  const f=S.contacts.filter(c=>c.nextDate&&c.nextDate<=T&&c.stage<4).length;
  const r=S.clients.filter(c=>reorderDue(c)<=3).length;
  return {f,r};
}
function reorderDate(c){return c.last?iso(addDays(parse(c.last),+c.cycle||30)):""}
function reorderDue(c){return c.last?diff(reorderDate(c)):999}
/* mobil alsó menü: 4 fő nézet + „Több" (a többi nézet egy alulról felcsúszó lapon) */
const NICON={
  ma:'<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  naptar:'<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  kapcsolatok:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.5 14.3c2.3-.3 4.4 1.2 5 4.2"/>',
  tartalom:'<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  tobb:'<circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/>',
  szokasok:'<path d="M5 12.5l4 4 10-10"/>',terkep:'<circle cx="12" cy="12" r="3"/><circle cx="4.5" cy="6" r="2"/><circle cx="19.5" cy="6" r="2"/><circle cx="4.5" cy="18" r="2"/><circle cx="19.5" cy="18" r="2"/><path d="M6.2 7.2l3.4 3M17.8 7.2l-3.4 3M6.2 16.8l3.4-3M17.8 16.8l-3.4-3"/>',
  olvasas:'<path d="M4 5.5c3-1.2 5.7-1 8 1 2.3-2 5-2.2 8-1V19c-3-1.2-5.7-1-8 1-2.3-2-5-2.2-8-1z"/><path d="M12 6.5V20"/>',
  ugyfelek:'<path d="M5 8h14l-1.3 10.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  csapat:'<circle cx="12" cy="7.5" r="3"/><circle cx="5.5" cy="10" r="2.2"/><circle cx="18.5" cy="10" r="2.2"/><path d="M7 19c.5-3 2.5-4.6 5-4.6s4.5 1.6 5 4.6M2.5 18c.3-2 1.5-3.2 3-3.4M21.5 18c-.3-2-1.5-3.2-3-3.4"/>',
  szamok:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',matricak:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  bovitesek:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><path d="M16.5 13v7M13 16.5h7"/>',
  ertekelesek:'<path d="M5 4h11l3 3v13H5z"/><path d="M8.5 12.5l2 2 4-4.5M8.5 8h5"/>',
  markam:'<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M9.5 20v-5.5h5V20"/>',
  admin:'<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  beallitasok:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'
};
const nicon=k=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NICON[k]||""}</svg>`;
const TABS=["ma","naptar","kapcsolatok","tartalom"];
function navBadge(k,dc){if(!PRO&&PRO_VIEWS.includes(k))return 0;if(k==="kapcsolatok"&&dc.f)return dc.f;if(k==="ugyfelek"&&dc.r)return dc.r;return 0}
function nav(){
  const dc=dueCounts();
  $("#nav").innerHTML=VIEWS.map(([k,l])=>{
    const n=navBadge(k,dc),b=!PRO&&PRO_VIEWS.includes(k)?'<span class="badge probadge">PRO</span>':(n?`<span class="badge">${n}</span>`:"")+(PRO_VIEWS.includes(k)?proTag():"");
    return `<a href="#${k}" ${route===k?'aria-current="page"':""}>${l}${b}</a>`}).join("");
  const tb=$("#tabbar");
  if(tb){
    const restBadge=VIEWS.filter(([k])=>!TABS.includes(k)).reduce((a,[k])=>a+navBadge(k,dc),0);
    const inRest=!TABS.includes(route);
    tb.innerHTML=TABS.map(k=>{const l=(VIEWS.find(v=>v[0]===k)||[k,k])[1],n=navBadge(k,dc);return `<a href="#${k}" class="tab" ${route===k?'aria-current="page"':""}>${nicon(k)}<span>${l}</span>${PRO_VIEWS.includes(k)?proTag("tpro"):""}${n?`<i class="tbadge">${n}</i>`:""}</a>`}).join("")
      +`<button type="button" class="tab" data-act="more" ${inRest?'aria-current="page"':""} aria-haspopup="dialog">${nicon("tobb")}<span>${inRest?esc((VIEWS.find(v=>v[0]===route)||["",""])[1]):"Több"}</span>${restBadge?`<i class="tbadge">${restBadge}</i>`:""}</button>`;
  }
  const mt=$("#mtitle");if(mt)mt.textContent=(VIEWS.find(v=>v[0]===route)||["",""])[1];
}
function openMore(){
  const dc=dueCounts();
  $("#layer").innerHTML=`<div class="modal" data-act="close"><div class="sheet moresheet" role="dialog" aria-label="Minden nézet"><div class="grabber" aria-hidden="true"></div><div class="row between"><h2>Minden nézet</h2><button type="button" class="iconbtn" data-act="close" aria-label="Bezárás">×</button></div>
  <div class="moregrid">${VIEWS.filter(([k])=>!TABS.includes(k)).map(([k,l])=>{const n=navBadge(k,dc);return `<a href="#${k}" class="moreitem" data-act="close" ${route===k?'aria-current="page"':""}>${nicon(k)}<span>${l}</span>${PRO_VIEWS.includes(k)?proTag("tpro"):""}${n?`<i class="tbadge">${n}</i>`:""}</a>`}).join("")}</div>
  ${DEMO&&ctx.cloud?`<button class="btn" data-act="signup">${SIGNUP_CTA}</button>`:""}${!DEMO?`<button class="btn ghost" data-act="logout">Kijelentkezés</button>`:""}</div></div>`;
}

/* ---------- views ---------- */
function head(title,sub,right,hand){return `<div class="head"><div class="stack"><div class="eyebrow">${esc(sub)}</div><h1>${esc(title)}${hand?` <span class="hand">${esc(hand)}</span>`:""}${PRO_VIEWS.includes(route)?proTag("hpro"):""}</h1></div><div class="row">${right||""}${DEMO&&!ctx.cloud?'<span class="proto">Bemutató mód, mintaadatokkal</span>':""}${syncBadge()}</div></div>`}

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

function proBlock(dc,rc,bd,cont,st){return `  <div class="grid g4 kpirow">
    <div class="card kpi"><div class="v num red">${st.contacts}</div><div class="l">új kapcsolat ebben a hónapban</div></div>
    <div class="card kpi"><div class="v num">${st.clients}</div><div class="l">új ügyfél</div></div>
    ${FEAT("csapat")?`<div class="card kpi"><div class="v num">${st.team}</div><div class="l">új csapattag</div></div>`:""}
    ${FEAT("szamok")?`<div class="card kpi"><div class="v num">${money(st.revenue)}</div><div class="l">bevétel a rendelésekből</div></div>`:""}
  </div>
  <div class="grid g3">
    <div class="card"><h3>Kit keress meg ma?</h3><div class="list">${dc.map(c=>`<div class="li"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.next)} · ${STAGES[c.stage]}</div></div>${c.nextDate<T?`<span class="chip warn">${-diff(c.nextDate)} napja</span>`:'<span class="chip">ma</span>'}<button class="iconbtn" data-act="msg" data-k="${c.stage===1?"bemutato":"utankovetes"}" data-type="contact" data-id="${c.id}" aria-label="Üzenetvázlat" title="Üzenetvázlat">${MSGICON}</button><button class="iconbtn" data-act="cdone" data-id="${c.id}" aria-label="Megvolt" title="Megvolt">✓</button></div>`).join("")||'<div class="empty">Mára nincs esedékes utánkövetés.</div>'}</div></div>
    <div class="card"><h3>Újrarendelés, szülinap</h3><div class="list">${rc.map(c=>`<div class="li"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.fav)}</div></div><span class="chip ${reorderDue(c)<0?"warn":""}">${reorderDue(c)<0?-reorderDue(c)+" napja esedékes":reorderDue(c)===0?"ma esedékes":reorderDue(c)+" nap múlva"}</span><button class="iconbtn" data-act="msg" data-k="ujrarendeles" data-type="client" data-id="${c.id}" aria-label="Üzenetvázlat" title="Üzenetvázlat">${MSGICON}</button></div>`).join("")}${bd.map(c=>`<div class="li"><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">születésnap a héten</div></div><span class="chip good">Szülinap</span><button class="iconbtn" data-act="msg" data-k="szulinap" data-type="client" data-id="${c.id}" aria-label="Üzenetvázlat" title="Üzenetvázlat">${MSGICON}</button></div>`).join("")}${!rc.length&&!bd.length?'<div class="empty">Nincs teendő az ügyfeleiddel.</div>':""}</div></div>
    <div class="card"><h3>Mai tartalom</h3><div class="list">${cont.map(c=>`<div class="li"><span class="dot" style="background:var(--p${c.pillar+1})"></span><div class="grow"><div class="t">${esc(c.title)}</div><div class="s">${c.format} · ${PILLARS[c.pillar]}</div></div><button class="chip" data-act="cstat" data-id="${c.id}">${CSTATUS[c.status]}</button></div>`).join("")||'<div class="empty">Mára nincs betervezett tartalom.</div>'}</div><div style="margin-top:10px"><a class="btn ghost small" href="#tartalom" style="text-decoration:none">Tartalomnaptár</a></div></div>
  </div>
`}
/* ---------- Vezérlőpult: átrendezhető blokkok ----------
   A blokkok sorrendje, mérete és láthatósága a felhasználó tervében él (S.prefs.dash), így minden eszközén ugyanaz.
   Méret: a 6 oszlopos rácsban hány oszlopot foglal (2 = keskeny, 3 = fél, 4 = széles, 6 = teljes). */
const DASH_DEF=[["kovetkezo","A következő lépésed",6],["lepesek","A mai napi lépéseid",4],["lendulet","Napi lendület",2],["allas","Napi állás",6],["pro","Kapcsolatok, ügyfelek, tartalom",6],["beosztas","Mai beosztás",3],["teendok","Mai teendők",3],["szokasok","Szokások",3],["zaras","Napzárás",3]];
const DASH_SIZES=[[2,"Keskeny"],[3,"Fél"],[4,"Széles"],[6,"Teljes"]];
function dashPrefs(){S.prefs=S.prefs||{};const d=S.prefs.dash||(S.prefs.dash={});d.order=Array.isArray(d.order)?d.order:[];d.hidden=Array.isArray(d.hidden)?d.hidden:[];d.size=d.size&&typeof d.size==="object"?d.size:{};return d}
function dashOrder(){const d=dashPrefs(),ids=DASH_DEF.map(x=>x[0]);return d.order.filter(k=>ids.includes(k)).concat(ids.filter(k=>!d.order.includes(k)))}
function dashSize(k){const d=dashPrefs(),def=(DASH_DEF.find(x=>x[0]===k)||[])[2]||6,v=+d.size[k];return [2,3,4,6].includes(v)?v:def}
function vMa(){
  extLoad();
  activeBoard="ma-"+T;
  const dc=S.contacts.filter(c=>c.nextDate&&c.nextDate<=T).sort((a,b)=>a.nextDate.localeCompare(b.nextDate));
  const rc=S.clients.filter(c=>reorderDue(c)<=3).sort((a,b)=>reorderDue(a)-reorderDue(b));
  const bd=S.clients.filter(c=>{if(!c.bday)return false;for(let i=0;i<7;i++){if(iso(addDays(TODAY,i)).slice(5)===c.bday)return true}return false});
  const cont=S.content.filter(c=>c.date===T);
  const st=monthStats(ym(TODAY));
  const done=day(T).steps.filter(Boolean).length;
  const B={
    kovetkezo:()=>nextCard(),
    lepesek:()=>`<div class="card hero page"><div class="row between" style="align-items:flex-start"><div class="stack" style="gap:4px;max-width:60ch">
    <div class="eyebrow">A mai napi lépéseid</div><div class="big">${done===5?"Mind az 5 megvan. Büszke lehetsz Magadra!":done?`${done} / 5 kész, így tovább!`:"Ma is közelebb kerülhetsz a céljaidhoz."}</div></div>
    <span class="row" style="gap:6px"><div class="chip good">${streak()} napos sorozat</div><button class="chip" data-act="stepedit" title="A napi lépések átnevezése">✎ Lépések</button></span></div>
    <div style="margin-top:14px">${ui.stepEdit?`<div class="stack" style="gap:8px"><p class="muted" style="margin:0;font-size:12.5px">Nevezd át a napi lépéseidet (5 lépés). A már kipipált napok megmaradnak.</p><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">${S.settings.steps.map((s,i)=>`<input type="text" data-step="${i}" value="${esc(s)}" maxlength="24" aria-label="${i+1}. lépés">`).join("")}</div><div class="row" style="justify-content:flex-end"><button class="btn small" data-act="stepedit">Kész</button></div></div>`:stepsHTML(T)}</div></div>`,
    lendulet:()=>pointsCard(),
    allas:()=>bpStrip(),
    pro:()=>`<div class="stack" style="gap:var(--gap,18px)">${PRO?proBlock(dc,rc,bd,cont,st):proTeaser()}</div>`,
    beosztas:()=>`<div class="card"><div class="row between" style="margin-bottom:6px"><h3 style="margin:0">Mai beosztás</h3><button class="btn ghost small" data-act="opennap" data-k="${T}">Napi nézet</button></div><div class="list">${[...hoursOf(T).map(([h,v])=>({t:pad(h)+":00",own:[h,v]})),...extOf(T).map(e=>({t:e.allDay?"00:00":e.start,ext:e}))].sort((a,b)=>a.t.localeCompare(b.t)).map(x=>{if(x.ext){const e=x.ext;return `<div class="li"><span class="num tm">${e.allDay?"egész nap":e.start}</span><div class="grow"><div class="t">${esc(e.title)}</div><div class="s"><span class="dot" style="background:${esc(e.color)};width:8px;height:8px"></span> ${esc(e.calName)}${e.location?" · "+esc(e.location):""}</div></div></div>`}const[h,v]=x.own,loc=locOf(T,h);return `<div class="li"><span class="num tm ${+h===new Date().getHours()?"now":""}">${pad(h)}:00</span><div class="grow"><div class="t">${esc(v)}</div>${loc?`<div class="s">${esc(loc)}</div>`:""}</div>${apptLinks(T,h,v,loc)}</div>`}).join("")||'<div class="empty">Mára nincs beírt időpont.</div>'}</div></div>`,
    teendok:()=>`<div class="card"><h3>Mai teendők</h3>${tasksHTML(T)}</div>`,
    szokasok:()=>habitsToday(),
    zaras:()=>closeHTML(T,true),
  };
  const ed=!!ui.dashEdit,d=dashPrefs(),order=dashOrder();
  if(ed){activeBoard=null;trayOpen=false}
  const blocks=order.map(k=>{
    const name=(DASH_DEF.find(x=>x[0]===k)||[k,k])[1];
    if(d.hidden.includes(k))return "";
    const html=(B[k]||(()=>""))();
    if(!html||!String(html).trim())return "";
    const sz=dashSize(k);
    const tools=ed?`<div class="dtools" role="group" aria-label="${esc(name)}"><span class="dgrip" data-grip="${k}" title="Húzd az áthelyezéshez" aria-hidden="true">⠿</span><b>${esc(name)}</b>
      <span class="row" style="gap:4px;flex-wrap:nowrap"><button class="dbtn" data-act="dmove" data-k="${k}" data-d="-1" aria-label="Feljebb">↑</button><button class="dbtn" data-act="dmove" data-k="${k}" data-d="1" aria-label="Lejjebb">↓</button>
      <label class="dsel"><span class="sr">Méret</span><select data-dsize="${k}" aria-label="${esc(name)}: méret">${DASH_SIZES.map(([v,l])=>`<option value="${v}" ${v===sz?"selected":""}>${l}</option>`).join("")}</select></label><button class="dbtn" data-act="dhide" data-k="${k}" aria-label="Elrejtés">Elrejt</button></span></div>`:"";
    return `<div class="dblock" data-dk="${k}" style="--span:${sz}">${tools}<div class="dinner">${html}</div></div>`}).join("");
  const hiddenList=ed?DASH_DEF.filter(x=>d.hidden.includes(x[0])):[];
  const bar=ed?`<div class="card dashbar"><div class="grow"><b>A Vezérlőpult szerkesztése</b><div class="muted" style="font-size:12.5px">Fogd meg a ⠿ jelet, és húzd a blokkot a helyére (vagy használd a ↑ ↓ gombokat). A legördülő menüben a blokk szélességét állíthatod.</div>
      ${hiddenList.length?`<div class="row" style="gap:6px;margin-top:8px"><span class="muted" style="font-size:12.5px">Elrejtve:</span>${hiddenList.map(x=>`<button class="chip" data-act="dshow" data-k="${x[0]}">＋ ${esc(x[1])}</button>`).join("")}</div>`:""}</div>
      <div class="row" style="gap:8px"><button class="nc-skip" data-act="dreset">Alaphelyzet</button><button class="btn" data-act="dedit">Kész</button></div></div>`
    :`<div class="dashedit-row"><button class="chip" data-act="dedit">✎ Vezérlőpult szerkesztése</button></div>`;
  return installCard("ma")+head("Szia,",longDate(T),BR.founder.enabled&&S.settings.founder?'<button class="chip founderchip" data-act="cert" data-id="alapito" title="Alapító oklevél">Alapító tag</button>':"",(greetName()||"")+"!")+(()=>{const q=quoteOfDay();return `<p class="qday">„${esc(q.t)}”${q.a?` <span class="qday-a">${esc(q.a)}</span>`:""}</p>`})()+consentCard()+revBanner()+checklistCard()+bar+
  `<div class="dash${ed?" editing":""}" id="dash">${blocks}${ed?"":board(activeBoard)}</div>`;
}
/* Vezérlőpult: blokkok húzása (egér és érintés is, pointer eseményekkel) */
function bindDash(){
  const dash=$("#dash");if(!dash||!dash.classList.contains("editing"))return;
  dash.querySelectorAll("[data-grip]").forEach(g=>{
    g.addEventListener("pointerdown",e=>{
      const blk=g.closest(".dblock");if(!blk)return;e.preventDefault();
      g.setPointerCapture(e.pointerId);blk.classList.add("dragging");dash.classList.add("dragmode");
      const move=ev=>{
        const t=document.elementFromPoint(ev.clientX,ev.clientY),over=t&&t.closest(".dblock");
        if(over&&over!==blk&&over.parentNode===dash){const r=over.getBoundingClientRect(),before=(ev.clientY<r.top+r.height/2)||(ev.clientY<r.bottom&&ev.clientX<r.left+r.width/2&&r.width<dash.clientWidth*0.9);dash.insertBefore(blk,before?over:over.nextSibling)}
        const dr=dash.getBoundingClientRect();if(ev.clientY<80)window.scrollBy(0,-14);else if(ev.clientY>innerHeight-80)window.scrollBy(0,14);void dr;
      };
      const up=()=>{g.removeEventListener("pointermove",move);g.removeEventListener("pointerup",up);g.removeEventListener("pointercancel",up);
        blk.classList.remove("dragging");dash.classList.remove("dragmode");
        const d=dashPrefs(),shown=[...dash.querySelectorAll(".dblock")].map(x=>x.dataset.dk);
        d.order=shown.concat(dashOrder().filter(k=>!shown.includes(k)));save();render()};
      g.addEventListener("pointermove",move);g.addEventListener("pointerup",up);g.addEventListener("pointercancel",up);
    });
  });
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
  extLoad(false);
  const mode=ui.calMode;
  const ctrls=`<button class="btn small" data-act="qadd">+ Gyors hozzáadás</button><div class="tabs">${MODES.map(([k,l])=>`<button data-act="calmode" data-k="${k}" aria-pressed="${mode===k}">${l}</button>`).join("")}</div><span class="row" style="gap:6px"><button class="iconbtn" data-act="calnav" data-d="-1" aria-label="Előző">‹</button><button class="btn ghost small" data-act="caltoday">Ma</button><button class="iconbtn" data-act="calnav" data-d="1" aria-label="Következő">›</button></span>`;
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
        ${hrs.length?`<span class="mini"><b>${pad(hrs[0][0])}:00</b> ${esc(hrs[0][1])}</span>`:""}${hrs.length>1?`<span class="mini">+${hrs.length-1} időpont</span>`:""}${tk&&hrs.length<2?`<span class="mini">${tk} teendő</span>`:""}${extOf(k).slice(0,2).map(e=>`<span class="mini extmini" style="--c:${esc(e.color)}">${e.allDay?"":`<b>${e.start}</b> `}${esc(e.title)}</span>`).join("")}${extOf(k).length>2?`<span class="mini">+${extOf(k).length-2} más naptárból</span>`:""}
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
        ${extOf(k).map(e=>`<div class="wappt extappt" style="--c:${esc(e.color)}"><span class="num">${e.allDay?"Egész nap":e.start}</span>${esc(e.title)}<span class="extsrc">${esc(e.calName)}</span></div>`).join("")}
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
    body=`<div class="card page daypage"><div class="row between dp-top"><div class="row" style="gap:10px"><div class="eyebrow">Időbeosztás</div>${pointsChip(sel)}</div><button class="btn gold small" data-act="tray">Matrica a lapra</button></div><div class="dp-cols"><div>${extOf(sel).length?`<div class="extlist"><div class="eyebrow" style="margin-bottom:6px">Más naptárakból</div>${extOf(sel).map(e=>`<div class="li"><span class="dot" style="background:${esc(e.color)}"></span><span class="num tm">${extLabel(e)}</span><div class="grow"><div class="t">${esc(e.title)}</div><div class="s">${esc(e.calName)}${e.location?" · "+esc(e.location):""}</div></div></div>`).join("")}</div>`:""}<div class="hours">${hoursHTML}</div><p class="muted" style="font-size:12px;margin:10px 0 0">Írd be az időpontot, mellé a helyszínt: azonnal a tervezőbe mentődik. A Térkép a Google Térképet nyitja meg. A Google Naptárral és a telefonod naptárával a <a href="#beallitasok" data-act="tosync">Beállítások → Naptár-szinkron</a> alatt kötheted össze.</p></div>${dayPanels(sel)}</div>${board(activeBoard)}</div>`;
  }
  return head(title,mode==="nap"?"Napi nézet":mode==="het"?"Heti nézet":"Havi nézet",ctrls)+extStatus()+body;
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
  <div class="row between"><div class="tabs">${[["all","Mind"],["Termék","Termék iránt"],["Üzlet","Üzlet iránt"]].map(([k,l])=>`<button data-act="kf" data-k="${k}" aria-pressed="${ui.kFilter===k}">${l}</button>`).join("")}</div><span class="muted" style="font-size:12.5px">Az esedékes utánkövetéseket a Vezérlőpulton is megtalálod.</span></div>
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
    <p class="muted" style="margin:0;font-size:12.5px">Gyűjtsd ide a mondatokat, amik erőt adnak. Matricaként a lapjaidra teheted őket, és felbukkannak a Vezérlőpult napi gondolatai között is.</p>
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
  return head("Beállítások","Egyszer beírod, mindenhol ott lesz")+installCard("beallitasok")+accountCard()+planCard()+brandCard()+`
  <div class="grid g2">
    <div class="card stack"><h3>Rólad</h3>
      <label class="f">A neved<input type="text" id="set-name" data-set="name" value="${esc(S.settings.name)}"></label>
      <label class="f">Így szólíts (nem kötelező)<input type="text" id="set-nick" data-set="nick" value="${esc(S.settings.nick||"")}" maxlength="30"></label><label class="f">Pénznem<input type="text" id="set-cur" data-set="cur" value="${esc(S.settings.cur)}"></label><button class="chip" data-act="obstart" style="align-self:flex-start">Bevezető újra</button></div>
    <div class="card stack"><div class="row between"><h3 style="margin:0">Pontrendszer</h3><button class="chip" data-act="pttoggle">${S.settings.ptOff?"Bekapcsolom":"Nincs rá szükségem"}</button></div><p class="muted" style="margin:0;font-size:12.5px">Minden cégnél másképp hívják. Írd be, nálad hogy szerepel, és mik a havi céljaid.</p>
      <label class="f">A pont neve a cégednél (pl. BP, PV, CC)<input type="text" id="set-ptname" data-set="ptName" value="${esc(S.settings.ptName||"")}" placeholder="pont"></label>
      <div class="row" style="flex-wrap:nowrap;gap:8px"><label class="f" style="flex:1">Havi személyes cél<input type="number" id="set-ptgoal" data-set="ptGoal" value="${esc(S.settings.ptGoal||"")}"></label><label class="f" style="flex:1">Havi csoportcél<input type="number" id="set-gpgoal" data-set="gpGoal" value="${esc(S.settings.gpGoal||"")}"></label></div>
      <label class="f">A következő szinted neve (nem kötelező)<input type="text" id="set-lvl" data-set="lvlName" value="${esc(S.settings.lvlName||"")}" placeholder="Például: Vezető"></label></div>
    <div class="card stack"><h3>Az 5 napi lépésed</h3><p class="muted" style="margin:0;font-size:12.5px">Ezeket pipálod ki minden nap a Vezérlőpulton és a naptárban.</p>
      ${S.settings.steps.map((s,i)=>`<label class="f">${i+1}. lépés<input type="text" id="set-step-${i}" data-step="${i}" value="${esc(s)}"></label>`).join("")}</div>
  </div>
  <div class="grid g2">
    <div class="card stack"><h3>Esti kérdéseid</h3><p class="muted" style="margin:0;font-size:12.5px">Ezekkel zárod a napot a Vezérlőpulton és a napi nézetben.</p>
      ${questions().map((q,i)=>`<label class="f">${i+1}. kérdés<input type="text" id="set-q-${i}" data-qset="${i}" value="${esc(q)}"></label>`).join("")}</div>
    ${calSyncCard()}
  </div>
  ${FEAT("sablonok")?`<div class="card stack"><h3>Üzenetvázlataid</h3><p class="muted" style="margin:0;font-size:12.5px">A {nev} helyére az ember keresztneve, a {termek} helyére a kedvenc terméke, a {sajat} helyére a Te neved kerül.</p>
    <div class="grid g2">${Object.keys(TPL_DEFAULT).map(k=>`<label class="f">${esc(TPL_DEFAULT[k][0])}<textarea id="tpl-${k}" data-tpl="${k}" rows="4">${esc(tpl(k))}</textarea>${S.tpl&&S.tpl[k]!=null?`<button type="button" class="chip" data-act="tplreset" data-k="${k}" style="align-self:flex-start">Eredeti szöveg visszaállítása</button>`:""}</label>`).join("")}</div></div>`:""}
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
const ACH_ALL=[
  {id:"elso-ertekeles",t:"Első értékelés",n:"✍",d:"Kitöltötted az első heti vagy havi értékelődet.",test:()=>Object.values(S.reviews||{}).some(r=>r&&r.done)},
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
const ACH=ACH_ALL.filter(a=>FEAT("csapat")||!/csapat/.test(a.id));
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
  ${PRO&&!DEMO&&ctx.emailReady?`<div class="grid g2"><label class="f">E-mail-cím<input type="email" id="msgto" value="${esc(v.email||"")}" placeholder="pelda@pelda.hu"></label><label class="f">Tárgy<input type="text" id="msgsubj" maxlength="150" value="${esc(TPL_DEFAULT[k][0])}"></label></div>`:""}
  <label class="f">Igazítsd a saját szavaidra, aztán ${PRO&&!DEMO&&ctx.emailReady?"küldd el e-mailben, vagy ":""}másold be Messengerbe vagy SMS-be.<textarea id="msgtext" rows="6">${esc(fillTpl(k,v))}</textarea></label>
  <div class="row between"><span class="muted" style="font-size:12px">${FEAT("sablonok")?"A sablonokat a Beállításokban írhatod át.":""}</span><span class="row">${PRO&&!DEMO&&!ctx.emailReady?'<button class="btn" data-act="msgcopy">Másolás</button><span class="chip" title="Az e-mail-küldés bekapcsolása folyamatban">E-mail: hamarosan</span>':PRO&&!DEMO?'<button class="btn" data-act="msgsend">Küldés e-mailben</button><button class="btn ghost" data-act="msgcopy">Másolás</button>':!PRO?'<button class="btn" data-act="msgcopy">Másolás</button><a class="chip" href="#kapcsolatok" title="E-mail küldése a Pro csomagban">E-mail: Pro</a>':'<button class="btn" data-act="msgcopy">Másolás</button>'}${done?`<button class="btn ghost" data-act="${done.act}" data-id="${done.id}">${esc(done.label)}</button>`:""}</span></div></div></div>`;
}

/* ---------- következő lépés ---------- */
function suggestions(){
  const out=[];
  S.contacts.filter(c=>c.nextDate&&c.nextDate<=T).sort((a,b)=>a.nextDate.localeCompare(b.nextDate)).forEach(c=>{
    const late=-diff(c.nextDate);
    out.push({id:"c"+c.id,eyebrow:"Utánkövetés",title:`Keresd meg ${c.name} kapcsolatodat.`,sub:`${c.next||"Következő lépés"} · ${late?late+" napja esedékes":"ma esedékes"}`,
      msg:{k:c.stage>=1&&c.stage<2?"bemutato":"utankovetes",v:{email:c.email||"",nev:firstName(c.name),full:c.name},done:{act:"cdone",id:c.id,label:"Megvolt"}},done:{act:"cdone",id:c.id,label:"Megvolt"}});
  });
  S.clients.filter(c=>reorderDue(c)<=0).forEach(c=>out.push({id:"r"+c.id,eyebrow:"Újrarendelés",title:`${c.name} kedvencei mostanra fogyhatnak el.`,sub:`${c.fav} · ${-reorderDue(c)?(-reorderDue(c))+" napja esedékes":"ma esedékes"}`,
    msg:{k:"ujrarendeles",v:{email:c.email||"",nev:firstName(c.name),full:c.name,termek:c.fav}},done:{act:"order",id:c.id,label:"Rendelés rögzítése"}}));
  S.clients.forEach(c=>{if(!c.bday)return;for(let i=0;i<4;i++){if(iso(addDays(TODAY,i)).slice(5)===c.bday){out.push({id:"b"+c.id,eyebrow:"Születésnap",title:i?`${c.name} ${i} nap múlva ünnepel.`:`Ma van ${c.name} születésnapja.`,sub:"Egy kedves üzenet többet ér minden akciónál.",msg:{k:"szulinap",v:{email:c.email||"",nev:firstName(c.name),full:c.name}}});break}}});
  S.team.filter(t=>t.talk&&diff(t.talk)<-14).forEach(t=>out.push({id:"t"+t.id,eyebrow:"Csapat",title:`${-diff(t.talk)} napja nem beszéltél ${t.name} csapattagoddal.`,sub:t.goal?"A célja: "+t.goal:"Egy rövid hívás sokat jelent.",msg:{k:"csapattag",v:{nev:firstName(t.name),full:t.name},done:{act:"talk",id:t.id,label:"Ma beszéltünk"}},done:{act:"talk",id:t.id,label:"Ma beszéltünk"}}));
  const m=mondayOf(T),wk=[0,1,2,3,4,5,6].map(i=>iso(addDays(m,i)));
  if(!S.content.some(c=>wk.includes(c.date)&&c.date>=T)){out.push({id:"content",eyebrow:"Tartalom",title:"Erre a hétre még nincs betervezett tartalmad.",sub:"Válassz egy ötletet az Ötletbankból, és tedd be a naptárba.",go:{label:"Tartalomnaptár",href:"tartalom"}})}
  if(new Date().getHours()>=17&&!(S.days[T]&&S.days[T].close&&S.days[T].close.mood!=null))out.push({id:"close",eyebrow:"Esti zárás",title:"Zárd le a napot két perc alatt.",sub:"Három kérdés és a hangulatod: így látod, mennyit haladtál.",anchor:"estizaras"});
  const cp=curPeriod();if(cp){const c=cdParts(cp.end);if(c&&c.d<3){const b=bpPeriod(cp),pg=+S.settings.ptGoal||0,miss=Math.max(0,pg-b.personal);out.unshift({id:"per-"+cp.id,eyebrow:"Periódus zárása",title:`Még ${cdText(cp.end)} a zárásig.`,sub:miss?`A személyes célodhoz még ${nfmt(miss)} ${ptName()} hiányzik.`:"A személyes célod megvan. Segíts a csapatodnak is!",go:{label:"Napi állás",href:"szamok"}})}}
  return out.filter(x=>!ui.skip.includes(x.id)&&(PRO||!/^(c|r|b|content)/.test(x.id)||x.id.startsWith("close")));
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
const MOODS_DEFAULT=["Fáradt","Nyugodt","Jó","Lelkes","Csúcs"];
// a hangulatgombok szövege átírható (Esti zárás → ✎ Kérdések); a sorrend (rossztól a jóig) marad
const moods=()=>MOODS_DEFAULT.map((m,i)=>(S.settings.moods&&String(S.settings.moods[i]||"").trim())||m);
const Q_DEFAULT=["Kinek segítettem ma?","Mi vitt ma közelebb a célomhoz?","Mire vagyok ma büszke?"];
const questions=()=>S.settings.questions||Q_DEFAULT;
function closeHTML(k,card){
  const dd=day(k),c=dd.close||{};
  // a kérdések helyben is átírhatók (✎ Kérdések): ugyanazok, mint a Beállításokban
  if(card&&ui.qEdit){const qs=questions();return `<div class="card stack" id="estizaras" style="gap:10px"><div class="row between"><h3 style="margin:0">Esti zárás: a kérdéseid</h3><button class="btn small" data-act="qedit">Kész</button></div>
    <p class="muted" style="margin:0;font-size:12.5px">Írd át őket a saját szavaidra. Legfeljebb 5 kérdés lehet; minden este ezekre válaszolsz.</p>
    ${qs.map((q,i)=>`<div class="row" style="gap:6px;flex-wrap:nowrap"><label class="f grow" style="margin:0">${i+1}. kérdés<input type="text" data-qset="${i}" value="${esc(q)}" maxlength="120"></label>${qs.length>1?`<button class="iconbtn" data-act="qdel" data-i="${i}" aria-label="${i+1}. kérdés törlése" style="align-self:flex-end">×</button>`:""}</div>`).join("")}
    <div class="row between">${qs.length<5?'<button class="chip" data-act="qadd">＋ Új kérdés</button>':"<span></span>"}<button class="nc-skip" data-act="qreset">Eredeti kérdések</button></div>
    <div class="lab2" style="margin-top:6px">„Milyen volt a napod?” gombok (a rosszabbtól a jobbig)</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px">${moods().map((m,i)=>`<input type="text" data-moodset="${i}" value="${esc(m)}" maxlength="20" aria-label="${i+1}. hangulat">`).join("")}</div></div>`}
  const inner=`<div class="stack" style="gap:10px">${questions().map((q,i)=>!String(q).trim()?"":`<label class="f">${esc(q)}<input type="text" id="close-${k}-${i}" data-close="${k}" data-q="${i}" value="${esc((c.a||[])[i]||"")}"></label>`).join("")}
    <div><div class="lab2">Milyen volt a napod?</div><div class="moods">${moods().map((m,i)=>`<button class="mood m${i}" data-act="mood" data-day="${k}" data-i="${i}" aria-pressed="${c.mood===i}">${m}</button>`).join("")}</div></div></div>`;
  return card?`<div class="card" id="estizaras"><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">Esti zárás</h3><span class="row" style="gap:6px">${c.mood!=null?'<span class="chip good">Lezártad a napot</span>':""}<button class="chip" data-act="qedit" title="A kérdések átírása">✎ Kérdések</button></span></div>${inner}</div>`:`<div id="estizaras"><div class="eyebrow" style="margin-bottom:8px">Esti zárás</div>${inner}</div>`;
}

/* ---------- naptár és térkép ---------- */
const enc=encodeURIComponent;
function apptLinks(k,h,v,loc){return `${loc?`<a class="alink" href="${mapURL(loc)}" target="_blank" rel="noopener">Térkép</a>`:""}${PX.canPush("event")?`<button type="button" class="alink" data-act="pxpush" data-kind="event" data-day="${k}" data-h="${h}">${((S.days[k]||{}).px||{})[h]?"PolyOS ✓":"PolyOS"}</button>`:""}`}
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
  if(S.settings.ptOff||!FEAT("szamok"))return "";
  const b=bpPeriod(),p=b.p,pg=+S.settings.ptGoal||0,gg=+S.settings.gpGoal||0,pn=ptName();
  const pp=pg?Math.min(100,b.personal/pg*100):0,gp=gg?Math.min(100,b.group/gg*100):0;
  return `<div class="card bpstrip"><div class="row between" style="gap:12px"><div class="eyebrow">Napi állás · ${periodHead(p)}</div><a class="btn ghost small" href="#szamok" data-act="toallas">Mai állás rögzítése</a></div>
  <div class="bpgrid"><div><div class="bpl">Személyes ${esc(pn)}</div><div class="bpv"><span class="num">${nfmt(b.personal)}</span>${pg?` <small>/ ${nfmt(pg)}</small>`:""}</div><div class="prog ${pp>=100?"ok":""}"><i style="width:${pp}%"></i></div><div class="bps">${needLine(b.personal,pg,b.left)}</div></div>
  <div><div class="bpl">Csoport ${esc(pn)}</div><div class="bpv"><span class="num">${nfmt(b.group)}</span>${gg?` <small>/ ${nfmt(gg)}</small>`:""}</div><div class="prog ${gp>=100?"ok":""}"><i style="width:${gp}%"></i></div><div class="bps">${needLine(b.group,gg,b.left)}</div></div>
  <div><div class="bpl">Zárásig</div><div class="bpv cdwrap">${countdownHTML(p)}</div><div class="bps">${S.settings.lvlName?`Cél: ${esc(S.settings.lvlName)}`:""}</div></div></div></div>`;
}
function bpSection(){
  if(S.settings.ptOff)return "";
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
  if(!FEAT("szamok"))return "";
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
  const src=BR.logo&&(/^data:image\//.test(BR.logo)||BR.logo===TH.LOGO)?BR.logo:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(TH.svg(MARK_SVG));
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
const PTS={step:10,all5:20,task:5,close:15,habit:5,follow:10,talk:10,publish:10,order:15,contact:5,review:20};
const DAILY_GOAL=100;
function logPt(kind,k){k=k||T;S.pts=S.pts||{};const d=S.pts[k]||(S.pts[k]={});d[kind]=(d[kind]||0)+1}
function scoreOf(k){
  const dd=S.days[k]||{},p=(S.pts||{})[k]||{};
  const steps=(dd.steps||[]).filter(Boolean).length,tasks=(dd.tasks||[]).filter(t=>t.done).length;
  const closed=dd.close&&dd.close.mood!=null?1:0,habits=(S.habits||[]).filter(h=>(h.days||{})[k]).length;
  const parts=[["Napi lépések",steps*PTS.step],["Arany nap bónusz",steps===5?PTS.all5:0],["Sorozat bónusz",k===T&&steps>0?Math.min(streak(),10)*2:0],["Teendők",(tasks+(p.todo||0))*PTS.task],["Esti zárás",closed*PTS.close],["Kihívások",habits*PTS.habit],["Utánkövetés",(p.follow||0)*PTS.follow],["Csapat",(p.talk||0)*PTS.talk],["Megjelent tartalom",(p.publish||0)*PTS.publish],["Rendelés",(p.order||0)*PTS.order],["Értékelés",(p.review||0)*PTS.review],["Új kapcsolat",(p.contact||0)*PTS.contact]];
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
const mapW=m=>m.w||MAP_W,mapH=m=>m.h||MAP_H;
const mapZoom=m=>{const z=(S.prefs&&S.prefs.mapZoom||{})[m.id];return z?Math.min(2,Math.max(0.3,z)):1};
function setMapZoom(m,z,keepCenter){
  const w=$("#mapwrap"),old=mapZoom(m);z=Math.round(Math.min(2,Math.max(0.3,z))*100)/100;
  const cx=w?(w.scrollLeft+w.clientWidth/2)/old:mapW(m)/2,cy=w?(w.scrollTop+w.clientHeight/2)/old:mapH(m)/2;
  S.prefs=S.prefs||{};S.prefs.mapZoom=Object.assign({},S.prefs.mapZoom,{[m.id]:z});save();
  const cv=$("#mapcanvas"),sz=$("#mapsizer"),lb=$("#mapzoomlbl");
  if(cv){cv.style.transform=`scale(${z})`;sz.style.width=mapW(m)*z+"px";sz.style.height=mapH(m)*z+"px";if(lb)lb.textContent=Math.round(z*100)+"%"}
  if(w&&keepCenter!==false){w.scrollLeft=cx*z-w.clientWidth/2;w.scrollTop=cy*z-w.clientHeight/2}
}
function fitMap(m){const w=$("#mapwrap");if(!w)return;const z=Math.min(w.clientWidth/mapW(m),w.clientHeight/mapH(m))*0.98;setMapZoom(m,z,false);w.scrollLeft=0;w.scrollTop=0}
// becsült doboz-méret (px) egy ág szövegéhez — az ütközésfeloldáshoz
function nodeBox(m,n){const l=nodeLevel(m,n),len=String(n.t||"").length||1;const cw=l===0?11:7.3,maxw=l===0?300:190,pad=l===0?44:30;const w=Math.min(maxw,len*cw+pad);const lines=Math.max(1,Math.ceil(len*cw/(w-pad)));return {w,h:l===0?lines*25+30:lines*17+20}}
// egymásra lógó ágak széttolása (a középpont helyben marad)
function relaxMap(m,iter){
  const N=m.nodes,W=mapW(m),H=mapH(m),B=N.map(n=>nodeBox(m,n)),gap=16;
  for(let it=0;it<(iter||120);it++){let moved=false;
    for(let i=0;i<N.length;i++)for(let j=i+1;j<N.length;j++){const a=N[i],b=N[j],A=B[i],Bb=B[j];
      const ox=(A.w+Bb.w)/2+gap-Math.abs(a.x-b.x),oy=(A.h+Bb.h)/2+gap-Math.abs(a.y-b.y);if(ox<=0||oy<=0)continue;moved=true;
      const ra=a.p?1:0,rb=b.p?1:0,tot=(ra+rb)||1;
      if(ox<oy){const d=(a.x<b.x?-1:1)*ox;a.x+=d*ra/tot;b.x-=d*rb/tot}else{const d=(a.y<b.y?-1:1)*oy;a.y+=d*ra/tot;b.y-=d*rb/tot}}
    N.forEach((n,i)=>{n.x=Math.round(Math.min(W-B[i].w/2-6,Math.max(B[i].w/2+6,n.x)));n.y=Math.round(Math.min(H-B[i].h/2-6,Math.max(B[i].h/2+6,n.y)))});
    if(!moved)break}
}
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
  const nodes=m.nodes.map(n=>{const l=nodeLevel(m,n);return `<div class="mnode l${Math.min(l,2)}${sel&&sel.id===n.id?" sel":""}${n.open?" open":""}" data-nid="${n.id}" style="left:${n.x}px;top:${n.y}px;${nodeStyle(m,n)}" tabindex="0" role="button" aria-label="${esc(n.t)}"><span class="mt">${esc(n.t)||"…"}</span></div>`}).join("");
  const starter=m.nodes.length<=1||(S.maps.length===1&&!m.quiz&&m.title==="Első térképem");
  return head("Gondolattérkép","Ötletek, célok, tervek egy lapon",`<button class="btn" data-act="mzstart">Új térkép kérdésekkel</button><button class="btn ghost" data-act="mapnew">Üres térkép</button>`)+(starter?`<div class="card mzstart"><span class="ic" aria-hidden="true">${nicon("terkep")}</span><div class="grow"><b>Nem kell egyedül kitalálnod.</b><span class="s">Kb. 10 perc alatt, egyszerre egy kérdéssel végigvezetünk: mire kell a térkép, kinek segítesz, mit adsz, mitől vagy más, honnan jönnek az ügyfeleid, mi akadályoz. A végén a válaszaidból elkészül a térkép, amit utána szabadon alakíthatsz.</span></div><button class="btn" data-act="mzstart">Kérdésekkel indulok</button></div>`:"")+`
  <div class="tabs">${S.maps.map(x=>`<button data-act="mapsel" data-id="${x.id}" aria-pressed="${x.id===m.id}">${esc(x.title||"Névtelen térkép")}</button>`).join("")}</div>
  <div class="card stack" style="gap:12px">
    <div class="row between"><label class="f" style="flex:1;min-width:220px">A térkép címe<input type="text" id="map-title" data-mtitle="1" value="${esc(m.title)}"></label>
      <span class="row" style="gap:6px;align-self:flex-end"><button class="btn ghost small" data-act="mcenter">Középre</button>${m.quiz?`<button class="btn ghost small" data-act="mzrerun" title="A válaszaid előre kitöltve; a régi térkép megmarad, így látod, mi változott">Kérdések újra (${fmtDate(m.quiz.at)})</button>`:""}${ui.mapdel===m.id?`<button class="chip warn" data-act="mapdel" data-id="${m.id}">Igen, törlöm a térképet</button><button class="chip" data-act="mapdelno">Mégse</button>`:`<button class="btn ghost small" data-act="mapdelask" data-id="${m.id}">Térkép törlése</button>`}</span></div>
    <div class="mtools">${sel?`<label class="f" style="flex:1;min-width:200px">Kijelölt ág szövege<input type="text" id="mnode-${sel.id}" data-mnode="${sel.id}" value="${esc(sel.t)}"></label>
      <span class="row" style="gap:6px;align-self:flex-end"><button class="btn small" data-act="mchild">Új ág innen</button>${sel.p?`<button class="btn ghost small" data-act="msib">Új testvér</button>`:""}
      <span class="row" style="gap:4px">${SC().map((c,i)=>`<button class="eswatch light" data-act="mcolor" data-i="${i}" style="background:${c.main}" aria-label="${c.n}" title="${c.n}" aria-pressed="${sel.c===i}"></button>`).join("")}<button class="chip" data-act="mcolor" data-i="-1">Alap</button></span>
      ${sel.p?`<button class="btn ghost small" data-act="mdel">Ág törlése</button>`:""}<button class="iconbtn" data-act="mdesel" aria-label="Kijelölés megszüntetése">×</button></span>`:`<span class="muted" style="font-size:13px">Koppints egy ágra a szerkesztéshez, húzd, ahová szeretnéd. Új ágat a kijelölt ágból indíthatsz.</span><button class="btn small" data-act="mchild">Új ág a középpontból</button>`}</div>
    <div class="mapzoom" role="group" aria-label="Nagyítás"><button type="button" class="iconbtn" data-act="mzoom" data-d="-1" aria-label="Kicsinyítés">−</button><span id="mapzoomlbl" class="num">${Math.round(mapZoom(m)*100)}%</span><button type="button" class="iconbtn" data-act="mzoom" data-d="1" aria-label="Nagyítás">+</button><button type="button" class="chip" data-act="mfit">Teljes térkép</button><button type="button" class="chip" data-act="mrelax" title="Széttolja az egymásra lógó ágakat">Rendezés</button></div>
    <div class="mapwrap" id="mapwrap"><div id="mapsizer" style="width:${mapW(m)*mapZoom(m)}px;height:${mapH(m)*mapZoom(m)}px;position:relative"><div class="mapcanvas page" id="mapcanvas" style="width:${mapW(m)}px;height:${mapH(m)}px;transform:scale(${mapZoom(m)});transform-origin:0 0"><svg class="mlines" width="${mapW(m)}" height="${mapH(m)}" viewBox="0 0 ${mapW(m)} ${mapH(m)}" aria-hidden="true">${mapLines(m)}</svg>${nodes}${board(activeBoard)}</div></div></div>
  </div>`;
}
function redrawEdges(m){const svg=document.querySelector(".mlines");if(svg)svg.innerHTML=mapLines(m)}
let mapCentered=null;
function bindMap(){
  if(route!=="terkep")return;
  const m=curMap(),cv=$("#mapcanvas"),wrap=$("#mapwrap");if(!cv||!m)return;
  const Z=()=>mapZoom(m);
  if(mapCentered!==m.id){mapCentered=m.id;if(m.fitOnOpen){delete m.fitOnOpen;fitMap(m)}else{const r=m.nodes.find(n=>!n.p);if(r){wrap.scrollLeft=r.x*Z()-wrap.clientWidth/2;wrap.scrollTop=r.y*Z()-wrap.clientHeight/2}}}
  // Ctrl/⌘ + görgetés és csippentés (érintőpad) = nagyítás
  if(!wrap.dataset.zb){wrap.dataset.zb="1";wrap.addEventListener("wheel",e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();setMapZoom(curMap(),mapZoom(curMap())*(e.deltaY<0?1.1:0.9))},{passive:false});
    let pd=0;wrap.addEventListener("touchmove",e=>{if(e.touches.length!==2)return;const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(pd){e.preventDefault();setMapZoom(curMap(),mapZoom(curMap())*d/pd)}pd=d},{passive:false});wrap.addEventListener("touchend",()=>{pd=0})}
  cv.querySelectorAll(".mnode").forEach(el=>{
    let sx,sy,ox,oy,moved=false;const n=m.nodes.find(x=>x.id===el.dataset.nid);
    el.addEventListener("pointerdown",e=>{sx=e.clientX;sy=e.clientY;ox=n.x;oy=n.y;moved=false;el.setPointerCapture(e.pointerId);e.preventDefault()});
    el.addEventListener("pointermove",e=>{if(!el.hasPointerCapture(e.pointerId))return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(!moved)return;
      n.x=Math.round(Math.min(mapW(m)-40,Math.max(40,ox+dx/Z())));n.y=Math.round(Math.min(mapH(m)-24,Math.max(24,oy+dy/Z())));el.style.left=n.x+"px";el.style.top=n.y+"px";redrawEdges(m)});
    el.addEventListener("pointerup",e=>{if(!el.hasPointerCapture(e.pointerId))return;el.releasePointerCapture(e.pointerId);if(moved){save()}else{ui.mapSel=n.id;render();const i=document.getElementById("mnode-"+n.id);i&&i.focus()}});
    el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();ui.mapSel=n.id;render()}});
  });
}
function addMapNode(m,par){
  const root=m.nodes.find(n=>!n.p);const kids=m.nodes.filter(n=>n.p===par.id).length;let x,y;
  if(!par.p){const a=(-90+kids*55)*Math.PI/180;x=par.x+260*Math.cos(a);y=par.y+180*Math.sin(a)}
  else{const base=Math.atan2(par.y-root.y,par.x-root.x),off=(kids%2?1:-1)*Math.ceil(kids/2)*.5,a=base+off;x=par.x+190*Math.cos(a);y=par.y+120*Math.sin(a)}
  const n={id:uid(),x:Math.round(Math.min(mapW(m)-80,Math.max(80,x))),y:Math.round(Math.min(mapH(m)-30,Math.max(30,y))),t:"Új ág",p:par.id};
  m.nodes.push(n);return n;
}

/* ---------- forms ---------- */
const FORMS={
  contact:{title:"Kapcsolat",coll:"contacts",fields:[["name","Név","text"],["email","E-mail (nem kötelező)","email"],["src","Honnan ismered?","text"],["interest","Érdeklődés","select",["Termék","Üzlet","Mindkettő"]],["stage","Hol tartotok?","select",STAGES.map((s,i)=>[i,s])],["next","Következő lépés","text"],["nextDate","Mikor?","date"],["note","Megjegyzés","textarea"]]},
  client:{title:"Ügyfél",coll:"clients",fields:[["name","Név","text"],["phone","Telefon","text"],["email","E-mail","email"],["bdayFull","Születésnap","date"],["fav","Kedvenc termékei","text"],["addr","Cím (átadáshoz, szállításhoz)","text"],["last","Utolsó rendelés","date"],["cycle","Újrarendelési ciklus (nap)","number"]]},
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
function blank(){return {v:1,blank:true,settings:{name:(ctx.user&&ctx.user.name)||"",cur:"Ft",steps:["Poszt","Sztori","Új kapcsolat","Utánkövetés",FEAT("csapat")?"Csapat":"Tanulás"]},days:{},contacts:[],clients:[],orders:[],content:[],ideas:[],team:[],goals:{},stickers:{},prefs:{}}}
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
  return head("Bővítések","A tervező a PolyOS része")+`<p class="qday" style="margin:0">A Sikermaker a napi rutinod. Ha a vállalkozásod kinövi, a PolyOS-ben folytathatod: ugyanazok az adatok, több eszköz.</p>${st}<div class="ups">${cards}</div>`;
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
/* design system importálása: javaslat a névre, színekre, betűkre és logóra; csak „Átveszem” után kerül a vázlatba */
function dsImportBlock(){
  const r=ui.dsImport;
  const head=`<div class="dsimp"><div class="row between" style="gap:10px;flex-wrap:wrap"><div><b>Design system importálása</b><div class="muted" style="font-size:12.5px">Töltsd fel a Claude design system ZIP-jét (vagy a tokens.json fájlt), és kitöltjük belőle a nevet, a színeket, a betűpárt és a logót.</div></div>
    <label class="btn ghost small" for="brand-ds" style="cursor:pointer">Fájl kiválasztása</label><input type="file" id="brand-ds" accept=".zip,.json,application/zip,application/json" hidden></div>`;
  if(!r)return head+"</div>";
  if(r.loading)return head+`<div class="muted" style="margin-top:8px">Beolvasás…</div></div>`;
  if(r.err)return head+`<div class="status" style="margin-top:8px">${esc(r.err)}</div></div>`;
  const sw=c=>c?`<span class="dssw" style="background:${esc(c)}"></span>${esc(c)}`:"–";
  const F=TH.FONTS||{};
  return head+`<div class="stack" style="gap:10px;margin-top:10px">
    <div class="muted" style="font-size:12.5px">Megtaláltuk: ${esc(r.found.join(", ")||"semmit")}. Nézd át, és vedd át, ami tetszik; a mentés gombbal élesíted.</div>
    <div class="dsgrid">
      <div><span class="lab2">Név</span>${esc(r.name||"–")}</div>
      <div><span class="lab2">Kiemelőszín</span>${sw(r.colors.accent)}</div>
      <div><span class="lab2">Kiemelés</span>${sw(r.colors.highlight)}</div>
      <div><span class="lab2">Háttér</span>${sw(r.colors.background)}</div>
      <div><span class="lab2">Betűpár</span>${esc(r.fonts&&F[r.fonts]?F[r.fonts].label:"–")}</div>
    </div>
    ${r.logos.length?`<div><span class="lab2">Logó (válassz egyet)</span><div class="row" style="gap:8px;flex-wrap:wrap">${r.logos.map((l,i)=>`<button type="button" class="dslogo" data-act="dslogo" data-i="${i}" aria-pressed="${r.logo===i}" title="${esc(l.name)}"><img src="${l.url}" alt="${esc(l.name)}"></button>`).join("")}</div></div>`:""}
    <div class="row" style="gap:8px"><button class="btn small" data-act="dsapply">Átveszem</button><button class="nc-skip" data-act="dsclose">Mégse</button></div></div></div>`;
}
function brandEditor(d,o){
  d.colors=d.colors||{};const e=TH.effectiveBrand(d);
  return `<div class="card stack" id="${o.id}" style="gap:14px"><div class="row between"><h3 style="margin:0">${o.title}</h3><span class="chip on">${o.badge}</span></div>
      <p class="muted" style="margin:0;font-size:12.5px">${o.note}</p>
      ${dsImportBlock()}
      <div class="grid g2"><label class="f">A tervező neve<input type="text" data-brand="productName" value="${esc(d.productName||"")}" placeholder="Sikermaker" maxlength="40"></label><label class="f">Alcím<input type="text" data-brand="tagline" value="${esc(d.tagline||"")}" maxlength="60"></label>
      <label class="f full">A márka gazdája (oklevél aláírása, idézetek szerzője)<input type="text" data-brand="ownerName" value="${esc(d.ownerName||"")}" maxlength="40"></label></div>
      <div class="row" style="gap:14px"><span class="logoprev">${e.logo?`<img src="${esc(e.logo)}" alt="Logó">`:TH.svg(MARK_SVG)}</span><div class="stack" style="gap:6px"><label class="btn ghost small" for="brand-logo" style="cursor:pointer;align-self:flex-start">Logó feltöltése</label><input type="file" id="brand-logo" accept="image/png,image/svg+xml,image/webp,image/jpeg" hidden>${e.logo?'<button class="chip" data-act="brandlogodel" style="align-self:flex-start">Logó törlése</button>':""}<span class="muted" style="font-size:12px">Átlátszó hátterű PNG vagy SVG, legfeljebb 300 KB.</span></div></div>
      <div class="colorrow"><label class="f">Kiemelőszín<input type="color" data-brandc="accent" value="${e.accent}"></label><label class="f">Kiemelés (érmek, arany nap)<input type="color" data-brandc="highlight" value="${e.highlight}"></label><label class="f">Alap háttérszín<input type="color" data-brandc="background" value="${TH.util.isHex(d.colors.background)?d.colors.background:"#F4F4F1"}"></label></div>
      <div><div class="lab2">Oldalsáv</div><div class="tabs">${[["dark","Sötét"],["accent","Kiemelőszín"],["light","Világos"]].map(([k,l])=>`<button data-act="brandside" data-k="${k}" aria-pressed="${e.sidebar===k}">${l}</button>`).join("")}</div></div>
      <div><div class="lab2">Betűk</div><div class="tabs">${Object.entries(TH.FONTS).map(([k,f])=>`<button data-act="brandfont" data-k="${k}" aria-pressed="${e.fonts===k}">${esc(f.label)}</button>`).join("")}</div></div>
      <div class="stack" style="gap:8px"><button class="cbx" data-act="brandfounder" aria-pressed="${!!(d.founder&&d.founder.enabled)}" aria-label="Alapító tagság" style="display:none"></button><label class="row" style="gap:8px;font-size:13px"><button type="button" class="cbx" data-act="brandfounder" aria-pressed="${!!(d.founder&&d.founder.enabled)}">${d.founder&&d.founder.enabled?"✓":""}</button>Alapító tagsági program (oklevél, külön érem)</label>
      ${d.founder&&d.founder.enabled?`<label class="f">Az alapító tagok kedvezménye<input type="text" data-brandf="perk" value="${esc(d.founder.perk||"")}" maxlength="200" placeholder="Például: örökre a mostani áron használod a tervezőt."></label>`:""}</div>
      <label class="f">Saját idézetek a napi gondolatokhoz (soronként egy; üresen a beépítettek)<textarea data-brandq="1" rows="4">${esc((d.quotes||[]).join("\n"))}</textarea></label>
      <div class="row"><button class="btn" data-act="${o.saveAct}">${o.saveLabel}</button><button class="btn ghost" data-act="${o.resetAct}">Elvetés</button>${o.extra||""}</div></div>`;
}
function brandCard(){
  const bp=bgPrefs(),ink=TH.palette().ink;
  const pats=Object.entries(TH.BG_PATTERNS).map(([k,p])=>`<button class="bgopt" data-act="bgpat" data-k="${k}" aria-pressed="${bp.bgPattern===k}" style="background-color:${bp.bgColor};background-image:${p.image(`color-mix(in srgb,${ink} ${k==="pont"?16:7}%,transparent)`)};--sz:${p.size}"><span>${esc(p.label)}</span></button>`).join("");
  const cols=TH.BG_COLORS.map(([n,c])=>`<button class="swatch" data-act="bgcol" data-c="${c}" aria-pressed="${bp.bgColor.toUpperCase()===c.toUpperCase()}" style="background:${c}" aria-label="${n}" title="${n}"></button>`).join("");
  let wl="";
  if(BR.plan==="whitelabel"&&(ctx.brandAdmin||DEMO)){
        ui.brand=null;wl=`<div class="card stack"><h3 style="margin:0">A márkád</h3><p style="margin:0;font-size:13px">A márkád arculatát és a felhasználóidat a <b>Márkám</b> menüben kezeled.</p><a class="btn small" href="#markam" style="align-self:flex-start">Márkám megnyitása</a></div>`;
  }else if(BR.plan!=="whitelabel"&&BR.upsell){
    wl=`<div class="card stack lockcard"><div class="row between"><h3 style="margin:0">Saját márkával szeretnéd?</h3><span class="chip">Hamarosan</span></div><p style="margin:0;font-size:13px">A <b>white label</b> csomagban a tervező a te nevedet, logódat, színeidet és betűidet viseli, és így adhatod tovább a csapatodnak, ügyfeleidnek.</p><a class="btn small ghost" style="align-self:flex-start" href="${esc(PX.upsellUrl("whitelabel",BR.slug))}" target="_blank" rel="noopener">Érdekel a white label</a></div>`;
  }
  return `<div class="grid g2" style="align-items:start" id="arculat"><div class="card stack" style="gap:14px"><h3 style="margin:0">Háttér</h3><p class="muted" style="margin:0;font-size:12.5px">Csak nálad látszik, bármikor visszaváltható.</p><div class="bgpick">${pats}</div><div class="colorrow">${cols}<input type="color" data-bgc="1" value="${bp.bgColor}" aria-label="Saját háttérszín"></div></div>${wl}</div>`;
}
function accountCard(){
  if(DEMO)return `<div class="card stack"><h3>Bemutató mód</h3><p class="muted" style="margin:0">Most belépés nélkül, mintaadatokkal próbálod a tervezőt: amit beírsz, csak ebben a böngészőben marad meg. Fiókkal minden eszközödön ugyanazt látod.</p>
  <div class="row">${ctx.cloud?`<button class="btn" data-act="signup">${SIGNUP_CTA}</button>`:""}<span id="resetrow" class="row"><button class="btn ghost" data-act="resetask">Mintaadatok visszaállítása</button></span></div>
</div>`;
  return `<div class="card stack"><h3>Fiók</h3><div class="row between"><div><b>${esc((ctx.user&&ctx.user.email)||"")}</b><div class="muted" style="font-size:12.5px">A terved a fiókodhoz van mentve, minden eszközödön ugyanaz.</div>${consentRow()}</div><span class="row"><button class="btn ghost small" data-act="export">Adataim letöltése</button><button class="btn ghost small" data-act="logout">Kijelentkezés</button></span></div></div>`;
}

/* ---------- bemutató mód: regisztrációs felhívás minden oldal tetején ---------- */
function demoCta(){
  if(!DEMO||!ctx.cloud)return "";
  return `<div class="card democta" role="region" aria-label="Regisztráció"><div class="grow"><span class="t">${ctx.signupOpen?"Tetszik? Kezdd el a saját tervedet.":"Tetszik? Hamarosan nyitunk!"}</span><span class="s">${ctx.signupOpen?"Most mintaadatokkal nézelődsz. Regisztrálj ingyen, és a saját terved minden eszközödön ott lesz.":"Most mintaadatokkal nézelődsz. Iratkozz fel a várólistára: elsőként szólunk, és ajándékba letöltheted a Káoszmanagert."}</span></div><div class="row" style="gap:10px"><button class="btn democta-btn" data-act="signup">${SIGNUP_CTA}</button>${ctx.signupOpen?'<button class="nc-skip" data-act="authshow">Már van fiókom</button>':""}</div></div>`;
}
/* ---------- telepítés a kezdőképernyőre ---------- */
function installCard(where){
  const I=ctx.install;if(!I)return "";const mode=I.mode();if(!mode)return "";
  if(where==="ma"&&((S.prefs&&S.prefs.installHide)||!matchMedia("(max-width:860px)").matches))return "";
  const body=mode==="prompt"
    ?`<span class="s">Egy koppintás, és a ${esc(BR.productName)} saját ikonnal, teljes képernyőn indul, mint egy app.</span>`
    :`<span class="s">Safariban koppints a <b>Megosztás</b> ikonra <span aria-hidden="true">(négyzet felfelé nyíllal)</span>, majd a <b>Főképernyőhöz adás</b> pontra.</span>`;
  return `<div class="card installcard"><span class="ic" aria-hidden="true">${BR.logo?`<img src="${esc(BR.logo)}" width="40" height="40" alt="">`:TH.svg(TH.MARK).replace('width="48" height="48"','width="40" height="40"')}</span><div class="grow"><span class="t">Tedd ki a kezdőképernyőre</span>${body}</div><div class="row" style="gap:8px">${mode==="prompt"?'<button class="btn small" data-act="install">Telepítés</button>':""}${where==="ma"?'<button class="nc-skip" style="color:var(--muted)" data-act="installhide">Most nem</button>':""}</div></div>`;
}
/* ---------- bevezető (első belépés) és „Első lépések" lista ---------- */
const PROFILES=[
  {k:"mlm",l:"Közvetlen értékesítés, csapatépítés",d:"Termékeket ajánlasz, ügyfélkört és csapatot építesz (pl. kozmetikum, étrend-kiegészítő).",steps:["Poszt","Sztori","Új kapcsolat","Utánkövetés",FEAT("csapat")?"Csapat":"Tanulás"],pt:true},
  {k:"szolg",l:"Saját szolgáltatás vagy termék",d:"Szolgáltatást nyújtasz vagy saját terméket árulsz (pl. coach, szépségipar, kézműves).",steps:["Tartalom","Új érdeklődő","Utánkövetés","Ügyfélmunka","Tanulás"],pt:false},
  {k:"tartalom",l:"Tartalomgyártás, személyes márka",d:"A közösségi médiában építed a márkádat és a közösségedet.",steps:["Poszt","Sztori","Közösség","Új kapcsolat","Ötletgyűjtés"],pt:false},
  {k:"egyeb",l:"Valami más",d:"Egyszerűen jól akarod szervezni a napjaidat és a kapcsolataidat.",steps:["Tervezés","Új kapcsolat","Utánkövetés","Tartalom","Önfejlesztés"],pt:false}
];
const greetName=()=>{const n=(S.settings.nick||"").trim();return n||firstName(S.settings.name)||""};
function obSteps(d){return ["udv","nev","profil","lepesek"].concat(d.pt&&PRO?["pont"]:[]).concat(PRO?["kulonbseg","kapcsolat","ugyfel"]:[]).concat(["kesz"])}
function obOpen(){
  const prof=PROFILES.find(p=>p.k===S.settings.profile)||null;
  ui.ob={i:0,d:{name:S.settings.name||"",nick:S.settings.nick||"",profile:prof?prof.k:"",pt:prof?prof.pt:true,steps:S.settings.steps.slice(),ptName:S.settings.ptName||"pont",ptGoal:S.settings.ptGoal||"",gpGoal:S.settings.gpGoal||"",perEnd:(curPeriod()||{}).end||iso(addDays(TODAY,27)),contact:{name:"",src:"",next:"",nextDate:iso(addDays(TODAY,1))},client:{name:"",fav:"",last:""}}};
  obRender();
}
function obClose(){const el=$("#onboard");if(el)el.remove();ui.ob=null;document.body.classList.remove("ob-open")}
function obField(k,label,v,type,extra){return `<label class="f">${label}<input type="${type||"text"}" data-ob="${k}" value="${esc(v)}" ${extra||""}></label>`}
function obBody(step,d){
  if(step==="udv")return `<div class="ob-hero">${BR.logo?`<img src="${esc(BR.logo)}" width="64" height="64" alt="">`:TH.svg(TH.MARK).replace('width="48" height="48"','width="64" height="64"')}</div><h2>Szia! Állítsuk be együtt a tervezőt.</h2><p class="lead">Pár rövid kérdés, nagyjából 2 perc. Utána a ${esc(BR.productName)} pontosan rád szabva indul, és megmutatjuk, hol mit találsz.</p><ul class="ob-list"><li>Hogyan szólítsunk</li><li>Mivel foglalkozol, és mik a napi lépéseid</li><li>Mi a különbség a kapcsolat és az ügyfél között</li><li>Az első kapcsolatod és ügyfeled felvétele</li></ul>`;
  if(step==="nev")return `<h2>Hogyan szólíthatunk?</h2><p class="lead">Ezzel köszönünk minden reggel, és ez kerül az okleveleidre és az üzenetvázlataid aláírásába.</p>${obField("name","A teljes neved",d.name,"text",'autocomplete="name" maxlength="60" placeholder="Például: Minta Anna"')}${obField("nick","Így szólíts (nem kötelező)",d.nick,"text",'maxlength="30" placeholder="Például: Anna"')}`;
  if(step==="profil")return `<h2>Mivel foglalkozol?</h2><p class="lead">Ez alapján javaslunk napi lépéseket. Később bármit átírhatsz.</p><div class="ob-choices">${PROFILES.map(p=>`<button type="button" class="ob-choice" data-act="obprof" data-k="${p.k}" aria-pressed="${d.profile===p.k}"><b>${esc(p.l)}</b><span>${esc(p.d)}</span></button>`).join("")}</div>`;
  if(step==="lepesek")return `<h2>Az 5 napi lépésed</h2><p class="lead">Ez az öt dolog visz előre minden nap. A Vezérlőpulton pipálod ki őket, és ha mind az öt megvan, az „arany nap”.</p><div class="stack" style="gap:10px">${d.steps.map((s,i)=>`<label class="f">${i+1}. lépés<input type="text" data-ob="step${i}" value="${esc(s)}" maxlength="24"></label>`).join("")}</div>`;
  if(step==="pont")return `<h2>Pontrendszer és periódus</h2><p class="lead">Ha a cégednél pontokat gyűjtesz egy elszámolási időszakban, a tervező napi bontásban mutatja, mennyi hiányzik még. Ha nem kell, a „Nincs pontrendszerem” gombbal kikapcsolhatod.</p>${obField("ptName","A pont neve a cégednél",d.ptName,"text",'maxlength="12" placeholder="pl. BP, PV, CC"')}<div class="grid g2">${obField("ptGoal","Havi személyes cél",d.ptGoal,"number",'inputmode="numeric"')}${obField("gpGoal","Havi csoportcél (nem kötelező)",d.gpGoal,"number",'inputmode="numeric"')}</div>${obField("perEnd","Mikor zárul az aktuális periódus?",d.perEnd,"date")}<button type="button" class="chip" data-act="obnopt" style="align-self:flex-start">Nincs pontrendszerem</button>`;
  if(step==="kulonbseg")return `<h2>Kapcsolat vagy ügyfél?</h2><p class="lead">A tervezőben két külön helyen vezeted az embereket, mert mással kell foglalkoznod velük.</p>
    <div class="ob-two"><div class="ob-card"><div class="ob-ic">${nicon("kapcsolatok")}</div><b>Kapcsolat</b><p>Akivel <b>még ismerkedsz</b>: érdeklődő, leendő ügyfél vagy leendő csapattag. Négy lépcsőn viszed végig (kapcsolatfelvétel, beszélgetés, bemutató, döntés), és a tervező szól, mikor kell utánakövetned.</p></div>
    <div class="ob-arrow" aria-hidden="true">→</div>
    <div class="ob-card"><div class="ob-ic">${nicon("ugyfelek")}</div><b>Ügyfél</b><p>Aki <b>már vásárolt</b> tőled. Itt a rendeléseit, a kedvenc termékeit és a születésnapját látod, és a tervező szól, mikor fogyhat el a terméke.</p></div></div>
    <p class="ob-note">Röviden: a kapcsolatból ügyfél lesz. Amikor valaki először vásárol, vedd fel az Ügyfelek közé.</p>`;
  if(step==="kapcsolat")return `<h2>Vedd fel az első kapcsolatod</h2><p class="lead">Gondolj valakire, akivel mostanában beszéltél, vagy akit szeretnél megkeresni. Később a <b>Kapcsolatok</b> oldalon az <b>Új kapcsolat</b> gombbal veszel fel újat.</p>${obField("c.name","Név",d.contact.name,"text",'maxlength="60" placeholder="Például: Minta Kata"')}${obField("c.src","Honnan ismered?",d.contact.src,"text",'maxlength="60" placeholder="Például: Instagram, ajánlás"')}<div class="grid g2">${obField("c.next","Mi a következő lépés?",d.contact.next,"text",'maxlength="60" placeholder="Például: Első üzenet"')}${obField("c.nextDate","Mikor?",d.contact.nextDate,"date")}</div>`;
  if(step==="ugyfel")return `<h2>És az első ügyfeled</h2><p class="lead">Ha már van, aki vásárolt tőled, vedd fel. Ha még nincs, nyugodtan hagyd ki. Később az <b>Ügyfelek</b> oldalon az <b>Új ügyfél</b> gombbal veszel fel újat.</p>${obField("u.name","Név",d.client.name,"text",'maxlength="60" placeholder="Például: Minta Éva"')}${obField("u.fav","Mit szokott venni?",d.client.fav,"text",'maxlength="80" placeholder="Például: arckrém, vitamin"')}${obField("u.last","Mikor vásárolt utoljára?",d.client.last,"date")}`;
  const inst=ctx.install&&ctx.install.mode();
  return `<div class="ob-hero">🎉</div><h2>Kész is vagy${greetName()||d.nick||firstName(d.name)?", "+esc(d.nick||firstName(d.name)):""}!</h2><p class="lead">Így találsz meg mindent:</p><ul class="ob-list"><li><b>Ma:</b> a napi lépéseid, kit keress meg, mai teendők</li><li><b>Naptár:</b> havi, heti és napi nézet az időpontjaiddal</li><li><b>Kapcsolatok és Ügyfelek:</b> az embereid, emlékeztetőkkel</li><li><b>Tartalom:</b> mit posztolsz és mikor</li></ul><p class="lead">A Vezérlőpulton egy <b>Első lépések</b> lista vár, amivel végigjárhatod az alapokat.</p>${PRO?"":`<p class="ob-note">A kapcsolatok, ügyfelek, a tartalomtervező és a számok a <b>Pro</b> csomagban érhetők el (${PRO_PRICE}).</p>`}${inst==="prompt"?'<button type="button" class="btn ghost" data-act="install">Telepítem a kezdőképernyőre</button>':inst==="ios"?'<p class="ob-note">Tipp: Safariban a Megosztás ikon, majd a „Főképernyőhöz adás” után appként indul a tervező.</p>':""}`;
}
function obRender(){
  const o=ui.ob;if(!o)return;const steps=obSteps(o.d),step=steps[o.i],last=o.i===steps.length-1;
  let el=$("#onboard");if(!el){el=document.createElement("div");el.id="onboard";document.body.appendChild(el);document.body.classList.add("ob-open")}
  const canNext=step!=="profil"||!!o.d.profile;const optional=step==="kapcsolat"||step==="ugyfel";
  el.innerHTML=`<div class="ob" role="dialog" aria-modal="true" aria-label="Bevezető"><div class="ob-top"><div class="ob-prog" aria-hidden="true"><i style="width:${Math.round((o.i+1)/steps.length*100)}%"></i></div><span class="ob-count">${o.i+1} / ${steps.length}</span>${last?"":`<button type="button" class="nc-skip" data-act="obskip">Kihagyom a bevezetőt</button>`}</div>
  <form class="ob-body" data-form="ob">${obBody(step,o.d)}</form>
  <div class="ob-nav">${o.i>0&&!last?'<button type="button" class="btn ghost" data-act="obback">Vissza</button>':"<span></span>"}<span class="row" style="gap:8px">${optional?'<button type="button" class="btn ghost" data-act="obnext" data-skip="1">Kihagyom</button>':""}<button type="button" class="btn" data-act="obnext" ${canNext?"":"disabled"}>${last?"Kezdjük!":o.i===0?"Kezdjük el":optional?"Hozzáadom":"Tovább"}</button></span></div></div>`;
  const f=el.querySelector(".ob-body input");if(f&&!matchMedia("(max-width:860px)").matches)f.focus();
}
function obInput(t){const o=ui.ob;if(!o)return;const k=t.dataset.ob,v=t.value;
  if(k.startsWith("step"))o.d.steps[+k.slice(4)]=v;else if(k.startsWith("c."))o.d.contact[k.slice(2)]=v;else if(k.startsWith("u."))o.d.client[k.slice(2)]=v;else o.d[k]=v}
function obNext(skip){
  const o=ui.ob,steps=obSteps(o.d),step=steps[o.i];
  if(step==="nev"&&!o.d.name.trim()){toast("Írd be a neved, hogy tudjuk, hogyan szólítsunk.");return}
  if(step==="kapcsolat"&&!skip&&!o.d.contact.name.trim()){toast("Írj be egy nevet, vagy hagyd ki ezt a lépést.");return}
  if(step==="ugyfel"&&!skip&&!o.d.client.name.trim()){toast("Írj be egy nevet, vagy hagyd ki ezt a lépést.");return}
  if(skip&&step==="kapcsolat")o.d.contact.name="";if(skip&&step==="ugyfel")o.d.client.name="";
  if(o.i<steps.length-1){o.i++;obRender();const b=$("#onboard .ob");if(b)b.scrollTop=0;return}
  obFinish(false);
}
function obFinish(skipped){
  const o=ui.ob;
  if(!skipped&&o){const d=o.d;
    S.settings.name=d.name.trim();S.settings.nick=d.nick.trim();S.settings.profile=d.profile||"egyeb";
    S.settings.steps=d.steps.map((s,i)=>s.trim()||S.settings.steps[i]);
    S.settings.ptOff=!d.pt;
    if(d.pt){S.settings.ptName=(d.ptName||"pont").trim();S.settings.ptGoal=+d.ptGoal||0;S.settings.gpGoal=+d.gpGoal||0;
      const p=curPeriod();if(p&&/^\d{4}-\d{2}-\d{2}$/.test(d.perEnd)&&d.perEnd>=p.start)p.end=d.perEnd}
    if(d.contact.name.trim()){S.contacts.push({id:uid(),name:d.contact.name.trim(),src:d.contact.src.trim(),interest:"Mindkettő",stage:0,next:d.contact.next.trim()||"Első üzenet",nextDate:d.contact.nextDate||"",note:"",created:T});logPt("contact")}
    if(d.client.name.trim()){S.clients.push({id:uid(),name:d.client.name.trim(),phone:"",bday:"",fav:d.client.fav.trim(),last:d.client.last||"",cycle:30,created:T})}
  }
  S.onboarded=T;save();obClose();if(route!=="ma")location.hash="ma";else render();
  if(!skipped)toast("Minden be van állítva. Jó tervezést!");
}
/* Első lépések lista a Vezérlőpulton, amíg be nem járja az alapokat */
function checklistCard(){
  if(!S.onboarded||(S.prefs&&S.prefs.checklistHide))return "";
  const items=[
    ["Beállítottad a tervezőt",true,""],
    ["Felvetted az első kapcsolatod",S.contacts.length>0,'<button class="btn small ghost" data-act="new" data-type="contact">Új kapcsolat</button>'],
    ["Felvetted az első ügyfeled",S.clients.length>0,'<button class="btn small ghost" data-act="new" data-type="client">Új ügyfél</button>'],
    ["Kipipáltad az első napi lépésed",Object.values(S.days).some(d=>d.steps&&d.steps.some(Boolean)),'<span class="muted" style="font-size:12px">Fent, a napi lépéseknél</span>'],
    ["Betervezted az első tartalmad",S.content.length>0,'<button class="btn small ghost" data-act="newcontent" data-k="">Új tartalom</button>'],
    ["Lezártad az első napod este",closedDays()>0,'<button class="btn small ghost" data-act="ncanchor" data-k="estizaras">Esti zárás</button>']
  ];
  if(!PRO)for(let i=items.length-1;i>=0;i--)if(/kapcsolat|ügyfel|tartalm/.test(items[i][0]))items.splice(i,1);
  const done=items.filter(x=>x[1]).length;if(done===items.length)return "";
  return `<div class="card checklist"><div class="row between"><div><div class="eyebrow">Első lépések</div><h3 style="margin:4px 0 0">${done} / ${items.length} kész</h3></div><button class="nc-skip" style="color:var(--muted)" data-act="checkhide">Elrejtés</button></div>
  <div class="prog" style="margin:10px 0 6px"><i style="width:${done/items.length*100}%"></i></div>
  <div class="list">${items.map(([l,ok,act])=>`<div class="li ${ok?"done":""}"><span class="cbx" aria-hidden="true" ${ok?'aria-pressed="true"':""}>${ok?"✓":""}</span><div class="grow t">${l}</div>${ok?"":act}</div>`).join("")}</div></div>`;
}
/* ---------- superadmin (Polymaind) ---------- */
const ADM_TABS=[["attekintes","Áttekintés"],["varolista","Várólista"],["felhasznalok","Regisztrálók"],["arculat","Sikermaker-arculat"],["markak","Márkák"],["naplo","Napló"]];
const SUB_PLANS=[["ingyenes","Ingyenes"],["pro","Pro"]];
const SUB_STATUS=[["probaido","Próbaidő"],["aktiv","Aktív"],["lejart","Lejárt"],["lemondva","Lemondva"],["ajandek","Ajándék"]];
const lbl=(arr,k)=>(arr.find(x=>x[0]===k)||[k,k])[1];
const fmtLaunch=s=>{try{return new Intl.DateTimeFormat("hu-HU",{timeZone:"Europe/Budapest",month:"long",day:"numeric",weekday:"long",hour:"2-digit",minute:"2-digit"}).format(new Date(s))}catch(e){return String(s)}};
// datetime-local mezőhöz: a böngésző helyi ideje szerint (magyar gépen magyar idő)
const toLocalInput=s=>{const x=new Date(s);if(isNaN(x))return"";const p2=n=>String(n).padStart(2,"0");return `${x.getFullYear()}-${p2(x.getMonth()+1)}-${p2(x.getDate())}T${p2(x.getHours())}:${p2(x.getMinutes())}`};
const dt=s=>s?fmtDate(String(s).slice(0,10))+" "+String(s).slice(0,4):"–";
async function admLoad(what){
  ui.adm=ui.adm||{};ui.adm.loading=what;ui.adm.err="";render();
  try{
    if(what==="attekintes")ui.adm.overview=(await ctx.admin("overview")).overview;
    if(what==="felhasznalok")ui.adm.users=(await ctx.admin("users")).users;
    if(what==="markak")ui.adm.brands=(await ctx.admin("brands")).brands;
    if(what==="varolista")ui.adm.waitlist=await ctx.admin("waitlist");
    if(what==="naplo"){const r=await ctx.admin("audit");ui.adm.audit=r.audit;ui.adm.auditMissing=r.missing}
    if(what==="arculat"){const r=await ctx.admin("platform.get");ui.adm.platform=r;
      // élő előnézet: a szerkesztett alap-arculat azonnal ráül az appra (mentésig csak nálad látszik)
      ui.brand=Object.assign(JSON.parse(JSON.stringify(r.config||{})),{slug:ctx.brandRaw.slug,plan:ctx.brandRaw.plan,upsell:ctx.brandRaw.upsell,themed:true});ui.brandFor="platform";repaint()}
  }catch(e){ui.adm.err=e.status===403?"Ehhez nincs jogosultságod.":"Nem sikerült betölteni. Próbáld újra."}
  ui.adm.loading="";render();
}
function vAdmin(){
  activeBoard=null;
  if(!ctx.superadmin)return head("Admin","Nincs hozzáférés")+'<div class="card empty">Ez az oldal csak a superadminnak érhető el.</div>';
  const a=ui.adm=ui.adm||{},tab=ui.admTab||"attekintes";
  const need={varolista:"waitlist",attekintes:"overview",felhasznalok:"users",arculat:"platform",markak:"brands",naplo:"audit"}[tab];
  if(!a[need]&&a.loading!==tab&&!a.err)setTimeout(()=>admLoad(tab),0);
  const tabs=`<div class="tabs">${ADM_TABS.map(([k,l])=>`<button data-act="admtab" data-k="${k}" aria-pressed="${tab===k}">${l}</button>`).join("")}<button data-act="admreload" data-k="${tab}">↻ Frissítés</button></div>`;
  let body="";
  if(a.err)body=`<div class="card"><p style="margin:0">${esc(a.err)}</p></div>`;
  else if(!a[need])body=`<div class="card"><div class="spinner" role="status" aria-label="Betöltés"></div></div>`;
  else if(tab==="attekintes"){const o=a.overview;
    body=`<div class="grid g4">${[["Regisztrált",o.users],["Megerősített e-mail",o.confirmed],["Új az elmúlt 7 napban",o.new7],["Aktív az elmúlt 7 napban",o.active7]].map(([l,v])=>`<div class="card kpi"><div class="v num">${v}</div><div class="l">${l}</div></div>`).join("")}</div>
    <div class="grid g2"><div class="card"><h3>Előfizetések állapota</h3>${Object.keys(o.byStatus).length?`<div class="list">${Object.entries(o.byStatus).map(([k,v])=>`<div class="li"><div class="grow t">${lbl(SUB_STATUS,k)}</div><b class="num">${v}</b></div>`).join("")}</div>`:'<div class="empty">Még senkinek nincs beállított előfizetése (mindenki ingyenes).</div>'}</div>
    <div class="card"><h3>Felhasználók márkánként</h3>${Object.keys(o.byBrand).length?`<div class="list">${Object.entries(o.byBrand).map(([k,v])=>`<div class="li"><div class="grow t">${esc(k)}</div><b class="num">${v}</b></div>`).join("")}</div>`:'<div class="empty">Még senki nem mentett tervet.</div>'}<p class="muted" style="font-size:12px;margin:8px 0 0">Új az elmúlt 30 napban: ${o.new30}</p></div></div>`;}
  else if(tab==="varolista"){const w=a.waitlist,list=w.waitlist||[],dl=list.filter(x=>x.downloads>0).length,wk=list.filter(x=>Date.now()-Date.parse(x.created_at)<7*864e5).length;
    body=w.missing?'<div class="card"><p style="margin:0">A várólista táblája még nincs létrehozva (0009_waitlist.sql).</p></div>':
    `<div class="card status" style="box-shadow:none;gap:14px"><div class="grow"><b>Regisztráció: ${w.signupOpen?"NYITVA":"ZÁRVA (várólista)"}</b><div class="muted" style="font-size:12.5px">${w.signupOpen?"Bárki létrehozhat fiókot. A landing és a belépőképernyő a regisztrációt kínálja.":"Új fiók nem hozható létre (ezt az adatbázis is kikényszeríti). A landing és a belépőképernyő e-mail-címet gyűjt, és utána letölthető a Káoszmanager."}</div></div>
    ${ui.signupConfirm?`<button class="btn" data-act="signupset" data-k="${w.signupOpen?"close":"open"}">Igen, ${w.signupOpen?"lezárom":"megnyitom"}</button><button class="nc-skip" data-act="signupno">Mégse</button>`:`<button class="btn ${w.signupOpen?"ghost":""}" data-act="signupask">${w.signupOpen?"Regisztráció lezárása":"Regisztráció megnyitása"}</button>`}</div>
    <div class="card stack" style="gap:10px"><div class="row between"><h3 style="margin:0">Nyitás időpontja (visszaszámláló)</h3>${w.launchAt?`<span class="chip">${esc(fmtLaunch(w.launchAt))}</span>`:'<span class="chip">Nincs beállítva</span>'}</div>
      <p class="muted" style="margin:0;font-size:12.5px">A landingen és az appban visszaszámláló fut eddig az időpontig, és ekkor a regisztráció <b>magától megnyílik</b> (az adatbázis is ezt követi). Magyar idő szerint add meg.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><input type="datetime-local" id="wl-launch" value="${esc(w.launchAt?toLocalInput(w.launchAt):"")}" aria-label="Nyitás időpontja" style="max-width:230px"><button class="btn small" data-act="launchset">Mentés</button>${w.launchAt?'<button class="btn small ghost" data-act="launchclear">Időzítés törlése</button>':""}</div></div>
    ${(()=>{const notN=list.filter(x=>!x.notified_at).length,done=list.length-notN;return `<div class="card stack" style="gap:10px"><div class="row between"><h3 style="margin:0">Nyitási értesítő</h3><span class="chip">${done} / ${list.length} értesítve</span></div>
      <p class="muted" style="margin:0;font-size:12.5px">„Megnyitottunk!” levél a feliratkozóknak, regisztrációs gombbal. Mindenki csak egyszer kapja meg; ha a küldés megszakad (pl. a Brevo napi kerete miatt), később folytatható. ${w.signupOpen?"":"<b>Előbb nyisd meg a regisztrációt</b> (vagy várd meg az időzített nyitást), csak utána küldhető ki."}</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn small ghost" data-act="wlnotest">Próbalevél nekem</button>${ui.wlConfirm?`<button class="btn small" data-act="wlnotgo">Igen, kiküldöm ${notN} főnek</button><button class="nc-skip" data-act="wlnotno">Mégse</button>`:`<button class="btn small" data-act="wlnotask" ${!w.signupOpen||!notN?"disabled":""}>Értesítő küldése${notN?` (${notN} fő)`:""}</button>`}${ui.wlProgress?`<span class="muted" style="font-size:12.5px">${esc(ui.wlProgress)}</span>`:""}</div></div>`})()}
    <div class="grid g3">${[["Feliratkozó",list.length],["Új az elmúlt 7 napban",wk],["Letöltötte az ajándékot",dl]].map(([l,v])=>`<div class="card kpi"><div class="v num">${v}</div><div class="l">${l}</div></div>`).join("")}</div>
    <div class="card"><div class="row between" style="margin-bottom:10px"><h3 style="margin:0">Feliratkozók</h3>${list.length?'<button class="btn ghost small" data-act="wlcsv">Letöltés (CSV)</button>':""}</div>
    ${list.length?`<div class="tablewrap"><table><thead><tr><th>E-mail</th><th>Feliratkozott</th><th>Honnan</th><th>Letöltés</th></tr></thead><tbody>${list.map(x=>`<tr><td>${esc(x.email)}</td><td class="num">${esc(String(x.created_at).replace("T"," ").slice(0,16))}</td><td>${esc(x.source||"–")}</td><td class="num">${x.downloads||0}</td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">Még nincs feliratkozó.</div>'}</div>`}
  else if(tab==="felhasznalok"){const q=(ui.admQ||"").toLowerCase();const list=a.users.filter(u=>!q||(u.email+" "+u.name).toLowerCase().includes(q));
    body=`<div class="card"><div class="row between" style="margin-bottom:10px"><input type="text" data-admq="1" value="${esc(ui.admQ||"")}" placeholder="Keresés név vagy e-mail szerint" aria-label="Keresés" style="max-width:340px"><span class="muted" style="font-size:12.5px">${list.length} / ${a.users.length} fő</span></div>
    <div class="tablewrap"><table><thead><tr><th>Felhasználó</th><th>Regisztrált</th><th>Utoljára aktív</th><th>Márka</th><th>Előfizetés</th><th></th></tr></thead><tbody>${list.map(u=>`<tr><td><strong>${esc(u.name||"–")}</strong>${u.superadmin?' <span class="chip on">fő admin</span>':u.admin?' <span class="chip on">admin</span>':""}<div class="muted" style="font-size:12px">${esc(u.email)}${u.confirmed?"":' · <span style="color:var(--warn)">nincs megerősítve</span>'}${u.banned?' · <span style="color:var(--warn)">letiltva</span>':""}</div></td><td class="num">${dt(u.created_at)}</td><td class="num">${dt(u.last_active||u.last_sign_in_at)}</td><td>${esc(u.brand||"–")}</td><td>${u.sub?`<span class="chip ${u.sub.status==="aktiv"||u.sub.status==="ajandek"?"good":u.sub.status==="lejart"||u.sub.status==="lemondva"?"warn":""}">${lbl(SUB_PLANS,u.sub.plan)} · ${lbl(SUB_STATUS,u.sub.status)}</span>${u.sub.current_period_end?`<div class="muted" style="font-size:11.5px">eddig: ${fmtDate(u.sub.current_period_end)}</div>`:""}`:'<span class="chip">Ingyenes</span>'}</td><td><button class="btn small ghost" data-act="admuser" data-id="${u.id}">Kezelés</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty">Nincs találat.</td></tr>'}</tbody></table></div></div>`;}
  else if(tab==="arculat"){const pl=a.platform;
    body=pl.missing?'<div class="card"><p style="margin:0">Az arculat táblája még nincs létrehozva (0004_platform_theme.sql).</p></div>':
    `<div class="card status" style="box-shadow:none"><div class="grow"><b>Ez a Sikermaker alapkinézete.</b><div class="muted" style="font-size:12.5px">Minden alap csomagos felhasználó és a bemutató mód ezt látja. A white label ügyfelek saját arculata erre épül: amit ők beállítanak, az felülírja. Szerkesztés közben a változás csak nálad látszik, a <b>Mentés</b> után mindenkinél (legfeljebb fél perc).${pl.updated_at?` Utoljára mentve: ${dt(pl.updated_at)}.`:""}</div></div></div>`
    +brandEditor(ui.brand||{},{id:"platszerk",title:"Sikermaker-arculat",badge:"Superadmin",note:"Név, alcím, logó, színek, oldalsáv, betűk, saját idézetek. Üresen hagyott mező = a semleges alapérték.",saveAct:"platsave",resetAct:"platreset",saveLabel:"Mentés mindenkinek",
      extra:ui.platClear?'<button class="btn ghost" data-act="platclearyes">Igen, visszaállítom semlegesre</button><button class="nc-skip" data-act="platclearno">Mégse</button>':'<button class="nc-skip" style="color:var(--muted)" data-act="platclear">Visszaállítás semlegesre</button>'});}
  else if(tab==="markak"){
    body=`<div class="card stack" style="gap:10px"><h3 style="margin:0">Új márka (white label ügyfél)</h3><form class="row" data-form="admbrand" style="align-items:flex-end"><label class="f" style="flex:1;min-width:180px">Azonosító (kisbetű, kötőjel)<input type="text" id="adm-slug" placeholder="pl. ceged" pattern="[a-z0-9][a-z0-9-]{0,39}" required></label><label class="f" style="min-width:160px">Csomag<select id="adm-plan">${[["alap","Alap"],["whitelabel","White label"]].map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select></label><button class="btn">Létrehozás</button></form><p class="muted" style="margin:0;font-size:12px">A márka címe: <code>/?brand=azonosító</code>, vagy saját domain a BRAND_HOSTS beállítással. Az arculatot a márka-admin a Beállításokban állítja be.</p></div>
    ${a.brands.map(x=>`<div class="card stack" style="gap:10px"><div class="row between"><h3 style="margin:0">${esc(x.slug)}</h3><span class="row" style="gap:6px">${[["alap","Alap"],["whitelabel","White label"]].map(([k,l])=>`<button class="mood" data-act="admbplan" data-slug="${esc(x.slug)}" data-k="${k}" aria-pressed="${x.plan===k}">${l}</button>`).join("")}<button class="chip" data-act="admbupsell" data-slug="${esc(x.slug)}" data-plan="${x.plan}" data-on="${x.upsell?0:1}">${x.upsell?"PolyOS-ajánló: be":"PolyOS-ajánló: ki"}</button></span></div>
      ${x.plan==="whitelabel"?`<div class="row" style="gap:6px;flex-wrap:wrap"><span class="muted" style="font-size:12.5px;margin-right:4px">Extra funkciók:</span>${[["csapat","Csapat"],["sablonok","Üzenetsablonok"],["szamok","Számok"],["matricak","Szépség-matricák"]].map(([k,l])=>`<button class="mood" data-act="admbfeat" data-slug="${esc(x.slug)}" data-k="${k}" aria-pressed="${!!(x.features&&x.features[k])}">${l}</button>`).join("")}</div>`:""}
      ${x.plan==="whitelabel"?`<div class="row" style="gap:8px"><a class="btn small" href="/app?brand=${encodeURIComponent(x.slug)}#markam">Megnyitom és beállítom</a><span class="muted" style="font-size:12px">Az ő márkájában nyílik meg; minden mentésed naplózva lesz („támogatói hozzáférés”). A felhasználói ezen a linken regisztrálnak: <code>${esc(location.origin)}/app?brand=${esc(x.slug)}</code></span></div>`:""}
      <div><div class="lab2">Márka-adminok (ők szerkesztik az arculatot)</div>${x.admins.length?`<div class="row" style="gap:6px">${x.admins.map(e=>`<span class="chip">${esc(e)} <button class="cadd" style="opacity:1;width:18px;height:18px;font-size:13px" data-act="admbadmdel" data-slug="${esc(x.slug)}" data-email="${esc(e)}" aria-label="Eltávolítás">×</button></span>`).join("")}</div>`:'<div class="empty">Még nincs.</div>'}</div>
      <form class="row" data-form="admbadm" data-slug="${esc(x.slug)}" style="flex-wrap:nowrap"><input type="email" placeholder="Regisztrált felhasználó e-mail-címe" aria-label="Márka-admin e-mail" required><button class="btn small">Hozzáadás</button></form>
      <div class="row" style="justify-content:flex-end;gap:8px">${ui.admBDel===x.slug?`<span class="muted" style="font-size:12.5px">Biztosan törlöd a(z) <b>${esc(x.slug)}</b> márkát? Az adminjai is törlődnek; a felhasználók tervei megmaradnak, de az alap Sikermaker-arculatot látják.</span><button type="button" class="btn small" style="background:var(--warn)" data-act="admbdelgo" data-slug="${esc(x.slug)}">Igen, törlöm</button><button type="button" class="btn small ghost" data-act="admbdelno">Mégse</button>`:`<button type="button" class="btn small ghost" data-act="admbdel" data-slug="${esc(x.slug)}">Márka törlése</button>`}</div></div>`).join("")}`;}
  else{
    body=a.auditMissing?'<div class="card"><p style="margin:0">A napló táblája még nincs létrehozva. Futtasd le a <code>supabase/migrations/0002_admin.sql</code> fájlt a Supabase SQL Editorban.</p></div>':
    `<div class="card"><div class="tablewrap"><table><thead><tr><th>Időpont</th><th>Ki</th><th>Művelet</th><th>Mire</th><th>Részletek</th></tr></thead><tbody>${a.audit.map(r=>`<tr><td class="num">${esc(String(r.at).replace("T"," ").slice(0,16))}</td><td>${esc(r.actor_email||"")}</td><td>${esc(r.action)}</td><td style="font-size:12px">${esc(r.target||"")}</td><td style="font-size:12px">${esc(JSON.stringify(r.detail||{}))}</td></tr>`).join("")||'<tr><td colspan="5" class="empty">Még nincs bejegyzés.</td></tr>'}</tbody></table></div></div>`;
  }
  return head("Admin","Superadmin · Polymaind")+tabs+body;
}
function admUserSheet(id){
  const u=(ui.adm.users||[]).find(x=>x.id===id);if(!u)return;const s=u.sub||{plan:"ingyenes",status:"probaido",current_period_end:"",note:""};
  $("#layer").innerHTML=`<div class="modal" data-act="close"><form class="sheet" data-form="admsub" data-id="${u.id}"><div class="grabber" aria-hidden="true"></div><div class="row between"><div><div class="eyebrow">Felhasználó</div><h2>${esc(u.name||u.email)}</h2><div class="muted" style="font-size:12.5px">${esc(u.email)} · regisztrált: ${dt(u.created_at)}</div></div><button type="button" class="iconbtn" data-act="close" aria-label="Bezárás">×</button></div>
  <div class="fg"><label class="f">Csomag<select id="as-plan">${SUB_PLANS.map(([k,l])=>`<option value="${k}" ${s.plan===k?"selected":""}>${l}</option>`).join("")}</select></label><label class="f">Állapot<select id="as-status">${SUB_STATUS.map(([k,l])=>`<option value="${k}" ${s.status===k?"selected":""}>${l}</option>`).join("")}</select></label>
  <label class="f">Érvényes eddig<input type="date" id="as-end" value="${esc(s.current_period_end||"")}"></label><label class="f full">Megjegyzés (csak admin látja)<textarea id="as-note" rows="2" maxlength="500">${esc(s.note||"")}</textarea></label></div>
  <div class="status"><div class="grow"><b>Admin jog</b><div class="muted" style="font-size:12.5px">${u.superadmin?"Fő admin (a Vercel beállításából), innen nem módosítható.":u.me?"Ez a te fiókod.":u.admin?"Admin: látja és kezeli a regisztrálókat, előfizetéseket, márkákat.":u.confirmed?"Nem admin.":"Előbb erősítse meg az e-mail-címét, csak utána tehető adminná."}</div></div>${u.superadmin||u.me||(!u.admin&&!u.confirmed)?"":ui.admConfirm===u.id?`<span class="row" style="gap:6px"><button type="button" class="btn small" data-act="${u.admin?"admrevoke":"admgrant"}" data-id="${u.id}">${u.admin?"Igen, elveszem":"Igen, adminná teszem"}</button><button type="button" class="btn small ghost" data-act="admconfno" data-id="${u.id}">Mégse</button></span>`:`<button type="button" class="btn small ${u.admin?"ghost":""}" data-act="admconf" data-id="${u.id}">${u.admin?"Admin jog elvétele":"Adminná teszem"}</button>`}</div>
  <div class="status" style="flex-wrap:wrap"><div class="grow" style="min-width:200px"><b>White label</b><div class="muted" style="font-size:12.5px">Saját márkát kap: saját név, logó, színek, és a saját felhasználói. Ő lesz a márka gazdája, de te is be tudod állítani helyette (a Márkák fülön: „Megnyitom és beállítom”).</div></div>
    <div class="row" style="gap:6px;flex-wrap:nowrap"><input type="text" id="as-wl" placeholder="pl. minta-marka" aria-label="Márka azonosítója" maxlength="40" style="width:150px"><button type="button" class="btn small" data-act="admwl" data-email="${esc(u.email)}">Márkát kap</button></div></div>
  <p class="muted" style="margin:0;font-size:12px">A Pro azonnal bekapcsolja a Pro funkciókat (aktív, ajándék, vagy próbaidő a megadott dátumig). Az online fizetés bekötéséig itt kezeled.</p>
  <div class="row between">${u.superadmin?"<span></span>":`<button type="button" class="btn ghost small" data-act="${u.banned?"admunban":"admban"}" data-id="${u.id}">${u.banned?"Letiltás feloldása":"Fiók letiltása"}</button>`}<button class="btn">Mentés</button></div></form></div>`;
}
async function admDo(action,payload,okMsg,reload){
  try{await ctx.admin(action,payload);toast(okMsg);closeForm();if(reload)admLoad(reload)}
  catch(e){toast(e.message==="not_confirmed"?"Csak megerősített e-mail-című felhasználó tehető adminná.":e.message==="root"?"A fő admin a Vercel beállításából jön, innen nem módosítható.":e.message==="self"?"A saját fiókodon ezt nem módosíthatod.":e.message==="user_not_found"?"Nincs ilyen e-mail-címmel regisztrált felhasználó.":e.message==="bad_slug"?"Az azonosító csak kisbetűt, számot és kötőjelet tartalmazhat.":"Nem sikerült. Próbáld újra.")}
}
/* ---------- gyors hozzáadás (a napi nézet megnyitása nélkül) ---------- */
function openQuickAdd(kind,date){
  const k=date||(ui.calMode==="honap"&&ui.calMonth!==ym(TODAY)?ui.calMonth+"-01":(ui.calMode==="honap"?T:ui.selDay))||T;
  ui.qa={kind:kind||"ido",date:k};
  const q=ui.qa,nowH=Math.min(21,Math.max(7,new Date().getHours()+1));
  $("#layer").innerHTML=`<div class="modal" data-act="close"><form class="sheet" data-form="qadd"><div class="grabber" aria-hidden="true"></div><div class="row between"><h2>Gyors hozzáadás</h2><button type="button" class="iconbtn" data-act="close" aria-label="Bezárás">×</button></div>
  <div class="tabs">${[["ido","Időpont"],["teendo","Teendő"]].map(([v,l])=>`<button type="button" data-act="qakind" data-k="${v}" aria-pressed="${q.kind===v}">${l}</button>`).join("")}</div>
  <label class="f">${q.kind==="ido"?"Mi lesz?":"Mit kell elintézni?"}<input type="text" id="qa-title" maxlength="120" required placeholder="${q.kind==="ido"?"Például: Bemutató Minta Katának":"Például: Csomag összekészítése"}"></label>
  ${q.kind==="ido"?`<div class="grid g2"><label class="f">Nap<input type="date" id="qa-date" value="${q.date}" required></label><label class="f">Időpont<select id="qa-hour">${HOURS.map(h=>`<option value="${h}" ${h===nowH?"selected":""}>${pad(h)}:00</option>`).join("")}</select></label></div><label class="f">Helyszín (nem kötelező)<input type="text" id="qa-loc" maxlength="120" placeholder="Például: online, vagy egy cím"></label>`
  :`<label class="f">Mikorra?<select id="qa-when"><option value="nap">Egy adott napra</option><option value="het">Valamikor ezen a héten</option><option value="honap">Valamikor ebben a hónapban</option></select></label><label class="f" id="qa-datewrap">Nap<input type="date" id="qa-date" value="${q.date}"></label>`}
  <div class="row between"><span class="muted" style="font-size:12px">A tervezőbe mentjük; a telefonos naptáradba a szinkron viszi át.</span><button class="btn">Hozzáadás</button></div></form></div>`;
  setTimeout(()=>{const i=$("#qa-title");i&&i.focus()},50);
}
function saveQuickAdd(){
  const title=$("#qa-title").value.trim();if(!title){toast("Írd be, mi lesz.");return}
  if(ui.qa.kind==="ido"){
    const k=$("#qa-date").value,h=+$("#qa-hour").value,loc=($("#qa-loc").value||"").trim();if(!k){toast("Válassz napot.");return}
    const dd=day(k);dd.hours=dd.hours||{};dd.hours[h]=dd.hours[h]?dd.hours[h]+" · "+title:title;if(loc){dd.locs=dd.locs||{};dd.locs[h]=loc}
    save();closeForm();toast(`Bekerült: ${fmtDate(k)} ${pad(h)}:00`);render();return}
  const w=$("#qa-when").value;
  if(w==="nap"){const k=$("#qa-date").value||T;day(k).tasks.push({id:uid(),t:title,done:false});save();closeForm();toast(`Teendő: ${fmtDate(k)}`);render();return}
  const key=w==="het"?"w:"+iso(mondayOf(ui.calMode==="honap"?T:ui.selDay)):"m:"+(ui.calMode==="honap"?ui.calMonth:ui.selDay.slice(0,7));
  S.todos=S.todos||{};(S.todos[key]=S.todos[key]||[]).push({id:uid(),t:title,done:false});save();closeForm();toast(w==="het"?"Bekerült a hét teendői közé.":"Bekerült a hónap teendői közé.");render();
}

/* ---------- naptár-szinkron (Beállítások) ---------- */
function calSyncCard(){
  const c=ui.cal||{};
  let body;
  if(!PRO)body=`<p style="margin:0">A naptár-szinkron a Pro csomag része (${PRO_PRICE}).</p><div class="row">${proCta()}</div>`;
  else if(DEMO)body=`<p style="margin:0">A naptár-szinkronhoz fiók kell: ${ctx.cloud?`<button class="chip" data-act="signup">${ctx.signupOpen?"Regisztrálok":"Feliratkozom a várólistára"}</button>`:"a bemutató módban nem érhető el."}</p>`;
  else if(!c.loaded){if(!c.loading){c.loading=true;ui.cal=c;ctx.calendar("status").then(r=>{ui.cal=Object.assign({loaded:true},r);render()},()=>{ui.cal={loaded:true,err:true};render()})}body='<div class="spinner" role="status" aria-label="Betöltés"></div>'}
  else if(c.err)body='<p style="margin:0">Most nem sikerült betölteni. Próbáld újra később.</p>';
  else{
    const https=c.url||"",webcal=https.replace(/^https?:/,"webcal:");
    body=`<div class="status"><span class="ic">${c.active?"✅":"📅"}</span><div class="grow"><b>${c.active?"A naptárlinked aktív.":"Még nincs naptárlinked."}</b><div class="muted" style="font-size:12.5px">${c.active?`Létrehozva: ${fmtDate(String(c.created_at).slice(0,10))}${c.last_fetch_at?` · a naptárad utoljára ${fmtDate(String(c.last_fetch_at).slice(0,10))} kérte le`:" · még egy naptár sem kérte le"}`:"A tervező időpontjai, tartalmai és utánkövetései megjelennek a Google Naptárban és a telefonod naptárában, és maguktól frissülnek."}</div></div>
      ${c.active?`<span class="row" style="gap:6px"><button class="btn small ghost" data-act="calnew">Új link</button>${ui.calOff?'<button class="chip warn" data-act="calrevoke">Igen, kikapcsolom</button><button class="chip" data-act="caloffno">Mégse</button>':'<button class="chip" data-act="caloff">Kikapcsolás</button>'}</span>`:'<button class="btn small" data-act="calnew">Bekapcsolom</button>'}</div>
    ${https?`<label class="f">A te naptárlinked (titkos, ne oszd meg)<input type="text" readonly value="${esc(https)}" id="cal-url" onfocus="this.select()"></label><div class="row" style="gap:8px"><button class="btn small" data-act="calcopy">Link másolása</button><a class="btn small ghost" href="${esc(webcal)}">Megnyitás a telefonon / Macen</a></div>`:c.active?'<p class="muted" style="margin:0;font-size:12.5px">Biztonsági okból a linket csak létrehozáskor mutatjuk meg. Ha új eszközt kötnél be, kérj új linket (a régi ilyenkor megszűnik, a már bekötött naptárakat is frissíteni kell).</p>':""}
    <details class="howto"><summary>Hogyan kötöm be?</summary><ol><li><b>iPhone:</b> koppints a „Megnyitás a telefonon” gombra, majd az „Előfizetés” gombra. Vagy kézzel: Beállítások → Naptár → Fiókok → Fiók hozzáadása → Egyéb → Előfizetett naptár → illeszd be a linket.</li><li><b>Google Naptár:</b> számítógépen a calendar.google.com oldalon bal oldalt a „Más naptárak” melletti <b>+</b> → „URL alapján” → illeszd be a linket → „Naptár hozzáadása”.</li><li><b>Outlook:</b> Naptár → Naptár hozzáadása → Feliratkozás a webről.</li></ol><p class="muted" style="margin:0;font-size:12px">A Google és az iPhone néhány óránként frissíti a feliratkozott naptárt, ezért egy új időpont késéssel jelenhet meg.</p></details>`;
  }
  return `<div class="card stack" id="naptarszinkron" style="gap:12px"><div class="row between"><h3 style="margin:0">Naptár-szinkron${proTag()}</h3><span class="chip">Google · iPhone · Outlook</span></div>${body}${PRO&&!DEMO?'<hr class="sep">'+importsBlock():""}
  <p class="muted" style="margin:0;font-size:12px">A tervezőből a naptáraidba: feliratkozó link. A naptáraidból a tervezőbe: a „Más naptárak behúzása” rész. A Google Naptárba közvetlen írás (teljes kétirányú szinkron) hamarosan.</p></div>`;
}

/* ---------- heti és havi értékelő ---------- */
const WEEK_Q=[["best","Mi sikerült a héten a legjobban?"],["hard","Mi nem úgy alakult, ahogy szeretted volna? Miért?"],["learn","Mit tanultál a héten?"],["thanks","Kinek vagy hálás ezen a héten?"]];
const MONTH_STEPS_ALL=[
  ["szamok","A hónap számokban","Nézd meg, hol tartasz. Ezeket a tervező számolta ki a hónapodból."],
  ["siker","Sikerek",null,[["win","Mi volt a hónap legnagyobb sikere?"],["proud","Mire vagy a legbüszkébb?"]]],
  ["kihivas","Kihívások",null,[["hard","Mi volt a legnehezebb?"],["diff","Mit csinálnál másképp, ha újrakezdhetnéd a hónapot?"]]],
  ["tanulsag","Tanulságok és hála",null,[["learn","Mi volt a hónap legfontosabb tanulsága?"],["thanks","Ki segített a legtöbbet? Kinek mondasz köszönetet?"]]],
  ["jovo","A következő hónap","Válassz egy fő fókuszt és három célt. A célokat felvehetjük a jövő havi teendőid közé."],
  ["zaras","Zárás","Egy szóban vagy egy pontszámmal: milyen volt ez a hónap?"]
];
const MONTH_STEPS=MONTH_STEPS_ALL.filter(x=>x[0]!=="szamok"||FEAT("szamok"));
const monthStart=k=>k+"-01";
const monthEnd=m=>{const[Y,M]=m.split("-").map(Number);return iso(new Date(Y,M,0))};
const revStart=()=>S.onboarded||Object.keys(S.days||{}).sort()[0]||T;
function revLabel(key){if(key.startsWith("w:")){const m=parse(key.slice(2));return `${weekLabel(m)}`}const[Y,M]=key.slice(2).split("-").map(Number);return cap(MONTHS[M-1])+" "+Y}
// melyik értékelő „telt be": a hét péntekétől a heti, a hónap utolsó 3 napjától a havi; a lezárt, ki nem töltött = kimaradt
function dueReviews(){
  const out=[],R=S.reviews||{},hide=(S.prefs&&S.prefs.revHide)||{},start=revStart();
  const mon=mondayOf(T),wd=(TODAY.getDay()+6)%7;
  for(let i=0;i<=4;i++){const m=addDays(mon,-7*i),key="w:"+iso(m),end=iso(addDays(m,6));
    if(end<start)continue;if(R[key]&&R[key].done)continue;
    if(i===0){if(wd>=4)out.push({key,type:"het",state:"open"})}else if(!hide[key])out.push({key,type:"het",state:"missed"})}
  const cm=ym(TODAY),dim=new Date(TODAY.getFullYear(),TODAY.getMonth()+1,0).getDate();
  const pm=ym(new Date(TODAY.getFullYear(),TODAY.getMonth()-1,1));
  if(TODAY.getDate()>=dim-2&&!(R["m:"+cm]&&R["m:"+cm].done))out.push({key:"m:"+cm,type:"honap",state:"open"});
  if(monthEnd(pm)>=start&&!(R["m:"+pm]&&R["m:"+pm].done)&&!hide["m:"+pm])out.push({key:"m:"+pm,type:"honap",state:"missed"});
  return out;
}
function rangeStats(from,to){
  const ks=[];for(let d=parse(from);iso(d)<=to;d=addDays(d,1)){const k=iso(d);if(k>T)break;ks.push(k)}
  const inR=s=>s&&s>=from&&s<=to;
  let steps=0,gold=0,pts=0,closes=0;ks.forEach(k=>{const dd=S.days[k]||{},n=(dd.steps||[]).filter(Boolean).length;steps+=n;if(n===5)gold++;pts+=scoreOf(k).total;if(dd.close&&dd.close.mood!=null)closes++});
  return {days:ks.length,steps,stepsMax:ks.length*5,gold,pts,closes,
    contacts:S.contacts.filter(c=>inR(c.created)).length,clients:S.clients.filter(c=>inR(c.created)).length,
    published:S.content.filter(c=>inR(c.date)&&c.status===2).length,planned:S.content.filter(c=>inR(c.date)).length,
    revenue:S.orders.filter(o=>inR(o.date)).reduce((a,o)=>a+(+o.amount||0),0),team:S.team.filter(t=>inR(t.joined)).length};
}
function revRange(key){if(key.startsWith("w:")){const m=key.slice(2);return [m,iso(addDays(parse(m),6))]}const m=key.slice(2);return [monthStart(m),monthEnd(m)]}
function statsHTML(st){
  const pct=st.stepsMax?Math.round(st.steps/st.stepsMax*100):0;
  return `<div class="grid g4 revstats">${[[pct+"%","napi lépés teljesítve",`${st.steps} / ${st.stepsMax}`],[st.gold,"arany nap","mind az 5 lépés"],[st.pts,"lendületpont",""],[st.closes,"esti zárás",`${st.days} napból`],[st.contacts,"új kapcsolat",""],[st.clients,"új ügyfél",""],[st.published,"megjelent tartalom",`${st.planned} betervezve`],[money(st.revenue),"bevétel",""]].map(([v,l,s])=>`<div class="card kpi"><div class="v num">${v}</div><div class="l">${l}${s?`<br><span class="muted">${s}</span>`:""}</div></div>`).join("")}</div>`;
}
function revBanner(){
  const missed=dueReviews().filter(r=>r.state==="missed");if(!missed.length)return "";const r=missed[0];
  return `<div class="card revbanner"><span class="ic" aria-hidden="true">📝</span><div class="grow"><span class="t">Kimaradt egy értékelő: ${r.type==="het"?"heti":"havi"} (${esc(revLabel(r.key))})</span><span class="s">Töltsd ki, kérlek, ${r.type==="het"?"5":"10"} perc. Ebből látod, merre haladsz.${missed.length>1?` Még ${missed.length-1} vár.`:""}</span></div><div class="row" style="gap:8px"><button class="btn small" data-act="revopen" data-k="${r.key}">Kitöltöm</button><button class="nc-skip" style="color:var(--muted)" data-act="revhide" data-k="${r.key}">Elrejtés</button></div></div>`;
}
function vErtekelesek(){
  activeBoard=null;
  if(ui.rev)return revForm();
  const due=dueReviews(),R=S.reviews||{},done=Object.keys(R).filter(k=>R[k].done).sort().reverse();
  return head("Értékelések","Heti és havi visszatekintés")+`<p class="qday" style="margin:0">A hét végén (péntektől) betelik a heti értékelő, a hónap utolsó napjaiban a havi. Itt bármikor visszanézheted, merre jártál.</p>
  ${due.length?`<div class="card"><h3>Kitöltésre vár</h3><div class="list">${due.map(r=>`<div class="li"><div class="grow"><div class="t">${r.type==="het"?"Heti értékelő":"Havi értékelő"} · ${esc(revLabel(r.key))}</div><div class="s">${r.state==="missed"?'<span style="color:var(--warn)">Kimaradt</span>':"Most kitölthető"}</div></div><button class="btn small" data-act="revopen" data-k="${r.key}">Kitöltöm</button></div>`).join("")}</div></div>`:'<div class="card"><p style="margin:0">Most nincs kitöltésre váró értékelő. A heti péntektől, a havi a hónap utolsó napjaiban jelenik meg.</p></div>'}
  <div class="card"><h3>Korábbi értékeléseid</h3>${done.length?`<div class="list">${done.map(k=>{const r=R[k];return `<div class="li"><div class="grow"><div class="t">${k.startsWith("w:")?"Heti":"Havi"} · ${esc(revLabel(k))}</div><div class="s">${r.a&&(r.a.best||r.a.win)?esc(String(r.a.best||r.a.win).slice(0,90)):"Kitöltve: "+fmtDate(r.done)}</div></div>${r.mood!=null?`<span class="chip">${moods()[r.mood]}</span>`:""}<button class="btn small ghost" data-act="revopen" data-k="${k}">Megnyitás</button></div>`}).join("")}</div>`:'<div class="empty">Az első kitöltött értékelőd itt jelenik meg.</div>'}</div>`;
}
function revDraft(key){const R=S.reviews=S.reviews||{};const r=R[key]||{};return {key,a:Object.assign({},r.a||{}),goals:(r.goals||["","",""]).slice(0,3),focus:r.focus||"",mood:r.mood!=null?r.mood:null,toTodos:true,step:0,doneBefore:!!r.done}}
function revForm(){
  const d=ui.rev,isW=d.key.startsWith("w:"),[from,to]=revRange(d.key),st=rangeStats(from,to);
  const q=(k,l)=>`<label class="f">${l}<textarea data-rev="${k}" rows="3">${esc(d.a[k]||"")}</textarea></label>`;
  const goals=`<div class="stack" style="gap:8px">${d.goals.map((g,i)=>`<label class="f">${i+1}. cél<input type="text" data-revgoal="${i}" maxlength="120" value="${esc(g)}"></label>`).join("")}</div><label class="row" style="gap:8px;font-size:13px"><button type="button" class="cbx" data-act="revtodos" aria-pressed="${d.toTodos}">${d.toTodos?"✓":""}</button>Felveszem őket a ${isW?"jövő heti":"jövő havi"} teendőim közé</label>`;
  const moodRow=`<div class="moods">${moods().map((m,i)=>`<button type="button" class="mood" data-act="revmood" data-i="${i}" aria-pressed="${d.mood===i}">${m}</button>`).join("")}</div>`;
  const back=`<button class="chip" data-act="revclose" style="align-self:flex-start">← Értékelések</button>`;
  if(isW)return back+head("Heti értékelő",revLabel(d.key))+`<div class="card"><h3>A heted számokban</h3>${statsHTML(st)}</div>
    <div class="card stack" style="gap:14px"><h3 style="margin:0">Visszatekintés</h3>${WEEK_Q.map(([k,l])=>q(k,l)).join("")}</div>
    <div class="card stack" style="gap:12px"><h3 style="margin:0">A jövő heted</h3><p class="muted" style="margin:0;font-size:12.5px">Három dolog, ami a legfontosabb a következő héten.</p>${goals}</div>
    <div class="card stack" style="gap:10px"><h3 style="margin:0">Milyen volt a heted?</h3>${moodRow}</div>
    <div class="row between"><button class="btn ghost" data-act="revclose">Később folytatom</button><button class="btn" data-act="revsave">${d.doneBefore?"Mentés":"Kész, lezárom a hetet"}</button></div>`;
  const stp=MONTH_STEPS[d.step],last=d.step===MONTH_STEPS.length-1;
  let inner="";
  if(stp[0]==="szamok"){const g=S.goals[d.key.slice(2)];inner=statsHTML(st)+(g?`<div class="list" style="margin-top:6px">${[["szem","Személyes forgalom",g.szem&&g.szem.teny],["csop","Csoportforgalom",g.csop&&g.csop.teny]].filter(x=>g[x[0]]&&+g[x[0]].cel).map(([k,l,v])=>`<div class="li"><div class="grow t">${l}</div><span class="chip ${+v>=+g[k].cel?"good":""}">${nfmt(v||0)} / ${nfmt(g[k].cel)}</span></div>`).join("")}</div>`:"")}
  else if(stp[3])inner=stp[3].map(([k,l])=>q(k,l)).join("");
  else if(stp[0]==="jovo")inner=`<label class="f">A következő hónap fő fókusza<input type="text" data-revfocus="1" maxlength="120" value="${esc(d.focus)}" placeholder="Például: 10 új kapcsolat és heti 3 Reel"></label>`+goals;
  else inner=moodRow+`<label class="f">Egy mondat magadnak a hónap végén (nem kötelező)<textarea data-rev="note" rows="2">${esc(d.a.note||"")}</textarea></label>`;
  return back+head("Havi értékelő",revLabel(d.key))+`<div class="card stack revstep" style="gap:14px"><div class="row between"><div class="eyebrow">${d.step+1}. lépés / ${MONTH_STEPS.length}</div><div class="ob-prog" style="max-width:220px"><i style="width:${(d.step+1)/MONTH_STEPS.length*100}%"></i></div></div><h2 style="margin:0">${stp[1]}</h2>${stp[2]?`<p class="lead muted" style="margin:0">${stp[2]}</p>`:""}${inner}
    <div class="row between">${d.step?'<button class="btn ghost" data-act="revprev">Vissza</button>':'<button class="btn ghost" data-act="revclose">Később folytatom</button>'}<button class="btn" data-act="${last?"revsave":"revnext"}">${last?(d.doneBefore?"Mentés":"Kész, lezárom a hónapot"):"Tovább"}</button></div></div>`;
}
function revSave(){
  const d=ui.rev,isW=d.key.startsWith("w:"),[from,to]=revRange(d.key),R=S.reviews=S.reviews||{},first=!(R[d.key]&&R[d.key].done);
  R[d.key]={done:(R[d.key]&&R[d.key].done)||T,updated:T,a:d.a,goals:d.goals,focus:d.focus,mood:d.mood,stats:rangeStats(from,to)};
  if(first&&d.toTodos){const goals=d.goals.map(g=>g.trim()).filter(Boolean);if(goals.length){
    const nk=isW?"w:"+iso(addDays(parse(d.key.slice(2)),7)):"m:"+ym(new Date(+d.key.slice(2,6),+d.key.slice(7,9),1));
    S.todos=S.todos||{};(S.todos[nk]=S.todos[nk]||[]).push(...goals.map(t=>({id:uid(),t,done:false})))}}
  if(first)logPt("review");
  ui.rev=null;save();toast(first?(isW?"Lezártad a hetet. Szép munka!":"Lezártad a hónapot. Gratulálok!"):"Mentve.");render();window.scrollTo(0,0);
}
/* ---------- csomagok: ingyenes / pro ---------- */
const PRO_LIST_ALL=[["tartalom","Tartalomtervező","Havi tartalomnaptár, pillér-egyensúly, ötletbank hookkal és CTA-val."],["kapcsolatok","Kapcsolatok","Négylépcsős folyamat, utánkövetési emlékeztetők, üzenetvázlatok."],["ugyfelek","Ügyfelek","Rendelések, újrarendelési és szülinapi emlékeztető."],["szamok","Számok","Havi célok, bevétel, pontrendszer napi bontásban."],["naptar","Naptár-szinkron","A tervező naptára a Google Naptárban és a telefonodon, és a többi naptárad bekötése."],["email","E-mail","Üzenetek küldése a kapcsolataidnak és ügyfeleidnek, közvetlenül a tervezőből (hamarosan)."]];
const PRO_LIST=PRO_LIST_ALL.filter(x=>VIEWS.some(v=>v[0]===x[0]));
function proUrl(){
  if(DEMO)return null;
  const u=ctx.user||{};return "mailto:hello@polymaind.hu?subject="+encodeURIComponent(BR.productName+" Pro előfizetés")+"&body="+encodeURIComponent(`Szia!\n\nSzeretnék Pro-ra váltani (${PRO_PRICE}).\nA fiókom e-mail-címe: ${u.email||""}\n\nKöszönöm!`);
}
function proCta(label){
  if(DEMO)return `<button class="btn" data-act="demoplan" data-k="pro">${label||"Kipróbálom a Pro-t a bemutatóban"}</button>`;
  if(ctx.billingReady)return `<button class="btn" data-act="buypro">${label||"Pro-ra váltok"}</button>`;
  return `<a class="btn" href="${esc(proUrl())}">${label||"Pro-ra váltok"}</a>`;
}
function vPro(view){
  activeBoard=null;
  const it=PRO_LIST.find(x=>x[0]===view)||PRO_LIST[0];
  return head(it[1],"Pro funkció")+`<div class="card stack procard" style="gap:14px"><div class="row" style="gap:12px;flex-wrap:nowrap"><span class="ic" aria-hidden="true">${nicon(view)}</span><div><h2 style="margin:0">${esc(it[1])} a Pro csomagban</h2><p class="muted" style="margin:4px 0 0">${esc(it[2])}</p></div></div>
  <div class="prolist">${PRO_LIST.map(([k,l,d])=>`<div class="li"><span class="cbx" aria-hidden="true" aria-pressed="true">✓</span><div class="grow"><div class="t">${esc(l)}</div><div class="s">${esc(d)}</div></div></div>`).join("")}</div>
  <div class="row between"><div><div class="bpv" style="margin:0">${PRO_PRICE.replace(" / hó","")}<small> / hó</small></div><div class="muted" style="font-size:12px">Bármikor lemondható. Minden ingyenes funkció is benne van.</div></div>${proCta()}</div>
  ${DEMO?"":ctx.billingReady?'<p class="muted" style="margin:0;font-size:12px">Biztonságos bankkártyás fizetés a Stripe-on. A Pro a fizetés után azonnal bekapcsol.</p>':'<p class="muted" style="margin:0;font-size:12px">Az online fizetés hamarosan indul. Addig a gombra kattintva írj nekünk, és még aznap bekapcsoljuk a Pro-t a fiókodon.</p>'}</div>`;
}
function proTeaser(){
  return `<div class="card upstrip"><span class="ic" aria-hidden="true">⭐</span><div class="grow"><span class="t">Kapcsolatok, ügyfelek, tartalom és számok a Pro csomagban</span><span class="s">Utánkövetési emlékeztetők, újrarendelés, tartalomnaptár, havi célok, naptár-szinkron. ${PRO_PRICE}.</span></div><a class="btn small" href="#kapcsolatok">Megnézem</a></div>`;
}
function planCard(){
  const pro=PRO,wl=BR.plan==="whitelabel";
  return `<div class="card stack"><div class="row between"><h3 style="margin:0">Csomagod</h3><span class="chip ${pro?"on":""}">${wl?"White label":pro?"Pro":"Ingyenes"}</span></div>
  <p style="margin:0;font-size:13.5px">${wl?`A ${esc(BR.productName)} csomagjában minden funkció elérhető.`:pro?"Minden funkció elérhető: tartalom, kapcsolatok, ügyfelek, számok, naptár-szinkron.":`A Pro csomagban (${PRO_PRICE}) a Tartalomtervező, a Kapcsolatok, az Ügyfelek, a Számok, a naptár-szinkron és az e-mail is elérhető.`}</p>
  ${pro||wl?"":`<div class="row">${proCta()}</div>`}${pro&&!wl&&!DEMO&&ctx.billingReady&&ctx.planSource==="subscription"?'<div class="row"><button class="btn ghost small" data-act="billportal">Előfizetés kezelése (kártya, számlák, lemondás)</button></div>':""}
  ${DEMO?`<div class="row" style="gap:6px"><span class="lab2" style="margin:0">Csomag a bemutatóban:</span>${[["ingyenes","Ingyenes"],["pro","Pro"],["whitelabel","White label"]].map(([k,l])=>`<button class="mood" data-act="demoplan" data-k="${k}" aria-pressed="${(wl?"whitelabel":pro?"pro":"ingyenes")===k}">${l}</button>`).join("")}</div>`:""}</div>`;
}
/* ---------- bekötött külső naptárak (csak olvasható réteg) ---------- */
function extRange(){
  if(route==="ma")return [T,T];
  if(ui.calMode==="honap"){const[Y,M]=ui.calMonth.split("-").map(Number);const f=new Date(Y,M-1,1),s=addDays(f,-((f.getDay()+6)%7));return [iso(s),iso(addDays(s,41))]}
  if(ui.calMode==="het"){const m=mondayOf(ui.selDay);return [iso(m),iso(addDays(m,6))]}
  return [ui.selDay,ui.selDay];
}
// újralekérés: új időszaknál, a nézet megnyitásakor (ha 60 mp-nél régebbi), 5 percenként, és a Frissítés gombra
function extLoad(force){
  if(!PRO||DEMO)return;const[from,to]=extRange(),key=from+"|"+to;const e=ui.ext||(ui.ext={});
  if(e.loading===key)return;
  if(!force&&e.key===key&&Date.now()-(e.at||0)<60000)return;
  e.loading=key;
  ctx.calendar("events",{from,to,fresh:!!force}).then(r=>{ui.ext={key,at:Date.now(),events:r.events||[],errors:r.errors||[],meta:r.meta||[]};if(route==="naptar"||route==="ma")render()},()=>{ui.ext={key,at:Date.now(),events:[],errors:[{name:"",error:"network"}],meta:[]};if(route==="naptar")render()});
}
setInterval(()=>{if(route==="naptar"||route==="ma")extLoad(true)},5*60*1000);
function extStatus(){
  const e=ui.ext;if(!PRO||DEMO||!e||!e.meta||!e.meta.length)return "";
  const hhmm=iso=>{const d=new Date(iso);return pad(d.getHours())+":"+pad(d.getMinutes())};
  return `<div class="extstatus">${e.meta.map(m=>`<span class="chip"><span class="dot" style="background:${esc(m.color)};width:8px;height:8px"></span>${esc(m.name)}: ${m.error?'<span style="color:var(--warn)">nem sikerült frissíteni</span>':`${m.count} esemény ebben az időszakban · frissítve ${hhmm(m.fetched_at)}`}</span>`).join("")}<button class="chip" data-act="extrefresh">↻ Frissítés</button></div>`;
}
const extOf=k=>((ui.ext&&ui.ext.events)||[]).filter(e=>e.date===k);
function extLabel(e){return `${e.allDay?"Egész nap":e.start}${e.allDay?"":"–"+e.end}`}
function importsBlock(){
  if(!PRO)return "";
  if(DEMO)return `<p class="muted" style="margin:0;font-size:12.5px">Más naptárak behúzása fiókkal érhető el.${proTag()}</p>`;
  const im=ui.imports;
  if(!im){ctx.calendar("import.list").then(r=>{ui.imports=r.imports||[];render()},e=>{ui.imports={err:e.message||"hiba"};render()});return '<div class="spinner" role="status" aria-label="Betöltés"></div>'}
  if(im.err)return `<p class="muted" style="margin:0">${im.err==="not_configured"?"A naptárak behúzása ezen a telepítésen még nincs bekapcsolva.":"Most nem sikerült betölteni a bekötött naptárakat."}</p>`;
  const COLS=["#3E7BFA","#12A150","#E5484D","#C77700","#8B5CF6","#0EA5E9"];
  return `<div class="stack" style="gap:10px"><h3 style="margin:6px 0 0;font-size:16px">Más naptárak behúzása${proTag()}</h3><p class="muted" style="margin:0;font-size:12.5px">A Google, iCloud vagy Outlook naptáraid eseményei megjelennek a tervező naptárában, így egy helyen látsz mindent. Csak olvassuk őket, nem módosítjuk.</p>
  ${im.length?`<div class="list">${im.map(c=>`<div class="li"><span class="dot" style="background:${esc(c.color)}"></span><div class="grow"><div class="t">${esc(c.name)}</div><div class="s">${esc(c.host||"")}${c.last_error?' · <span style="color:var(--warn)">nem sikerült frissíteni</span>':c.last_ok_at?" · frissítve: "+fmtDate(String(c.last_ok_at).slice(0,10)):""}</div></div>${ui.impDel===c.id?`<button class="chip warn" data-act="impdel" data-id="${c.id}">Igen, leválasztom</button><button class="chip" data-act="impdelno">Mégse</button>`:`<button class="iconbtn" data-act="impdelask" data-id="${c.id}" aria-label="Leválasztás">×</button>`}</div>`).join("")}</div>`:""}
  <form class="stack" data-form="impadd" style="gap:10px"><div class="grid g2"><label class="f">Megnevezés<input type="text" id="imp-name" maxlength="60" placeholder="Például: Google (munka)" required></label><label class="f">Szín<select id="imp-color">${COLS.map((c,i)=>`<option value="${c}">${["Kék","Zöld","Piros","Narancs","Lila","Égszínkék"][i]}</option>`).join("")}</select></label></div>
  <label class="f">A naptár iCal-linkje<input type="text" id="imp-url" inputmode="url" placeholder="https://… vagy webcal://… (.ics)" required></label><button class="btn small" style="align-self:flex-start">Naptár bekötése</button></form>
  <details class="howto"><summary>Honnan kapom meg a linket?</summary><ol><li><b>Google Naptár:</b> számítógépen a calendar.google.com → bal oldalt a naptár neve melletti ⋮ → <b>Beállítások és megosztás</b> → lent a <b>Naptár integrálása</b> résznél: <b>Titkos cím iCal formátumban</b> → másold ki.</li><li><b>iPhone / iCloud:</b> a Naptár appban a <b>Naptárak</b> → a naptár melletti ⓘ → kapcsold be a <b>Nyilvános naptár</b>-t → <b>Link megosztása</b> → Másolás. (A link bárki számára olvasható, aki ismeri.)</li><li><b>Outlook:</b> outlook.com → Beállítások → Naptár → <b>Megosztott naptárak</b> → Naptár közzététele → „Minden részlet” → az <b>ICS</b> linket másold ki.</li></ol><p class="muted" style="margin:0;font-size:12px">A linkeket titkosítva tároljuk. Az új események legfeljebb 10 percen belül jelennek meg itt.</p></details></div>`;
}
/* ---------- gondolattérkép-indító kérdéssor ----------
 * 3 kör: alapkör (mindenkinek) → helyzet + szakma (rá szabott kérdések) → mélyítés (a túl általános válaszokra, max 4).
 * A térképre CSAK a felhasználó saját szavai kerülnek, rövidítve; a kihagyott kérdés „Nyitott: …?" levél lesz.
 * Legfeljebb 7 főág: „Cél és siker" + a hat szakmai ág (a helyzet-kérdések a hozzájuk illő ágba kerülnek). */
const MZB={cel:"Cél és siker",kinek:"Kinek",mit:"Mit adok",mas:"Mitől vagyok más",hogyan:"Hogyan találnak rám",penz:"Pénz és kapacitás",akad:"Akadályok"};
const MZ_ORDER=["cel","kinek","mit","mas","hogyan","penz","akad"];
const MZ_HELYZET=[["indul","Most indulok"],["megakadt","Működik, de megakadtam"],["novekedes","Növekedni szeretnék"],["valtas","Váltanék vagy újrapozicionálnék"],["uj","Új terméket, szolgáltatást vagy programot tervezek"]];
// [kérdés, ág, címke, példaválasz, idézőjeles?]
const MZ_HQ={
  indul:[["Mi az az egy dolog, amit már most is el tudnál adni, ha holnap valaki megkérdezné?","mit","Első ajánlat","Egy 60 perces egyéni konzultáció 15 000 Ft-ért"],["Kinek mondtad el eddig, mivel foglalkozol, és mit kérdeztek vissza?","kinek","Első visszajelzések","Három barátnőmnek; azt kérdezték: „online is lehet?”"],["Mennyi időd és pénzed van rá havonta, őszintén?","penz","Erőforrások","Heti 8 óra, havi 30 000 Ft"]],
  megakadt:[["Mikor ment utoljára jól, és mi volt akkor más?","cel","Ami működött","Tavasszal, amikor hetente élőztem"],["Mit csinálsz hetente, amiről tudod, hogy nem hoz semmit, mégis csinálod?","akad","Elengedni","Napi 2 óra görgetés „inspirációért”"],["Ha egyetlen számot javíthatnál, melyik lenne: érdeklődők, vásárlások, ár, visszatérés?","akad","Szűk keresztmetszet","Érdeklődők: most havi 5, kellene 20"]],
  novekedes:[["Mennyi a mostani havi bevételed vagy ügyfélszámod, és mennyi legyen egy év múlva?","cel","Növekedési cél","Most 12 ügyfél, egy év múlva 25"],["Mi törne el először, ha holnaptól kétszer annyi ügyfeled lenne?","akad","Korlátok","Az időpont-egyeztetés és az e-mailek"],["Mit adhatnál ki másnak, vagy mit lehetne automatizálni?","penz","Kiszervezés","Számlázás, posztok ütemezése"]],
  valtas:[["Mi az, amit már nem akarsz csinálni, és miért?","akad","Amit elhagyok","Az egyéni óradíjas munkát, mert kiéget"],["Mi az, ami felé húz, és mit csináltál már ebben az irányban?","cel","Új irány","Csoportos program; már tartottam két workshopot"],["Mit viszel át a régiből: ügyfeleket, tudást, hírnevet?","mas","Amit viszek","10 év tapasztalat és 40 ajánló ügyfél"]],
  uj:[["Kinek a melyik problémáját oldja meg, és ki kérte már tőled?","kinek","Igény","Kezdő vállalkozóknak a tervezést; hárman kérték"],["Mikorra kell kész lennie, és mi a legkisebb változat, amit már árulni lehet?","mit","Első verzió","Márciusra; egy 4 hetes online csoport"],["Hogyan kapcsolódik a mostani ajánlataidhoz: előtte, utána vagy helyette jön?","penz","Ajánlatlépcső","Az egyéni konzultáció elé, belépőként"]]
};
const MZ_SZAKMA=[["coach","Coach, mentor, tréner"],["termek","Termékes vállalkozó (gyártó, webshop, kézműves)"],["kreativ","Kreatív szakember (designer, fotós, író, videós)"],["helyi","Helyi szolgáltató (szépségipar, sport, egészség, oktatás)"],["tanacsado","Tanácsadó, szakértő, cégeknek dolgozó szabadúszó"],["halozat","Hálózatépítő"],["tartalom","Tartalomgyártó, online oktató, digitális termék"],["vendeglatas","Vendéglátás, helyi üzlet"],["egyeb","Egyéb"]];
const MZ_SQ={
  coach:[["Írd le egy konkrét ügyfeledet, akivel a legszívesebben dolgoztál: hol tartott, amikor jött?","kinek","","35 éves anyuka, két év GYES után nem merte újrakezdeni"],["Honnan hová viszed el az ügyfeleidet? Mi az „előtte” és mi az „utána”?","mit","Átalakulás","Bizonytalan → saját, fizető ügyfelekkel működő szolgáltatás"],["Melyik három probléma miatt keresnek meg leggyakrabban, ahogy ők mondják?","kinek","Fájdalompontok","„Nem tudom, hol kezdjem”, „nincs időm”, „félek eladni”",1],["Van saját módszered, lépéssorod vagy meggyőződésed, ami csak a tiéd? Van neve?","mas","","Az 5 lépéses „Bátor indulás” módszer"],["Milyen formában dolgozol (egyéni, csoportos, online program, workshop), mennyiért, és hány fő fér bele egy hónapba?","penz","Ajánlatlépcső","Egyéni: 25 000 Ft/alkalom, havonta 12 fő"],["Honnan jött az utolsó öt ügyfeled?","hogyan","","3 ajánlás, 1 Instagram, 1 előadás"],["Mi tart vissza most a legjobban: a láthatóság, az ár, az időbeosztás vagy az önbizalom?","akad","","A láthatóság: nem posztolok rendszeresen"]],
  termek:[["Melyik terméked hozza a bevétel nagyobb részét, és melyiket szereted a legjobban?","mit","Termékek","A szójagyertyák hozzák, a kerámiát szeretem"],["Ki vásárolja, és ki használja? Ugyanaz az ember, vagy ajándék, céges beszerzés?","kinek","Vásárló és használó","Főleg ajándéknak veszik, 30–45 éves nők"],["Miért téged választanak egy hasonló, olcsóbb termék helyett?","mas","","Kézzel öntött, egyedi illatok, szép csomagolás"],["Hol adod el: saját webshop, piactér, viszonteladó, vásár, üzlet? Melyik hozza a legtöbbet?","hogyan","Csatornák","Saját webshop 60%, vásárok 40%"],["Nagyjából mennyi marad egy darabon, és mi a legnagyobb költség?","penz","Árazás","Kb. 2 500 Ft; a legdrágább a viasz és a posta"],["Hol szorít a működés: alapanyag, gyártás, raktár, szállítás?","akad","Működés","A csomagolás viszi el az estéket"],["Melyik hónapokban fogy a legtöbb, és mikor áll?","penz","Szezon","November–december csúcs, nyáron áll"]],
  kreativ:[["Melyik munkád miatt keresnek meg, és melyiket csinálnád szívesebben?","mit","Fókusz","Logókért keresnek, arculatot csinálnék"],["Melyik három munkát tennéd a portfóliód elejére, és miért pont azokat?","mas","Portfólió","Egy kávézó, egy jógastúdió és egy borászat arculata"],["Hogyan írná le a stílusodat három szóban egy elégedett megbízód?","mas","Stílus","„Letisztult, meleg, bátor”",1],["Kik a megbízóid (cégek, ügynökségek, magánszemélyek), és ki fizet a legjobban?","kinek","","Kisvállalkozások; az ügynökségek fizetnek jobban"],["Projektre, óradíjra vagy csomagban árazol? Mikor érezted utoljára, hogy aluláraztad magad?","penz","Árazás","Projektre; a múlt havi arculatnál"],["Mennyi időd megy el nem alkotó munkára (egyeztetés, javítási körök, számlázás)?","akad","Folyamatok","Heti kb. 10 óra"],["Van olyan ötleted, amit egyszer elkészítesz és sokszor eladsz (sablon, preset, nyomat, kurzus)?","mit","Termékesítés","Instagram-sablon csomag kisvállalkozóknak"]],
  helyi:[["Melyik szolgáltatásodat kérik a legtöbben, és melyiken keresel a legtöbbet?","mit","","Gél lakkot kérik, a műkörmön keresek a legtöbbet"],["A vendégeid hányad része tér vissza, és milyen gyakran?","kinek","Törzsvendégek","Kb. 70%, háromhetente"],["Mit mondanak rólad a vendégeid, amikor ajánlanak valakinek?","mas","","„Nála mindig nyugi van, és sosem késik”",1],["Honnan találnak rád: ajánlás, Google, Instagram, kirakat, foglalóoldal?","hogyan","","Főleg ajánlás és Google-térkép"],["Hány üres idősáv van egy átlagos héten, és melyik napokon?","penz","Foglaltság","5–6 sáv, hétfőn és kedden délelőtt"],["Mit adhatnál még a meglévő vendégeidnek: bérletet, terméket, ajándékutalványt, csomagot?","mit","Bővítés","Ajándékutalvány karácsonyra"]],
  tanacsado:[["Milyen cégnek segítesz a legjobban: méret, iparág, és ki dönt náluk?","kinek","","10–50 fős gyártócégek; az ügyvezető dönt"],["Milyen üzleti problémát oldasz meg, és mibe kerül nekik, ha nem oldják meg?","mit","Érték","Pénzügyi átláthatóság; havi több százezer elfolyik"],["Mi a belépő ajánlatod, és mi az, amit hosszú távon havidíjasan adsz?","penz","Ajánlatlépcső","Egynapos átvilágítás → havi kontrolling"],["Mennyi idő telik el az első beszélgetéstől a szerződésig, és hol akad el leggyakrabban?","hogyan","Értékesítési folyamat","Kb. 6 hét; az árajánlat után elakad"],["Melyik három referenciád a legjobb, számokkal?","mas","Bizonyítékok","Egy cégnél 18%-kal csökkent a költség"],["Mit adsz te, amit egy olcsóbb versenytárs vagy egy AI-eszköz nem tud?","mas","Pozíció","Ott ülök velük a vezetői megbeszélésen"]],
  halozat:[["Mi a fő célod: saját termékhasználat, mellékjövedelem vagy vezetői pálya?","cel","Fő cél","Mellékjövedelem, havi 100 000 Ft"],["Kik a vásárlóid, és kik lehetnének csapattagok? Miben különböznek?","kinek","Két célcsoport","Vásárlók: anyukák; csapattagok: akik otthonról dolgoznának"],["Miért pont ezt a céget és terméket választottad? Mi a saját történeted?","mas","Énmárka","A bőrproblémám megoldódott, ezért kezdtem ajánlani"],["Hogyan építesz kapcsolatot tukmálás nélkül: tartalommal, ajánlással, eseménnyel?","hogyan","","Napi sztorikkal és havi kóstoló-estekkel"],["Hol tartasz a következő szintig, és mennyi pont hiányzik még?","penz","Szint","Még 1 200 pont a vezetői szintig"],["Kiben látsz most vezetőt a csapatodból, és mire van szüksége tőled?","kinek","Csapat","Timiben; heti egy közös tervezésre"]],
  tartalom:[["Kinek készíted a tartalmat, és mit tud meg az, aki három hónapja követ?","kinek","","Kezdő futóknak; három hónap után lefut 5 km-t"],["Melyik három témád hozza a legtöbb mentést, megosztást vagy kérdést?","mit","Tartalompillérek","Edzéstervek, sérülésmegelőzés, felszerelés"],["Melyik platform a főhadiszállásod, és melyik csak terjeszt?","hogyan","","Instagram a fő, a TikTok csak terjeszt"],["Miből keresel most pénzt, és miből szeretnél: szponzoráció, kurzus, közösség, termék?","penz","Bevételi lábak","Most szponzoráció; online kurzust szeretnék"],["Mi az ingyenes anyagod, és hova viszi tovább az embereket?","hogyan","Tölcsér","Ingyenes 4 hetes edzésterv → hírlevél"],["Mennyi idő egy tartalom elkészítése, és mit lehetne újrahasznosítani?","akad","Gyártás","Egy Reel 3 óra; a hosszú videókból lehetne rövidet vágni"]],
  vendeglatas:[["Milyen alkalomra jönnek hozzád: ebéd, randi, céges est, gyors kávé, bevásárlás?","kinek","Alkalmak","Hétköznap ebéd, hétvégén reggeli"],["Melyik három tétel fogy a legjobban, és melyiken marad a legtöbb?","mit","Kínálat","Bowl, lepény, limonádé; a limonádén marad a legtöbb"],["Ha három szóban kellene leírni a hangulatodat, mi lenne az?","mas","","Napfényes, családias, zöld"],["Melyik nap és napszak gyenge, és miért?","penz","Forgalom","Hétfő délután; nincs, ami idehozná az embereket"],["Kik a törzsvendégeid, és mi hozza vissza őket?","kinek","Közösség","A szomszéd irodák; a napi menü"],["Milyen rendezvény, csomag vagy kiszállítás hiányzik még?","mit","Új bevétel","Céges reggeli-csomag kiszállítással"]],
  egyeb:[["Kinek segítesz a legtöbbet? Írj le egy konkrét embert.","kinek","","Egy kisvállalkozó, aki egyedül viszi a boltját"],["Mit adsz nekik: terméket, szolgáltatást, tudást?","mit","","Havi könyvelést és egy negyedéves átnézést"],["Miért téged választanak más helyett?","mas","","Mindig elérhető vagyok és érthetően magyarázok"],["Honnan jön most a legtöbb érdeklődő?","hogyan","","Ajánlásból"],["Mennyiért adod, és mennyit bírsz egy hónapban?","penz","","Havi 40 000 Ft-tól, 15 ügyfél fér bele"],["Mi akadályoz most a legjobban?","akad","","Az időm nagy része adminisztráció"]]
};
const MZ_DEEP=[
  [/^\s*(nem tudom|fogalmam sincs|nem tudom még|passz)/i,"Ha a legjobb barátod válaszolna helyetted, mit mondana?"],
  [/\b(mindenki|bárki|mindenkinek|bárkinek)/i,"Ki az az egy ember, akinek a legjobban tudtál segíteni? Mit csinált, miért jött hozzád?"],
  [/(minőség|odafigyel|szeretettel|igényes munk)/i,"Mit csinálsz konkrétan másképp, mint a többiek? Mondj egy esetet."],
  [/^(?!.*\d).*(több ügyfél|több pénz|több bevétel|több vevő|több vendég)/i,"Mennyi pontosan, és mikorra? Mire kell ez a szám?"],
  [/nincs időm/i,"Mi viszi el a heted legnagyobb részét, hány órában?"],
  [/minden fontos/i,"Ha csak egyet tarthatnál meg, melyik lenne?"],
  [/^\s*majd ha/i,"Mi a legkisebb lépés, amit jövő héten meg tudsz tenni?"],
  [/mások is/i,"Melyik elégedett ügyfeled mondta, hogy nálad más volt? Mit mondott pontosan?",1]
];
function mzDeepFor(ans){
  const a=String(ans||"").trim();if(!a)return null;
  for(const[re,q,quote]of MZ_DEEP)if(re.test(a))return {q,quote:!!quote};
  if(a.split(/[,;\n]/).filter(x=>x.trim()).length>=5)return {q:"Ebből melyik három hozza a legtöbbet?"};
  return null;
}
const MZ_PROFMAP={mlm:"halozat",tartalom:"tartalom"};
// a lépések a válaszokból épülnek (elágazás + visszakérdezés)
function mzSteps(st){
  const a=st.a,steps=[
    {k:"cel",type:"choice",q:"Mire kell most ez a térkép?",opts:[["dontes","Dönteni szeretnék"],["terv","Tervet csinálnék"],["otlet","Ötleteket gyűjtenék"],["rend","Rendet raknék a fejemben"]]},
    {k:"kozep",q:"Ha egy mondatban kellene leírnod, mi kerüljön a közepére, mi lenne az?",ex:"Saját online programot indítok tavaszra",req:1},
    {k:"ido",type:"choice",q:"Mekkora időtávra gondolkodsz?",opts:[["egy hónap","Egy hónap"],["egy negyedév","Egy negyedév"],["egy év","Egy év"],["több év","Több év"]]},
    {k:"miert",q:"Mi történt, ami miatt pont most kezdesz bele?",ex:"Januárban lejár a munkaszerződésem",br:"cel",label:"Miért most"},
    {k:"siker",q:"Honnan tudod majd, hogy a térkép elvégezte a dolgát? Mi lesz másképp egy hónap múlva?",ex:"Tudni fogom, mivel indulok, és lesz 3 fizető ügyfelem",br:"cel",label:"Siker"},
    {k:"biztos",type:"two",q:"Mi az, amit már biztosan tudsz, és mi az, ami még kavarog?",f:[["biztos","Amit biztosan tudok","Online szeretnék dolgozni, kisebb csoportokkal"],["kavarog","Ami még kavarog","Mennyit kérjek érte, és hol találom meg őket"]],br:"cel"}
  ];
  if(a.cel==="dontes"){
    steps.push({k:"opciok",type:"list",q:"Milyen lehetőségek között választasz? Soronként egyet írj (2–4).",ex:"Saját stúdiót nyitok\nOnline maradok\nBeállok egy szalonba",req:1});
    const ops=String(a.opciok||"").split("\n").map(x=>x.trim()).filter(Boolean).slice(0,4);
    ops.forEach((o,i)=>{steps.push({k:"pro"+i,q:`Mi szól amellett, hogy „${o}”?`,ex:"Több bevétel, a saját szabályaim szerint",br:"opt"+i,label:"Mellette"},{k:"con"+i,q:`Mi a kockázata annak, hogy „${o}”?`,ex:"Nagy kezdő költség, bérleti szerződés",br:"opt"+i,label:"Kockázat"})});
    steps.push({k:"jel",q:"Mi lenne az a jel vagy szám, ami eldönti a kérdést?",ex:"Ha márciusig meglesz 10 állandó vendég, nyitok",br:"cel",label:"Döntési jel"});
  }else{
    steps.push({k:"helyzet",type:"choice",q:"Melyik illik most rád a legjobban?",opts:MZ_HELYZET});
    if(a.helyzet)(MZ_HQ[a.helyzet]||[]).forEach((x,i)=>steps.push({k:"h"+i,q:x[0],br:x[1],label:x[2],ex:x[3],quote:!!x[4]}));
    steps.push({k:"szakma",type:"choice",q:"Melyik írja le legjobban, mivel foglalkozol?",opts:MZ_SZAKMA});
    if(a.szakma)(MZ_SQ[a.szakma]||[]).forEach((x,i)=>steps.push({k:"s"+i,q:x[0],br:x[1],label:x[2],ex:x[3],quote:!!x[4]}));
  }
  // mélyítés: a túl általános válasz után egyszer visszakérdezünk (menetenként legfeljebb 4-szer)
  const out=[];let deep=0;
  for(const s of steps){out.push(s);
    if(s.type||!s.br||deep>=4)continue;const d=mzDeepFor(a[s.k]);
    if(d){deep++;out.push({k:s.k+"_m",q:d.q,deep:1,parent:s.k,br:s.br,label:s.label,quote:d.quote||s.quote,ex:s.ex||"Egy konkrét eset, név vagy szám"})}}
  return out;
}
function mzShort(t,n){t=String(t||"").replace(/\s+/g," ").trim();if(t.length<=n)return t;const c=t.slice(0,n);const i=c.lastIndexOf(" ");return (i>n*0.6?c.slice(0,i):c).replace(/[,;:.\s]+$/,"")+"…"}
const isOpenAns=v=>!String(v||"").trim()||/^\s*(nem tudom|fogalmam sincs|passz)\s*\.?$/i.test(v);
// válaszokból fa: középpont + legfeljebb 7 főág, főáganként legfeljebb 4 levél
function mzTree(st){
  const a=st.a,steps=mzSteps(st),dec=a.cel==="dontes";
  const ops=dec?String(a.opciok||"").split("\n").map(x=>x.trim()).filter(Boolean).slice(0,4):[];
  const order=dec?["cel",...ops.map((_,i)=>"opt"+i)]:MZ_ORDER;
  const label=k=>k.startsWith("opt")?mzShort(ops[+k.slice(3)],40):MZB[k];
  const br={};order.forEach(k=>br[k]=[]);
  const add=(k,t,open)=>{if(!br[k])return;br[k].push({t,open:!!open})};
  for(const s of steps){
    if(s.type==="choice"||s.type==="list"||s.deep||!s.br)continue;
    if(s.type==="two"){s.f.forEach(([fk,fl])=>{const v=a[fk];if(isOpenAns(v))add(s.br,`Nyitott: ${fl.toLowerCase()}?`,1);else add(s.br,fk==="kavarog"?"Nyitott: "+mzShort(v,70):"Biztos: "+mzShort(v,70),fk==="kavarog")});continue}
    const follow=steps.find(x=>x.parent===s.k);const v=follow&&!isOpenAns(a[follow.k])?a[follow.k]:a[s.k];
    if(isOpenAns(v)){add(s.br,`Nyitott: ${(s.label||mzShort(s.q,46)).replace(/\?$/,"")}?`,1);continue}
    const q=(follow&&!isOpenAns(a[follow.k])?follow.quote:s.quote);
    const parts=String(v).split("\n").map(x=>x.trim()).filter(Boolean).slice(0,3);
    parts.forEach(p=>{let t=mzShort(p,q?80:70);if(q&&!/^[„"]/.test(t))t="„"+t.replace(/[”"]$/,"")+"”";add(s.br,(s.label&&parts.length===1?s.label+": ":"")+t)});
  }
  // főáganként legfeljebb 4 levél: a fölösleg az utolsóba olvad (válasz nem vész el)
  order.forEach(k=>{const L=br[k];while(L.length>4){const x=L.pop();L[L.length-1].t=mzShort(L[L.length-1].t+" · "+x.t,120)}});
  const center=mzShort(a.kozep||"A térképem",80)+(a.ido?` (${a.ido})`:"");
  return {center,branches:order.map(k=>({k,t:label(k),leaves:br[k]})).filter(b=>b.leaves.length||!dec)};
}
// automatikus elrendezés: főágak ellipszisen a középpont körül, levelek kifelé legyezőben
function mzLayout(tree){
  const W=1900,H=1250,cx=W/2,cy=H/2,n=tree.branches.length,nodes=[],r={id:uid(),x:cx,y:cy,t:tree.center,p:null};nodes.push(r);
  tree.branches.forEach((b,i)=>{
    const ang=-Math.PI/2+i*2*Math.PI/n,c=Math.cos(ang),sn=Math.sin(ang);
    const bn={id:uid(),x:Math.round(cx+470*c),y:Math.round(cy+330*sn),t:b.t,p:r.id};nodes.push(bn);
    const k=b.leaves.length,side=Math.abs(c)>0.35;
    b.leaves.forEach((l,j)=>{const off=j-(k-1)/2;
      // oldalsó ágaknál a levelek oszlopban kifelé, a felső/alsó ágaknál sorban fölötte/alatta
      const x=side?bn.x+Math.sign(c)*270:bn.x+off*215,y=side?bn.y+off*82+sn*40:bn.y+Math.sign(sn)*150+Math.abs(off)*Math.sign(sn)*20;
      nodes.push({id:uid(),x:Math.round(x),y:Math.round(y),t:l.t,p:bn.id,open:l.open||undefined})});
  });
  return {nodes,w:W,h:H};
}
function mzSplitParts(t){
  const m=/^([^:„"]{2,30}):\s*(.*)$/.exec(String(t||""));const lab=m?m[1]:"",body=(m?m[2]:String(t||"")).replace(/…$/,"");
  const parts=body.split(/\s*(?:[,;]|\s+majd\s+)\s*/i).map(x=>x.trim()).filter(x=>x.length>1);
  return parts.length>1?parts.map((p,i)=>(i===0&&lab?lab+": ":"")+p.charAt(0).toUpperCase()+p.slice(1)):[String(t||"")];
}
function mzGrow(){document.querySelectorAll("#mapquiz .mz-lt").forEach(t=>{t.style.height="auto";t.style.height=t.scrollHeight+"px"})}
function mzStart(fromMap){
  const prev=fromMap&&fromMap.quiz;
  const prof=MZ_PROFMAP[S.settings.profile]||"";
  ui.mz={i:0,st:{a:prev?Object.assign({},prev.a):{szakma:prof||undefined}},tree:null,rerun:fromMap?fromMap.id:null};
  mzRender();
}
function mzClose(){const el=$("#mapquiz");if(el)el.remove();ui.mz=null;document.body.classList.remove("ob-open")}
function mzBody(s,a){
  const ex=s.ex?`<div class="mz-ex"><span>Példa:</span> ${esc(s.ex)}</div>`:"";
  if(s.type==="choice")return `<h2>${esc(s.q)}</h2><div class="ob-choices">${s.opts.map(([k,l])=>`<button type="button" class="ob-choice" data-act="mzpick" data-k="${esc(k)}" aria-pressed="${a[s.k]===k}"><b>${esc(l)}</b></button>`).join("")}</div>${s.k==="szakma"&&MZ_PROFMAP[S.settings.profile]?'<p class="ob-note">A bevezetőben megadott tevékenységed alapján előre kijelöltük. Ha más illik jobban, válassz.</p>':""}`;
  if(s.type==="two")return `<h2>${esc(s.q)}</h2>${s.f.map(([k,l,e])=>`<label class="f">${esc(l)}<textarea data-mz="${k}" rows="3" placeholder="${esc(e)}">${esc(a[k]||"")}</textarea></label>`).join("")}`;
  if(s.type==="list")return `<h2>${esc(s.q)}</h2><textarea data-mz="${s.k}" rows="5" placeholder="${esc(s.ex)}">${esc(a[s.k]||"")}</textarea>`;
  return `${s.deep?'<div class="eyebrow">Egy pontosító kérdés</div>':""}<h2>${esc(s.q)}</h2>${ex}<textarea data-mz="${s.k}" rows="4" placeholder="Írd le a saját szavaiddal…">${esc(a[s.k]||"")}</textarea>${s.deep?`<p class="ob-note">Erre azért kérdezünk vissza, mert az előző válasz még elég általános: „${esc(mzShort(a[s.parent],80))}”. Egy konkrét eset, név vagy szám sokat segít.</p>`:""}`;
}
function mzRender(){
  const z=ui.mz;if(!z)return;
  let el=$("#mapquiz");if(!el){el=document.createElement("div");el.id="mapquiz";document.body.appendChild(el);document.body.classList.add("ob-open")}
  if(z.tree){
    el.innerHTML=`<div class="ob" role="dialog" aria-modal="true" aria-label="A térkép előnézete"><div class="ob-top"><div class="ob-prog"><i style="width:100%"></i></div><span class="ob-count">Előnézet</span><button type="button" class="nc-skip" data-act="mzclose">Bezárás</button></div>
    <div class="ob-body"><h2>Így néz ki a térképed</h2><p class="lead">Átírhatod vagy törölheted az ágakat, mielőtt a lapra kerülnek. A halvány „Nyitott” levelek azok, amikre még nem volt válasz: ezek a következő lépéseid.</p>
    <label class="f">Középpont<input type="text" data-mzt="c" value="${esc(z.tree.center)}"></label>
    ${z.tree.branches.map((b,i)=>`<div class="mz-branch"><div class="row" style="gap:8px;flex-wrap:nowrap"><input type="text" class="mz-bt" data-mzt="b${i}" value="${esc(b.t)}" aria-label="Főág"><button type="button" class="iconbtn" data-act="mzdelb" data-i="${i}" aria-label="Főág törlése">×</button></div>
      ${b.leaves.map((l,j)=>`<div class="row mz-leaf${l.open?" open":""}" style="gap:8px;flex-wrap:nowrap"><textarea rows="1" class="mz-lt" data-mzt="l${i}_${j}" aria-label="Levél">${esc(l.t)}</textarea>${mzSplitParts(l.t).length>1?`<button type="button" class="iconbtn" data-act="mzsplit" data-i="${i}" data-j="${j}" aria-label="Szétszedés külön levelekre" title="Szétszedés külön levelekre">⇆</button>`:""}<button type="button" class="iconbtn" data-act="mzdell" data-i="${i}" data-j="${j}" aria-label="Levél törlése">×</button></div>`).join("")||'<div class="muted" style="font-size:12.5px;padding-left:14px">Üres ág, később bővítheted.</div>'}
      <button type="button" class="chip mz-add" data-act="mzaddl" data-i="${i}">+ Új levél</button></div>`).join("")}
    <button type="button" class="btn ghost small" data-act="mzaddb" style="align-self:flex-start">+ Új főág</button></div>
    <div class="ob-nav"><button type="button" class="btn ghost" data-act="mzbackq">Vissza a kérdésekhez</button><button type="button" class="btn" data-act="mzapply">Térképre rakom</button></div></div>`;
    mzGrow();return;
  }
  const steps=mzSteps(z.st);z.i=Math.min(z.i,steps.length-1);const s=steps[z.i],a=z.st.a;
  const canNext=s.type!=="choice"||!!a[s.k];const need=s.req&&!String(a[s.k]||"").trim();
  el.innerHTML=`<div class="ob" role="dialog" aria-modal="true" aria-label="Gondolattérkép-indító kérdések"><div class="ob-top"><div class="ob-prog"><i style="width:${Math.round((z.i+1)/steps.length*100)}%"></i></div><span class="ob-count">${z.i+1} / ${steps.length}</span><button type="button" class="nc-skip" data-act="mzclose">Bezárás</button></div>
  <form class="ob-body" data-form="mz">${mzBody(s,a)}</form>
  <div class="ob-nav">${z.i>0?'<button type="button" class="btn ghost" data-act="mzback">Vissza</button>':"<span></span>"}<span class="row" style="gap:8px">${s.type==="choice"||s.req?"":'<button type="button" class="btn ghost" data-act="mzskip">Kihagyom</button>'}<button type="button" class="btn" data-act="mznext" ${canNext&&!need?"":"disabled"}>${z.i===steps.length-1?"Elkészítem a térképet":"Tovább"}</button></span></div></div>`;
  const f=el.querySelector(".ob-body textarea");if(f&&!matchMedia("(max-width:860px)").matches)f.focus();
}
function mzNext(skip){
  const z=ui.mz,steps=mzSteps(z.st),s=steps[z.i];
  if(skip){if(s.type==="two")s.f.forEach(([k])=>z.st.a[k]="");else z.st.a[s.k]=""}
  const ns=mzSteps(z.st);
  if(z.i<ns.length-1){z.i++;mzRender();const b=$("#mapquiz .ob-body");if(b)b.scrollTop=0;return}
  z.tree=mzTree(z.st);mzRender();
}
function mzApply(){
  const z=ui.mz,t=z.tree;t.branches=t.branches.filter(b=>String(b.t).trim()).map(b=>Object.assign(b,{leaves:b.leaves.filter(l=>String(l.t).trim())}));const L=mzLayout(t),nodes=L.nodes;
  const title=mzShort(t.center.replace(/\s*\([^)]*\)$/,""),40)+(z.rerun?" · "+fmtDate(T):"");
  const m={id:uid(),title,nodes,w:L.w,h:L.h,fitOnOpen:true,quiz:{v:1,a:Object.assign({},z.st.a),at:T}};relaxMap(m,250);
  S.maps=S.maps||[];S.maps.push(m);ui.mapId=m.id;ui.mapSel=null;mapCentered=null;save();mzClose();
  if(route!=="terkep")location.hash="terkep";else render();
  toast(z.rerun?"Elkészült az új változat. A régit a fülek között találod, így látszik, mi változott.":"Kész a térképed. Húzd az ágakat, ahová szeretnéd, és bővítsd bátran.");
}
/* ---------- Márkám (white label partner: a saját márkája, a saját felhasználói) ---------- */
const MARKAM=BR.plan==="whitelabel"&&(ctx.brandAdmin||DEMO);
function inviteUrl(){return location.origin+"/app?"+(BR.slug&&BR.slug!=="alap"?"brand="+encodeURIComponent(BR.slug)+"&":"")+"regisztracio"}
const DEMO_MEMBERS=[["Minta Kata","kata@pelda.hu",-40,0],["Minta Éva","eva@pelda.hu",-21,-1],["Minta Zsófi","zsofi@pelda.hu",-9,-6],["Minta Réka","reka@pelda.hu",-3,-3]];
function vMarkam(){
  activeBoard=null;
  if(!MARKAM)return head("Márkám","Nincs hozzáférés")+'<div class="card empty">Ez az oldal a white label márka gazdájának érhető el.</div>';
  const tab=ui.mkTab||"arculat";
  const sup=ctx.brandSupport?`<div class="card status" style="box-shadow:none;border:1.5px dashed var(--accent)"><div class="grow"><b>Támogatói mód: „${esc(BR.slug)}” márkát állítod be a partner helyett.</b><div class="muted" style="font-size:12.5px">Amit itt mentesz, az ő márkájára vonatkozik, és minden lépésed naplózva van. A saját felületedre a <a href="/app">sikermaker.hu/app</a> címen jutsz vissza.</div></div></div>`:"";
  const tabs=sup+`<div class="tabs">${[["arculat","Arculat"],["felhasznalok","Felhasználóim"]].map(([k,l])=>`<button data-act="mktab" data-k="${k}" aria-pressed="${tab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(tab==="arculat"){
    const d=ui.brand||(ui.brand=JSON.parse(JSON.stringify(ctx.brandRaw||{})));ui.brandFor="brand";
    body=brandEditor(d,{id:"markaszerk",title:"A márkád arculata",badge:DEMO?"Bemutató":"Te kezeled",note:"Ez minden felhasználódnál megjelenik: név, logó, kiemelőszínek, betűk, alapító program, saját idézetek. A háttérmintát mindenki maga választja.",saveAct:"brandsave",resetAct:"brandreset",saveLabel:"Mentés minden felhasználómnak"})
      +`<div class="card lockcard"><b>Hamarosan:</b> design system feltöltése (zip): a színeket, betűket, logókat és matricákat automatikusan behúzza.</div>`;
  }else{
    const m=ui.members;
    if(DEMO&&!m)ui.members={stats:{total:6,active7:4,named:4},members:DEMO_MEMBERS.map(([n,e,c,a])=>({name:n,email:e,created_at:iso(addDays(TODAY,c)),last_active:iso(addDays(TODAY,a)),consent_at:iso(addDays(TODAY,c))}))};
    const mm=ui.members;
    if(!mm){if(!ui.membersLoading){ui.membersLoading=true;ctx.brandMembers().then(r=>{ui.members=r;ui.membersLoading=false;render()},()=>{ui.members={err:1};ui.membersLoading=false;render()})}body='<div class="card"><div class="spinner" role="status" aria-label="Betöltés"></div></div>'}
    else if(mm.err)body='<div class="card"><p style="margin:0">Most nem sikerült betölteni. Próbáld újra később.</p></div>';
    else body=`<div class="grid g3">${[["Felhasználó",mm.stats.total],["Aktív az elmúlt 7 napban",mm.stats.active7],["Hozzájárult a névsorhoz",mm.stats.named]].map(([l,v])=>`<div class="card kpi"><div class="v num">${v}</div><div class="l">${l}</div></div>`).join("")}</div>
      <div class="card stack" style="gap:10px"><h3 style="margin:0">Meghívó link</h3><p class="muted" style="margin:0;font-size:12.5px">Ezzel a linkkel a csapatod és az ügyfeleid a te arculatoddal regisztrálnak, és a te felhasználóid közé kerülnek.</p><div class="row" style="flex-wrap:nowrap;gap:8px"><input type="text" readonly value="${esc(inviteUrl())}" id="inv-url" onfocus="this.select()"><button class="btn small" data-act="invcopy">Másolás</button></div></div>
      <div class="card"><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">Névsor</h3><span class="muted" style="font-size:12px">Csak azok, akik hozzájárultak · a tervük tartalmát nem látod</span></div>
      <div class="tablewrap"><table><thead><tr><th>Név</th><th>E-mail</th><th>Regisztrált</th><th>Utoljára aktív</th></tr></thead><tbody>${mm.members.map(u=>`<tr><td><strong>${esc(u.name||"–")}</strong></td><td>${esc(u.email)}</td><td class="num">${fmtDate(String(u.created_at).slice(0,10))}</td><td class="num">${u.last_active?fmtDate(String(u.last_active).slice(0,10)):"–"}</td></tr>`).join("")||'<tr><td colspan="4" class="empty">Még senki nem járult hozzá, hogy a névsorban látszódjon.</td></tr>'}</tbody></table></div>
      ${mm.stats.total>mm.stats.named?`<p class="muted" style="margin:8px 0 0;font-size:12px">További ${mm.stats.total-mm.stats.named} felhasználó nem járult hozzá, ők csak a létszámban szerepelnek.</p>`:""}</div>`;
  }
  return head("Márkám",esc(BR.productName))+tabs+body;
}
/* hozzájárulás: a white label márka gazdája lássa-e a nevet, e-mailt, regisztrációt, utolsó aktivitást */
function consentCard(){
  if(DEMO||BR.plan!=="whitelabel"||!ctx.brandConsent||ctx.brandConsent())return "";
  return `<div class="card revbanner"><span class="ic" aria-hidden="true">🤝</span><div class="grow"><span class="t">Láthatja ${esc(BR.ownerName||BR.productName)} a neved a felhasználói között?</span><span class="s">Csak a nevedet, e-mail-címedet, a regisztrációd és az utolsó aktivitásod dátumát. A terved tartalmát nem látja. Bármikor visszavonhatod a Beállításokban.</span></div><div class="row" style="gap:8px"><button class="btn small" data-act="consent" data-k="1">Hozzájárulok</button><button class="btn small ghost" data-act="consent" data-k="0">Nem</button></div></div>`;
}
function consentRow(){
  if(DEMO||BR.plan!=="whitelabel"||!ctx.brandConsent)return "";const c=ctx.brandConsent();
  return `<div class="row between" style="margin-top:6px"><span style="font-size:13px">${esc(BR.ownerName||BR.productName)} ${c&&c.ok?"<b>látja</b>":"<b>nem látja</b>"} a nevedet és e-mail-címedet a felhasználói között.</span><button class="chip" data-act="consent" data-k="${c&&c.ok?0:1}">${c&&c.ok?"Visszavonom":"Hozzájárulok"}</button></div>`;
}
/* ---------- render ---------- */
const RENDER={ma:vMa,markam:vMarkam,admin:vAdmin,ertekelesek:vErtekelesek,bovitesek:vBovitesek,olvasas:vOlvasas,szokasok:vSzokasok,terkep:vTerkep,matricak:vMatricak,naptar:vNaptar,kapcsolatok:vKapcsolatok,ugyfelek:vUgyfelek,tartalom:vTartalom,csapat:vCsapat,szamok:vSzamok,beallitasok:vBeall};
function render(){
  const y=window.scrollY;
  $("#view").innerHTML=demoCta()+(!PRO&&PRO_VIEWS.includes(route)?vPro(route):RENDER[route]()+upStrip(route));
  nav();drawer();bindBoards();bindMap();bindDash();
  window.scrollTo(0,y);
  checkAch(false);
}
function go(){const h=(location.hash||"").slice(1);if(h!=="ertekelesek"&&ui.rev&&!ui.rev.keep)ui.rev=null;if(ui.brand&&h!==route){ui.brand=null;ui.brandFor=null;repaint()}route=RENDER[h]&&VIEWS.some(v=>v[0]===h)?h:"ma";trayOpen=false;ui.sel=null;render();window.scrollTo(0,0)}
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
    case"msg":{const ty=b.dataset.type;let v={},done=null;ui.msgRef={type:ty,id};
      if(ty==="contact"){const c=find("contacts");v={nev:firstName(c.name),full:c.name,email:c.email||""};done={act:"cdone",id:c.id,label:"Megvolt"}}
      else if(ty==="client"){const c=find("clients");v={nev:firstName(c.name),full:c.name,termek:c.fav,email:c.email||(/@/.test(c.phone||"")?(c.phone.match(/[^\s,;]+@[^\s,;]+/)||[""])[0]:"")}}
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
    case"mcenter":{const m=curMap(),w=$("#mapwrap"),r=m.nodes.find(n=>!n.p),z=mapZoom(m);if(w&&r)w.scrollTo({left:r.x*z-w.clientWidth/2,top:r.y*z-w.clientHeight/2,behavior:"smooth"});break}
    case"mzoom":{const m=curMap();setMapZoom(m,mapZoom(m)*(+b.dataset.d>0?1.2:1/1.2));break}
    case"mfit":fitMap(curMap());break;
    case"mrelax":{const m=curMap();relaxMap(m,200);save();render();toast("Széttoltam az egymásra lógó ágakat.");break}

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
    case"toToday":{const k="ma-"+T,arr=S.stickers[k]||(S.stickers[k]=[]);arr.push({id:uid(),k:b.dataset.k,x:40+Math.random()*25,y:35+Math.random()*30,r:Math.round(Math.random()*12-6),s:1});save();toast("Rátettem a mai lapra (Vezérlőpult).");break}
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
    case"stepedit":if(ui.stepEdit){S.settings.steps=S.settings.steps.map((x,i)=>String(x).trim()||["Poszt","Sztori","Új kapcsolat","Utánkövetés","Tanulás"][i]);save()}ui.stepEdit=!ui.stepEdit;render();break;
    case"dslogo":if(ui.dsImport){ui.dsImport.logo=+b.dataset.i;render()}break;
    case"dsclose":ui.dsImport=null;render();break;
    case"dsapply":{const r=ui.dsImport;if(!r||!ui.brand)break;const d=ui.brand;d.colors=d.colors||{};
      if(r.name&&!d.productName)d.productName=r.name;
      ["accent","highlight","background"].forEach(k=>{if(r.colors[k])d.colors[k]=r.colors[k]});
      if(r.fonts)d.fonts=r.fonts;
      if(r.logos.length)d.logo=r.logos[r.logo!=null?r.logo:0].url;
      ui.dsImport=null;repaint();render();toast("Átvettük a design systemből. Nézd meg az előnézetet, és mentsd el.");break}
    case"qedit":ui.qEdit=!ui.qEdit;render();break;
    case"qadd":{const q=(S.settings.questions||Q_DEFAULT).slice();if(q.length<5){q.push("");S.settings.questions=q;save();render();setTimeout(()=>{const el=document.querySelector(`[data-qset="${q.length-1}"]`);el&&el.focus()},30)}break}
    case"qdel":{const q=(S.settings.questions||Q_DEFAULT).slice();q.splice(+b.dataset.i,1);S.settings.questions=q;save();render();break}
    case"qreset":delete S.settings.questions;save();render();toast("Visszaállítva az eredeti kérdésekre.");break;
    case"dedit":ui.dashEdit=!ui.dashEdit;ui.sel=null;render();break;
    case"dmove":{const d=dashPrefs(),o=dashOrder().filter(k=>!d.hidden.includes(k)),i=o.indexOf(b.dataset.k),j=i+(+b.dataset.d);if(i<0||j<0||j>=o.length)break;[o[i],o[j]]=[o[j],o[i]];d.order=o.concat(dashOrder().filter(k=>!o.includes(k)));save();render();break}
    case"dsize":{const d=dashPrefs(),k=b.dataset.k,cur=dashSize(k),list=[2,3,4,6];d.size[k]=list[(list.indexOf(cur)+1)%list.length];save();render();break}
    case"dhide":{const d=dashPrefs();if(!d.hidden.includes(b.dataset.k))d.hidden.push(b.dataset.k);save();render();break}
    case"dshow":{const d=dashPrefs();d.hidden=d.hidden.filter(k=>k!==b.dataset.k);save();render();break}
    case"dreset":S.prefs.dash={};save();render();toast("A Vezérlőpult visszaállt az alap elrendezésre.");break;
    case"authshow":ctx.showAuth("belepes");break;
    case"signup":ctx.showAuth("regisztracio");break;
    case"logout":ctx.logout();break;
    case"export":{const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"}),u=URL.createObjectURL(blob),a2=document.createElement("a");a2.href=u;a2.download="sikermaker-adataim-"+T+".json";document.body.appendChild(a2);a2.click();a2.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);break}
    case"demoplan":ctx.setDemoPlan(b.dataset.k);break;
    case"bgpat":S.prefs=S.prefs||{};S.prefs.bg=Object.assign({},bgPrefs(),{bgPattern:b.dataset.k});save();repaint();render();break;
    case"bgcol":S.prefs=S.prefs||{};S.prefs.bg=Object.assign({},bgPrefs(),{bgColor:b.dataset.c});save();repaint();render();break;
    case"brandside":ui.brand.colors=Object.assign({},ui.brand.colors,{sidebar:b.dataset.k});repaint();render();break;
    case"brandfont":ui.brand.fonts=b.dataset.k;repaint();render();break;
    case"brandfounder":ui.brand.founder=Object.assign({perk:""},ui.brand.founder,{enabled:!(ui.brand.founder&&ui.brand.founder.enabled)});render();break;
    case"brandlogodel":ui.brand.logo="";repaint();render();break;
    case"brandreset":ui.brand=null;repaint();render();toast("Visszaállítva a mentett márkára.");break;
    case"brandsave":{const d=ui.brand;if(!d)break;b.disabled=true;ctx.saveBrand(d).then(()=>{toast("Márka mentve. Újratöltöm…");setTimeout(()=>location.reload(),700)},e=>{b.disabled=false;toast(e&&e.message==="forbidden"?"Ehhez nincs jogosultságod.":"Nem sikerült menteni. Próbáld újra.")});break}
    case"obstart":obOpen();break;
    case"obnext":obNext(!!b.dataset.skip);break;
    case"obback":if(ui.ob&&ui.ob.i>0){ui.ob.i--;obRender()}break;
    case"obskip":obFinish(true);break;
    case"obprof":{const p=PROFILES.find(x=>x.k===b.dataset.k);if(p&&ui.ob){ui.ob.d.profile=p.k;ui.ob.d.pt=p.pt;ui.ob.d.steps=p.steps.slice();obRender()}break}
    case"obnopt":if(ui.ob){ui.ob.d.pt=false;obNext()}break;
    case"pttoggle":S.settings.ptOff=!S.settings.ptOff;save();render();break;
    case"checkhide":S.prefs=S.prefs||{};S.prefs.checklistHide=true;save();render();break;
    case"admtab":if(ui.brandFor==="platform"&&b.dataset.k!=="arculat"){ui.brand=null;ui.brandFor=null;repaint()}ui.admTab=b.dataset.k;render();break;
    case"platsave":{const d=ui.brand;if(!d)break;const cfg=JSON.parse(JSON.stringify(d));["slug","plan","upsell","themed"].forEach(k=>delete cfg[k]);b.disabled=true;
      ctx.admin("platform.set",{config:cfg}).then(()=>{toast("Mentve. Mindenkinél ez az új alapkinézet. Újratöltöm…");setTimeout(()=>location.reload(),900)},()=>{b.disabled=false;toast("Nem sikerült menteni. Próbáld újra.")});break}
    case"platreset":ui.brand=null;ui.brandFor=null;ui.adm.platform=null;repaint();admLoad("arculat");break;
    case"platclear":ui.platClear=true;render();break;
    case"platclearno":ui.platClear=false;render();break;
    case"platclearyes":ui.platClear=false;ctx.admin("platform.set",{config:{}}).then(()=>{toast("Visszaállítva a semleges alapkinézetre. Újratöltöm…");setTimeout(()=>location.reload(),900)},()=>toast("Nem sikerült. Próbáld újra."));break;

    case"wlnotest":ctx.admin("waitlist.notify",{test:true}).then(()=>toast("Próbalevél elküldve a saját címedre."),e=>toast(e.message==="email_not_configured"?"Az e-mail-küldés nincs beállítva (BREVO_API_KEY).":"Nem sikerült elküldeni."));break;
    case"wlnotask":ui.wlConfirm=true;render();break;
    case"wlnotno":ui.wlConfirm=false;render();break;
    case"wlnotgo":{ui.wlConfirm=false;let total=0;ui.wlProgress="Küldés…";render();
      (async()=>{try{for(let i=0;i<60;i++){const r=await ctx.admin("waitlist.notify",{});total+=r.sent||0;ui.wlProgress=`Elküldve: ${total}`;render();if(!r.left)break}
        toast(`Kész: ${total} értesítő elküldve.`)}catch(e){toast(e.message==="signup_closed"?"Előbb nyisd meg a regisztrációt.":`Megszakadt ${total} levél után. Később folytathatod ugyanezzel a gombbal.`)}
        ui.wlProgress="";admLoad("varolista")})();break}
    case"launchset":{const v=$("#wl-launch").value;if(!v){toast("Válaszd ki a nyitás napját és időpontját.");break}const at=new Date(v);if(isNaN(at)){toast("Hibás időpont.");break}admDo("launch.set",{at:at.toISOString()},"Elmentve: a visszaszámláló eddig fut.","varolista");break}
    case"launchclear":admDo("launch.set",{at:null},"Az időzített nyitás törölve.","varolista");break;
    case"signupask":ui.signupConfirm=true;render();break;
    case"signupno":ui.signupConfirm=false;render();break;
    case"signupset":ui.signupConfirm=false;admDo("signup.set",{open:b.dataset.k==="open"},b.dataset.k==="open"?"A regisztráció megnyílt.":"A regisztráció lezárva.","varolista");break;
    case"wlcsv":{const rows=((ui.adm.waitlist||{}).waitlist||[]);const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';const csv="\ufeff"+["email;feliratkozott;forras;letoltesek"].concat(rows.map(x=>[x.email,String(x.created_at).replace("T"," ").slice(0,16),x.source||"",x.downloads||0].map(q).join(";"))).join("\n");
      const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(blob),a2=document.createElement("a");a2.href=u;a2.download="sikermaker-varolista-"+T+".csv";document.body.appendChild(a2);a2.click();a2.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);break}
    case"admreload":ui.adm=ui.adm||{};ui.adm.err="";admLoad(b.dataset.k);break;
    case"admuser":ui.admConfirm=null;admUserSheet(id);break;
    case"admconf":ui.admConfirm=id;admUserSheet(id);break;
    case"admconfno":ui.admConfirm=null;admUserSheet(id);break;
    case"admgrant":ui.admConfirm=null;admDo("user.admin.grant",{id},"Adminná tetted.","felhasznalok");break;
    case"admrevoke":ui.admConfirm=null;admDo("user.admin.revoke",{id},"Admin jog elvéve.","felhasznalok");break;

    case"admban":admDo("user.ban",{id},"Fiók letiltva.","felhasznalok");break;
    case"admunban":admDo("user.unban",{id},"Letiltás feloldva.","felhasznalok");break;
    case"admwl":{const slug=($("#as-wl").value||"").trim().toLowerCase(),email=b.dataset.email;
      if(!/^[a-z0-9][a-z0-9-]{1,39}$/.test(slug)||slug==="alap"){toast("Az azonosító kisbetű, szám és kötőjel lehet (2–40 karakter), például: minta-marka.");break}
      (async()=>{try{await ctx.admin("brand.set",{slug,plan:"whitelabel",upsell:true});await ctx.admin("brand.admin.add",{slug,email});closeForm();toast("Kész: saját márkát kapott ("+slug+").");ui.admTab="markak";admLoad("markak")}catch(e){toast(e.message==="bad_slug"?"Ez az azonosító nem használható.":"Nem sikerült. Próbáld újra.")}})();break}
    case"admbfeat":{const br=(ui.adm.brands||[]).find(x=>x.slug===b.dataset.slug);if(!br)break;const f=Object.assign({},br.features||{});f[b.dataset.k]=!f[b.dataset.k];if(!f[b.dataset.k])delete f[b.dataset.k];admDo("brand.features",{slug:br.slug,features:f},"Funkciók mentve.","markak");break}
    case"admbplan":admDo("brand.set",{slug:b.dataset.slug,plan:b.dataset.k,upsell:true},"Csomag módosítva.","markak");break;
    case"admbupsell":admDo("brand.set",{slug:b.dataset.slug,plan:b.dataset.plan,upsell:b.dataset.on==="1"},"Mentve.","markak");break;
    case"admbdel":ui.admBDel=b.dataset.slug;render();break;
    case"admbdelno":ui.admBDel=null;render();break;
    case"admbdelgo":{const slug=b.dataset.slug;ui.admBDel=null;admDo("brand.delete",{slug,confirm:slug},"A márka törölve.","markak");break}
    case"admbadmdel":admDo("brand.admin.remove",{slug:b.dataset.slug,email:b.dataset.email},"Márka-admin eltávolítva.","markak");break;
    case"qadd":openQuickAdd();break;
    case"qakind":{const t=($("#qa-title")||{}).value||"";openQuickAdd(b.dataset.k,($("#qa-date")||{}).value);const i=$("#qa-title");if(i)i.value=t;break}
    case"tosync":e.preventDefault();location.hash="beallitasok";setTimeout(()=>{const el=$("#naptarszinkron");el&&el.scrollIntoView({behavior:"smooth",block:"center"})},350);break;
    case"calnew":ui.calOff=false;ctx.calendar("create").then(r=>{ui.cal=Object.assign({},ui.cal,{loaded:true,active:true,created_at:new Date().toISOString(),last_fetch_at:null,url:r.url});render();toast("Kész a naptárlinked. Másold be a naptáradba.")},()=>toast("Nem sikerült. Próbáld újra."));break;
    case"caloff":ui.calOff=true;render();break;
    case"caloffno":ui.calOff=false;render();break;
    case"calrevoke":ui.calOff=false;ctx.calendar("revoke").then(()=>{ui.cal={loaded:true,active:false};render();toast("Naptárlink kikapcsolva.")},()=>toast("Nem sikerült. Próbáld újra."));break;
    case"calcopy":{const v=($("#cal-url")||{}).value||"";try{navigator.clipboard.writeText(v).then(()=>toast("Kimásolva."),()=>toast("Jelöld ki és másold ki a linket."))}catch(err){toast("Jelöld ki és másold ki a linket.")}break}
    case"revopen":ui.rev=revDraft(b.dataset.k);revOpenPanel=false;if(route!=="ertekelesek")location.hash="ertekelesek";else{render();window.scrollTo(0,0)}break;
    case"revclose":ui.rev=null;render();window.scrollTo(0,0);break;
    case"revhide":S.prefs=S.prefs||{};S.prefs.revHide=Object.assign({},S.prefs.revHide,{[b.dataset.k]:true});save();render();break;
    case"revmood":ui.rev.mood=ui.rev.mood===+b.dataset.i?null:+b.dataset.i;render();break;
    case"revtodos":ui.rev.toTodos=!ui.rev.toTodos;render();break;
    case"revnext":ui.rev.step++;render();window.scrollTo(0,0);break;
    case"revprev":ui.rev.step--;render();window.scrollTo(0,0);break;
    case"revsave":revSave();break;
    case"revpanel":revOpenPanel=!revOpenPanel;drawer();break;
    case"extrefresh":ui.ext=Object.assign({},ui.ext,{at:0});extLoad(true);toast("Frissítem a behúzott naptárakat…");break;
    case"impdelask":ui.impDel=id;render();break;
    case"impdelno":ui.impDel=null;render();break;
    case"impdel":ui.impDel=null;ctx.calendar("import.remove",{id}).then(()=>{ui.imports=null;ui.ext=null;toast("Naptár leválasztva.");render()},()=>toast("Nem sikerült. Próbáld újra."));break;
    case"msgsend":{const to=($("#msgto").value||"").trim(),subj=($("#msgsubj").value||"").trim(),txt=$("#msgtext").value;
      if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(to)){toast("Adj meg egy érvényes e-mail-címet.");break}
      if(ui.msgRef){const coll={contact:"contacts",client:"clients"}[ui.msgRef.type];const rec=coll&&S[coll].find(x=>x.id===ui.msgRef.id);if(rec&&rec.email!==to){rec.email=to;save()}}
      b.disabled=true;b.textContent="Küldöm…";
      ctx.email({to,subject:subj||"Üzenet",text:txt,senderName:S.settings.name||"",kind:"msg"}).then(()=>{toast("Elküldve. A válasz a te e-mail-címedre érkezik.");closeForm()},e=>{b.disabled=false;b.textContent="Küldés e-mailben";toast({not_configured:"Az e-mail-küldés hamarosan indul. Addig másold ki az üzenetet.",daily_limit:"Ma már elérted a napi 50 e-mailt.",pro_required:"Az e-mail-küldés Pro funkció.",not_confirmed:"Előbb erősítsd meg az e-mail-címed."}[e.message]||"Nem sikerült elküldeni. Próbáld újra.")});break}
    case"buypro":b.disabled=true;ctx.billing("checkout").then(r=>{location.href=r.url},()=>{b.disabled=false;toast("Most nem sikerült elindítani a fizetést. Próbáld újra.")});break;
    case"billportal":ctx.billing("portal").then(r=>{location.href=r.url},e=>toast(e.message==="no_customer"?"Az előfizetésedet nem bankkártyával indítottad; írj nekünk, ha módosítanál rajta.":"Most nem sikerült megnyitni. Próbáld újra."));break;
    case"mzstart":mzStart(null);break;
    case"mzrerun":mzStart(curMap());break;
    case"mzclose":mzClose();break;
    case"mzpick":{const z=ui.mz,steps=mzSteps(z.st),st=steps[z.i];const old=z.st.a[st.k];z.st.a[st.k]=b.dataset.k;
      if(old!==b.dataset.k){if(st.k==="helyzet")Object.keys(z.st.a).forEach(k=>{if(/^h\d/.test(k))delete z.st.a[k]});if(st.k==="szakma")Object.keys(z.st.a).forEach(k=>{if(/^s\d/.test(k))delete z.st.a[k]});if(st.k==="cel")["opciok","jel"].concat(Object.keys(z.st.a).filter(k=>/^(pro|con)\d/.test(k))).forEach(k=>delete z.st.a[k])}
      mzNext(false);break}
    case"mznext":mzNext(false);break;
    case"mzskip":mzNext(true);break;
    case"mzback":if(ui.mz&&ui.mz.i>0){ui.mz.i--;mzRender()}break;
    case"mzbackq":ui.mz.tree=null;mzRender();break;
    case"mzdelb":ui.mz.tree.branches.splice(+b.dataset.i,1);mzRender();break;
    case"mzdell":ui.mz.tree.branches[+b.dataset.i].leaves.splice(+b.dataset.j,1);mzRender();break;
    case"mzaddl":{const br=ui.mz.tree.branches[+b.dataset.i];br.leaves.push({t:""});mzRender();const all=document.querySelectorAll(`#mapquiz [data-mzt^="l${b.dataset.i}_"]`);const last=all[all.length-1];if(last)last.focus();break}
    case"mzaddb":{ui.mz.tree.branches.push({k:"x"+uid(),t:"Új főág",leaves:[]});mzRender();const all=document.querySelectorAll("#mapquiz .mz-bt");const last=all[all.length-1];if(last){last.focus();last.select()}break}
    case"mzsplit":{const br=ui.mz.tree.branches[+b.dataset.i],j=+b.dataset.j,l=br.leaves[j];br.leaves.splice(j,1,...mzSplitParts(l.t).map(t=>({t,open:l.open})));mzRender();break}
    case"mzapply":mzApply();break;
    case"mktab":ui.mkTab=b.dataset.k;if(b.dataset.k!=="arculat"&&ui.brand){ui.brand=null;ui.brandFor=null;repaint()}render();break;
    case"invcopy":{const v=($("#inv-url")||{}).value||"";try{navigator.clipboard.writeText(v).then(()=>toast("Kimásolva."),()=>toast("Jelöld ki és másold ki a linket."))}catch(err){toast("Jelöld ki és másold ki a linket.")}break}
    case"consent":ctx.setBrandConsent(b.dataset.k==="1").then(()=>{toast(b.dataset.k==="1"?"Köszönjük!":"Rendben, nem látszol a névsorban.");render()},()=>toast("Nem sikerült menteni. Próbáld újra."));break;
    case"more":openMore();break;
    case"install":ctx.install.prompt().then(ok=>{if(ok)toast("Telepítve. Mostantól a kezdőképernyőről indíthatod.");render()});break;
    case"installhide":S.prefs=S.prefs||{};S.prefs.installHide=true;save();render();break;
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
  if(f.dataset.form==="ob"){obNext();return}
  if(f.dataset.form==="mz"){return}
  if(f.dataset.form==="qadd"){saveQuickAdd();return}
  if(f.dataset.form==="impadd"){const btn=f.querySelector(".btn");btn.disabled=true;btn.textContent="Ellenőrzöm a naptárt…";
    ctx.calendar("import.add",{name:$("#imp-name").value,url:$("#imp-url").value,color:$("#imp-color").value}).then(()=>{ui.imports=null;ui.ext=null;toast("Naptár bekötve.");render()},e=>{btn.disabled=false;btn.textContent="Naptár bekötése";toast({bad_url:"Ez nem érvényes https:// vagy webcal:// naptárlink.",not_ics:"Ezen a linken nem naptár van. Az iCal (.ics) linket másold be.",too_many:"Legfeljebb 8 naptárat köthetsz be.",too_large:"Ez a naptár túl nagy.",pro_required:"Ez Pro funkció."}[e.message]||"Nem sikerült elérni a naptárt. Ellenőrizd a linket.")});return}
  if(f.dataset.form==="admsub"){admDo("sub.set",{id:f.dataset.id,plan:$("#as-plan").value,status:$("#as-status").value,current_period_end:$("#as-end").value,note:$("#as-note").value},"Előfizetés mentve.","felhasznalok");return}
  if(f.dataset.form==="admbrand"){admDo("brand.set",{slug:$("#adm-slug").value.trim(),plan:$("#adm-plan").value,upsell:true},"Márka létrehozva.","markak");return}
  if(f.dataset.form==="admbadm"){const em=f.querySelector("input").value.trim();if(em)admDo("brand.admin.add",{slug:f.dataset.slug,email:em},"Márka-admin hozzáadva.","markak");return}
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
  if(t.dataset.ob){obInput(t);return}
  if(t.dataset.mz&&ui.mz){ui.mz.st.a[t.dataset.mz]=t.value;const nb=document.querySelector('#mapquiz [data-act="mznext"]');if(nb){const st=mzSteps(ui.mz.st)[ui.mz.i];nb.disabled=!!(st&&st.req&&!t.value.trim())}return}
  if(t.classList&&t.classList.contains("mz-lt")){t.style.height="auto";t.style.height=t.scrollHeight+"px"}
  if(t.dataset.mzt&&ui.mz&&ui.mz.tree){const k=t.dataset.mzt,T2=ui.mz.tree;if(k==="c")T2.center=t.value;else if(k[0]==="b")T2.branches[+k.slice(1)].t=t.value;else{const[i,j]=k.slice(1).split("_").map(Number);T2.branches[i].leaves[j].t=t.value}return}
  if(t.dataset.rev&&ui.rev){ui.rev.a[t.dataset.rev]=t.value;return}
  if(t.dataset.revgoal&&ui.rev){ui.rev.goals[+t.dataset.revgoal]=t.value;return}
  if(t.dataset.revfocus&&ui.rev){ui.rev.focus=t.value;return}
  if(t.dataset.admq){ui.admQ=t.value;const pos=t.selectionStart;render();const n=document.querySelector("[data-admq]");if(n){n.focus();n.setSelectionRange(pos,pos)}return}
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
  else if(t.dataset.moodset!=null){S.settings.moods=S.settings.moods||[];S.settings.moods[+t.dataset.moodset]=t.value;save()}
});
document.addEventListener("change",e=>{
  const t=e.target,m=ym(TODAY);
  if(t.id==="qa-when"){const w=$("#qa-datewrap");if(w)w.hidden=t.value!=="nap";return}
  if(t.dataset.dsize){const d=dashPrefs(),v=+t.value;if([2,3,4,6].includes(v)){d.size[t.dataset.dsize]=v;save();render()}return}
  if(t.dataset.bp||t.dataset.per){render();return}
  if(t.id==="brand-ds"&&t.files&&t.files[0]){const f=t.files[0];ui.dsImport={loading:true};render();
    ST.dsimport.read(f).then(r=>{ui.dsImport=Object.assign(r,{logo:r.logos.length?0:null});render()},e=>{ui.dsImport={err:e.message==="too_large"?"A fájl túl nagy (legfeljebb 15 MB).":e.message==="not_zip"?"Ez nem ZIP-fájl. Töltsd fel a design system ZIP-jét vagy a tokens.json fájlt.":"Nem sikerült beolvasni a fájlt."};render()});return}
  if(t.id==="brand-logo"&&t.files&&t.files[0]){const f=t.files[0];if(f.size>300*1024){toast("A logó legfeljebb 300 KB lehet.");return}const r=new FileReader();r.onload=()=>{ui.brand.logo=String(r.result);repaint();render()};r.readAsDataURL(f);return}
  if(t.id==="mk-file"&&t.files&&t.files[0]){const f=t.files[0];const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const mx=360,sc=Math.min(1,mx/Math.max(img.width,img.height));const cv=document.createElement("canvas");cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);const src=cv.toDataURL(f.type==="image/jpeg"?"image/jpeg":"image/png",.9);S.custom.push({id:uid(),type:"img",src});if(save()){toast("Kép hozzáadva a saját matricáidhoz.")}else{S.custom.pop();toast("Ez a kép túl nagy a prototípusnak. Próbálj kisebbet.")}render()};img.onerror=()=>toast("Ezt a képet nem tudtam megnyitni.");img.src=r.result};r.readAsDataURL(f);return}
  if(t.dataset.goal){S.goals[m][t.dataset.goal].cel=+t.value||0;save();render()}
  else if(t.dataset.actIn){S.goals[m][t.dataset.actIn].teny=+t.value||0;save();render()}
});

if(!S.unlocked){S.unlocked={};checkAch(true)}
if(!S.maps){S.maps=[S.blank?{id:uid(),title:"Első térképem",nodes:[{id:uid(),x:700,y:450,t:"A céljaim",p:null}]}:sampleMap()];save()}
go();
if(ctx.payResult==="ok")setTimeout(()=>toast(PRO?"Köszönjük! A Pro bekapcsolt.":"Köszönjük a fizetést! A Pro pár másodpercen belül bekapcsol, frissítsd az oldalt."),400);
if((S.blank&&!S.onboarded&&!DEMO)||/[?&]bevezeto\b/.test(location.search))obOpen();
return {render,replace(st){S=st&&st.v?st:S;migrate();render()},get state(){return S}};
};
})();
