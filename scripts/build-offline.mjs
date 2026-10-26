import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const directory = process.argv[2];
if (!['dist','dist-web'].includes(directory)) throw new Error('Diretório de build inválido');
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir,entry.name)) : [path.join(dir,entry.name)]); }
const assets = files(directory).filter(p => !p.endsWith('sw.js') && !path.basename(p).startsWith('.')).map(p => './' + path.relative(directory,p).replaceAll('\\','/'));
const hash = createHash('sha256');
for (const file of assets) hash.update(fs.readFileSync(path.join(directory,file)));
const version = 'lightbot-ti-' + hash.digest('hex').slice(0,12);
fs.writeFileSync(path.join(directory,'sw.js'), `const CACHE=${JSON.stringify(version)};
const ASSETS=${JSON.stringify(['./',...assets])};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('lightbot-ti-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();for(const client of await self.clients.matchAll())client.postMessage('offline-ready');})()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached)return cached;try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return await caches.match('./index.html');throw error;}})());});
`);
console.log(`${version}: ${assets.length} arquivos preparados para uso offline`);
