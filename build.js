const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// TRAINING_UI_FIX_20261019 - six targeted fixes for the NAS dashboard.
// Keep all changes at build time so the historical training archive stays untouched.
const removeRepeatedTitle = '<div class="hub-heading"><span class="hub-mark heading-mark" aria-hidden="true"><i></i><i></i><i></i></span><div><h1>Training Hub</h1><p>Panoramica generale</p></div></div>';
if (!html.includes(removeRepeatedTitle)) throw new Error('Training heading selector changed');
html = html.replace(removeRepeatedTitle, '');

// Original embedded product shots are only tiny WebP thumbnails. Replace BOTH
// copies (static HTML + dynamic EQUIPMENT_PHOTOS object) with fuller-size photos.
const smallPhotos = [...new Set([...html.matchAll(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g)].map(m=>m[0]))];
if (smallPhotos.length !== 2) throw new Error('Unexpected equipment photo count: '+smallPhotos.length);
const noosaHQ = 'https://res.cloudinary.com/ekoweb/image/upload/s--63uo51rk--/f_auto%2Ch_600%2Cq_auto%3Aeco%2Cw_600/v1/products/9-101055/views/9-101055__1011b368-300_01';
const hokaHQ = 'https://www.bfgcdn.com/1500_1500_90/023-2201-0511/hoka-mafate-x-trailrunningschuhe.jpg';
html = html.replaceAll(smallPhotos[0], noosaHQ).replaceAll(smallPhotos[1], hokaHQ);
 // Remote product photos may be large; don't delay dashboard icons or charts.
html = html.replace(/(<img class="equipment-real-photo"[^>]*?)loading="eager"/g,'$1loading="lazy"');

// Do not show an approximation mark on the Noosa main card. The historical
// estimation metadata and the underlying calculation remain unchanged.
const kmBefore = 'const km=known?(estimated?"≈ ":"")+';
const kmAfter = 'const km=known?((estimated && item.id!=="run-noosa13")?"≈ ":"")+';
if (!html.includes(kmBefore)) throw new Error('Noosa km format has changed');
html = html.replace(kmBefore,kmAfter);
html = html.replace('<span class="equip-km">≈ 592 <small>km</small></span>','<span class="equip-km">592 <small>km</small></span>');

// A distinct, balanced bicycle glyph; simpler geometry remains legible at 25px.
const iconStart = html.indexOf("  Bici:'",html.indexOf('const SPORT_SVG={'));
const iconEnd = html.indexOf(",\n  Nuoto:",iconStart);
if(iconStart<0||iconEnd<0) throw new Error('Sport bicycle symbol not found');
const bikeGlyph = '<circle cx="10" cy="34" r="8" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="38" cy="34" r="8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 34L18 20L26 34H10M18 20H34L26 34M34 20L38 34M15 17h7M32 15h7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="34" r="2" fill="currentColor" stroke="none"/>';
html=html.slice(0,iconStart)+"  Bici:'"+bikeGlyph+"'"+html.slice(iconEnd);

// Use the very same runner as the running discipline for the top 'Allenamenti'
// navigation link instead of a different mismatched stick-figure icon.
const navAnchor='/* Illustrazioni inline: nessuna richiesta HTTP o dipendenza da assets/ nel deploy Pages. */';
if(!html.includes(navAnchor)) throw new Error('Running navigation anchor not found');
html=html.replace(navAnchor,
  `document.querySelector('.hub-side-links a[href="#trainingDiary"] .side-icon').innerHTML=sportIcon("Corsa");\n`+navAnchor);

