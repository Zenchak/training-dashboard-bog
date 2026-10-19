const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Link alla pagina Gare in fondo alla dashboard Allenamenti.
const raceButtonCss = `
.bottom-nav{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:24px 0 2px}
.bottom-link{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:white;background:linear-gradient(135deg,#765ff1,#5f8dff);border:0;border-radius:12px;padding:11px 16px;font:inherit;font-size:12px;font-weight:850;box-shadow:0 7px 18px rgba(111,92,241,.18);transition:.15s;cursor:pointer}
.bottom-link:hover{transform:translateY(-1px);filter:brightness(1.03)}
.bottom-link.secondary{color:#596678;background:#fff;border:1px solid #dfe5ee;box-shadow:0 5px 14px rgba(43,55,85,.05)}
@media(max-width:720px){.bottom-nav{display:grid;grid-template-columns:repeat(3,1fr)}.bottom-link{width:100%;min-height:46px;padding:10px 8px}}
`;
html = html.replace('</style>', raceButtonCss + '\n</style>');
html = html.replace(
  '<footer id="footerNote"></footer>\n</div>',
  '<footer id="footerNote"></footer>\n<div class="bottom-nav"><a class="bottom-link secondary" href="/" onclick="if(location.port===\'8441\'){this.href=\'https://\'+location.hostname+\'/\'}">🏠 Home</a><button class="bottom-link secondary" type="button" onclick="location.reload()">↻ Refresh</button><a class="bottom-link" href="/gare/" onclick="if(location.port===\'8441\'){this.href=\'https://\'+location.hostname+\':8442/\'}">🏁 Gare</a></div>\n</div>'
);


// TRAINING_UI_FIX_20261019 - six targeted fixes for the NAS dashboard.
// Keep all changes at build time so the historical training archive stays untouched.
const removeRepeatedTitle = '<div class="hub-heading"><span class="hub-mark heading-mark" aria-hidden="true"><i></i><i></i><i></i></span><div><h1>Training Hub</h1><p>Panoramica generale</p></div></div>';
if (!html.includes(removeRepeatedTitle)) throw new Error('Training heading selector changed');
html = html.replace(removeRepeatedTitle, '');

// Original embedded product shots are only tiny WebP thumbnails. Replace BOTH
// copies (static HTML + dynamic EQUIPMENT_PHOTOS object) with fuller-size photos.
const smallPhotos = [...new Set([...html.matchAll(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g)].map(m=>m[0]))];
if (smallPhotos.length !== 2) throw new Error('Unexpected equipment photo count: '+smallPhotos.length);
const noosaHQ = 'https://www.sneakers4u.nl/img/images/2023/04/11/ASICS-Noosa-Tri-13-Hazard-Green-Digital-Aqua-1011B021-300.png';
const hokaHQ = 'https://www.bfgcdn.com/1500_1500_90/023-2201-0511/hoka-mafate-x-trailrunningschuhe.jpg';
html = html.replaceAll(smallPhotos[0], noosaHQ).replaceAll(smallPhotos[1], hokaHQ);

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
const bikeGlyph = '<circle cx="10" cy="35" r="8.3"/><circle cx="38" cy="35" r="8.3"/><path d="M10 35l10-16 8 16H10l11-16m17 16-7-19h-6m6 0h6" stroke-width="3.2"/><circle cx="27" cy="6.5" r="3.7" fill="currentColor" stroke="none"/><path d="m25 14-7 7 9 3 4-7-6-3Z" fill="currentColor" stroke="none"/><path d="m18 21-7 14m16-11 10 11m-9-20 6 4 7 1" stroke-width="3" stroke-linecap="round"/>';
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

// NAS is the authoritative deployment: serve the locally built data.js,
// avoiding an external GitHub fetch that could overwrite fresh training data.


// INLINE_ACTIVITY_MERGE_20261019
// index.html contains its OWN inline const A=[...]; it never loads data.js.
// Inject records immediately BEFORE renderAll(), otherwise the user sees a stale
// dashboard even when dist/data.js has been updated correctly.
const activitiesExtraPath = path.join(__dirname, 'data-additions.json');
if (fs.existsSync(activitiesExtraPath)) {
  const activitiesExtra = JSON.parse(fs.readFileSync(activitiesExtraPath, 'utf8'));
  if (!Array.isArray(activitiesExtra)) throw new Error('Expected activity list');
  const beforeRender = 'renderAll();\n</script>';
  if (!html.includes(beforeRender)) throw new Error('Cannot find dashboard render entrypoint');
  const addToEmbeddedHistory = '\nfor (const activity of ' + JSON.stringify(activitiesExtra) + ') {\n'
    + '  if (!A.some(old => old.date===activity.date && old.type===activity.type && old.duration===activity.duration && Math.abs(Number(old.km)-Number(activity.km))<0.01)) A.push(activity);\n'
    + '}\n';
  html = html.replace(beforeRender, addToEmbeddedHistory + beforeRender);
}

fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(__dirname, 'data.js'), path.join(out, 'data.js'));

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
