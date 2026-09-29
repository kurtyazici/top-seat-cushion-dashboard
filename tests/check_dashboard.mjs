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
if (rows.some(r => !Array.isArray(r) || r.length !== 13 || typeof r[11] !== 'boolean' || typeof r[12] !== 'boolean' || !(r[11] || r[12]))) throw new Error('Invalid dashboard row shape');
if (ids.some(id => knownDead.has(id))) throw new Error('Known-dead TikTok video returned to the dashboard');
if (!html.includes("https://www.tiktok.com/player/v1/${v[0]}")) throw new Error('Cards must use stable TikTok player links');
if (html.includes('https://www.tiktok.com/@i/video/${v[0]}')) throw new Error('Unresolved @i TikTok links are forbidden');
if (html !== archive) throw new Error('Latest and dated archive must be byte-identical');
if (html.includes('Â')) throw new Error('Mojibake detected');
for (const r of rows) {
  for (const o of [3,5,7,9]) if (!(Number.isFinite(r[o]) && (r[o] === 0 ? r[o+1] === '' : r[o] > 100 && typeof r[o+1] === 'string'))) throw new Error('Invalid metrics');
  for (const [a,b] of [[7,5],[5,3],[3,9]]) if (r[a] && r[b] && r[a] > r[b]) throw new Error(`Observed revenue-window invariant failed for ${r[0]}`);
}
if (!html.includes('id="b90"') || !html.includes('True 90-day window:')) throw new Error('90-day controls/methodology missing');

const pub = s => { const [m,d,y] = s.split('/').map(Number); return new Date(2000+y,m-1,d); };
const pick = n => {
  const base = rows.filter(r => n === 90 ? r[12] : r[11]);
  if (n === 'rising') return base.filter(r => r[3] > 100 && pub(r[2]) >= risingSince).sort((a,b) => pub(b[2]) - pub(a[2]) || b[3] - a[3] || a[0].localeCompare(b[0]))[0];
  const o = n === 90 ? 9 : n === 1 ? 7 : n === 7 ? 5 : 3;
  return base.filter(r => r[o] > 100).sort((a,b) => b[o] - a[o] || a[0].localeCompare(b[0]))[0];
};
const top = [...new Set([pick(90), pick(30), pick(7), pick(1), pick('rising')].filter(Boolean).map(r => String(r[0])))];
console.log(`PASS: ${rows.length} rows; top-card IDs requiring live browser smoke test: ${top.join(', ')}`);