// Visually erase the gray studio-photo rectangle around the gravel bicycle:
// its very light background is pushed to white, then blended into the card.
const targetedUiCSS = `
/* Targeted mobile dashboard fixes - retain the four filter buttons. */
.hero{min-height:0!important;margin:0 0 8px!important;padding:3px 5px 10px!important;gap:0!important}
.hero .hub-time-controls{width:100%!important;max-width:100%!important}
.hub-side-links a[href="#trainingDiary"] .side-icon svg{display:block;width:21px;height:21px;overflow:visible}
.hub-equipment-shell #equipmentCards [data-equipment-id="bike-vr"] .equipment-real-photo{
  mix-blend-mode:multiply!important;
  filter:brightness(1.13) contrast(1.06)!important;
  background:transparent!important;border-radius:0!important;
}
.hub-equipment-shell #equipmentCards .equipment-real-photo{
  image-rendering:auto;object-fit:contain;object-position:center;
}
@media(max-width:900px){
  .hub-side-links a[href="#trainingDiary"] .side-icon svg{width:17px;height:17px}
}
`;
html = html.replace('</style>',targetedUiCSS+'\n</style>');


// Comandi flottanti unificati: icone SVG colorate e feedback tattile.
let floatingNavigationCss = `
.hub-floating-actions{
 position:fixed;left:50%;transform:translateX(-50%);bottom:max(8px,env(safe-area-inset-bottom));z-index:2147483646;
 display:flex;gap:6px;padding:4px;border:1px solid #e0e8f5;border-radius:18px;
 background:rgba(255,255,255,.94);box-shadow:0 10px 28px rgba(25,52,92,.17);backdrop-filter:blur(14px)
}
.hub-floating-actions .hub-floating-action{
 appearance:none;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:10px;
 width:96px;min-height:36px;padding:6px 9px;border:0;border-radius:14px;
 color:#fff!important;text-decoration:none!important;font:750 12px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
 white-space:nowrap;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;
 transition:transform .13s,filter .13s,box-shadow .13s
}
.hub-floating-actions [data-hub-refresh]{background:linear-gradient(145deg,#2daaff,#1269ee);box-shadow:0 5px 12px rgba(18,105,238,.22)}
.hub-floating-actions [data-hub-home]{background:linear-gradient(145deg,#ffc349,#ff821c);box-shadow:0 5px 12px rgba(255,130,28,.24)}
.hub-floating-actions .hub-floating-action:active,.hub-floating-actions .hub-floating-action.is-pressed{transform:scale(.93);filter:brightness(.84);box-shadow:inset 0 3px 8px rgba(0,0,0,.2)}
.hub-floating-actions .hub-floating-action:focus-visible{outline:3px solid #163c8c;outline-offset:3px}
.hub-floating-actions svg{display:block;width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.hub-floating-actions button:disabled{opacity:1;cursor:progress;filter:saturate(.75)}
@media(max-width:370px){.hub-floating-actions{gap:7px;padding:6px}.hub-floating-actions .hub-floating-action{width:90px;min-height:34px;font-size:11px}}
`;
floatingNavigationCss += `\n/* Stile coerente con il tasto Refresh della Home Hub */
.hub-floating-actions [data-hub-refresh]{background:linear-gradient(145deg,#8a4dff,#6733df);color:#fff!important;border:1px solid #7439ec;box-shadow:0 5px 14px rgba(104,51,223,.30)}
.hub-floating-actions [data-hub-refresh] svg{stroke:#fff}
.hub-floating-actions [data-hub-refresh]:active,.hub-floating-actions [data-hub-refresh].is-pressed{background:#5d2cc9;color:#fff!important;border-color:#5d2cc9;box-shadow:inset 0 2px 7px rgba(55,22,126,.35)}
`;
const floatingNavigationMarkup = `
<div class="hub-floating-actions" role="group" aria-label="Comandi rapidi">
 <button type="button" class="hub-floating-action" data-hub-refresh aria-label="Aggiorna Allenamenti">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.4 6"/><path d="M20 4v7h-7"/></svg><span class="hub-action-caption">Refresh</span>
 </button>
 <a class="hub-floating-action" data-hub-home href="/" aria-label="Torna alla Home">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-8h6v8"/></svg><span class="hub-action-caption">Home</span>
 </a>
</div>
<script>
document.addEventListener('DOMContentLoaded',()=>{
 const home=document.querySelector('[data-hub-home]');
 if(home)home.href=window.location.protocol+'//'+window.location.hostname+'/';
 document.querySelectorAll('body > a[style]').forEach(a=>{if(a.textContent.trim()==='🏠 Home')a.remove()});
 const refresh=document.querySelector('[data-hub-refresh]');
 refresh?.addEventListener('click',()=>{
  refresh.classList.add('is-pressed');refresh.disabled=true;refresh.setAttribute('aria-busy','true');
  refresh.querySelector('.hub-action-caption').textContent='Aggiorno…';
  const u=new URL(window.location.href);u.searchParams.set('_hub_reload',Date.now().toString());
  setTimeout(()=>window.location.replace(u.href),220);
 });
 home?.addEventListener('click',()=>home.classList.add('is-pressed'));
});
</script>
`;
if (!html.includes('</style>') || !html.includes('</body>')) throw new Error('Missing HTML anchors for quick actions');
html=html.replace('</style>',floatingNavigationCss+'\n</style>');
html=html.replace('</body>',floatingNavigationMarkup+'\n</body>');
// Il vecchio tasto "↻ Aggiorna" nell'header è ridondante: rimane solo il Refresh flottante.
html=html.replace(/<button\b[^>]*\bid="trainingRefresh"[^>]*>[\s\S]*?<\/button>/,'');


