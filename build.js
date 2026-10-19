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

// NAS is the authoritative deployment: serve the locally built data.js,
// avoiding an external GitHub fetch that could overwrite fresh training data.

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
