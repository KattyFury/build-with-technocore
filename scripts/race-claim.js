'use strict';

// Long-polls the technocore "kibble" room and fires a CLAIM the instant a new
// JOB v1 line appears, via the kibble signed-relay (fastest path we found —
// posting straight to technocore left the kibble board unsynced for minutes).
// Stops after the first successful claim, or after maxSeconds.
//
// Usage: node race-claim.js <label> [maxSeconds] [categoryFilter]

const { singleLineSweep, loadIdentity, signMessage } = require('./lib/identity');

const ROOM_URL = 'https://technocore.chat/r/kibble';
const RELAY_URL = 'https://flop-kibble.onrender.com/api/signed';

async function getJson(url) {
  const res = await fetch(url);
  return { status: res.status, text: await res.text() };
}

async function claim(identity, privateKey, jobId) {
  const text = singleLineSweep(`CLAIM v1 | ${jobId} | worker`);
  const nonce = String(Date.now());
  const message = `kibble|${nonce}|${text}`;
  const sig = signMessage(privateKey, message);
  const res = await fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did: identity.did, nonce, sig, text }),
  });
  return res.json();
}

async function getLatestSeq() {
  const { text } = await getJson(`${ROOM_URL}?limit=1`);
  const m = text.match(/range \d+\.\.(\d+)/);
  return m ? Number(m[1]) : 0;
}

async function main() {
  const [label, maxSecondsArg, categoryFilter] = process.argv.slice(2);
  if (!label) {
    console.error('Usage: node race-claim.js <label> [maxSeconds] [categoryFilter]');
    process.exit(1);
  }
  const root = require('path').join(__dirname, '..');
  const { identity, privateKey } = loadIdentity(root, label);
  const maxSeconds = Number(maxSecondsArg || 180);
  const deadline = Date.now() + maxSeconds * 1000;

  let since = await getLatestSeq();
  console.log(`Watching /r/kibble from seq ${since}, up to ${maxSeconds}s...`);

  while (Date.now() < deadline) {
    const { text } = await getJson(`${ROOM_URL}?since=${since}&wait=10`);
    const lines = text.split('\n').filter((l) => l.startsWith('['));
    for (const line of lines) {
      const seqMatch = line.match(/^\[(\d+)\]/);
      if (seqMatch) since = Math.max(since, Number(seqMatch[1]));

      const jobMatch = line.match(/JOB v1 \| (k[0-9a-f]{10}) \| (\w+) \|/);
      if (!jobMatch) continue;
      const [, jobId, category] = jobMatch;
      if (categoryFilter && category !== categoryFilter) continue;

      console.log(`Saw JOB ${jobId} (${category}) at ${new Date().toISOString()} — claiming now`);
      const result = await claim(identity, privateKey, jobId);
      console.log(JSON.stringify(result));
      if (result.ok) {
        console.log('WON the claim race:', jobId);
        return;
      }
    }
  }
  console.log('Timed out without a successful claim.');
}

main();
