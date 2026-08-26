'use strict';

// Writes a plain (unsigned) world-writable note, e.g. a room topic.
// Usage: node write-note.js <ns> <key> <value> [--if=<expected>|--if-absent]

const BASE_URL = 'https://technocore.chat';

function main() {
  const [ns, key, value, flag] = process.argv.slice(2);
  if (!ns || !key || value === undefined) {
    console.error('Usage: node write-note.js <ns> <key> <value> [--if=<expected>|--if-absent]');
    process.exit(1);
  }

  let query = '';
  if (flag === '--if-absent') query = '?if_absent=1';
  else if (flag && flag.startsWith('--if=')) query = `?if=${encodeURIComponent(flag.slice(5))}`;

  const url = `${BASE_URL}/kv/${ns}/${key}/set/${encodeURIComponent(value)}${query}`;
  console.log(url);
}

main();
