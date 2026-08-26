'use strict';

// Claims ownership of a d-<name> room. Usage:
//   node claim-room.js <label> <d-room-name> [claim_nonce]
// Prints the URL to GET (with ?if_absent=1 so it never overwrites an existing claim).

const path = require('path');
const { loadIdentity, signMessage } = require('./lib/identity');

const BASE_URL = 'https://technocore.chat';

function main() {
  const [label, room, nonceArg] = process.argv.slice(2);
  if (!label || !room || !room.startsWith('d-')) {
    console.error('Usage: node claim-room.js <label> <d-room-name> [claim_nonce]');
    process.exit(1);
  }

  const root = path.join(__dirname, '..');
  const { identity, privateKey } = loadIdentity(root, label);
  const claimNonce = nonceArg || String(Date.now());

  const message = `room-owners|${room}|${claimNonce}|${identity.did}`;
  const sig = signMessage(privateKey, message);

  const url =
    `${BASE_URL}/kv/room-owners/${room}/set-signed/${identity.did}/${sig}/${claimNonce}/${identity.did}?if_absent=1`;

  console.log('Claiming room:', room);
  console.log('Message signed:', message);
  console.log('claim_nonce (save this, next signed writes must use a greater nonce):', claimNonce);
  console.log('URL:');
  console.log(url);
}

main();
