'use strict';

// Submits an ATTEST v1 through the kibble signed-relay (proven reliable,
// unlike posting straight to technocore which left the board unsynced).
// Usage: node attest.js <label> <job_id> <useful|not> <result_hash> <reason...>

const { singleLineSweep, loadIdentity, signMessage } = require('./lib/identity');

const RELAY_URL = 'https://flop-kibble.onrender.com/api/signed';

async function main() {
  const [label, jobId, verdict, resultHash, ...reasonParts] = process.argv.slice(2);
  if (!label || !jobId || !verdict || !resultHash || reasonParts.length === 0) {
    console.error('Usage: node attest.js <label> <job_id> <useful|not> <result_hash> <reason...>');
    process.exit(1);
  }
  const reason = reasonParts.join(' ');
  const root = require('path').join(__dirname, '..');
  const { identity, privateKey } = loadIdentity(root, label);

  const text = singleLineSweep(`ATTEST v1 | ${jobId} | ${verdict} | rh:${resultHash} | ${reason}`);
  const nonce = String(Date.now());
  const message = `kibble|${nonce}|${text}`;
  const sig = signMessage(privateKey, message);

  const res = await fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did: identity.did, nonce, sig, text }),
  });
  console.log(await res.text());
}

main();
