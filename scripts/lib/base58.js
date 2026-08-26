'use strict';

// Base58btc (Bitcoin alphabet), used for did:key multibase encoding.
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP = {};
for (let i = 0; i < ALPHABET.length; i++) ALPHABET_MAP[ALPHABET[i]] = i;

function encode(buffer) {
  if (buffer.length === 0) return '';

  let digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  // leading zero bytes -> leading '1's
  for (let k = 0; k < buffer.length && buffer[k] === 0; k++) {
    digits.push(0);
  }

  return digits
    .reverse()
    .map((d) => ALPHABET[d])
    .join('');
}

module.exports = { encode };
