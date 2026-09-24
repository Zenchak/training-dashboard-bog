const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Link alla pagina Gare in fondo alla dashboard Allenamenti.
const raceButtonCss = `
.bottom-nav{display:flex;justify-content:center;margin:24px 0 2px}
.race-link{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:#06111d;background:linear-gradient(135deg,var(--accent),#8fb7ff);border-radius:12px;padding:11px 16px;font-size:12px;font-weight:850;box-shadow:0 6px 18px rgba(103,232,249,.18);transition:.15s}
.race-link:hover{transform:translateY(-1px);filter:brightness(1.05)}
@media(max-width:720px){.race-link{width:100%;min-height:46px}}
`;
html = html.replace('</style>', raceButtonCss + '\n</style>');
html = html.replace(
  '<footer id="footerNote"></footer>\n</div>',
  '<footer id="footerNote"></footer>\n<div class="bottom-nav"><a class="race-link" href="/gare/" onclick="if(location.port===\'8441\'){this.href=\'https://\'+location.hostname+\':8442/\'}">🏁 Gare</a></div>\n</div>'
);

// Un unico grafico per ore, kcal e peso, sulla stessa timeline mensile.
const trendChartCss = `
.trend-chart{grid-column:1/-1;min-height:365px}
.trend-chart canvas{height:265px}
.trend-legend{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.trend-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:999px;background:#0a1b2c;border:1px solid rgba(129,183,226,.17);font-size:10px;font-weight:800;color:#dbe8f3}
.trend-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.trend-dot.hours{background:#c99cff}.trend-dot.kcal{background:#ffb454}.trend-dot.weight{background:#ff9f43}
@media(max-width:720px){.trend-chart{min-height:330px}.trend-chart canvas{height:245px}}
`;
html = html.replace('</style>', trendChartCss + '\n</style>');

const oldTrendCards = `    <div class="card chart"><h3>⏱️ Ore di allenamento</h3><p>Tempo attivo registrato mese per mese.</p><canvas id="hours"></canvas></div>
    <div class="card chart"><h3>🔥 Kcal attività</h3><p id="kcalInfo">Consumo energetico mese per mese.</p><canvas id="kcal"></canvas></div>
    <div class="card chart"><h3>⚖️ Peso</h3><p>Andamento delle misurazioni disponibili.</p><canvas id="weight"></canvas></div>`;
const newTrendCard = `    <div class="card chart trend-chart"><h3>⏱️🔥⚖️ Ore · Kcal · Peso</h3><p id="kcalInfo">Tre andamenti sulla stessa timeline; ogni serie usa la propria scala verticale per rendere confrontabili i trend.</p><div class="trend-legend"><span class="trend-chip" id="trendHoursSummary"><i class="trend-dot hours"></i>Ore</span><span class="trend-chip" id="trendKcalSummary"><i class="trend-dot kcal"></i>Kcal</span><span class="trend-chip" id="trendWeightSummary"><i class="trend-dot weight"></i>Peso</span></div><canvas id="trainingTrend"></canvas></div>`;
html = html.replace(oldTrendCards, newTrendCard);

