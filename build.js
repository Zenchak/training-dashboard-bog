const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Link alla pagina Gare direttamente dentro la dashboard Allenamenti.
const raceButtonCss = `
.hero-side{display:grid;justify-items:end;gap:12px;position:relative;z-index:2}
.race-link{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:#06111d;background:linear-gradient(135deg,var(--accent),#8fb7ff);border-radius:12px;padding:10px 14px;font-size:12px;font-weight:850;box-shadow:0 6px 18px rgba(103,232,249,.18);transition:.15s}
.race-link:hover{transform:translateY(-1px);filter:brightness(1.05)}
@media(max-width:720px){.hero-side{justify-items:start}.race-link{min-height:42px}}
`;
html = html.replace('</style>', raceButtonCss + '\n</style>');
html = html.replace(
  '<div class="hero-art" aria-label="Triathlon">🏊‍♂️ 🚴‍♂️ 🏃‍♂️</div>',
  '<div class="hero-side"><div class="hero-art" aria-label="Triathlon">🏊‍♂️ 🚴‍♂️ 🏃‍♂️</div><a class="race-link" href="/gare/" onclick="if(location.port===\'8441\'){this.href=\'https://\'+location.hostname+\':8442/\'}">🏁 Gare</a></div>'
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
