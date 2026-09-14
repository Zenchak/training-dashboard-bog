const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const navCss = `
.site-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}
.site-switch{display:inline-flex;align-items:center;gap:8px;width:max-content;text-decoration:none;color:#06111d;background:linear-gradient(135deg,var(--accent),#8fb7ff);border:0;border-radius:12px;padding:10px 13px;font-size:12px;font-weight:850;box-shadow:0 7px 20px rgba(103,232,249,.18);transition:.2s}
.site-switch:hover{transform:translateY(-1px);box-shadow:0 9px 24px rgba(103,232,249,.25)}
`;

if (!html.includes('.site-switch{')) {
  html = html.replace('</style>', `${navCss}</style>`);
}

const button = '<div class="site-actions"><a class="site-switch" href="https://illustrious-cupcake-c1bcb0.netlify.app/">🗺️ Mappa gare</a></div>';
if (!html.includes('>🗺️ Mappa gare</a>')) {
  html = html.replace('<p id="coverage"></p>', `<p id="coverage"></p>\n      ${button}`);
}

fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(__dirname, 'data.js'), path.join(out, 'data.js'));
