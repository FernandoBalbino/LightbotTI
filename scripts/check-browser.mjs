// Isolated Chromium QA; no developer hooks or mutations of the running app.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createObjective } from '../src/education/objective.js';
import { createStorage } from '../src/education/storage.js';
const base = process.argv[2] || 'http://127.0.0.1:43861/';
const quick = process.argv.includes('--quick');
const browser = await chromium.launch({channel:'chrome',headless:true});
const errors=[], results=[];
await fs.mkdir('qa-evidence',{recursive:true});
const storage=createStorage();
const init=[];
for(let level=0;level<16;level++){
  storage.setItem('seed:'+level,1);
  const goal=createObjective({storage});goal.load(level);
  init.push(['lightbot-ti:v1:seed:'+level,'1'],['lightbot-ti:v1:lightbot_program_level_'+level,JSON.stringify({version:1,program:goal.getReferenceProgram().map(type=>({type}))})]);
}
async function context(){
  const ctx=await browser.newContext({viewport:{width:1366,height:768}});
  await ctx.addInitScript(entries=>{if(!sessionStorage.getItem('qa-initialized')){for(const[k,v]of entries)localStorage.setItem(k,v);sessionStorage.setItem('qa-initialized','yes');}},init);
  return ctx;
}
async function verifyLevel(level){
  const ctx=await context(),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push({level:level+1,message:e.message}));
  page.on('console',msg=>{if(msg.type()==='error')errors.push({level:level+1,message:msg.text(),location:msg.location()});});
  await page.goto(base+'#/level/'+level);
  await page.locator('#educationHint').waitFor();
  assert.equal(await page.locator('#educationStatus').innerText(),'Item correto: Não coletado');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
  assert.ok(await page.evaluate(()=>{const c=document.getElementById('gameCanvas');return c.width>=c.clientWidth*2&&c.height>=c.clientHeight*2;}));
  await page.locator('#speedSlider').fill('3');
  await page.locator('#runButton').click();
  // Pause/resume is checked against visible UI, without bypassing the interpreter.
  await page.locator('#runButton').click();assert.match(await page.locator('#runButton').innerText(),/CONTINUAR/i);
  await page.locator('#runButton').click();
  await page.locator('#levelCompleteDialog[open]').waitFor({timeout:60000});
  assert.equal(await page.locator('#educationStatus').innerText(),'Item correto: Coletado');
  assert.match(await page.locator('#levelCompleteDialog .message').innerText(),/coletou o item correto/);
  await page.screenshot({path:`qa-evidence/${quick?'public':'local'}-victory-${level+1}.png`});
  const message=await page.locator('#levelCompleteDialog .message').innerText();
  results.push({level:level+1,completed:true,message});
  console.log(`Fase ${level+1}: coleta + luzes + vitória + pausa/continuação OK`);
  await ctx.close();
}
try {
  const levels=quick?[0]:[0,7,11,14,15];
  // Bound concurrent isolated browsers to keep verification reproducible on this workstation.
  let cursor=0;
  await Promise.all(Array.from({length:Math.min(3,levels.length)},async()=>{while(cursor<levels.length)await verifyLevel(levels[cursor++]);}));
  const ctx=await context(),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push({scenario:'editor/offline',message:e.message}));
  await page.goto(base+'#/level/0');await page.locator('#clearButton').click();
  const palette=page.locator('#instructionsContainer');
  await palette.locator('p.repeat').click();
  await page.locator('#mainProgram > li > p.repeat .lb-instruction-label').click();
  await page.getByRole('button',{name:'Inserir dentro',exact:true}).click();
  await palette.locator('p.repeat').click();
  await page.locator('#mainProgram > li > .lb-repeat-body p.repeat .lb-instruction-label').click();
  await page.getByRole('button',{name:'Inserir dentro',exact:true}).click();
  await palette.locator('p.walk').press('Enter');
  assert.equal(await page.locator('#mainProgram .lb-repeat-body .lb-repeat-body p.walk').count(),1);
  await page.locator('#mainProgram p.walk .lb-instruction-label').click();
  await page.getByRole('button',{name:'Sair',exact:true}).click();
  assert.equal(await page.locator('#mainProgram > li > .lb-repeat-body > div > ul > li > p.walk').count(),1);
  await page.getByRole('button',{name:'Mover comando para cima',exact:true}).click();
  assert.equal(await page.locator('#mainProgram > li > .lb-repeat-body ul > li').first().locator(':scope > p.walk').count(),1);
  await page.reload();assert.equal(await page.locator('#mainProgram p.walk').count(),1);
  const objects=await page.locator('#boardDescription').innerText();
  await page.reload();assert.equal(await page.locator('#boardDescription').innerText(),objects);
  await page.locator('#rerollButton').click();assert.notEqual(await page.locator('#boardDescription').innerText(),objects);
  await page.locator('#clearButton').click();
  await palette.locator('p.walk').dragTo(page.locator('#mainProgram'));
  assert.equal(await page.locator('#mainProgram p.walk').count(),1);
  await page.locator('#mainProgram .lb-instruction-delete').click();assert.equal(await page.locator('#mainProgram > li').count(),0);
  await page.setViewportSize({width:1920,height:1080});
  await page.goto(base+'#/level/15');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
  await page.screenshot({path:`qa-evidence/${quick?'public':'local'}-1920.png`});
  await page.waitForFunction(()=>document.getElementById('offlineStatus').textContent==='Disponível offline');
  const stableItems=await page.locator('#boardDescription').innerText();
  await ctx.setOffline(true);await page.reload();
  await page.locator('#educationHint').waitFor();assert.equal(await page.locator('#boardDescription').innerText(),stableItems);
  assert.equal(await page.locator('#mainProgram > li').count(),createObjectiveProgramLength(15));
  await page.screenshot({path:`qa-evidence/${quick?'public':'local'}-offline.png`});
  await ctx.setOffline(false);
  await page.goto(base+'#/help');await page.locator('#playTutorial').click();
  await page.waitForFunction(()=>document.getElementById('tutorialStatus').textContent.includes('Demonstração concluída'),{timeout:15000});
  assert.equal(await page.locator('#videoPlayer').count(),0);
  console.log('Editor: clique/teclado, repetições aninhadas, reordenação, arrastar/excluir, persistência e novo sorteio OK');
  console.log('1920×1080, recarga offline, sprites locais e demonstração localizada OK');
  await ctx.close();
  assert.deepEqual(errors,[]);
} finally {
  await fs.writeFile(`qa-evidence/${quick?'public':'local'}-browser-report.json`,JSON.stringify({base,results,errors},null,2));
  await browser.close();
}
function createObjectiveProgramLength(level){const objective=createObjective({storage});objective.load(level);return objective.getReferenceProgram().length;}
