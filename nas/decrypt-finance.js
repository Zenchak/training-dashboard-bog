const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const [encPath, keyPath, outPath] = process.argv.slice(2);
if (!encPath || !keyPath || !outPath) {
  console.error('Uso: node decrypt-finance.js <finance.enc> <private.pem> <finance.json>');
  process.exit(2);
}

function decryptPayload(inputPath, privateKey) {
  const env = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (env.version !== 2 || env.alg !== 'RSA-OAEP-SHA256+AES-256-GCM+GZIP') throw new Error('Formato cifrato non supportato: ' + inputPath);
  const aesKey = crypto.privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(env.encryptedKey, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(env.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(env.tag, 'base64'));
  return JSON.parse(zlib.gunzipSync(Buffer.concat([decipher.update(Buffer.from(env.ciphertext, 'base64')), decipher.final()])).toString('utf8'));
}

function decryptOne(inputPath, privateKeyPath, outputPath) {
  const env = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (env.version !== 2 || env.alg !== 'RSA-OAEP-SHA256+AES-256-GCM+GZIP') {
    throw new Error('Formato cifrato non supportato: ' + inputPath);
  }
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const aesKey = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(env.encryptedKey, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(env.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(env.tag, 'base64'));
  const compressed = Buffer.concat([
    decipher.update(Buffer.from(env.ciphertext, 'base64')),
    decipher.final()
  ]);
  const plaintext = zlib.gunzipSync(compressed);
  const parsed = JSON.parse(plaintext.toString('utf8'));
  if (path.basename(inputPath) === 'finance.enc') {
    const patchFile = path.join(path.dirname(inputPath), 'finance-payroll-updates.enc');
    if (fs.existsSync(patchFile)) {
      const patch = decryptPayload(patchFile, privateKey);
      for (const entry of patch.payrollUpdates || []) {
        if (entry.month === 'Ottobre 2026') {
          parsed.current = { ...(parsed.current || {}), ferieHours: entry.ferieHours, rolHours: entry.rolHours };
          parsed.monthly2026 = Array.isArray(parsed.monthly2026) ? parsed.monthly2026 : [];
          const record = {
            month: entry.month,
            fixedGross: entry.fixedGross,
            totalGross: entry.totalGross,
            net: entry.net,
            ordinaryNet: entry.ordinaryNet,
            extra: entry.net - entry.ordinaryNet,
            note: entry.note
          };
          const idx = parsed.monthly2026.findIndex(x => String(x.month).toLowerCase().includes('ott'));
          if (idx >= 0) parsed.monthly2026[idx] = { ...parsed.monthly2026[idx], ...record };
          else parsed.monthly2026.push(record);
          parsed.updatedAt = entry.updatedAt;
        }
      }
    }
  }
  const output = Buffer.from(JSON.stringify(parsed));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tmp = outputPath + '.tmp';
  fs.writeFileSync(tmp, output, { mode: 0o644 });
  fs.renameSync(tmp, outputPath);
  try { fs.chmodSync(outputPath, 0o644); } catch {}
  console.log(path.basename(outputPath) + ' aggiornato: ' + outputPath);
}

decryptOne(encPath, keyPath, outPath);

// L'updater esegue già questo script ogni minuto per finance.enc.
// Quando esiste anche expenses.enc, aggiorna automaticamente il database Uscite
// senza richiedere modifiche manuali o riavvii dei container.
if (path.basename(encPath) === 'finance.enc') {
  const expensesEnc = path.join(path.dirname(encPath), 'expenses.enc');
  if (fs.existsSync(expensesEnc)) {
    const expensesOut = path.join(path.dirname(outPath), 'expenses.json');
    decryptOne(expensesEnc, keyPath, expensesOut);
  }
}
