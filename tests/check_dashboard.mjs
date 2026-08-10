#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const updated = html.match(/Updated ([A-Z][a-z]+ \d{1,2}, \d{4})/);
if (!updated) throw new Error('Updated date marker missing');
const runDate = new Date(updated[1] + ' 12:00:00 UTC');
const archiveRel = `seat-cushion-brief/${runDate.getUTCFullYear()}/${String(runDate.getUTCMonth()+1).padStart(2,'0')}${String(runDate.getUTCDate()).padStart(2,'0')}.html`;
const archive = fs.readFileSync(path.join(root, archiveRel), 'utf8');
const match = html.match(/const D=window\.__D=(\[.*?\]);window\.__RISING_SINCE="([^"]+)"/s);
if (!match) throw new Error('Dashboard data markers missing');
const rows = JSON.parse(match[1]);
const risingSince = new Date(match[2] + 'T00:00:00');
const ids = rows.map(r => String(r[0]));
const knownDead = new Set(['7660475077581982990', '7670870572565400845']);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate TikTok IDs');
if (rows.some(r => !Array.isArray(r) || r.length !== 9)) throw new Error('Invalid dashboard row shape');
if (ids.some(id => knownDead.has(id))) throw new Error('Known-dead TikTok video returned to the dashboard');
if (!html.includes("https://www.tiktok.com/player/v1/${v[0]}")) throw new Error('Cards must use stable TikTok player links');
if (html.includes('https://www.tiktok.com/@i/video/${v[0]}')) throw new Error('Unresolved @i TikTok links are forbidden');
if (html !== archive) throw new Error('Latest and dated archive must be byte-identical');
if (html.includes('Â')) throw new Error('Mojibake detected');
for (const r of rows) if (!(r[7] <= r[5] && r[5] <= r[3])) throw new Error(`Revenue-window invariant failed for ${r[0]}`);

const pub = s => { const [m,d,y] = s.split('/').map(Number); return new Date(2000+y,m-1,d); };
const pick = n => {
  if (n === 'rising') return rows.filter(r => r[3] > 100 && pub(r[2]) >= risingSince).sort((a,b) => pub(b[2]) - pub(a[2]) || b[3] - a[3])[0];
  const o = n === 1 ? 7 : n === 7 ? 5 : 3;
  return rows.filter(r => r[o] > 100).sort((a,b) => b[o] - a[o])[0];
};
const top = [...new Set([pick(30), pick(7), pick(1), pick('rising')].map(r => String(r[0])))];
console.log(`PASS: ${rows.length} rows; top-card IDs requiring live browser smoke test: ${top.join(', ')}`);
