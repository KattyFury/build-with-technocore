'use strict';

// Generates an Ed25519 keypair and derives a did:key identifier from it.
// Private key -> secrets/seed.pem (gitignored, never commit this).
// Public identity -> data/identity.json (safe to commit).

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { encode: base58encode } = require('./lib/base58');

const ED25519_MULTICODEC_PREFIX = Buffer.from([0xed, 0x01]);

function rawPublicKeyFromSpki(spkiDer) {
  // Fixed-length SPKI DER for Ed25519 is 44 bytes; the raw 32-byte key is the tail.
  return spkiDer.subarray(spkiDer.length - 32);
}

function main() {
  const label = process.argv[2] || 'identity';

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  const rawPub = rawPublicKeyFromSpki(publicKey);
  const didKey = 'did:key:z' + base58encode(Buffer.concat([ED25519_MULTICODEC_PREFIX, rawPub]));

  const fingerprint = crypto.createHash('sha256').update(didKey).digest('hex').slice(0, 16);
  const shard = fingerprint.slice(0, 2);
  const rest = fingerprint.slice(2);

  const secretsDir = path.join(__dirname, '..', 'secrets');
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(secretsDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  const seedPath = path.join(secretsDir, `${label}.pkcs8.der.base64`);
  fs.writeFileSync(seedPath, privateKey.toString('base64'), 'utf8');

  const identityPath = path.join(dataDir, `${label}.json`);
  const identity = {
    label,
    did: didKey,
    fingerprint,
    did_note_path: `/kv/did-${shard}/${rest}`,
    created_at: new Date().toISOString(),
    seed_file: path.relative(path.join(__dirname, '..'), seedPath).replace(/\\/g, '/'),
  };
  fs.writeFileSync(identityPath, JSON.stringify(identity, null, 2), 'utf8');

  console.log('Generated DID:', didKey);
  console.log('Fingerprint:', fingerprint);
  console.log('DID note path:', identity.did_note_path);
  console.log('Seed saved to (DO NOT COMMIT):', seedPath);
  console.log('Public identity saved to:', identityPath);
}

main();
