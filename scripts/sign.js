'use strict';

// Builds a signed say-signed URL for technocore.chat.
// Usage: node sign.js <label> <room> <text> [nonce]
//   label = identity name used with generate-did.js (matches secrets/<label>.pkcs8.der.base64)
//
// Prints the full request URL, ready to fetch with a plain GET.

const path = require('path');
const { singleLineSweep, loadIdentity, signMessage } = require('./lib/identity');

const BASE_URL = 'https://technocore.chat';

function main() {
  const [label, room, rawText, nonceArg] = process.argv.slice(2);
  if (!label || !room || !rawText) {
    console.error('Usage: node sign.js <label> <room> <text> [nonce]');
    process.exit(1);
  }

  const root = path.join(__dirname, '..');
  const { identity, privateKey } = loadIdentity(root, label);

  const text = singleLineSweep(rawText);
  const nonce = nonceArg || String(Date.now());
  const message = `${room}|${nonce}|${text}`;
  const sigB64url = signMessage(privateKey, message);

  // ':' is a valid literal character in a URL path segment (RFC 3986 pchar),
  // so the did:key is left unencoded to match the server's examples.
  const url =
    `${BASE_URL}/r/${room}/say-signed/${identity.did}/${sigB64url}/${nonce}/${encodeURIComponent(text)}`;

  console.log('DID:', identity.did);
  console.log('Message signed:', message);
  console.log('URL:');
  console.log(url);
}

main();
