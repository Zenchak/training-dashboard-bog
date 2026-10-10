const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [encPath, keyPath, outPath] = process.argv.slice(2);
if (!encPath || !keyPath || !outPath) {
  console.error('Uso: node decrypt-finance.js <finance.enc> <private.pem> <finance.json>');
  process.exit(2);
}

const env = JSON.parse(fs.readFileSync(encPath, 'utf8'));
if (env.version !== 1 || env.alg !== 'RSA-OAEP-SHA256+AES-256-GCM') {
  throw new Error('Formato finance.enc non supportato');
}
const privateKey = fs.readFileSync(keyPath, 'utf8');
const aesKey = crypto.privateDecrypt({
  key: privateKey,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256'
}, Buffer.from(env.encryptedKey, 'base64'));

const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(env.iv, 'base64'));
decipher.setAuthTag(Buffer.from(env.tag, 'base64'));
const plaintext = Buffer.concat([
  decipher.update(Buffer.from(env.ciphertext, 'base64')),
  decipher.final()
]);
JSON.parse(plaintext.toString('utf8'));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const tmp = outPath + '.tmp';
fs.writeFileSync(tmp, plaintext, { mode: 0o600 });
fs.renameSync(tmp, outPath);
try { fs.chmodSync(outPath, 0o600); } catch {}
console.log('finance.json aggiornato: ' + outPath);
