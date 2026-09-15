const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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
