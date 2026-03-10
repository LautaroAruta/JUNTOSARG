import { useState, useEffect, useCallback, useRef } from "react";

/* ════════════════════════════════════════════════════════════════
   JUNTO v2 — Plataforma de Compras Grupales
   San Martín, Mendoza, Argentina
   Mejoras: onboarding · chat grupal · favoritos · reseñas
            gamificación · actividad en tiempo real · tiendas
            notificaciones · historial de precios · demanda inversa
════════════════════════════════════════════════════════════════ */

const FONTS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #EEF2F8; -webkit-font-smoothing: antialiased; }
    input, select, textarea, button { font-family: inherit; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes fadeDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pop      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.14)} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes slideIn  { from{transform:translateY(100%)} to{transform:translateY(0)} }
    @keyframes slideRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
    @keyframes ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes heartbeat{ 0%,100%{transform:scale(1)} 14%{transform:scale(1.3)} 28%{transform:scale(1)} 42%{transform:scale(1.2)} }
    @keyframes shimmer  { 0%{background-position:-468px 0} 100%{background-position:468px 0} }
    @keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes countAnim{ from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    .fu      { animation: fadeUp   .38s cubic-bezier(.16,1,.3,1) both }
    .fd      { animation: fadeDown .28s cubic-bezier(.16,1,.3,1) both }
    .fi      { animation: fadeIn   .22s ease both }
    .pop     { animation: pop .28s ease }
    .pulse   { animation: pulse 2.2s ease infinite }
    .slide   { animation: slideIn .42s cubic-bezier(.16,1,.3,1) both }
    .slideR  { animation: slideRight .35s cubic-bezier(.16,1,.3,1) both }
    .bounce  { animation: bounce 1.6s ease infinite }
    .hb      { animation: heartbeat 1.4s ease infinite }
    .ca      { animation: countAnim .3s cubic-bezier(.16,1,.3,1) both }
    .skel    { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
               background-size: 468px 100%; animation: shimmer 1.2s infinite linear; border-radius:8px; }
    button:active { transform: scale(.96); }
  `}</style>
);

/* ── Tokens ──────────────────────────────────────────────────── */
const T = {
  navy:"#0B1D3A", blue:"#1651E0", blueMid:"#2563EB", blueLight:"#DBEAFE", bluePale:"#EFF6FF",
  teal:"#0E7490", tealPale:"#CFFAFE",
  green:"#15803D", greenV:"#22C55E", greenPale:"#DCFCE7", greenDark:"#14532D",
  red:"#DC2626", redPale:"#FEE2E2", redLight:"#FCA5A5",
  amber:"#D97706", amberPale:"#FEF3C7", amberLight:"#FDE68A",
  purple:"#7C3AED", purplePale:"#EDE9FE",
  pink:"#DB2777", pinkPale:"#FCE7F3",
  slate:"#475569", slateL:"#94A3B8", slateXL:"#E2E8F0", slatePale:"#F8FAFC",
  bg:"#EEF2F8", white:"#FFFFFF", dark:"#0F172A",
  // Category gradients
  cats:{
    "Almacén":["#1E40AF","#2563EB"],
    "Mascotas":["#92400E","#D97706"],
    "Higiene":["#0E7490","#06B6D4"],
    "Carnicería":["#991B1B","#DC2626"],
    "Limpieza":["#1D4ED8","#06B6D4"],
    "Verdulería":["#166534","#22C55E"],
    "Panadería":["#78350F","#F59E0B"],
  }
};

/* ── Live Activity Data ──────────────────────────────────────── */
const ACTIVITY_MSGS = [
  "🧉 Lucía G. se unió al grupo de Yerba Playadito",
  "🛢️ 3 personas nuevas compraron Aceite Cocinero",
  "✅ El grupo de Arroz Gallo Oro se completó",
  "🐾 Carlos R. se unió a Pedigree Adultos 15kg",
  "💰 Ana S. ahorró $7.800 comprando en grupo",
  "🔥 El grupo de Yerba está a 1 persona de completarse",
  "🍝 Grupo de Fideos Matarazzo completado en 2hs",
  "🎉 Nuevo proveedor: Verdulería La Huerta se sumó",
  "👥 Martín P. invitó a 3 amigos al grupo de aceite",
  "⚡ ¡Solo quedan 2 lugares en el grupo de pollo!",
];

/* ── Products & Stores ───────────────────────────────────────── */
const PRODUCTS_DATA = [
  {id:1,name:"Yerba Playadito 1kg",emoji:"🧉",cat:"Almacén",pInd:8500,pGroup:5200,minB:20,stock:200,secs:72000,cur:17,storeId:1,desc:"Yerba mate molida gruesa 100% argentina. Bolsa de 1kg. Ideal para tereré y mate.",featured:true,shares:89,rating:4.8,reviews:34,views:312,tag:"MÁS POPULAR"},
  {id:2,name:"Aceite Cocinero 1.5L",emoji:"🛢️",cat:"Almacén",pInd:15000,pGroup:10500,minB:20,stock:100,secs:57600,cur:8,storeId:1,desc:"Aceite de girasol refinado, botella de 1.5L. Ideal para cocina diaria.",featured:true,shares:47,rating:4.6,reviews:22,views:189,tag:"DESTACADO"},
  {id:3,name:"Arroz Gallo Oro 5kg",emoji:"🍚",cat:"Almacén",pInd:12000,pGroup:8500,minB:15,stock:80,secs:43200,cur:12,storeId:1,desc:"Arroz largo fino premium. Bolsa de 5kg. Sin TACC.",featured:false,shares:31,rating:4.7,reviews:18,views:156,tag:null},
  {id:4,name:"Azúcar Ledesma 2kg ×3",emoji:"🍬",cat:"Almacén",pInd:7200,pGroup:5400,minB:12,stock:60,secs:86400,cur:10,storeId:2,desc:"Pack de 3 bolsas azúcar blanca 2kg cada una.",featured:false,shares:22,rating:4.5,reviews:12,views:98,tag:null},
  {id:5,name:"Fideos Matarazzo ×6",emoji:"🍝",cat:"Almacén",pInd:9600,pGroup:7000,minB:10,stock:120,secs:36000,cur:9,storeId:2,desc:"Pack 6 paquetes fideos spaghetti 400g. Sémola de trigo.",featured:false,shares:19,rating:4.4,reviews:9,views:87,tag:null},
  {id:6,name:"Pedigree Adultos 15kg",emoji:"🐾",cat:"Mascotas",pInd:42000,pGroup:28000,minB:5,stock:30,secs:28800,cur:4,storeId:3,desc:"Alimento balanceado perros adultos. Bolsa 15kg. Veterinario recomendado.",featured:true,shares:63,rating:4.9,reviews:41,views:278,tag:"⭐ TOP"},
  {id:7,name:"Shampoo Pantene ×3",emoji:"🧴",cat:"Higiene",pInd:10500,pGroup:7200,minB:10,stock:50,secs:64800,cur:6,storeId:4,desc:"Pack 3 unidades shampoo + acondicionador 400ml. Cabello normal.",featured:false,shares:14,rating:4.3,reviews:8,views:72,tag:null},
  {id:8,name:"Pollo Fresco ×3kg",emoji:"🍗",cat:"Carnicería",pInd:18000,pGroup:13500,minB:8,stock:40,secs:14400,cur:7,storeId:5,desc:"Pollos frescos enteros. Peso aprox 3kg. Entrega el mismo día.",featured:false,shares:38,rating:4.5,reviews:16,views:134,tag:"⏰ URGENTE"},
  {id:9,name:"Lavandina Regular ×4",emoji:"🧹",cat:"Limpieza",pInd:6400,pGroup:4800,minB:15,stock:90,secs:50400,cur:5,storeId:2,desc:"Pack 4 botellas lavandina 900ml. Concentración estándar.",featured:false,shares:11,rating:4.2,reviews:6,views:54,tag:null},
  {id:10,name:"Detergente Skip ×2",emoji:"🫧",cat:"Limpieza",pInd:8800,pGroup:6200,minB:10,stock:70,secs:32400,cur:3,storeId:4,desc:"Pack 2 botellones detergente 3L. Todas las telas.",featured:false,shares:9,rating:4.1,reviews:5,views:41,tag:null},
  {id:11,name:"Lechuga + Tomate ×5kg",emoji:"🥗",cat:"Verdulería",pInd:5200,pGroup:3600,minB:8,stock:30,secs:18000,cur:2,storeId:6,desc:"Verduras frescas de temporada. Lechuga criolla + tomate perita.",featured:false,shares:7,rating:4.6,reviews:4,views:38,tag:"NUEVO"},
  {id:12,name:"Pan Lactal Bimbo ×3",emoji:"🍞",cat:"Panadería",pInd:4200,pGroup:3100,minB:6,stock:50,secs:21600,cur:5,storeId:2,desc:"Pack 3 panes lactal de molde 500g. Suave y esponjoso.",featured:false,shares:5,rating:4.3,reviews:7,views:62,tag:"NUEVO"},
];

const STORES_DATA = [
  {id:1,name:"Almacén Don Roberto",emoji:"🏪",addr:"Av. San Martín 450",cat:"Almacén",rating:4.8,approved:true,revenue:340000,orders:42,since:"Nov 2024",desc:"El almacén más completo del barrio. 20 años de experiencia en San Martín.",members:89},
  {id:2,name:"Distribuidora Pérez Hnos.",emoji:"📦",addr:"Belgrano 210",cat:"Distribuidora",rating:4.5,approved:true,revenue:210000,orders:28,since:"Dic 2024",desc:"Distribuidora mayorista con los mejores precios en productos de limpieza y almacén.",members:54},
  {id:3,name:"Veterinaria Central",emoji:"🐾",addr:"Rivadavia 780",cat:"Veterinaria",rating:4.9,approved:true,revenue:180000,orders:15,since:"Ene 2025",desc:"Especialistas en salud animal. Alimentos y accesorios para mascotas.",members:41},
  {id:4,name:"Farmacia y Perfumería Sol",emoji:"💊",addr:"San Martín 120",cat:"Farmacia",rating:4.7,approved:true,revenue:290000,orders:22,since:"Nov 2024",desc:"Farmacia y perfumería con amplio stock. Cosméticos y cuidado personal.",members:67},
  {id:5,name:"Carnicería El Gaucho",emoji:"🥩",addr:"Las Heras 55",cat:"Carnicería",rating:4.6,approved:true,revenue:420000,orders:35,since:"Feb 2025",desc:"Carnes frescas de primera calidad. Cortes especiales para asado.",members:78},
  {id:6,name:"Verdulería La Huerta",emoji:"🌿",addr:"9 de Julio 330",cat:"Verdulería",rating:4.4,approved:true,revenue:45000,orders:8,since:"Mar 2025",desc:"Frutas y verduras frescas de productores locales de San Martín.",members:22},
];

const CATS = ["Todos","Almacén","Mascotas","Higiene","Carnicería","Limpieza","Verdulería","Panadería"];

const REVIEWS_DATA = {
  1:[
    {id:1,user:"María G.",avatar:"MG",rating:5,text:"Excelente calidad. El grupo se completó en menos de 3 horas. Muy recomendable.",date:"hace 2 días",verified:true},
    {id:2,user:"Carlos L.",avatar:"CL",rating:4,text:"Buena yerba y precio increíble. Ahorré mucho comparado al super.",date:"hace 5 días",verified:true},
    {id:3,user:"Ana R.",avatar:"AR",rating:5,text:"Siempre compro por JUNTO. El grupo de yerba es el más activo del barrio.",date:"hace 1 semana",verified:true},
  ],
  6:[
    {id:1,user:"Pedro S.",avatar:"PS",rating:5,text:"Mi perro come esto hace años. El precio en grupo es increíble, 33% más barato.",date:"hace 3 días",verified:true},
    {id:2,user:"Lucía M.",avatar:"LM",rating:5,text:"Excelente producto y el proveedor es muy confiable.",date:"hace 1 semana",verified:true},
  ],
};

const CHAT_DATA = {
  1:[
    {id:1,user:"María G.",avatar:"MG",text:"¡Hola grupo! Yo ya me anoté, faltan 3 más 🧉",time:"10:23",self:false},
    {id:2,user:"Carlos L.",avatar:"CL",text:"Me sumo ahora! Alguien tiene el link para compartir?",time:"10:31",self:false},
    {id:3,user:"Tú",avatar:"VD",text:"Acá el link: junto.ar/grupo/1",time:"10:45",self:true},
    {id:4,user:"Ana R.",avatar:"AR",text:"Yo le mandé a 2 amigas del barrio, deberían entrar pronto!",time:"11:02",self:false},
  ],
};

const DEMAND_DATA = [
  {id:1,product:"Aceite de oliva 1L",votes:34,desc:"Aceite de oliva extra virgen, preferentemente de San Juan.",cat:"Almacén"},
  {id:2,product:"Fertilizante para jardín",votes:21,desc:"Para plantas ornamentales y huertas caseras.",cat:"Jardín"},
  {id:3,product:"Croquetas para gato",votes:18,desc:"Alimento para gatos adultos, bolsa grande.",cat:"Mascotas"},
  {id:4,product:"Papel higiénico ×12",votes:15,desc:"Pack económico, calidad triple hoja.",cat:"Limpieza"},
];

const BADGES = [
  {id:"first",icon:"🥇",name:"Primer grupo",desc:"Te uniste a tu primer grupo",xp:50},
  {id:"saver",icon:"💰",name:"Mega ahorrador",desc:"Ahorraste más de $10.000",xp:200},
  {id:"social",icon:"📣",name:"Embajador",desc:"Invitaste a 3 amigos",xp:150},
  {id:"loyal",icon:"⭐",name:"Comprador fiel",desc:"5 grupos completados",xp:300},
  {id:"fast",icon:"⚡",name:"Veloz",desc:"Fuiste el primero en unirte",xp:100},
];

const NOTIFICATIONS_DATA = [
  {id:1,type:"group",icon:"⚡",title:"¡Falta 1 persona!",body:"El grupo de Yerba Playadito está casi completo.",time:"hace 5 min",read:false,productId:1},
  {id:2,type:"complete",icon:"✅",title:"Grupo completado",body:"El grupo de Arroz Gallo Oro se completó. Podés ir a retirar.",time:"hace 30 min",read:false,productId:3},
  {id:3,type:"promo",icon:"🎁",title:"Oferta especial",body:"Nuevo grupo de Pedigree con 33% de descuento.",time:"hace 2hs",read:true,productId:6},
  {id:4,type:"refer",icon:"👥",title:"Referido exitoso",body:"Tu amigo Carlos usó tu código. ¡Ganaste $500!",time:"ayer",read:true},
];

/* ══════════════════════════════════════════════════════════════
   BASE COMPONENTS
══════════════════════════════════════════════════════════════ */
function Logo({scale=1,white=false,compact=false}) {
  const t=white?"#FFF":T.navy, b=white?"#FFF":T.blue, g=T.greenV;
  if(compact) return(
    <svg width={40*scale} height={40*scale} viewBox="0 0 40 40">
      <circle cx="12" cy="15" r="6" fill={b}/><ellipse cx="12" cy="28" rx="9" ry="7" fill={b}/>
      <circle cx="28" cy="15" r="6" fill={b}/><ellipse cx="28" cy="28" rx="9" ry="7" fill={b}/>
      <circle cx="33" cy="7" r="8" fill={g}/>
    </svg>
  );
  return(
    <svg width={170*scale} height={50*scale} viewBox="0 0 170 50">
      <circle cx="30" cy="17" r="7" fill={b}/><ellipse cx="30" cy="32" rx="11" ry="8.5" fill={b}/>
      <circle cx="48" cy="14" r="9" fill={b}/><ellipse cx="48" cy="32" rx="13" ry="10" fill={b}/>
      <circle cx="66" cy="17" r="7" fill={b}/><ellipse cx="66" cy="32" rx="11" ry="8.5" fill={b}/>
      <circle cx="74" cy="6" r="9.5" fill={g}/>
      <text x="88" y="30" fontFamily="'Syne',sans-serif" fontWeight="800" fontSize="26" fill={t} letterSpacing=".5">JUNTO</text>
      <rect x="88" y="39" width="76" height="3.5" rx="2" fill={g}/>
    </svg>
  );
}

function QRCode({data="junto",size=150}) {
  const cells=21,cell=size/cells;
  const h=s=>s.split("").reduce((a,c,i)=>((a<<5)-a+c.charCodeAt(0)*(i+1))|0,0);
  const isFR=(r,c)=>(r<7&&c<7)||(r<7&&c>=cells-7)||(r>=cells-7&&c<7);
  const isFB=(r,c)=>{
    if(r<7&&c<7) return r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4);
    if(r<7&&c>=cells-7) return r===0||r===6||c===cells-7||c===cells-1||(r>=2&&r<=4&&c>=cells-5&&c<=cells-3);
    if(r>=cells-7&&c<7) return r===cells-7||r===cells-1||c===0||c===6||(r>=cells-5&&r<=cells-3&&c>=2&&c<=4);
    return false;
  };
  const on=(r,c)=>isFR(r,c)?isFB(r,c):Math.abs(h(data+r*37+c*53))%5<3;
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx={10}/>
      {Array.from({length:cells},(_,r)=>Array.from({length:cells},(_,c)=>
        on(r,c)&&<rect key={`${r}${c}`} x={c*cell+.5} y={r*cell+.5} width={cell-.5} height={cell-.5} fill={T.dark} rx={.5}/>
      ))}
      <rect x={size/2-12} y={size/2-12} width={24} height={24} rx={6} fill={T.blue}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fontSize="10" fontWeight="800" fill="white" fontFamily="sans-serif">J</text>
    </svg>
  );
}

function Ring({pct,size=60,stroke=7,color=T.greenV,bg=T.slateXL,label}) {
  const r=(size-stroke)/2, circ=2*Math.PI*r, off=circ*(1-Math.min(Math.max(pct,0),1));
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{transition:"stroke-dashoffset .7s cubic-bezier(.16,1,.3,1)"}}/>
      </svg>
      {label&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*.18,fontWeight:800,color,fontFamily:"'Syne',sans-serif"}}>{label}</div>}
    </div>
  );
}

function Stars({rating,size=14}) {
  return(
    <div style={{display:"flex",gap:1}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{fontSize:size,color:i<=Math.round(rating)?T.amber:T.slateXL}}>★</span>
      ))}
    </div>
  );
}

function MiniBar({value,max,color=T.blue,height=6}) {
  const pct=Math.min(value/max,1);
  return(
    <div style={{height,borderRadius:height,background:T.slateXL,overflow:"hidden",flex:1}}>
      <div style={{height:"100%",width:`${pct*100}%`,background:color,borderRadius:height,
        transition:"width .6s cubic-bezier(.16,1,.3,1)"}}/>
    </div>
  );
}

function useCountdown(initial) {
  const [s,setS]=useState(initial);
  useEffect(()=>{const t=setInterval(()=>setS(x=>Math.max(0,x-1)),1000);return()=>clearInterval(t);},[]);
  const h=String(Math.floor(s/3600)).padStart(2,"0");
  const m=String(Math.floor((s%3600)/60)).padStart(2,"0");
  const sec=String(s%60).padStart(2,"0");
  return{display:`${h}:${m}:${sec}`,done:s===0,raw:s};
}

const Card=({children,style:s,onClick,className=""})=>(
  <div className={className} onClick={onClick}
    style={{background:T.white,borderRadius:20,padding:20,boxShadow:"0 2px 18px rgba(15,23,42,.07)",
      cursor:onClick?"pointer":"default",transition:"transform .15s,box-shadow .15s",...s}}
    onMouseEnter={e=>{if(onClick){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(15,23,42,.13)";}}}
    onMouseLeave={e=>{if(onClick){e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 18px rgba(15,23,42,.07)";}}}
  >{children}</div>
);

const Btn=({children,onClick,v="primary",size="md",full,style:s,disabled,loading})=>{
  const pad={xs:"5px 10px",sm:"7px 14px",md:"11px 22px",lg:"14px 28px",xl:"17px 36px"};
  const fs={xs:11,sm:12,md:14,lg:15,xl:17};
  const vars={
    primary:{background:T.blue,color:"#FFF",border:"none"},
    green:{background:T.green,color:"#FFF",border:"none"},
    dark:{background:T.navy,color:"#FFF",border:"none"},
    outline:{background:"transparent",color:T.blue,border:`2px solid ${T.blue}`},
    outlineG:{background:"transparent",color:T.green,border:`2px solid ${T.green}`},
    ghost:{background:"transparent",color:T.slate,border:"none"},
    danger:{background:T.red,color:"#FFF",border:"none"},
    amber:{background:T.amber,color:"#FFF",border:"none"},
    teal:{background:T.teal,color:"#FFF",border:"none"},
    wa:{background:"#25D366",color:"#FFF",border:"none"},
    pill:{background:T.bg,color:T.slate,border:"none"},
  };
  return(
    <button onClick={disabled||loading?undefined:onClick} disabled={disabled||loading}
      style={{...vars[v],padding:pad[size],fontSize:fs[size],fontWeight:700,borderRadius:12,
        cursor:disabled||loading?"default":"pointer",opacity:disabled?.5:1,
        display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,
        width:full?"100%":"auto",transition:"opacity .15s,transform .1s",lineHeight:1,...s}}>
      {loading&&<span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",
        borderTopColor:"#FFF",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>}
      {children}
    </button>
  );
};

const Badge=({children,c=T.blue,style:s})=>(
  <span style={{background:c+"1C",color:c,fontWeight:700,fontSize:11,padding:"3px 9px",
    borderRadius:20,display:"inline-flex",alignItems:"center",gap:3,...s}}>{children}</span>
);

const Div=()=><div style={{height:1,background:T.slateXL,margin:"14px 0"}}/>;

const Input=({label,value,onChange,type="text",placeholder,hint,error,prefix,autoFocus,suffix})=>{
  const [focus,setFocus]=useState(false);
  return(
    <div>
      {label&&<div style={{fontSize:12,fontWeight:700,color:T.slate,marginBottom:5,letterSpacing:.3}}>{label}</div>}
      <div style={{display:"flex",alignItems:"center",border:`1.5px solid ${error?T.red:focus?T.blue:T.slateXL}`,
        borderRadius:12,background:T.white,transition:"border .15s,box-shadow .15s",
        boxShadow:focus?`0 0 0 3px ${T.blue}20`:"none",overflow:"hidden"}}>
        {prefix&&<div style={{padding:"0 12px",fontSize:15,color:T.slateL,borderRight:`1px solid ${T.slateXL}`,height:"100%",display:"flex",alignItems:"center"}}>{prefix}</div>}
        <input value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}
          autoFocus={autoFocus} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
          style={{flex:1,padding:"12px 14px",border:"none",outline:"none",fontSize:14,
            background:"transparent",color:T.dark,width:"100%"}}/>
        {suffix&&<div style={{padding:"0 14px",fontSize:13,color:T.slateL}}>{suffix}</div>}
      </div>
      {hint&&!error&&<div style={{fontSize:11,color:T.slateL,marginTop:4}}>{hint}</div>}
      {error&&<div style={{fontSize:11,color:T.red,marginTop:4}}>⚠ {error}</div>}
    </div>
  );
};

const Toast=({msg,type="success",onClose})=>{
  useEffect(()=>{const t=setTimeout(onClose,3800);return()=>clearTimeout(t);},[]);
  const C={success:{bg:T.greenPale,bd:T.green,tx:T.green},
    error:{bg:T.redPale,bd:T.red,tx:T.red},
    info:{bg:T.blueLight,bd:T.blue,tx:T.blue},
    amber:{bg:T.amberPale,bd:T.amber,tx:T.amber}};
  const c=C[type]||C.info;
  return(
    <div className="slide" style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",
      zIndex:9999,background:c.bg,border:`1.5px solid ${c.bd}`,color:c.tx,
      padding:"12px 18px",borderRadius:16,fontSize:13,fontWeight:600,
      boxShadow:"0 8px 32px rgba(0,0,0,.14)",maxWidth:340,textAlign:"center",lineHeight:1.4}}>
      {msg}
    </div>
  );
};

const Sheet=({children,onClose,title,height="auto"})=>(
  <div className="fi" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(10,20,40,.65)",
    zIndex:998,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}}>
    <div className="slide" onClick={e=>e.stopPropagation()}
      style={{background:T.white,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,
        maxHeight:"92vh",overflowY:"auto",paddingBottom:28}}>
      <div style={{width:36,height:4,borderRadius:4,background:T.slateXL,margin:"12px auto 0"}}/>
      {title&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 14px"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18,color:T.dark}}>{title}</div>
          <button onClick={onClose} style={{background:T.bg,border:"none",width:32,height:32,
            borderRadius:10,cursor:"pointer",fontSize:15,color:T.slate}}>✕</button>
        </div>
      )}
      <div style={{padding:"0 20px"}}>{children}</div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   ONBOARDING
══════════════════════════════════════════════════════════════ */
function Onboarding({onDone}) {
  const [step,setStep]=useState(0);
  const slides=[
    {title:"Comprá en grupo,\nahorrá hasta 40%",sub:"Unite con vecinos de San Martín y accedé a precios mayoristas. Sin mínimo de compra.",emoji:"🛒",color:["#1651E0","#0891B2"]},
    {title:"Simple y\ntransparente",sub:"El dinero queda en custodia hasta que recibís tu producto. Si el grupo no se forma, reembolso automático.",emoji:"🔐",color:["#15803D","#0891B2"]},
    {title:"Compartí y\nganá más",sub:"Invitá amigos para completar grupos. Cada referido te da $500 de descuento en tu próxima compra.",emoji:"🎁",color:["#7C3AED","#1651E0"]},
  ];
  const s=slides[step];
  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${s.color[0]},${s.color[1]})`,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",
      padding:"60px 28px 48px",transition:"background 0.5s ease"}}>
      <FONTS/>
      <Logo scale={0.9} white/>
      <div className="fu" key={step} style={{textAlign:"center",flex:1,display:"flex",
        flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28}}>
        <div style={{fontSize:100,filter:"drop-shadow(0 8px 24px rgba(0,0,0,.2))"}}>{s.emoji}</div>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:30,color:"#FFF",
            marginBottom:16,lineHeight:1.2,whiteSpace:"pre-line"}}>{s.title}</div>
          <div style={{color:"rgba(255,255,255,.8)",fontSize:16,lineHeight:1.7,maxWidth:340}}>{s.sub}</div>
        </div>
      </div>
      <div style={{width:"100%"}}>
        {/* Dots */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:28}}>
          {slides.map((_,i)=>(
            <div key={i} onClick={()=>setStep(i)} style={{height:8,borderRadius:4,cursor:"pointer",
              width:i===step?28:8,background:i===step?"#FFF":"rgba(255,255,255,.35)",transition:"all .3s"}}/>
          ))}
        </div>
        {step<slides.length-1 ? (
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={onDone} style={{background:"none",border:"none",color:"rgba(255,255,255,.6)",
              cursor:"pointer",fontSize:14,fontWeight:600}}>Saltar</button>
            <Btn v="primary" size="lg" style={{background:"rgba(255,255,255,.2)",backdropFilter:"blur(8px)",
              border:"1.5px solid rgba(255,255,255,.4)",color:"#FFF"}} onClick={()=>setStep(s=>s+1)}>
              Siguiente →
            </Btn>
          </div>
        ) : (
          <Btn v="primary" full size="xl" style={{background:"#FFF",color:s.color[0]}} onClick={onDone}>
            ¡Empezar a ahorrar! 🚀
          </Btn>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════════ */
function LoginView({onLogin}) {
  const [tab,setTab]=useState("login");
  const [role,setRole]=useState("client");
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({name:"",email:"",phone:"",pass:"",code:""});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const f=(k,v)=>setForm(x=>({...x,[k]:v}));
  const doLogin=()=>{
    setLoading(true);
    setTimeout(()=>{
      setLoading(false);
      const demos={"admin@junto.ar":{name:"Admin JUNTO",role:"admin",email:"admin@junto.ar"},
        "roberto@junto.ar":{name:"Don Roberto",role:"provider",email:"roberto@junto.ar",storeId:1},
        "maria@junto.ar":{name:"María García",role:"client",email:"maria@junto.ar",points:1240,level:3}};
      onLogin(demos[form.email]||{name:form.name||"Usuario Demo",role,email:form.email||`demo@junto.ar`,points:0,level:1});
    },900);
  };
  return(
    <div style={{minHeight:"100vh",background:T.navy,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"24px",position:"relative",overflow:"hidden"}}>
      <FONTS/>
      <div style={{position:"fixed",top:-100,right:-100,width:360,height:360,borderRadius:"50%",background:T.blue,opacity:.18}}/>
      <div style={{position:"fixed",bottom:-80,left:-80,width:280,height:280,borderRadius:"50%",background:T.greenV,opacity:.1}}/>
      <div className="fu" style={{position:"relative",zIndex:1,width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <Logo scale={1.05} white/>
          <div style={{color:"#93C5FD",fontSize:14,marginTop:8}}>San Martín, Mendoza · Compras Grupales</div>
        </div>
        <Card style={{padding:0,overflow:"hidden",borderRadius:24}}>
          <div style={{display:"flex",background:T.bg,padding:5}}>
            {["login","registro"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setErr("");setStep(1);}}
                style={{flex:1,padding:"10px 0",border:"none",cursor:"pointer",fontWeight:700,fontSize:14,
                  borderRadius:15,transition:"all .2s",background:tab===t?T.white:"transparent",
                  color:tab===t?T.navy:T.slateL,boxShadow:tab===t?"0 2px 10px rgba(0,0,0,.08)":"none"}}>
                {t==="login"?"Ingresar":"Registrarse"}
              </button>
            ))}
          </div>
          <div style={{padding:28}}>
            {tab==="login"&&(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:T.slateL,marginBottom:8,letterSpacing:.5}}>ENTRÁ COMO</div>
                  <div style={{display:"flex",gap:8}}>
                    {[{v:"client",l:"🛒 Cliente"},{v:"provider",l:"🏪 Proveedor"},{v:"admin",l:"⚙️ Admin"}].map(r=>(
                      <button key={r.v} onClick={()=>setRole(r.v)}
                        style={{flex:1,padding:"9px 4px",border:`2px solid ${role===r.v?T.blue:T.slateXL}`,
                          borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:12,transition:"all .15s",
                          background:role===r.v?T.blueLight:T.white,color:role===r.v?T.blue:T.slate}}>
                        {r.l}
                      </button>
                    ))}
                  </div>
                </div>
                <Input label="Email" value={form.email} onChange={v=>f("email",v)} placeholder="tu@email.com"
                  hint={role==="admin"?"Demo: admin@junto.ar":role==="provider"?"Demo: roberto@junto.ar":"Demo: maria@junto.ar"}/>
                <Input label="Contraseña" value={form.pass} onChange={v=>f("pass",v)} type="password" placeholder="••••••"/>
                {err&&<div style={{color:T.red,fontSize:12,fontWeight:600}}>⚠ {err}</div>}
                <Btn v="primary" size="lg" full loading={loading} onClick={doLogin}>Ingresar</Btn>
                <div style={{textAlign:"center",fontSize:13,color:T.slateL}}>o ingresá con</div>
                <Btn v="outline" full onClick={doLogin}>🔵  Continuar con Google</Btn>
              </div>
            )}
            {tab==="registro"&&step===1&&(
              <div style={{display:"flex",flexDirection:"column",gap:15}}>
                <Input label="Nombre completo" value={form.name} onChange={v=>f("name",v)} placeholder="María García" autoFocus/>
                <Input label="Email" value={form.email} onChange={v=>f("email",v)} type="email" placeholder="maria@gmail.com"/>
                <Input label="WhatsApp" value={form.phone} onChange={v=>f("phone",v)} type="tel" placeholder="261-555-1234" prefix="🇦🇷"/>
                <Input label="Contraseña" value={form.pass} onChange={v=>f("pass",v)} type="password" placeholder="Mínimo 8 caracteres"/>
                {err&&<div style={{color:T.red,fontSize:12,fontWeight:600}}>⚠ {err}</div>}
                <Btn v="green" size="lg" full loading={loading} onClick={()=>{
                  if(!form.name||!form.email||!form.phone){setErr("Completá todos los campos");return;}
                  setLoading(true);setTimeout(()=>{setLoading(false);setStep(2);setErr("");},700);
                }}>Crear cuenta gratis →</Btn>
                <div style={{fontSize:11,color:T.slateL,textAlign:"center",lineHeight:1.6}}>
                  Al registrarte aceptás los <span style={{color:T.blue}}>Términos</span> y la <span style={{color:T.blue}}>Política de privacidad</span>
                </div>
              </div>
            )}
            {tab==="registro"&&step===2&&(
              <div style={{display:"flex",flexDirection:"column",gap:16,textAlign:"center"}}>
                <div style={{fontSize:60}}>📲</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18,color:T.dark}}>Verificá tu número</div>
                <div style={{fontSize:13,color:T.slate}}>Código enviado al {form.phone||"tu teléfono"}</div>
                <Input label="Código de 4 dígitos" value={form.code} onChange={v=>f("code",v)} placeholder="1234" hint="Usá 1234 para demo" autoFocus/>
                {err&&<div style={{color:T.red,fontSize:12,fontWeight:600}}>⚠ {err}</div>}
                <Btn v="green" size="lg" full loading={loading} onClick={()=>{
                  if(form.code!=="1234"){setErr("Código incorrecto. Usá 1234.");return;}
                  setLoading(true);setTimeout(()=>{setLoading(false);onLogin({name:form.name,role:"client",email:form.email,points:0,level:1});},600);
                }}>Verificar →</Btn>
              </div>
            )}
          </div>
        </Card>
        <div style={{textAlign:"center",marginTop:16,color:"rgba(255,255,255,.25)",fontSize:11}}>
          🔐 Plataforma segura · Año 1 sin comisión para proveedores
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LIVE ACTIVITY TICKER
══════════════════════════════════════════════════════════════ */
function Ticker() {
  const msgs=[...ACTIVITY_MSGS,...ACTIVITY_MSGS];
  return(
    <div style={{background:T.navy,overflow:"hidden",height:32,display:"flex",alignItems:"center"}}>
      <div style={{display:"flex",gap:48,whiteSpace:"nowrap",
        animation:"ticker 30s linear infinite",paddingLeft:20}}>
        {msgs.map((m,i)=>(
          <span key={i} style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:500}}>{m}</span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRODUCT CARD (improved)
══════════════════════════════════════════════════════════════ */
function ProductCard({p,joined,fav,onClick,onFav}) {
  const pct=p.cur/p.minB;
  const disc=Math.round((p.pInd-p.pGroup)/p.pInd*100);
  const done=p.cur>=p.minB;
  const hot=pct>=.7&&!done;
  const {display}=useCountdown(p.secs);
  const grad=T.cats[p.cat]||[T.navy,T.blue];
  const [favAnim,setFavAnim]=useState(false);

  return(
    <div onClick={onClick} style={{borderRadius:20,overflow:"hidden",background:T.white,
      boxShadow:"0 2px 18px rgba(15,23,42,.08)",cursor:"pointer",position:"relative",
      transition:"transform .15s,box-shadow .15s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(15,23,42,.14)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 18px rgba(15,23,42,.08)";}}>
      {/* Image area */}
      <div style={{height:108,background:`linear-gradient(135deg,${grad[0]},${grad[1]})`,
        display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <div style={{fontSize:52,filter:"drop-shadow(0 4px 8px rgba(0,0,0,.3))"}}>{p.emoji}</div>
        {/* Discount badge */}
        <div style={{position:"absolute",top:8,left:8,background:T.green,color:"#FFF",
          fontWeight:800,fontSize:12,padding:"3px 10px",borderRadius:8}}>-{disc}%</div>
        {/* Tag */}
        {p.tag&&<div className="pulse" style={{position:"absolute",top:8,right:36,background:"rgba(0,0,0,.35)",
          backdropFilter:"blur(4px)",color:"#FFF",fontWeight:700,fontSize:9,padding:"2px 7px",borderRadius:6}}>
          {p.tag}</div>}
        {/* Fav button */}
        <button onClick={e=>{e.stopPropagation();setFavAnim(true);setTimeout(()=>setFavAnim(false),400);onFav&&onFav(p.id);}}
          className={favAnim?"hb":""}
          style={{position:"absolute",top:6,right:6,background:"rgba(255,255,255,.2)",
            backdropFilter:"blur(4px)",border:"none",width:28,height:28,borderRadius:8,
            cursor:"pointer",fontSize:14,color:fav?"#F43F5E":"rgba(255,255,255,.8)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
          {fav?"❤️":"🤍"}
        </button>
        {/* joined */}
        {joined&&<div style={{position:"absolute",bottom:6,right:6,background:"rgba(22,197,94,.9)",
          color:"#FFF",fontWeight:700,fontSize:10,padding:"2px 8px",borderRadius:6}}>✓ Unido</div>}
      </div>
      {/* Content */}
      <div style={{padding:"11px 13px 13px"}}>
        <div style={{fontSize:12,fontWeight:700,color:T.dark,marginBottom:2,lineHeight:1.3}}>{p.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}>
          <Stars rating={p.rating} size={10}/>
          <span style={{fontSize:10,color:T.slateL}}>({p.reviews})</span>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"baseline",marginBottom:9}}>
          <span style={{fontSize:17,fontWeight:800,color:T.green,fontFamily:"'Syne',sans-serif"}}>
            ${p.pGroup.toLocaleString("es-AR")}
          </span>
          <span style={{fontSize:10,color:T.slateL,textDecoration:"line-through"}}>
            ${p.pInd.toLocaleString("es-AR")}
          </span>
        </div>
        {/* Progress */}
        <div style={{marginBottom:6}}>
          <MiniBar value={p.cur} max={p.minB} color={done?T.green:hot?T.amber:T.blue}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,fontWeight:600,color:done?T.green:hot?T.amber:T.slateL}}>
            {done?"✅ Completo":`${p.cur}/${p.minB}`}
          </span>
          <span style={{fontSize:9,color:T.slateL}}>⏱{display}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOME VIEW
══════════════════════════════════════════════════════════════ */
function HomeView({products,user,joined,favs,onProduct,onJoin,onFav,toastFn}) {
  const [cat,setCat]=useState("Todos");
  const [q,setQ]=useState("");
  const [banner,setBanner]=useState(true);
  const [viewMode,setViewMode]=useState("grid"); // grid | list
  const hot=products.filter(p=>p.cur/p.minB>=.65&&p.cur<p.minB).slice(0,4);
  const filtered=products.filter(p=>(cat==="Todos"||p.cat===cat)&&(!q||p.name.toLowerCase().includes(q.toLowerCase())));
  const xpLevel=user.level||1;
  const xpPct=((user.points||0)%500)/500;

  return(
    <div style={{paddingBottom:104}}>
      <Ticker/>
      {/* Hero */}
      <div style={{background:T.navy,padding:"16px 18px 28px",borderRadius:"0 0 28px 28px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",
          background:T.blue,opacity:.15,pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,position:"relative"}}>
          <div>
            <div style={{color:"#93C5FD",fontSize:13,marginBottom:2}}>Hola, {user.name.split(" ")[0]} 👋</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:"#FFF",lineHeight:1.2}}>
              ¿Qué compramos hoy?
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Logo compact scale={.95} white/>
          </div>
        </div>
        {/* XP bar */}
        <div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"8px 12px",
          display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{fontSize:16}}>⭐</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:T.greenV,fontWeight:700}}>Nivel {xpLevel} · {user.points||0} pts</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>→ Nivel {xpLevel+1}</span>
            </div>
            <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,.15)",overflow:"hidden"}}>
              <div style={{width:`${xpPct*100}%`,height:"100%",background:T.greenV,borderRadius:4,transition:"width .6s"}}/>
            </div>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>🏅 {BADGES[Math.min(xpLevel-1,BADGES.length-1)].icon}</div>
        </div>
        {/* Search */}
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15}}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar yerba, aceite, pollo..."
            style={{width:"100%",padding:"11px 14px 11px 40px",border:"none",borderRadius:14,
              fontSize:13,background:"rgba(255,255,255,.1)",color:"#FFF",outline:"none"}}/>
          {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
            background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:16}}>✕</button>}
        </div>
      </div>

      <div style={{padding:"14px 16px 0"}}>
        {/* First purchase banner */}
        {banner&&(
          <div className="fu" style={{background:"linear-gradient(135deg,#1651E0,#0891B2)",
            borderRadius:18,padding:"14px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#FFF",fontWeight:700,fontSize:13,marginBottom:2}}>🎁 Primera compra</div>
              <div style={{color:"rgba(255,255,255,.8)",fontSize:12}}>
                Usá <strong style={{color:T.amberLight}}>JUNTO10</strong> y ahorrá 10% adicional
              </div>
            </div>
            <button onClick={()=>setBanner(false)} style={{background:"none",border:"none",
              color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:16}}>✕</button>
          </div>
        )}

        {/* Hot groups */}
        {hot.length>0&&!q&&cat==="Todos"&&(
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:T.dark}}>🔥 Casi llenos</div>
              <Badge c={T.red} style={{cursor:"pointer"}}>¡Urgente!</Badge>
            </div>
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6,marginLeft:-2,paddingLeft:2}}>
              {hot.map(p=>{
                const left=p.minB-p.cur; const pct=p.cur/p.minB;
                const grad=T.cats[p.cat]||[T.navy,T.blue];
                return(
                  <div key={p.id} onClick={()=>onProduct(p)} style={{minWidth:155,
                    background:`linear-gradient(145deg,${grad[0]},${grad[1]})`,
                    borderRadius:18,padding:14,cursor:"pointer",flexShrink:0}}>
                    <div style={{fontSize:28,marginBottom:6}}>{p.emoji}</div>
                    <div style={{color:"#FFF",fontWeight:700,fontSize:12,lineHeight:1.3,marginBottom:4}}>{p.name}</div>
                    <div style={{color:T.amberLight,fontWeight:800,fontSize:15,fontFamily:"'Syne',sans-serif",marginBottom:6}}>
                      ${p.pGroup.toLocaleString("es-AR")}
                    </div>
                    <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,.2)",overflow:"hidden",marginBottom:5}}>
                      <div style={{width:`${pct*100}%`,height:"100%",background:T.greenV,borderRadius:4}}/>
                    </div>
                    <div style={{color:"#FCA5A5",fontSize:10,fontWeight:700}}>
                      ⚡ Faltan {left} persona{left!==1?"s":""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              style={{padding:"7px 15px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,
                background:cat===c?T.blue:T.white,color:cat===c?"#FFF":T.slate,
                boxShadow:"0 1px 6px rgba(0,0,0,.06)",whiteSpace:"nowrap",transition:"all .15s",flexShrink:0}}>
              {c}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:T.dark}}>
            {q?`Resultados: "${q}"`:"Grupos activos"}
            <span style={{fontWeight:400,fontSize:12,color:T.slateL,marginLeft:6}}>({filtered.length})</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            {["grid","list"].map(m=>(
              <button key={m} onClick={()=>setViewMode(m)}
                style={{width:30,height:30,border:"none",borderRadius:8,cursor:"pointer",
                  background:viewMode===m?T.blue:T.white,color:viewMode===m?"#FFF":T.slateL,
                  fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {m==="grid"?"⊞":"☰"}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"44px 0",color:T.slateL}}>
            <div style={{fontSize:48,marginBottom:12}}>🔍</div>
            <div style={{fontWeight:600,color:T.slate,marginBottom:4}}>Sin resultados para "{q}"</div>
            <div style={{fontSize:13}}>Probá con otra búsqueda o explorá por categoría</div>
          </div>
        ):viewMode==="grid"?(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {filtered.map((p,i)=>(
              <div key={p.id} className="fu" style={{animationDelay:`${i*.04}s`}}>
                <ProductCard p={p} joined={joined.includes(p.id)} fav={favs.includes(p.id)}
                  onClick={()=>onProduct(p)} onFav={onFav}/>
              </div>
            ))}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.map(p=>{
              const pct=p.cur/p.minB; const done=p.cur>=p.minB;
              const disc=Math.round((p.pInd-p.pGroup)/p.pInd*100);
              const grad=T.cats[p.cat]||[T.navy,T.blue];
              return(
                <div key={p.id} onClick={()=>onProduct(p)}
                  style={{background:T.white,borderRadius:16,padding:14,
                    display:"flex",gap:14,alignItems:"center",cursor:"pointer",
                    boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
                  <div style={{width:60,height:60,borderRadius:14,flexShrink:0,
                    background:`linear-gradient(135deg,${grad[0]},${grad[1]})`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                    {p.emoji}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.dark,marginBottom:2}}>{p.name}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                      <span style={{fontWeight:800,fontSize:15,color:T.green}}>${p.pGroup.toLocaleString("es-AR")}</span>
                      <Badge c={T.green} style={{fontSize:10}}>-{disc}%</Badge>
                    </div>
                    <MiniBar value={p.cur} max={p.minB} color={done?T.green:pct>=.7?T.amber:T.blue} height={5}/>
                    <span style={{fontSize:10,color:T.slateL}}>{p.cur}/{p.minB} compradores</span>
                  </div>
                  <span style={{color:T.slateL,fontSize:18}}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Demand banner */}
        {!q&&(
          <div style={{marginTop:22,background:T.navy,borderRadius:18,padding:"16px 18px",
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:"#FFF",fontWeight:700,fontSize:13}}>📋 Panel de Demanda</div>
              <div style={{color:"#93C5FD",fontSize:12,marginTop:2}}>Pedí el producto que necesitás</div>
            </div>
            <Btn v="amber" size="sm">Ver pedidos</Btn>
          </div>
        )}

        {/* Refer */}
        {!q&&(
          <div style={{marginTop:12,background:"linear-gradient(135deg,#166534,#22C55E)",
            borderRadius:18,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <div style={{color:"#FFF",fontWeight:700,fontSize:13}}>🎁 Invitá y ganás</div>
              <div style={{color:"rgba(255,255,255,.8)",fontSize:12}}>$500 para vos y tu amigo</div>
            </div>
            <Btn v="dark" size="sm" onClick={()=>toastFn("✅ Link copiado al portapapeles","success")}>Invitar</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRODUCT DETAIL (v2)
══════════════════════════════════════════════════════════════ */
function ProductDetail({p,joined,fav,onBack,onJoin,onFav,user,toastFn,onAddPoints}) {
  const [tab,setTab]=useState("info"); // info | reviews | chat
  const [view,setView]=useState("detail"); // detail | pay | success
  const [qty,setQty]=useState(1);
  const [payMethod,setPayMethod]=useState("mp");
  const [loading,setLoading]=useState(false);
  const [coupon,setCoupon]=useState("");
  const [couponApplied,setCouponApplied]=useState(false);
  const [chatMsg,setChatMsg]=useState("");
  const [chatMsgs,setChatMsgs]=useState(CHAT_DATA[p.id]||[]);
  const [viewersCount]=useState(Math.floor(2+Math.random()*8));
  const {display,done:expired}=useCountdown(p.secs);
  const pct=p.cur/p.minB; const done=p.cur>=p.minB; const hot=pct>=.7&&!done;
  const disc=Math.round((p.pInd-p.pGroup)/p.pInd*100);
  const store=STORES_DATA.find(s=>s.id===p.storeId);
  const effPrice=couponApplied?Math.round(p.pGroup*.9):p.pGroup;
  const total=effPrice*qty;
  const reviews=REVIEWS_DATA[p.id]||[];
  const grad=T.cats[p.cat]||[T.navy,T.blue];

  const sendChat=()=>{
    if(!chatMsg.trim()) return;
    setChatMsgs(m=>[...m,{id:Date.now(),user:"Vos",avatar:"VD",text:chatMsg,time:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),self:true}]);
    setChatMsg("");
  };

  if(view==="success") return(
    <div style={{padding:24,paddingBottom:100}}>
      <button onClick={onBack} style={{background:T.bg,border:"none",borderRadius:12,padding:"8px 14px",
        cursor:"pointer",fontWeight:600,fontSize:13,color:T.slate,marginBottom:20}}>← Volver</button>
      <div className="fu" style={{textAlign:"center"}}>
        <div className="bounce" style={{fontSize:80,marginBottom:16}}>🎉</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,color:T.dark,marginBottom:8}}>
          ¡Compra confirmada!
        </div>
        <div style={{color:T.slateL,marginBottom:24}}>Tu QR para retirar en {store?.name}</div>
        <div style={{display:"inline-block",padding:20,background:"#FFF",borderRadius:24,
          boxShadow:"0 8px 40px rgba(0,0,0,.12)",marginBottom:20}}>
          <QRCode data={`JUNTO-${p.id}-${user.email}-${Date.now()}`} size={180}/>
          <div style={{marginTop:12,fontSize:12,color:T.slate}}>
            Pedido #JTO-{p.id}0{Math.floor(10+Math.random()*90)}<br/>
            <strong>{user.name}</strong> · {p.name} ×{qty}
          </div>
        </div>
        {/* XP earned */}
        <div className="ca" style={{background:"linear-gradient(135deg,#1651E0,#0891B2)",borderRadius:18,
          padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:36}}>⭐</div>
          <div style={{textAlign:"left"}}>
            <div style={{color:"rgba(255,255,255,.8)",fontSize:12,marginBottom:2}}>¡Ganaste puntos!</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#FFF"}}>+100 XP</div>
          </div>
          <div style={{marginLeft:"auto",fontSize:11,color:"rgba(255,255,255,.6)",textAlign:"right"}}>
            Comprador<br/>fiel 🏅
          </div>
        </div>
        <Card style={{background:T.greenPale,boxShadow:"none",marginBottom:14}}>
          <div style={{color:T.green,fontWeight:700,fontSize:13,marginBottom:4}}>💰 Ahorraste</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:30,color:T.green}}>
            ${((p.pInd-effPrice)*qty).toLocaleString("es-AR")}
          </div>
          <div style={{color:T.green,fontSize:12}}>vs precio individual</div>
        </Card>
        <div style={{fontSize:13,color:T.slate,lineHeight:1.7,marginBottom:20}}>
          📍 <strong>{store?.name}</strong> · {store?.addr}<br/>
          ⏰ Disponible en 24–48hs tras completar el grupo
        </div>
        <Btn v="wa" full size="lg" style={{marginBottom:10}}
          onClick={()=>toastFn("📲 Compartido por WhatsApp","success")}>
          💬 Compartir — completá el grupo
        </Btn>
        <Btn v="ghost" full onClick={onBack}>← Seguir comprando</Btn>
      </div>
    </div>
  );

  if(view==="pay") return(
    <div style={{padding:"20px 18px 100px"}}>
      <button onClick={()=>setView("detail")} style={{background:T.bg,border:"none",borderRadius:12,
        padding:"8px 14px",cursor:"pointer",fontWeight:600,fontSize:13,color:T.slate,marginBottom:18}}>← Volver</button>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:T.dark,marginBottom:18}}>
        Confirmar pago
      </div>
      {/* Summary */}
      <Card style={{marginBottom:14,padding:16}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
          <div style={{width:50,height:50,borderRadius:14,
            background:`linear-gradient(135deg,${grad[0]},${grad[1]})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{p.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:T.dark}}>{p.name}</div>
            <div style={{fontSize:12,color:T.slateL}}>{store?.name}</div>
          </div>
          <div style={{fontWeight:800,color:T.green,fontSize:15}}>${effPrice.toLocaleString("es-AR")} ×{qty}</div>
        </div>
        <Div/>
        {/* Coupon */}
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input value={coupon} onChange={e=>setCoupon(e.target.value)} placeholder="Código de cupón (JUNTO10)"
            style={{flex:1,padding:"10px 12px",border:`1.5px solid ${couponApplied?T.green:T.slateXL}`,
              borderRadius:10,fontSize:12,outline:"none"}}/>
          <Btn v={couponApplied?"green":"outline"} size="sm" onClick={()=>{
            if(coupon.toUpperCase()==="JUNTO10"){setCouponApplied(true);toastFn("✅ -10% aplicado","success");}
            else toastFn("Cupón no válido","error");
          }}>{couponApplied?"✓ OK":"Aplicar"}</Btn>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700}}>Total</span>
          <div style={{textAlign:"right"}}>
            {couponApplied&&<div style={{fontSize:11,color:T.slateL,textDecoration:"line-through"}}>${(p.pGroup*qty).toLocaleString("es-AR")}</div>}
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:T.green}}>
              ${total.toLocaleString("es-AR")}
            </div>
          </div>
        </div>
      </Card>
      {/* Payment methods */}
      <div style={{fontWeight:700,color:T.dark,fontSize:13,marginBottom:10}}>Método de pago</div>
      <Card style={{marginBottom:14,padding:14}}>
        {[{v:"mp",l:"MercadoPago",ic:"💙",d:"Saldo o tarjeta vinculada"},
          {v:"credit",l:"Tarjeta de crédito",ic:"💳",d:"Visa, Mastercard, Amex"},
          {v:"debit",l:"Tarjeta de débito",ic:"🏦",d:"Débito inmediato"},
          {v:"qr",l:"QR Banco",ic:"📱",d:"Escaneá con tu app bancaria"}].map((m,i)=>(
          <div key={m.v}>
            {i>0&&<Div/>}
            <div onClick={()=>setPayMethod(m.v)}
              style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"2px 0"}}>
              <div style={{width:38,height:38,borderRadius:10,background:T.bg,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{m.ic}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:T.dark}}>{m.l}</div>
                <div style={{fontSize:11,color:T.slateL}}>{m.d}</div>
              </div>
              <div style={{width:18,height:18,borderRadius:"50%",
                border:`2px solid ${payMethod===m.v?T.blue:T.slateXL}`,
                background:payMethod===m.v?T.blue:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                {payMethod===m.v&&<div style={{width:7,height:7,borderRadius:"50%",background:"#FFF"}}/>}
              </div>
            </div>
          </div>
        ))}
      </Card>
      <div style={{background:T.blueLight,borderRadius:14,padding:"12px 14px",marginBottom:18,
        display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:18}}>🔐</span>
        <div>
          <div style={{fontWeight:700,color:T.blue,fontSize:12,marginBottom:2}}>Custodia JUNTO</div>
          <div style={{color:"#1e40af",fontSize:11,lineHeight:1.5}}>
            Tu pago queda en custodia hasta que retirás el producto. Sin entrega = reembolso automático.
          </div>
        </div>
      </div>
      <Btn v="green" size="xl" full loading={loading} onClick={()=>{
        setLoading(true);setTimeout(()=>{setLoading(false);setView("success");onAddPoints&&onAddPoints(100);},1500);
      }}>
        🔐 Pagar ${total.toLocaleString("es-AR")}
      </Btn>
    </div>
  );

  return(
    <div style={{paddingBottom:100}}>
      {/* Hero */}
      <div style={{background:`linear-gradient(145deg,${grad[0]},${grad[1]})`,
        padding:"16px 18px 40px",borderRadius:"0 0 28px 28px",marginBottom:-18,position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",
            borderRadius:12,width:38,height:38,cursor:"pointer",fontSize:18,color:"#FFF"}}>←</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{onFav&&onFav(p.id);toastFn(fav?"💔 Eliminado de favoritos":"❤️ Guardado en favoritos","info");}}
              style={{background:"rgba(255,255,255,.15)",border:"none",width:38,height:38,
                borderRadius:12,cursor:"pointer",fontSize:18,color:"#FFF"}}>
              {fav?"❤️":"🤍"}
            </button>
            <button onClick={()=>toastFn("📲 Link copiado","success")}
              style={{background:"rgba(255,255,255,.15)",border:"none",width:38,height:38,
                borderRadius:12,cursor:"pointer",fontSize:18,color:"#FFF"}}>🔗</button>
          </div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:80,filter:"drop-shadow(0 4px 12px rgba(0,0,0,.3))"}}>{p.emoji}</div>
          {/* Social proof */}
          <div style={{display:"inline-flex",alignItems:"center",gap:6,
            background:"rgba(0,0,0,.2)",borderRadius:20,padding:"4px 12px",marginTop:8}}>
            <div style={{display:"flex",gap:-4}}>
              {["🔵","🟢","🟡"].map((c,i)=>(
                <div key={i} style={{width:18,height:18,borderRadius:"50%",background:`hsl(${200+i*30},70%,60%)`,
                  marginLeft:i>0?-4:0,border:"1.5px solid rgba(255,255,255,.3)",fontSize:9,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>👤</div>
              ))}
            </div>
            <span style={{color:"rgba(255,255,255,.9)",fontSize:11,fontWeight:600}}>
              {viewersCount} personas viendo esto ahora
            </span>
          </div>
        </div>
      </div>

      <div style={{padding:"28px 18px 0"}}>
        {/* Title */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div style={{flex:1,paddingRight:12}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:T.dark,lineHeight:1.2}}>
              {p.name}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
              <Stars rating={p.rating}/>
              <span style={{fontSize:12,color:T.slateL}}>{p.rating} · {p.reviews} reseñas</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <Badge c={T.green}>-{disc}%</Badge>
            {p.tag&&<Badge c={T.amber}>{p.tag}</Badge>}
          </div>
        </div>

        {/* Store link */}
        <div style={{display:"flex",alignItems:"center",gap:10,background:T.bg,borderRadius:12,
          padding:"10px 14px",marginBottom:14,cursor:"pointer"}}>
          <div style={{fontSize:22}}>{store?.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:13,color:T.dark}}>{store?.name}</div>
            <div style={{fontSize:11,color:T.slateL}}>📍 {store?.addr} · ⭐ {store?.rating}</div>
          </div>
          <span style={{color:T.blue,fontSize:12,fontWeight:600}}>Ver tienda ›</span>
        </div>

        {/* Price */}
        <Card style={{background:T.greenPale,boxShadow:"none",marginBottom:14,padding:"14px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,color:T.green,fontWeight:700,marginBottom:2,letterSpacing:.3}}>PRECIO GRUPAL</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,color:T.green}}>
                ${p.pGroup.toLocaleString("es-AR")}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:T.slateL,marginBottom:2}}>Precio normal</div>
              <div style={{fontSize:18,color:T.slateL,textDecoration:"line-through",fontWeight:700}}>
                ${p.pInd.toLocaleString("es-AR")}
              </div>
              <div style={{fontSize:12,color:T.green,fontWeight:700}}>
                Ahorrás ${(p.pInd-p.pGroup).toLocaleString("es-AR")}
              </div>
            </div>
          </div>
        </Card>

        {/* Group progress */}
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:14,color:T.dark}}>Estado del grupo</div>
            <div style={{fontSize:12,fontWeight:700,color:expired?T.red:hot?T.red:T.slate}}>⏱ {display}</div>
          </div>
          <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:12}}>
            <Ring pct={pct} size={72} color={done?T.green:hot?T.amber:T.blue} label={`${Math.round(pct*100)}%`}/>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26,color:done?T.green:T.dark}}>
                {p.cur} <span style={{fontWeight:400,fontSize:16,color:T.slateL}}>/ {p.minB}</span>
              </div>
              <div style={{color:T.slate,fontSize:13}}>compradores</div>
              {!done&&<div style={{color:T.red,fontWeight:700,fontSize:13,marginTop:2}}>
                Faltan {p.minB-p.cur} persona{p.minB-p.cur!==1?"s":""}
              </div>}
              {done&&<div style={{color:T.green,fontWeight:700,fontSize:13,marginTop:2}}>✅ Precio grupal activo</div>}
            </div>
          </div>
          <MiniBar value={p.cur} max={p.minB} color={done?T.green:hot?T.amber:T.blue} height={10}/>
          {/* Members avatars */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
            <div style={{display:"flex"}}>
              {Array.from({length:Math.min(p.cur,5)},(_,i)=>(
                <div key={i} style={{width:28,height:28,borderRadius:"50%",
                  background:`hsl(${200+i*40},65%,55%)`,marginLeft:i>0?-8:0,
                  border:"2px solid #FFF",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:11,color:"#FFF",fontWeight:700}}>
                  {["MG","CL","AR","PS","LM"][i]?.slice(0,1)||"?"}
                </div>
              ))}
              {p.cur>5&&<div style={{width:28,height:28,borderRadius:"50%",background:T.slateXL,
                marginLeft:-8,border:"2px solid #FFF",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:10,color:T.slate,fontWeight:700}}>+{p.cur-5}</div>}
            </div>
            <span style={{fontSize:11,color:T.slateL}}>y {p.cur} persona{p.cur!==1?"s":""} más ya se unieron</span>
          </div>
        </Card>

        {/* Tabs: Info / Reviews / Chat */}
        <div style={{display:"flex",background:"#FFF",borderRadius:14,padding:4,marginBottom:14,
          boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          {[{v:"info",l:"ℹ️ Info"},{v:"reviews",l:`⭐ Reseñas (${reviews.length})`},{v:"chat",l:`💬 Chat (${chatMsgs.length})`}].map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)}
              style={{flex:1,padding:"8px 0",border:"none",cursor:"pointer",fontWeight:700,fontSize:11,
                borderRadius:10,transition:"all .15s",
                background:tab===t.v?T.blue:"transparent",
                color:tab===t.v?"#FFF":T.slateL}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {tab==="info"&&(
          <div>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,color:T.dark,fontSize:13,marginBottom:8}}>Descripción</div>
              <div style={{fontSize:13,color:T.slate,lineHeight:1.7}}>{p.desc}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
                <Badge c={T.slate}>📦 Stock: {p.stock}</Badge>
                <Badge c={T.teal}>{p.cat}</Badge>
                <Badge c={T.purple}>↗ {p.shares} compartidos</Badge>
                <Badge c={T.amber}>👁 {p.views} visitas</Badge>
              </div>
            </Card>
            {/* Qty */}
            <Card style={{marginBottom:14,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontWeight:700,color:T.dark}}>Cantidad</div>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <button onClick={()=>setQty(q=>Math.max(1,q-1))}
                    style={{width:34,height:34,borderRadius:10,border:`2px solid ${T.slateXL}`,
                      background:"#FFF",cursor:"pointer",fontWeight:800,fontSize:20,color:T.slate}}>−</button>
                  <span style={{fontWeight:800,fontSize:20,minWidth:26,textAlign:"center"}}>{qty}</span>
                  <button onClick={()=>setQty(q=>Math.min(p.stock,q+1))}
                    style={{width:34,height:34,borderRadius:10,border:"none",
                      background:T.blue,cursor:"pointer",fontWeight:800,fontSize:20,color:"#FFF"}}>+</button>
                </div>
              </div>
              <Div/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:T.slate,fontSize:13}}>Total</span>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:T.green}}>
                  ${(p.pGroup*qty).toLocaleString("es-AR")}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Reviews tab */}
        {tab==="reviews"&&(
          <div>
            {/* Rating summary */}
            <Card style={{marginBottom:12,padding:16}}>
              <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:14}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:36,color:T.dark}}>{p.rating}</div>
                  <Stars rating={p.rating}/>
                  <div style={{fontSize:11,color:T.slateL,marginTop:4}}>{p.reviews} reseñas</div>
                </div>
                <div style={{flex:1}}>
                  {[5,4,3,2,1].map(s=>(
                    <div key={s} style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:11,color:T.slate,minWidth:10}}>{s}</span>
                      <MiniBar value={s===5?60:s===4?25:s===3?10:s===2?3:2} max={100} color={T.amber}/>
                    </div>
                  ))}
                </div>
              </div>
              <Badge c={T.green}>✅ {p.reviews} compras verificadas</Badge>
            </Card>
            {reviews.length===0?(
              <div style={{textAlign:"center",padding:"24px",color:T.slateL,fontSize:13}}>
                Sé el primero en dejar una reseña
              </div>
            ):reviews.map(r=>(
              <Card key={r.id} style={{marginBottom:10,padding:14}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:T.blue,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#FFF",fontWeight:700,fontSize:13}}>{r.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.dark}}>{r.user}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <Stars rating={r.rating} size={12}/>
                      <span style={{fontSize:11,color:T.slateL}}>· {r.date}</span>
                    </div>
                  </div>
                  {r.verified&&<Badge c={T.green} style={{fontSize:10}}>✓ Verificado</Badge>}
                </div>
                <div style={{fontSize:13,color:T.slate,lineHeight:1.6}}>{r.text}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Chat tab */}
        {tab==="chat"&&(
          <div>
            <div style={{background:T.slatePale,borderRadius:14,padding:14,marginBottom:12,
              maxHeight:260,overflowY:"auto"}}>
              {chatMsgs.length===0?(
                <div style={{textAlign:"center",padding:"20px",color:T.slateL,fontSize:13}}>
                  Sé el primero en escribir en el grupo
                </div>
              ):chatMsgs.map(m=>(
                <div key={m.id} style={{display:"flex",flexDirection:m.self?"row-reverse":"row",
                  gap:8,marginBottom:12,alignItems:"flex-end"}}>
                  {!m.self&&<div style={{width:28,height:28,borderRadius:"50%",background:T.blue,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#FFF",fontSize:10,fontWeight:700,flexShrink:0}}>{m.avatar}</div>}
                  <div style={{maxWidth:"72%"}}>
                    {!m.self&&<div style={{fontSize:10,color:T.slateL,marginBottom:2,marginLeft:2}}>{m.user}</div>}
                    <div style={{background:m.self?T.blue:T.white,color:m.self?"#FFF":T.dark,
                      padding:"8px 12px",borderRadius:m.self?"16px 4px 16px 16px":"4px 16px 16px 16px",
                      fontSize:13,boxShadow:"0 1px 6px rgba(0,0,0,.08)"}}>
                      {m.text}
                    </div>
                    <div style={{fontSize:10,color:T.slateL,marginTop:2,textAlign:m.self?"right":"left"}}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendChat()}
                placeholder="Escribí un mensaje al grupo..."
                style={{flex:1,padding:"11px 14px",border:`1.5px solid ${T.slateXL}`,
                  borderRadius:12,fontSize:13,outline:"none"}}/>
              <button onClick={sendChat} style={{width:44,height:44,borderRadius:12,border:"none",
                background:T.blue,cursor:"pointer",fontSize:18,color:"#FFF"}}>↑</button>
            </div>
          </div>
        )}

        {/* WhatsApp share */}
        <Btn v="wa" full size="md" style={{marginTop:14,marginBottom:10}}
          onClick={()=>toastFn("📲 Compartido en WhatsApp","success")}>
          💬 Compartir en WhatsApp — completá el grupo
        </Btn>

        {/* CTA */}
        {joined.includes(p.id)?(
          <Btn v="green" size="lg" full onClick={()=>setView("pay")}>
            💳 Ir a pagar — ${(p.pGroup*qty).toLocaleString("es-AR")}
          </Btn>
        ):(
          <Btn v="primary" size="lg" full onClick={()=>{onJoin(p.id);toastFn("✅ ¡Unido! Compartí para completar el grupo.","success");}}>
            👥 Unirme al grupo
          </Btn>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STORES VIEW
══════════════════════════════════════════════════════════════ */
function StoresView({products,onProduct,toastFn}) {
  const [selected,setSelected]=useState(null);
  if(selected) {
    const s=STORES_DATA.find(x=>x.id===selected);
    const sProds=products.filter(p=>p.storeId===selected);
    return(
      <div style={{paddingBottom:100}}>
        <div style={{background:`linear-gradient(135deg,${T.navy},${T.blue})`,
          padding:"16px 18px 32px",borderRadius:"0 0 28px 28px"}}>
          <button onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,.1)",border:"none",
            borderRadius:12,width:38,height:38,cursor:"pointer",fontSize:18,color:"#FFF",marginBottom:12}}>←</button>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{width:60,height:60,borderRadius:18,background:"rgba(255,255,255,.1)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{s.emoji}</div>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#FFF"}}>{s.name}</div>
              <div style={{color:"#93C5FD",fontSize:12}}>📍 {s.addr}, San Martín</div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <Badge c={T.greenV}>⭐ {s.rating}</Badge>
                <Badge c={T.amberLight}>{s.orders} pedidos</Badge>
              </div>
            </div>
          </div>
        </div>
        <div style={{padding:"18px 16px 0"}}>
          <Card style={{marginBottom:16,background:T.slatePale,boxShadow:"none",padding:14}}>
            <div style={{fontSize:13,color:T.slate,lineHeight:1.6}}>{s.desc}</div>
            <div style={{display:"flex",gap:10,marginTop:10}}>
              <Btn v="wa" size="sm" onClick={()=>toastFn("📲 Abriendo WhatsApp","success")}>💬 WhatsApp</Btn>
              <Btn v="outline" size="sm">📍 Ver mapa</Btn>
            </div>
          </Card>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:T.dark,marginBottom:12}}>
            Productos activos ({sProds.length})
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {sProds.map(p=>(
              <ProductCard key={p.id} p={p} joined={false} fav={false} onClick={()=>onProduct(p)}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{padding:"18px 16px 100px"}}>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:T.dark,marginBottom:4}}>
        Tiendas
      </div>
      <div style={{color:T.slateL,fontSize:14,marginBottom:18}}>Proveedores verificados en San Martín</div>
      {STORES_DATA.map(s=>{
        const sProds=products.filter(p=>p.storeId===s.id);
        return(
          <Card key={s.id} onClick={()=>setSelected(s.id)} style={{marginBottom:12,padding:16}}>
            <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12}}>
              <div style={{width:52,height:52,borderRadius:16,
                background:`linear-gradient(135deg,${T.navy},${T.blue})`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{s.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:T.dark,marginBottom:2}}>{s.name}</div>
                <div style={{fontSize:12,color:T.slateL}}>📍 {s.addr}</div>
                <div style={{display:"flex",gap:6,marginTop:4}}>
                  <Badge c={s.approved?T.green:T.amber}>{s.approved?"✅ Verificado":"⏳ Pendiente"}</Badge>
                  <Badge c={T.amber}>⭐ {s.rating}</Badge>
                </div>
              </div>
              <span style={{color:T.slateL,fontSize:18}}>›</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                {n:sProds.length,l:"Productos"},
                {n:s.orders,l:"Pedidos"},
                {n:`${s.members||0}`,l:"Miembros"},
              ].map((k,i)=>(
                <div key={i} style={{background:T.bg,borderRadius:10,padding:"8px",textAlign:"center"}}>
                  <div style={{fontWeight:800,fontSize:14,color:T.dark}}>{k.n}</div>
                  <div style={{fontSize:10,color:T.slateL}}>{k.l}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FAVORITES VIEW
══════════════════════════════════════════════════════════════ */
function FavoritesView({products,favs,joined,onProduct}) {
  const myFavs=products.filter(p=>favs.includes(p.id));
  return(
    <div style={{padding:"18px 16px 100px"}}>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:T.dark,marginBottom:4}}>
        Favoritos ❤️
      </div>
      <div style={{color:T.slateL,fontSize:14,marginBottom:18}}>
        Productos que guardaste ({myFavs.length})
      </div>
      {myFavs.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:T.slateL}}>
          <div style={{fontSize:52,marginBottom:12}}>🤍</div>
          <div style={{fontWeight:700,fontSize:16,color:T.slate,marginBottom:4}}>No tenés favoritos todavía</div>
          <div style={{fontSize:13}}>Tocá el ❤️ en cualquier producto para guardarlo acá</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {myFavs.map(p=>(
            <ProductCard key={p.id} p={p} joined={joined.includes(p.id)} fav={true} onClick={()=>onProduct(p)}/>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DEMAND VIEW
══════════════════════════════════════════════════════════════ */
function DemandView({toastFn}) {
  const [demand,setDemand]=useState(DEMAND_DATA);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({product:"",desc:"",cat:"Almacén"});
  const f=(k,v)=>setForm(x=>({...x,[k]:v}));
  const addVote=id=>setDemand(d=>d.map(x=>x.id===id?{...x,votes:x.votes+1}:x));
  return(
    <div style={{padding:"18px 16px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:T.dark}}>
          Panel de Demanda
        </div>
        <Btn v="primary" size="sm" onClick={()=>setShowForm(true)}>+ Pedir</Btn>
      </div>
      <div style={{color:T.slateL,fontSize:14,marginBottom:18}}>
        Pedí productos que querés comprar en grupo
      </div>
      <Card style={{background:"linear-gradient(135deg,#1651E0,#0891B2)",boxShadow:"none",marginBottom:18}}>
        <div style={{color:"rgba(255,255,255,.8)",fontSize:12,marginBottom:4}}>¿Cómo funciona?</div>
        <div style={{color:"#FFF",fontSize:13,lineHeight:1.6}}>
          Pedí un producto. Si llega a <strong>10 votos</strong>, contactamos a proveedores locales para que lo publiquen en JUNTO.
        </div>
      </Card>
      {demand.sort((a,b)=>b.votes-a.votes).map(d=>(
        <Card key={d.id} style={{marginBottom:10,padding:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{flex:1,paddingRight:12}}>
              <div style={{fontWeight:700,fontSize:14,color:T.dark,marginBottom:3}}>{d.product}</div>
              <div style={{fontSize:12,color:T.slateL,marginBottom:6}}>{d.desc}</div>
              <Badge c={T.teal}>{d.cat}</Badge>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,
                color:d.votes>=10?T.green:T.blue}}>{d.votes}</div>
              <div style={{fontSize:10,color:T.slateL}}>votos</div>
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <MiniBar value={d.votes} max={10} color={d.votes>=10?T.green:T.blue}/>
            <div style={{fontSize:10,color:T.slateL,marginTop:3}}>
              {d.votes>=10?"✅ Enviado a proveedores":`Faltan ${10-d.votes} votos para activar`}
            </div>
          </div>
          <Btn v="outline" size="sm" full onClick={()=>{addVote(d.id);toastFn("✅ Voto registrado","success");}}>
            👍 Votar — quiero este producto
          </Btn>
        </Card>
      ))}
      {showForm&&(
        <Sheet title="Pedir producto" onClose={()=>setShowForm(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14,paddingBottom:20}}>
            <Input label="¿Qué producto necesitás?" value={form.product} onChange={v=>f("product",v)} placeholder="Ej: Aceite de oliva 1L"/>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.slate,marginBottom:5}}>Categoría</div>
              <select value={form.cat} onChange={e=>f("cat",e.target.value)}
                style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${T.slateXL}`,borderRadius:12,
                  fontSize:14,background:T.white,color:T.dark,outline:"none"}}>
                {CATS.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Descripción (opcional)" value={form.desc} onChange={v=>f("desc",v)} placeholder="Marca, presentación, etc."/>
            <Btn v="green" full size="lg" onClick={()=>{
              if(!form.product.trim()){toastFn("Escribí el nombre del producto","error");return;}
              setDemand(d=>[...d,{id:Date.now(),product:form.product,votes:1,desc:form.desc,cat:form.cat}]);
              setShowForm(false);setForm({product:"",desc:"",cat:"Almacén"});
              toastFn("✅ Pedido enviado. ¡Avisale a tus vecinos para que voten!","success");
            }}>Enviar pedido</Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ORDERS VIEW (v2)
══════════════════════════════════════════════════════════════ */
function OrdersView({joined,products}) {
  const myProds=products.filter(p=>joined.includes(p.id));
  const savings=myProds.reduce((a,p)=>a+(p.pInd-p.pGroup),0);
  const [filter,setFilter]=useState("all");
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:T.navy,padding:"18px 18px 28px",borderRadius:"0 0 28px 28px"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:"#FFF",marginBottom:16}}>
          Mis pedidos
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[{n:`$${savings.toLocaleString("es-AR")}`,l:"Total ahorrado",c:T.greenV},
            {n:myProds.length,l:"Grupos activos",c:"#FFF"}].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.08)",borderRadius:14,padding:"14px 12px"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:s.c}}>{s.n}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:3}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"16px 16px 0"}}>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{v:"all",l:"Todos"},{v:"active",l:"Activos"},{v:"done",l:"Completos"}].map(f=>(
            <button key={f.v} onClick={()=>setFilter(f.v)}
              style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,
                background:filter===f.v?T.blue:T.white,color:filter===f.v?"#FFF":T.slate,
                boxShadow:"0 1px 6px rgba(0,0,0,.06)",transition:"all .15s"}}>
              {f.l}
            </button>
          ))}
        </div>
        {myProds.length===0?(
          <div style={{textAlign:"center",padding:"50px 20px",color:T.slateL}}>
            <div style={{fontSize:52,marginBottom:12}}>🛒</div>
            <div style={{fontWeight:700,fontSize:15,color:T.slate}}>Todavía no te uniste a ningún grupo</div>
          </div>
        ):myProds.filter(p=>filter==="all"||((filter==="done")===p.cur>=p.minB)).map(p=>{
          const done=p.cur>=p.minB;
          const {display}=useCountdown(p.secs);
          const grad=T.cats[p.cat]||[T.navy,T.blue];
          return(
            <Card key={p.id} style={{marginBottom:12,padding:16}}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{width:50,height:50,borderRadius:14,flexShrink:0,
                  background:`linear-gradient(135deg,${grad[0]},${grad[1]})`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{p.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:T.dark,marginBottom:2}}>{p.name}</div>
                  <div style={{fontSize:11,color:T.slateL,marginBottom:7}}>
                    {STORES_DATA.find(s=>s.id===p.storeId)?.name} · ⏱ {display}
                  </div>
                  <MiniBar value={p.cur} max={p.minB} color={done?T.green:T.blue} height={5}/>
                  <div style={{fontSize:10,color:T.slateL,marginTop:2}}>{p.cur}/{p.minB} compradores</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:800,color:T.green,fontSize:14}}>${p.pGroup.toLocaleString("es-AR")}</div>
                  <Badge c={done?T.green:T.blue} style={{marginTop:4}}>
                    {done?"✅ Listo":"⏳ Activo"}
                  </Badge>
                </div>
              </div>
              {done&&(
                <button style={{width:"100%",marginTop:12,padding:"10px",background:T.greenPale,
                  border:`1.5px solid ${T.green}`,borderRadius:12,color:T.green,fontWeight:700,
                  fontSize:13,cursor:"pointer"}}>
                  📱 Ver QR de retiro
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NOTIFICATIONS VIEW
══════════════════════════════════════════════════════════════ */
function NotificationsView({notifs,onMarkRead}) {
  return(
    <div style={{padding:"18px 16px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:T.dark}}>
          Notificaciones
        </div>
        <button onClick={onMarkRead} style={{background:"none",border:"none",color:T.blue,
          cursor:"pointer",fontWeight:600,fontSize:12}}>
          Marcar todo leído
        </button>
      </div>
      {notifs.map(n=>(
        <div key={n.id} style={{background:n.read?T.white:T.blueLight,borderRadius:16,padding:"14px 16px",
          marginBottom:10,boxShadow:"0 2px 12px rgba(0,0,0,.06)",
          borderLeft:`4px solid ${n.read?T.slateXL:T.blue}`}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:40,height:40,borderRadius:12,
              background:n.read?T.bg:T.navy,display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:18,flexShrink:0}}>{n.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,color:T.dark,marginBottom:2}}>{n.title}</div>
              <div style={{fontSize:12,color:T.slate,lineHeight:1.5,marginBottom:4}}>{n.body}</div>
              <div style={{fontSize:11,color:T.slateL}}>{n.time}</div>
            </div>
            {!n.read&&<div style={{width:8,height:8,borderRadius:"50%",background:T.blue,marginTop:4,flexShrink:0}}/>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROFILE VIEW (v2)
══════════════════════════════════════════════════════════════ */
function ProfileView({user,joined,products,onLogout,toastFn}) {
  const savings=products.filter(p=>joined.includes(p.id)).reduce((a,p)=>a+(p.pInd-p.pGroup),0);
  const initials=user.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const level=user.level||1;
  const pts=user.points||0;
  const pxp=((pts%500)/500*100).toFixed(0);
  const ref=`JUNTO-${user.name.replace(/\s/g,"").toUpperCase().slice(0,5)}-${Math.floor(1000+Math.random()*9000)}`;
  const earnedBadges=BADGES.slice(0,Math.min(level,BADGES.length));
  const [tab,setTab]=useState("perfil");

  return(
    <div style={{paddingBottom:100}}>
      {/* Hero */}
      <div style={{background:`linear-gradient(145deg,${T.navy},${T.blue})`,
        padding:"20px 18px 28px",borderRadius:"0 0 32px 32px"}}>
        <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:16}}>
          <div style={{width:64,height:64,borderRadius:"50%",
            background:`linear-gradient(135deg,${T.greenV},${T.teal})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,color:"#FFF",
            boxShadow:"0 0 0 4px rgba(34,197,94,.25)"}}>
            {initials}
          </div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18,color:"#FFF"}}>{user.name}</div>
            <div style={{color:"#93C5FD",fontSize:12}}>{user.email}</div>
            <div style={{display:"flex",gap:6,marginTop:5}}>
              <Badge c={T.greenV}>Nivel {level}</Badge>
              <Badge c={T.amberLight}>🏅 {BADGES[Math.min(level-1,4)].name}</Badge>
            </div>
          </div>
        </div>
        {/* XP */}
        <div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>Progreso nivel {level}</span>
            <span style={{fontSize:12,color:T.greenV,fontWeight:700}}>{pts} / {level*500} XP</span>
          </div>
          <div style={{height:6,borderRadius:6,background:"rgba(255,255,255,.15)",overflow:"hidden"}}>
            <div style={{width:`${pxp}%`,height:"100%",background:T.greenV,borderRadius:6}}/>
          </div>
        </div>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:14}}>
          {[{n:joined.length,l:"Grupos",c:T.greenV},{n:`$${savings.toLocaleString("es-AR")}`,l:"Ahorrado",c:"#FDE68A"},{n:`⭐ 4.8`,l:"Rating",c:"#FCD34D"}].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <div style={{color:s.c,fontWeight:800,fontSize:i===0?22:14,fontFamily:"'Syne',sans-serif"}}>{s.n}</div>
              <div style={{color:"rgba(255,255,255,.45)",fontSize:10,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"16px 16px 0"}}>
        {/* Tabs */}
        <div style={{display:"flex",background:T.white,borderRadius:14,padding:4,marginBottom:16,
          boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
          {[{v:"perfil",l:"Mi cuenta"},{v:"badges",l:"Logros"},{v:"refer",l:"Referidos"}].map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)}
              style={{flex:1,padding:"8px 0",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,
                borderRadius:10,transition:"all .15s",
                background:tab===t.v?T.blue:"transparent",
                color:tab===t.v?"#FFF":T.slateL}}>
              {t.l}
            </button>
          ))}
        </div>

        {tab==="perfil"&&(
          <div>
            <Card style={{marginBottom:12}}>
              {[{ic:"📦",t:"Historial de pedidos",sub:`${joined.length} compras`},
                {ic:"📍",t:"Dirección",sub:"San Martín, Mendoza"},
                {ic:"🔔",t:"Notificaciones",sub:"Activas"},
                {ic:"💬",t:"Soporte WhatsApp",sub:"Responde en <2hs"},
                {ic:"🔐",t:"Privacidad y seguridad"},
              ].map((m,i)=>(
                <div key={i}>
                  {i>0&&<Div/>}
                  <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"2px 0"}}>
                    <div style={{width:40,height:40,borderRadius:12,background:T.bg,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{m.ic}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,color:T.dark}}>{m.t}</div>
                      {m.sub&&<div style={{fontSize:11,color:T.slateL}}>{m.sub}</div>}
                    </div>
                    <span style={{color:T.slateL,fontSize:16}}>›</span>
                  </div>
                </div>
              ))}
            </Card>
            <Btn v="danger" full onClick={onLogout}>Cerrar sesión</Btn>
          </div>
        )}

        {tab==="badges"&&(
          <div>
            <div style={{fontWeight:700,color:T.dark,marginBottom:12}}>
              Logros desbloqueados ({earnedBadges.length}/{BADGES.length})
            </div>
            {BADGES.map((b,i)=>{
              const earned=i<earnedBadges.length;
              return(
                <div key={b.id} style={{background:earned?T.white:T.slatePale,borderRadius:16,padding:"14px 16px",
                  marginBottom:10,display:"flex",gap:14,alignItems:"center",
                  boxShadow:earned?"0 2px 12px rgba(0,0,0,.06)":"none",
                  opacity:earned?1:.6}}>
                  <div style={{width:48,height:48,borderRadius:16,
                    background:earned?`linear-gradient(135deg,${T.navy},${T.blue})`:"#E2E8F0",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>
                    {earned?b.icon:"🔒"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:earned?T.dark:T.slateL}}>{b.name}</div>
                    <div style={{fontSize:12,color:T.slateL}}>{b.desc}</div>
                  </div>
                  <Badge c={earned?T.amber:T.slateL}>+{b.xp} XP</Badge>
                </div>
              );
            })}
          </div>
        )}

        {tab==="refer"&&(
          <div>
            <Card style={{background:"linear-gradient(135deg,#166534,#22C55E)",boxShadow:"none",marginBottom:14}}>
              <div style={{color:"rgba(255,255,255,.7)",fontSize:11,fontWeight:700,marginBottom:6,letterSpacing:.4}}>
                TU CÓDIGO DE REFERIDO
              </div>
              <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,padding:"10px 14px",
                display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{color:"#FFF",fontFamily:"monospace",fontWeight:700,fontSize:14}}>{ref}</span>
                <button onClick={()=>toastFn("✅ Código copiado","success")}
                  style={{background:"#FFF",border:"none",borderRadius:8,padding:"5px 12px",
                    cursor:"pointer",fontWeight:700,fontSize:11,color:T.green}}>Copiar</button>
              </div>
              <div style={{color:"rgba(255,255,255,.9)",fontSize:12,lineHeight:1.5}}>
                Por cada amigo que use tu código, <strong>vos y él ganan $500</strong> de descuento.
              </div>
            </Card>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,color:T.dark,marginBottom:10}}>Tus referidos (0)</div>
              <div style={{textAlign:"center",padding:"16px 0",color:T.slateL}}>
                <div style={{fontSize:32,marginBottom:8}}>👥</div>
                <div style={{fontSize:13}}>Todavía no invitaste a nadie.<br/>¡Compartí y ganás $500!</div>
              </div>
            </Card>
            <Btn v="wa" full size="lg" onClick={()=>toastFn("📲 Enlace compartido","success")}>
              💬 Invitar por WhatsApp
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROVIDER PANEL (v2)
══════════════════════════════════════════════════════════════ */
function ProviderPanel({products,user,onLogout,toastFn}) {
  const [tab,setTab]=useState("dash");
  const myProds=products.filter(p=>p.storeId===1);
  const [form,setForm]=useState({name:"",cat:"Almacén",pInd:"",pGroup:"",minB:"",time:"24",stock:"",desc:""});
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [published,setPublished]=useState(null);
  const f=(k,v)=>setForm(x=>({...x,[k]:v}));
  const rev=myProds.reduce((a,p)=>a+p.pGroup*p.cur,0);
  const orders=myProds.reduce((a,p)=>a+p.cur,0);
  const escrow=myProds.filter(p=>p.cur>0&&p.cur<p.minB).reduce((a,p)=>a+p.pGroup*p.cur,0);
  const ready=myProds.filter(p=>p.cur>=p.minB).reduce((a,p)=>a+p.pGroup*p.cur,0);
  const chartData=[
    {m:"Nov",v:45000},{m:"Dic",v:88000},{m:"Ene",v:125000},{m:"Feb",v:198000},{m:"Mar",v:340000}
  ];
  const maxV=Math.max(...chartData.map(d=>d.v));

  return(
    <div style={{paddingBottom:24}}>
      <FONTS/>
      <div style={{background:"linear-gradient(135deg,#0B1D3A,#1651E0)",
        padding:"18px 18px 22px",borderRadius:"0 0 28px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Logo scale={0.65} white/>
          <Btn v="ghost" size="sm" style={{color:"#93C5FD"}} onClick={onLogout}>Salir</Btn>
        </div>
        <div style={{color:"#FFF",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18,marginBottom:2}}>
          Panel Proveedor
        </div>
        <div style={{color:"#93C5FD",fontSize:12}}>🏪 Almacén Don Roberto · San Martín</div>
        <div style={{display:"flex",gap:6,marginTop:14,overflowX:"auto"}}>
          {[{v:"dash",l:"📊 Dashboard"},{v:"products",l:"📦 Productos"},{v:"publish",l:"+ Publicar"},
            {v:"orders",l:"🧾 Pedidos"},{v:"analytics",l:"📈 Analytics"}].map(t=>(
            <button key={t.v} onClick={()=>{setTab(t.v);setPublished(null);}}
              style={{padding:"7px 14px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,
                fontSize:11,whiteSpace:"nowrap",flexShrink:0,transition:"all .15s",
                background:tab===t.v?"rgba(255,255,255,.2)":"rgba(255,255,255,.07)",color:"#FFF"}}>
              {t.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"16px 16px 0"}}>
        {tab==="dash"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{n:`$${rev.toLocaleString("es-AR")}`,l:"Facturación",c:T.green,ic:"💰"},
                {n:orders,l:"Pedidos",c:T.blue,ic:"📦"},
                {n:`$${escrow.toLocaleString("es-AR")}`,l:"En custodia",c:T.amber,ic:"🔐"},
                {n:`$${ready.toLocaleString("es-AR")}`,l:"Para cobrar",c:T.green,ic:"✅"}].map((k,i)=>(
                <Card key={i} style={{padding:14}}>
                  <div style={{fontSize:20,marginBottom:8}}>{k.ic}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:k.c}}>{k.n}</div>
                  <div style={{fontSize:11,color:T.slateL,marginTop:2}}>{k.l}</div>
                </Card>
              ))}
            </div>
            <Card style={{background:T.greenPale,boxShadow:"none",marginBottom:14}}>
              <div style={{fontWeight:700,color:T.green,fontSize:13,marginBottom:4}}>🎉 Año 1 — Comisión 0%</div>
              <div style={{fontSize:12,color:"#166534",lineHeight:1.6}}>
                Vendés por JUNTO sin pagar comisión. El 100% va a tu CBU en 48hs. A partir del Año 2 se aplica 5%.
              </div>
            </Card>
            {myProds.filter(p=>p.cur>0).map(p=>(
              <Card key={p.id} style={{marginBottom:10,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{fontSize:28}}>{p.emoji}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:T.dark}}>{p.name}</div>
                      <div style={{fontSize:11,color:T.slateL}}>{p.cur} pedidos · {p.cur>=p.minB?"Completo":"En progreso"}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:800,color:T.green,fontSize:14}}>${(p.pGroup*p.cur).toLocaleString("es-AR")}</div>
                    <Badge c={p.cur>=p.minB?T.green:T.amber} style={{marginTop:3}}>
                      {p.cur>=p.minB?"✅ Listo":"⏳ Espera"}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab==="analytics"&&(
          <div>
            <div style={{fontWeight:700,color:T.dark,fontSize:16,marginBottom:16}}>Evolución de ventas</div>
            <Card style={{marginBottom:14}}>
              {/* Mini bar chart */}
              <div style={{display:"flex",gap:8,alignItems:"flex-end",height:100,marginBottom:10}}>
                {chartData.map((d,i)=>(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{fontSize:9,color:T.slateL,fontWeight:600}}>
                      ${Math.round(d.v/1000)}k
                    </div>
                    <div style={{width:"100%",borderRadius:"4px 4px 0 0",
                      background:`linear-gradient(180deg,${T.blue},${T.teal})`,
                      height:`${(d.v/maxV)*80}px`,minHeight:4,transition:"height .5s"}}/>
                    <div style={{fontSize:9,color:T.slateL}}>{d.m}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:12,color:T.slate,textAlign:"center"}}>
                Crecimiento: <strong style={{color:T.green}}>+172%</strong> en 5 meses
              </div>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{ic:"👁",l:"Visitas totales",n:"1.240"},{ic:"↗️",l:"Compartidos",n:"89"},
                {ic:"⭐",l:"Rating promedio",n:"4.8"},{ic:"🔄",l:"Tasa de retorno",n:"67%"}].map((k,i)=>(
                <Card key={i} style={{padding:14}}>
                  <div style={{fontSize:22,marginBottom:6}}>{k.ic}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:T.dark}}>{k.n}</div>
                  <div style={{fontSize:11,color:T.slateL,marginTop:2}}>{k.l}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {tab==="products"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontWeight:700,color:T.dark,fontSize:15}}>Mis productos ({myProds.length})</div>
              <Btn v="primary" size="sm" onClick={()=>setTab("publish")}>+ Nuevo</Btn>
            </div>
            {myProds.map(p=>(
              <Card key={p.id} style={{marginBottom:10,padding:14}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{fontSize:32}}>{p.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.dark,marginBottom:4}}>{p.name}</div>
                    <MiniBar value={p.cur} max={p.minB} color={p.cur>=p.minB?T.green:T.blue}/>
                    <div style={{fontSize:11,color:T.slateL,marginTop:2}}>
                      {p.cur}/{p.minB} · Stock: {p.stock} · ${p.pGroup.toLocaleString("es-AR")}
                    </div>
                  </div>
                  <Btn v="ghost" size="xs" style={{color:T.slate}}>Editar</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab==="publish"&&!published&&(
          <div>
            <div style={{fontWeight:700,color:T.dark,fontSize:17,marginBottom:4}}>Publicar producto</div>
            <div style={{display:"flex",gap:0,marginBottom:20}}>
              {[1,2].map(s=>(
                <div key={s} style={{flex:1,height:4,borderRadius:4,marginRight:s<2?6:0,
                  background:step>=s?T.blue:T.slateXL,transition:"background .3s"}}/>
              ))}
            </div>
            {step===1&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Input label="Nombre del producto" value={form.name} onChange={v=>f("name",v)} placeholder="Ej: Aceite Cocinero 1.5L"/>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:T.slate,marginBottom:5}}>Categoría</div>
                  <select value={form.cat} onChange={e=>f("cat",e.target.value)}
                    style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${T.slateXL}`,
                      borderRadius:12,fontSize:14,background:T.white,color:T.dark,outline:"none"}}>
                    {CATS.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <Input label="Precio individual" value={form.pInd} onChange={v=>f("pInd",v)} type="number" prefix="$" placeholder="15000"/>
                  <Input label="Precio grupal" value={form.pGroup} onChange={v=>f("pGroup",v)} type="number" prefix="$" placeholder="10500"/>
                </div>
                {form.pInd&&form.pGroup&&Number(form.pGroup)<Number(form.pInd)&&(
                  <div style={{background:T.greenPale,borderRadius:10,padding:"10px 14px",
                    display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:T.green,fontWeight:600}}>Descuento:</span>
                    <span style={{fontSize:12,color:T.green,fontWeight:800}}>
                      {Math.round((1-Number(form.pGroup)/Number(form.pInd))*100)}% OFF
                    </span>
                  </div>
                )}
                <Btn v="primary" full onClick={()=>{if(!form.name||!form.pInd||!form.pGroup){toastFn("Completá todos los campos","error");return;}setStep(2);}}>
                  Siguiente →
                </Btn>
              </div>
            )}
            {step===2&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <Input label="Compradores mínimos" value={form.minB} onChange={v=>f("minB",v)} type="number" placeholder="20"/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.slate,marginBottom:5}}>Tiempo límite</div>
                    <select value={form.time} onChange={e=>f("time",e.target.value)}
                      style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${T.slateXL}`,borderRadius:12,fontSize:13,background:T.white,color:T.dark,outline:"none"}}>
                      {[{v:"6",l:"6 horas"},{v:"12",l:"12 horas"},{v:"24",l:"24 horas"},{v:"48",l:"48 horas"}].map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                </div>
                <Input label="Stock disponible" value={form.stock} onChange={v=>f("stock",v)} type="number" placeholder="100" hint="Unidades que podés vender"/>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:T.slate,marginBottom:5}}>Descripción</div>
                  <textarea value={form.desc} onChange={e=>f("desc",e.target.value)} rows={3}
                    placeholder="Descripción del producto, marca, presentación..."
                    style={{width:"100%",padding:"12px 14px",border:`1.5px solid ${T.slateXL}`,
                      borderRadius:12,fontSize:13,resize:"none",outline:"none",fontFamily:"inherit"}}/>
                </div>
                <div style={{background:T.amberPale,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontWeight:700,color:T.amber,fontSize:12,marginBottom:3}}>💡 Custodia JUNTO</div>
                  <div style={{color:"#78350F",fontSize:12,lineHeight:1.5}}>
                    JUNTO custodia los pagos. Cuando el grupo se completa y los compradores retiran, recibís el 100% en tu CBU en 48hs.
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <Btn v="ghost" onClick={()=>setStep(1)} style={{flex:1}}>← Atrás</Btn>
                  <Btn v="green" loading={loading} style={{flex:2}} onClick={()=>{
                    if(!form.minB||!form.stock){toastFn("Completá todos los campos","error");return;}
                    setLoading(true);setTimeout(()=>{setLoading(false);setPublished(form.name);},900);
                  }}>✅ Publicar</Btn>
                </div>
              </div>
            )}
          </div>
        )}
        {tab==="publish"&&published&&(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div className="bounce" style={{fontSize:60,marginBottom:16}}>🎉</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:T.dark,marginBottom:8}}>
              ¡Publicado!
            </div>
            <div style={{color:T.slate,fontSize:13,lineHeight:1.6,marginBottom:24}}>
              <strong>{published}</strong> ya está activo en JUNTO.<br/>Compartilo para acelerar el grupo.
            </div>
            <Btn v="wa" full size="lg" style={{marginBottom:10}} onClick={()=>toastFn("📲 Link compartido","success")}>
              💬 Compartir en WhatsApp
            </Btn>
            <Btn v="outline" full onClick={()=>{setTab("products");setPublished(null);}}>Ver mis productos</Btn>
          </div>
        )}
        {tab==="orders"&&(
          <div>
            {myProds.filter(p=>p.cur>0).map((p,i)=>(
              <Card key={i} style={{marginBottom:10,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:700,fontSize:13,color:T.dark}}>{p.emoji} {p.name}</div>
                  <Badge c={p.cur>=p.minB?T.green:T.amber}>{p.cur>=p.minB?"✅ Listo":"⏳ Espera"}</Badge>
                </div>
                <div style={{fontSize:12,color:T.slateL,marginBottom:8}}>{p.cur}/{p.minB} compradores</div>
                <MiniBar value={p.cur} max={p.minB} color={p.cur>=p.minB?T.green:T.blue}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
                  <span style={{fontSize:12,color:T.slate}}>En custodia</span>
                  <span style={{fontWeight:800,color:T.green}}>${(p.pGroup*p.cur).toLocaleString("es-AR")}</span>
                </div>
                {p.cur>=p.minB&&<Btn v="green" full size="sm" style={{marginTop:10}}>📱 Escanear QR del cliente</Btn>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ADMIN PANEL (same as before, abbreviated for space)
══════════════════════════════════════════════════════════════ */
function AdminPanel({products,onLogout,toastFn}) {
  const [tab,setTab]=useState("stats");
  const [comm,setComm]=useState(5);
  const totalRev=products.reduce((a,p)=>a+p.pGroup*p.cur,0);
  const totalOrders=products.reduce((a,p)=>a+p.cur,0);
  const activeG=products.filter(p=>p.cur<p.minB).length;
  const fullG=products.filter(p=>p.cur>=p.minB).length;

  return(
    <div style={{paddingBottom:24}}>
      <FONTS/>
      <div style={{background:"linear-gradient(135deg,#0B1D3A,#0F172A)",padding:"18px 18px 22px",borderRadius:"0 0 28px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Logo scale={0.65} white/>
          <Btn v="ghost" size="sm" style={{color:"#93C5FD"}} onClick={onLogout}>Salir</Btn>
        </div>
        <div style={{color:"#FFF",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18}}>Panel Admin</div>
        <div style={{display:"flex",gap:6,marginTop:14,overflowX:"auto"}}>
          {[{v:"stats",l:"📊"},{v:"providers",l:"🏪"},{v:"orders",l:"📦"},{v:"config",l:"⚙️"}].map(t=>(
            <button key={t.v} onClick={()=>setTab(t.v)}
              style={{padding:"7px 16px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,
                fontSize:13,background:tab===t.v?"rgba(255,255,255,.2)":"rgba(255,255,255,.07)",
                color:"#FFF",transition:"all .15s"}}>
              {t.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"16px 16px 0"}}>
        {tab==="stats"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{n:`$${totalRev.toLocaleString("es-AR")}`,l:"Facturación",c:T.green,ic:"💰"},
                {n:totalOrders,l:"Pedidos",c:T.blue,ic:"📦"},
                {n:activeG,l:"Grupos activos",c:T.amber,ic:"⏳"},
                {n:fullG,l:"Grupos completos",c:T.green,ic:"✅"},
                {n:STORES_DATA.length,l:"Proveedores",c:T.teal,ic:"🏪"},
                {n:"5.347",l:"Usuarios",c:T.purple,ic:"👥"}].map((k,i)=>(
                <Card key={i} style={{padding:14}}>
                  <div style={{fontSize:20,marginBottom:6}}>{k.ic}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:k.c}}>{k.n}</div>
                  <div style={{fontSize:11,color:T.slateL,marginTop:2}}>{k.l}</div>
                </Card>
              ))}
            </div>
            <Card style={{background:T.navy}}>
              <div style={{color:"#93C5FD",fontSize:11,fontWeight:700,marginBottom:12}}>ROADMAP MONETIZACIÓN</div>
              {[{p:"Año 1",s:"🟢 Activo",d:"Comisión 0%",c:T.greenV},
                {p:"Mes 12+",s:"⚡ Próximo",d:`Activar ${comm}%`,c:T.amber},
                {p:"Año 2",s:"🔵 Futuro",d:"Ads + Analytics premium",c:T.blue},
                {p:"Año 3",s:"🌎 Expansión",d:"Nacional",c:T.purple}].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:12,padding:"9px 0",
                  borderBottom:i<3?"1px solid rgba(255,255,255,.07)":"none"}}>
                  <div style={{minWidth:60,fontSize:12,fontWeight:700,color:r.c}}>{r.p}</div>
                  <div style={{flex:1}}>
                    <div style={{color:"#FFF",fontSize:12}}>{r.d}</div>
                    <div style={{color:r.c,fontSize:10,marginTop:1}}>{r.s}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
        {tab==="providers"&&(
          <div>
            {STORES_DATA.map(s=>(
              <Card key={s.id} style={{marginBottom:10,padding:14}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{fontSize:28}}>{s.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.dark}}>{s.name}</div>
                    <div style={{fontSize:11,color:T.slateL}}>{s.addr}</div>
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      <Badge c={s.approved?T.green:T.amber}>{s.approved?"✅":"⏳"}</Badge>
                      <Badge c={T.amber}>⭐ {s.rating}</Badge>
                    </div>
                  </div>
                  {!s.approved&&<Btn v="green" size="sm" onClick={()=>toastFn("✅ Proveedor aprobado","success")}>Aprobar</Btn>}
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab==="orders"&&(
          <div>
            {products.map(p=>(
              <Card key={p.id} style={{marginBottom:10,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{fontWeight:700,fontSize:12,color:T.dark}}>{p.emoji} {p.name}</div>
                  <Badge c={p.cur>=p.minB?T.green:T.blue}>{p.cur>=p.minB?"✅":"⏳"}</Badge>
                </div>
                <MiniBar value={p.cur} max={p.minB} color={p.cur>=p.minB?T.green:T.blue}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                  <span style={{fontSize:11,color:T.slateL}}>Custodia: ${(p.pGroup*p.cur).toLocaleString("es-AR")}</span>
                  <span style={{fontSize:11,color:T.green}}>Comisión: ${Math.round(p.pGroup*p.cur*comm/100).toLocaleString("es-AR")}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
        {tab==="config"&&(
          <Card>
            <div style={{fontWeight:700,color:T.dark,marginBottom:14}}>⚙️ Comisión Año 2+</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:14,color:T.slate}}>Porcentaje</span>
              <span style={{fontWeight:800,color:T.blue,fontSize:18}}>{comm}%</span>
            </div>
            <input type="range" min={1} max={10} value={comm} onChange={e=>setComm(Number(e.target.value))}
              style={{width:"100%",accentColor:T.blue}}/>
            <div style={{background:T.blueLight,borderRadius:10,padding:"10px 14px",marginTop:14}}>
              <div style={{fontSize:12,color:T.blue}}>
                Con {comm}% → <strong>${Math.round(totalRev*comm/100).toLocaleString("es-AR")}/mes</strong>
              </div>
            </div>
            <Btn v="primary" full style={{marginTop:14}} onClick={()=>toastFn(`✅ ${comm}% guardado`,"success")}>
              Guardar
            </Btn>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════════ */
export default function App() {
  const [screen,setScreen]=useState("onboarding"); // onboarding | login | app
  const [user,setUser]=useState(null);
  const [products,setProducts]=useState(PRODUCTS_DATA);
  const [navView,setNavView]=useState("home"); // home|stores|demand|orders|profile|favs|notifs
  const [selected,setSelected]=useState(null);
  const [joined,setJoined]=useState([]);
  const [favs,setFavs]=useState([1,6]);
  const [notifs,setNotifs]=useState(NOTIFICATIONS_DATA);
  const [toast,setToast]=useState(null);

  const unreadNotifs=notifs.filter(n=>!n.read).length;

  const showToast=useCallback((msg,type="success")=>{
    setToast({msg,type,key:Date.now()});
  },[]);

  const handleJoin=useCallback((id)=>{
    if(joined.includes(id)) return;
    setJoined(j=>[...j,id]);
    setProducts(pp=>pp.map(p=>p.id===id?{...p,cur:p.cur+1}:p));
  },[joined]);

  const handleFav=useCallback((id)=>{
    setFavs(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);
  },[]);

  const handleAddPoints=useCallback((pts)=>{
    setUser(u=>u?{...u,points:(u.points||0)+pts}:u);
  },[]);

  // FOMO trigger
  useEffect(()=>{
    if(!user||user.role!=="client") return;
    const t=setTimeout(()=>{
      const almostFull=products.find(p=>p.cur/p.minB>=.75&&p.cur<p.minB&&!joined.includes(p.id));
      if(almostFull) showToast(`⚡ ¡Faltan solo ${almostFull.minB-almostFull.cur} para ${almostFull.name}!`,"amber");
    },8000);
    return()=>clearTimeout(t);
  },[user,navView]);

  if(screen==="onboarding") return <><FONTS/><Onboarding onDone={()=>setScreen("login")}/></>;
  if(!user) return <><FONTS/><LoginView onLogin={u=>{setUser(u);setScreen("app");}}/></>;

  // Special panels
  if(user.role==="provider") return(
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:T.bg}}>
      <FONTS/>
      {toast&&<Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <ProviderPanel products={products} user={user} onLogout={()=>setUser(null)} toastFn={showToast}/>
    </div>
  );
  if(user.role==="admin") return(
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:T.bg}}>
      <FONTS/>
      {toast&&<Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <AdminPanel products={products} onLogout={()=>setUser(null)} toastFn={showToast}/>
    </div>
  );

  const currentProduct=selected?products.find(p=>p.id===selected):null;
  const NAV=[
    {v:"home",ic:"🔥",l:"Grupos"},
    {v:"stores",ic:"🏪",l:"Tiendas"},
    {v:"demand",ic:"📋",l:"Pedidos"},
    {v:"orders",ic:"📦",l:"Mis compras"},
    {v:"profile",ic:"👤",l:"Perfil"},
  ];

  return(
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:T.bg,position:"relative"}}>
      <FONTS/>
      {toast&&<Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      <div key={`${navView}-${selected}`} className="fu" style={{animationDuration:".25s"}}>
        {navView==="home"&&!selected&&(
          <HomeView products={products} user={user} joined={joined} favs={favs}
            onProduct={p=>{setSelected(p.id);}} onJoin={handleJoin} onFav={handleFav} toastFn={showToast}/>
        )}
        {navView==="home"&&selected&&currentProduct&&(
          <ProductDetail p={currentProduct} user={user} joined={joined} fav={favs.includes(selected)}
            onJoin={handleJoin} onFav={handleFav} onBack={()=>setSelected(null)}
            toastFn={showToast} onAddPoints={handleAddPoints}/>
        )}
        {navView==="stores"&&!selected&&(
          <StoresView products={products} onProduct={p=>{setSelected(p.id);setNavView("stores");}} toastFn={showToast}/>
        )}
        {navView==="stores"&&selected&&currentProduct&&(
          <ProductDetail p={currentProduct} user={user} joined={joined} fav={favs.includes(selected)}
            onJoin={handleJoin} onFav={handleFav} onBack={()=>setSelected(null)}
            toastFn={showToast} onAddPoints={handleAddPoints}/>
        )}
        {navView==="demand"&&<DemandView toastFn={showToast}/>}
        {navView==="orders"&&<OrdersView joined={joined} products={products}/>}
        {navView==="favs"&&(
          <FavoritesView products={products} favs={favs} joined={joined}
            onProduct={p=>{setSelected(p.id);setNavView("home");}}/>
        )}
        {navView==="notifs"&&(
          <NotificationsView notifs={notifs}
            onMarkRead={()=>setNotifs(n=>n.map(x=>({...x,read:true})))}/>
        )}
        {navView==="profile"&&(
          <ProfileView user={user} joined={joined} products={products}
            onLogout={()=>setUser(null)} toastFn={showToast}/>
        )}
      </div>

      {/* Bottom Nav */}
      {!selected&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:480,background:"rgba(255,255,255,.97)",
          backdropFilter:"blur(16px)",borderTop:"1px solid rgba(0,0,0,.06)",
          padding:"7px 0 14px",display:"flex",zIndex:100,
          boxShadow:"0 -6px 24px rgba(0,0,0,.07)"}}>
          {NAV.map(n=>{
            const active=navView===n.v;
            return(
              <button key={n.v} onClick={()=>{setNavView(n.v);setSelected(null);}}
                style={{flex:1,background:"none",border:"none",cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 0",
                  position:"relative"}}>
                <div style={{width:40,height:28,display:"flex",alignItems:"center",justifyContent:"center",
                  borderRadius:10,background:active?T.blueLight:"transparent",transition:"background .2s"}}>
                  <span style={{fontSize:18}}>{n.ic}</span>
                </div>
                <span style={{fontSize:9,fontWeight:700,color:active?T.blue:T.slateL,transition:"color .2s"}}>
                  {n.l}
                </span>
                {active&&<div style={{position:"absolute",bottom:-1,width:20,height:3,
                  background:T.blue,borderRadius:4}}/>}
              </button>
            );
          })}
          {/* Floating action buttons */}
          <button onClick={()=>setNavView("favs")}
            style={{position:"absolute",right:60,top:-20,width:38,height:38,
              borderRadius:"50%",background:T.white,boxShadow:"0 4px 16px rgba(0,0,0,.15)",
              border:`2px solid ${T.slateXL}`,cursor:"pointer",fontSize:18,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            ❤️
          </button>
          <button onClick={()=>setNavView("notifs")}
            style={{position:"absolute",right:12,top:-20,width:38,height:38,
              borderRadius:"50%",background:unreadNotifs>0?T.blue:T.white,
              boxShadow:"0 4px 16px rgba(0,0,0,.15)",
              border:`2px solid ${unreadNotifs>0?T.blue:T.slateXL}`,cursor:"pointer",fontSize:18,
              display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            🔔
            {unreadNotifs>0&&(
              <div style={{position:"absolute",top:-4,right:-4,width:18,height:18,
                borderRadius:"50%",background:T.red,border:"2px solid #FFF",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:9,fontWeight:800,color:"#FFF"}}>{unreadNotifs}</div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