const trendChartJs = `
function drawTrainingTrend(hoursData,kcalData,weightData){
  const e=document.getElementById("trainingTrend");if(!e)return;
  const [c,w,h]=prep("trainingTrend"),l=40,r=18,t=20,b=30,pw=Math.max(1,w-l-r),ph=Math.max(1,h-t-b);
  c.clearRect(0,0,w,h);
  const lastActivityMonth=AY.length?Math.max(...AY.map(a=>a.month)):0;
  const lastWeightMonth=weightData.length?Math.max(...weightData.map(x=>new Date(x.date+"T12:00:00").getMonth()+1)):0;
  const lastMonth=Math.max(1,lastActivityMonth,lastWeightMonth);

  c.strokeStyle="rgba(145,169,191,.16)";c.lineWidth=1;
  for(let j=0;j<=4;j++){const y=t+ph*j/4;c.beginPath();c.moveTo(l,y);c.lineTo(w-r,y);c.stroke()}
  c.font="9px system-ui";c.fillStyle="#91a9bf";c.textAlign="center";
  ML.forEach((m,i)=>{const x=l+pw*i/11;c.fillText(m,x,h-7)});c.textAlign="left";

  function scale(values,zero=false){
    if(!values.length)return()=>.5;
    let mn=zero?0:Math.min(...values),mx=Math.max(...values);
    if(mx===mn){mx=mn+1}
    if(!zero){const pad=(mx-mn)*.12;mn-=pad;mx+=pad}
    return v=>(v-mn)/(mx-mn);
  }
  function drawMonthly(data,color){
    const rows=data.slice(0,lastMonth),sy=scale(rows.map(x=>x.v),true);if(!rows.length)return;
    c.beginPath();rows.forEach((p,i)=>{const x=l+pw*i/11,y=t+(1-sy(p.v))*ph;i?c.lineTo(x,y):c.moveTo(x,y)});c.strokeStyle=color;c.lineWidth=2.6;c.stroke();
    rows.forEach((p,i)=>{const x=l+pw*i/11,y=t+(1-sy(p.v))*ph;c.beginPath();c.arc(x,y,2.8,0,Math.PI*2);c.fillStyle=color;c.fill()});
  }
  function drawWeight(data,color){
    if(!data.length)return;const sy=scale(data.map(x=>x.v),false);
    const pts=data.map(p=>{const d=new Date(p.date+"T12:00:00"),mi=d.getMonth(),days=new Date(d.getFullYear(),mi+1,0).getDate(),xf=mi+(d.getDate()-1)/Math.max(1,days-1);return{x:l+pw*xf/11,y:t+(1-sy(p.v))*ph}});
    c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=2.6;c.stroke();
    pts.forEach(p=>{c.beginPath();c.arc(p.x,p.y,3.1,0,Math.PI*2);c.fillStyle=color;c.fill()});
  }

  drawMonthly(hoursData,"#c99cff");drawMonthly(kcalData,"#ffb454");drawWeight(weightData,"#ff9f43");

  const hTotal=hoursData.slice(0,lastMonth).reduce((s,x)=>s+x.v,0),kTotal=kcalData.slice(0,lastMonth).reduce((s,x)=>s+x.v,0),latest=weightData.length?weightData[weightData.length-1]:null;
  const eh=document.getElementById("trendHoursSummary"),ek=document.getElementById("trendKcalSummary"),ew=document.getElementById("trendWeightSummary");
  if(eh)eh.innerHTML='<i class="trend-dot hours"></i>'+n(hTotal,1)+' h';
  if(ek)ek.innerHTML='<i class="trend-dot kcal"></i>'+Math.round(kTotal).toLocaleString("it-IT")+' kcal';
  if(ew)ew.innerHTML='<i class="trend-dot weight"></i>'+(latest?n(latest.v,1)+' kg':'Peso n/d');
}
`;
html = html.replace('function drawCharts(){', trendChartJs + '\nfunction drawCharts(){');
html = html.replace('  drawLine("hours",hd,COLORS.hike);\n', '');
html = html.replace('  drawLine("kcal",kd,"#ffb454",{label:v=>Math.round(v).toLocaleString("it-IT")});\n', '');
html = html.replace(
  '  const wd=WY.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({label:shortDate(x.date),v:x.kg}));\n  drawLine("weight",wd,COLORS.run,{zero:false,label:v=>n(v,1)});',
  '  const wd=WY.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({label:shortDate(x.date),date:x.date,v:x.kg}));\n  drawTrainingTrend(hd,kd,wd);'
);

// After this shell is deployed once, training data are read directly from GitHub.
// Updating data.js will therefore not require another Netlify production deploy.
const liveLoader = `
async function loadLiveTrainingData(){
  try{
    const url='https://raw.githubusercontent.com/Zenchak/training-dashboard-bog/main/data.js?v='+Date.now();
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok) throw new Error('GitHub data HTTP '+response.status);
    const source=await response.text();
    const live=(new Function(source+'\\nreturn {A,W};'))();
    if(live && Array.isArray(live.A)) A.splice(0,A.length,...live.A);
    if(live && Array.isArray(live.W)) W.splice(0,W.length,...live.W);
  }catch(err){
    console.warn('Dati live GitHub non disponibili: uso la copia locale del deploy.',err);
  }
}
await loadLiveTrainingData();
`;

const scriptStart = '<script src="data.js"></script>\n<script>\nconst COLORS=';
if (html.includes(scriptStart)) {
  html = html.replace(
    scriptStart,
    '<script src="data.js"></script>\n<script>\n(async()=>{\n' + liveLoader + '\nconst COLORS='
  );
}

const scriptEnd = 'renderAll();\n</script>';
if (html.includes(scriptEnd)) {
  html = html.replace(scriptEnd, 'renderAll();\n})();\n</script>');
}

fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(__dirname, 'data.js'), path.join(out, 'data.js'));
fs.writeFileSync(path.join(out, 'nas-sync-test.txt'), 'OK NAS SYNC - 2026-09-14 21:55\n');