// NAS is the authoritative deployment: serve the locally built data.js,
// avoiding an external GitHub fetch that could overwrite fresh training data.


// INLINE_ACTIVITY_MERGE_20261019
// index.html contains its OWN inline const A=[...]; it never loads data.js.
// Inject records BEFORE A.forEach() derives year/month/pace. Records appended
// later are otherwise excluded by yearlyData() and never appear in the Hub.
const activitiesExtraPath = path.join(__dirname, 'data-additions.json');
if (fs.existsSync(activitiesExtraPath)) {
  const activitiesExtra = JSON.parse(fs.readFileSync(activitiesExtraPath, 'utf8'));
  if (!Array.isArray(activitiesExtra)) throw new Error('Expected activity list');
  const beforeRender = 'A.forEach(a=>{a.year=Number(a.date.slice(0,4));a.month=Number(a.date.slice(5,7));a.metric=metric(a)});';
  if (!html.includes(beforeRender)) throw new Error('Cannot find dashboard render entrypoint');
  const addToEmbeddedHistory = '\nfor (const activity of ' + JSON.stringify(activitiesExtra) + ') {\n'
    + '  if (!A.some(old => old.date===activity.date && old.type===activity.type && old.duration===activity.duration && Math.abs(Number(old.km)-Number(activity.km))<0.01)) A.push(activity);\n'
    + '}\n';
  html = html.replace(beforeRender, addToEmbeddedHistory + beforeRender);
}


// APPLY_EQUIPMENT_CORRECTIONS_V1
// Store small corrections independently of the historical inline A/data.js data.
// Apply before A.forEach derives year/month/pace for correct dashboard counters.
let equipmentCorrectionsJS = '';
const correctionPath = path.join(__dirname, 'activity-corrections.json');
if (fs.existsSync(correctionPath)) {
  const corrections = JSON.parse(fs.readFileSync(correctionPath, 'utf8'));
  if (!Array.isArray(corrections)) throw new Error('activity-corrections.json must be an array');
  equipmentCorrectionsJS = '\n;for (const fix of ' + JSON.stringify(corrections) + ') {\n'
    + ' const act=A.find(a=>a.date===fix.date&&a.type===fix.type&&Math.abs(Number(a.km)-Number(fix.km))<0.01);\n'
    + ' if(!act)continue;\n'
    + ' if(Array.isArray(fix.equipmentSegments)){\n'
    + '  if(!Array.isArray(act.equipmentSegments))act.equipmentSegments=[];\n'
    + '  for(const seg of fix.equipmentSegments){const i=act.equipmentSegments.findIndex(old=>old.equipmentId===seg.equipmentId);if(i>=0)act.equipmentSegments[i]=seg;else act.equipmentSegments.push(seg);}\n'
    + ' }\n'
    + ' if(fix.noteAppend&&!String(act.note||"").includes(fix.noteAppend))act.note=(act.note?act.note+" ":"")+fix.noteAppend;\n'
    + '}\n';
  const normMarker = 'A.forEach(a=>{a.year=Number(a.date.slice(0,4));a.month=Number(a.date.slice(5,7));a.metric=metric(a)});';
  if(!html.includes(normMarker))throw new Error('Cannot find activity normalization in index.html');
  html=html.replace(normMarker,equipmentCorrectionsJS+'\n'+normMarker);
}

