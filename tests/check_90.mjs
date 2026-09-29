import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(html.includes('id="b90"'),'90 Days control missing');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context={window:{},document:{querySelectorAll:()=>[],getElementById:()=>({textContent:'',classList:{add(){}},dataset:{}}),documentElement:{dataset:{}}},localStorage:{getItem:()=>null,setItem(){}},fetch:()=>Promise.reject(new Error('synthetic test: no network')),Image:class{}};
vm.createContext(context);vm.runInContext(script,context);
// Explicitly SYNTHETIC membership fixture; never production source.
vm.runInContext(`D.splice(0,D.length,
['legacy','a','09/28/26',500,'5k',300,'3k',150,'1k',900,'9k',true,false],
['90only','b','09/28/26',800,'8k',400,'4k',200,'2k',1500,'15k',false,true],
['both','c','09/28/26',600,'6k',350,'3k',175,'1k',1200,'12k',true,true]);window.__RISING_SINCE='2026-09-22';`,context);
for(const view of [1,7,30,'rising'])assert.deepEqual(Array.from(vm.runInContext(`listFor(${JSON.stringify(view)}).map(v=>v[0])`,context)).sort(),['both','legacy']);
assert.deepEqual(Array.from(vm.runInContext('listFor(90).map(v=>v[0])',context)),['90only','both']);
console.log('PASS: independent 90-day membership and preserved legacy views');
