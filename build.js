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