// GARMIN_RECONCILIATION_20261021
// Recover precisely seven missing workouts and attach Garmin metrics to 48 existing/new activities.
// Preserve manually curated time, distance, calories and equipment; never double-count multisport.
let garminOverlayScript = '';
const garminOverlayPath=path.join(__dirname,'garmin-overlay.json');
if(fs.existsSync(garminOverlayPath)){
 const pack=JSON.parse(fs.readFileSync(garminOverlayPath,'utf8'));
 if(!Array.isArray(pack.entries)||pack.entries.length!==48||pack.entries.filter(e=>e.newActivity).length!==7)throw new Error('Invalid Garmin overlay');
 garminOverlayScript='\n;for(const row of '+JSON.stringify(pack.entries)+'){\n'
 + ' let a=A.find(x=>x.date===row.date&&x.type===row.type&&Math.abs(Number(x.km)-Number(row.km))<0.26&&(!row.newActivity||String(x.duration)===String(row.newActivity.duration)));\n'
 + ' if(!a&&row.newActivity){a={...row.newActivity};A.push(a)}\n'
 + ' if(a){a.garminId=row.id;a.garmin=row.stats;if(!a.startTime&&row.stats.start)a.startTime=row.stats.start}\n'
 + '}\n';
 const marker='A.forEach(a=>{a.year=Number(a.date.slice(0,4));a.month=Number(a.date.slice(5,7));a.metric=metric(a)});';
 if(!html.includes(marker))throw new Error('Garmin merge marker missing');
 html=html.replace(marker,garminOverlayScript+'\n'+marker);
 const garminHintFn="function garminRowDetails(g){\n if(!g)return \"\";\n const items=[[\"FC max\",g.hrMax,\"bpm\"],[\"Potenza media\",g.powerAvg,\"W\"],[\"Cadenza media\",g.cadenceAvg,\"spm/rpm\"],[\"TE aerobico\",g.trainingEffectAerobic,\"\"],[\"TE anaerobico\",g.trainingEffectAnaerobic,\"\"],[\"VO₂ max\",g.vo2Max,\"\"],[\"Carico\",g.trainingLoad,\"\"],[\"Calorie attive Garmin\",g.caloriesActive,\"kcal\"],[\"Calorie totali Garmin\",g.caloriesTotal,\"kcal\"],[\"Body Battery\",g.bodyBatteryDelta,\"\"],[\"Sudorazione stimata\",g.sweatEstMl,\"ml\"],[\"D+ Garmin\",g.ascentGarminM,\"m\"],[\"Contatto suolo\",g.groundContactMs,\"ms\"],[\"Oscillazione verticale\",g.verticalOscillationCm,\"cm\"],[\"Rapporto verticale\",g.verticalRatioPct,\"%\"],[\"Falcata\",g.strideLengthCm,\"cm\"]];\n const details=items.filter(r=>r[1]!=null&&r[1]!==\"\").map(r=>\"<span><b>\"+escapeEquip(r[0])+\"</b> \"+escapeEquip(r[1])+\" \"+escapeEquip(r[2])+\"</span>\").join(\"\");\n const fc=g.hrAvg==null?\"\":(\" · FC \"+escapeEquip(g.hrAvg)+\" bpm\");\n return '<details class=\"garmin-metrics\"><summary>⌁ Garmin'+fc+'</summary><div class=\"garmin-details\">'+details\n  +(g.garminUrl?'<a href=\"'+escapeEquip(g.garminUrl)+'\" target=\"_blank\" rel=\"noopener\">Apri su Garmin Connect ↗</a>':\"\")\n  +'</div></details>';\n}";
 if(!html.includes('function renderTable(){'))throw new Error('Diary renderer missing');
 html=html.replace('function renderTable(){',garminHintFn+'\nfunction renderTable(){');
 const interpolation=String.fromCharCode(36);
 const oldCell='<span class="equip-text '+interpolation+'{gear.pending?"pending":""}">'+interpolation+'{label}</span></td></tr>';
 const newCell='<span class="equip-text '+interpolation+'{gear.pending?"pending":""}">'+interpolation+'{label}</span>'+interpolation+'{a.garmin?garminRowDetails(a.garmin):""}</td></tr>';
 if(!html.includes(oldCell))throw new Error('Diary equipment cell missing');
 html=html.replace(oldCell,newCell);
 const garminCss=".garmin-metrics{margin-top:6px;font-size:11px;color:#326a9c}\n.garmin-metrics>summary{cursor:pointer;font-weight:800;color:#256ea6;list-style:none;padding:3px 0;white-space:nowrap}\n.garmin-metrics>summary::-webkit-details-marker{display:none}\n.garmin-metrics>summary:after{content:\" ▾\";font-size:10px}\n.garmin-metrics[open]>summary:after{content:\" ▴\"}\n.garmin-details{display:flex;flex-wrap:wrap;gap:5px 10px;min-width:190px;max-width:400px;max-height:180px;overflow:auto;white-space:normal;padding:8px 0;line-height:1.5}\n.garmin-details span{display:block}\n.garmin-details b{font-weight:800;color:#3c5064}\n.garmin-details a{color:#1269ee;font-weight:800;text-decoration:underline}";
 html=html.replace('</style>',garminCss+'\n</style>');
}

fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(__dirname, 'data.js'), path.join(out, 'data.js'));
/* Copia le icone SVG nel sito pubblicato: prima erano presenti solo nel sorgente,
   quindi nel dist/ del NAS il browser non poteva caricarle. */
const sourceIcons=path.join(__dirname,'assets','icons');
const outputIcons=path.join(out,'assets','icons');
fs.mkdirSync(outputIcons,{recursive:true});
for(const name of fs.readdirSync(sourceIcons)){
  if(/\.(svg|png)$/i.test(name)) fs.copyFileSync(path.join(sourceIcons,name),path.join(outputIcons,name));
}


// Small incremental records: do not rewrite the historical 187-activity data.js.
// The NAS updater rebuilds dist/ after GitHub commits; duplicate keys are ignored.
const additionsPath = path.join(__dirname, 'data-additions.json');
if (fs.existsSync(additionsPath)) {
  const additions = JSON.parse(fs.readFileSync(additionsPath, 'utf8'));
  if (!Array.isArray(additions)) throw new Error('data-additions.json must contain an array');
  const mergeScript = '\n;for (const addition of ' + JSON.stringify(additions) + ') {\n' +
    '  if (!A.some(activity => activity.date === addition.date && activity.type === addition.type && activity.duration === addition.duration && Math.abs(Number(activity.km) - Number(addition.km)) < 0.01)) A.push(addition);\n' +
    '}\n';
  fs.appendFileSync(path.join(out, 'data.js'), mergeScript);
}


if (equipmentCorrectionsJS) fs.appendFileSync(path.join(out, 'data.js'), equipmentCorrectionsJS);
if(garminOverlayScript) fs.appendFileSync(path.join(out,'data.js'),garminOverlayScript);

// LAN fallbacks: materialize Hub and Finanze inside dist so Nginx can serve them
// with its normal static-file path and without special alias locations.
const hubDir = path.join(out, 'hub');
const financeDir = path.join(out, 'finanze');
const autoDir = path.join(out, 'auto');
fs.mkdirSync(hubDir, { recursive: true });
fs.mkdirSync(financeDir, { recursive: true });
fs.mkdirSync(autoDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'nas', 'lan-hub.html'), path.join(hubDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'nas', 'finance.html'), path.join(financeDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'nas', 'auto', 'index.html'), path.join(autoDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'nas', 'auto', 'data.js'), path.join(autoDir, 'data.js'));
fs.writeFileSync(path.join(out, 'nas-sync-test.txt'), 'OK NAS SYNC - 2026-09-14 21:55\n');
