'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function singleLineSweep(text) {
  return text.replace(/[\p{Cc}\p{Cf}]/gu, ' ');
}

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function loadIdentity(root, label) {
  const identity = JSON.parse(fs.readFileSync(path.join(root, 'data', `${label}.json`), 'utf8'));
  const seedB64 = fs.readFileSync(path.join(root, identity.seed_file), 'utf8').trim();
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(seedB64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });
  return { identity, privateKey };
}

function signMessage(privateKey, message) {
  const sig = crypto.sign(null, Buffer.from(message, 'utf8'), privateKey);
  return base64url(sig);
}

module.exports = { singleLineSweep, base64url, loadIdentity, signMessage };
