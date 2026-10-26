import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import placements from '../src/education/placements.json' with { type: 'json' };
import { LEVELS, ITEMS } from '../src/education/content.js';
import { createStorage } from '../src/education/storage.js';
import { createObjective } from '../src/education/objective.js';
import { boardFromMap, findPath, key, visibility, compatible } from '../src/education/solver.js';
import { createBox } from '../src/lightbot/lightbot.model.box.js';
import { createLightBox } from '../src/lightbot/lightbot.model.lightbox.js';
import { createMap } from '../src/lightbot/lightbot.model.map.js';
import { createMapState } from '../src/lightbot/lightbot.model.map.state.js';
import { createDirections } from '../src/lightbot/lightbot.model.directions.js';
import { createBotInstructions } from '../src/lightbot/lightbot.model.bot.instructions.js';
import { createBot } from '../src/lightbot/lightbot.model.bot.js';
import { LIGHTBOT_TRANSLATIONS_EN as en } from '../src/locales/translations.en.js';
import { LIGHTBOT_TRANSLATIONS_PT_BR as pt } from '../src/locales/translations.pt-BR.js';

function model(level = 0, storage = createStorage()) {
  const education = createObjective({ storage });
  const Box = createBox(), LightBox = createLightBox({ Box }), instructions = createBotInstructions();
  let map;
  const bot = createBot({ directions: createDirections(), getMap: () => map, instructions, LightBox,
    onMove: position => education.move(position), canLight: () => education.canLight() });
  map = createMap({ bot, Box, LightBox });
  map.state = createMapState({ map, LightBox, education });
  map.loadMap(level); education.load(level);
  return { map, bot, education, LightBox, instructions };
}
const types = { walk:'WalkInstruction', jump:'JumpInstruction', turnLeft:'TurnLeftInstruction', turnRight:'TurnRightInstruction', light:'LightInstruction' };
function run(m, program) {
  m.bot.queueInstructions(program.map(name => new m.instructions[types[name]]())); m.bot.execute();
  let blocked = 0, premature = 0;
  while (m.bot.hasNextInstruction()) {
    const previous = { ...m.bot.currentPos };
    const next = m.bot.executeNextInstruction();
    if (['walk','jump'].includes(next.name) && key(previous) === key(m.bot.currentPos)) blocked++;
    if (next.name === 'light' && !m.education.collected) premature++;
  }
  return { blocked, premature };
}
test('01–02: exactly 16 levels and byte-equivalent upstream geometry, including the final map', () => {
  assert.equal(LEVELS.length,16); assert.equal(placements.length,16); assert.equal(model().map.getNbrOfLevels(),16);
  const source = fs.readFileSync('src/lightbot/lightbot.model.map.js','utf8').replaceAll('\r\n','\n');
  const gitBlob = createHash('sha1').update(`blob ${Buffer.byteLength(source)}\0`).update(source).digest('hex');
  assert.equal(gitBlob,'5bf9388b400c75b8153dea9b41eccde5ca651c1e');
  const sprite = fs.readFileSync('public/img/sprites.png');
  assert.equal(createHash('sha1').update(`blob ${sprite.length}\0`).update(sprite).digest('hex'),'c1f5be31aaf3c8778f73c96b81b35e72fbfea144');
});
test('03–09,19: every published layout has three visible, spaced, reachable items off the original route', () => {
  for (let level = 0; level < 16; level++) {
    const m=model(level), board=boardFromMap(m.map,m.LightBox), data=placements[level];
    assert.equal(LEVELS[level].items.length,3);
    assert.equal(new Set(LEVELS[level].items).size,3);
    assert.equal(LEVELS[level].items.filter(id=>id===LEVELS[level].correct).length,1);
    for (const group of data.configurations) {
      assert.equal(new Set(group).size,3);
      const items=group.map(i=>data.candidates[i]);
      for (const item of items) {
        assert.ok(board.some(t=>key(t)===key(item)&&t.h===item.h&&!t.blue));
        assert.notEqual(key(item),key(data.initial));
        assert.ok(!data.reference.reserved.includes(key(item)));
        assert.ok(visibility(board,item)>=.95);
        assert.ok(item.detour.length<=data.budget);
        if(level<3) assert.ok(!item.detour.includes('jump'));
      }
      assert.ok(items.every((a,i)=>items.every((b,j)=>i===j||compatible(a,b))));
    }
  }
});
test('20: all 2,048 layouts and each of their three possible correct positions finish in the real engine', () => {
  let cases=0;
  for(let level=0;level<16;level++) for(const group of placements[level].configurations) for(let correctPosition=0;correctPosition<3;correctPosition++) {
    const m=model(level), ids=[...LEVELS[level].items];
    [ids[0],ids[correctPosition]]=[ids[correctPosition],ids[0]];
    m.education.items=group.map((index,i)=>({...placements[level].candidates[index],id:ids[i]}));
    assert.deepEqual(run(m,m.education.getReferenceProgram()),{blocked:0,premature:0},`phase ${level+1}`);
    assert.equal(m.map.state.isComplete(),true);
    assert.ok(m.education.medals().bronze>=m.bot.getNumberOfInstructions()); cases++;
  }
  assert.equal(cases,6144);
});
test('10: wrong item persists, does not collect or reveal the answer, and the program continues', () => {
  const m=model(); const wrong=m.education.items.find(t=>t.id!==LEVELS[0].correct);
  const correct=m.education.items.find(t=>t.id===LEVELS[0].correct);
  const route=findPath(boardFromMap(m.map,m.LightBox).filter(t=>key(t)!==key(correct)),{...m.bot.currentPos,d:m.bot.direction},s=>key(s)===key(wrong));
  assert.ok(route);
  run(m,[...route.commands,'turnLeft']);
  assert.equal(m.education.collected,false); assert.equal(m.education.items.length,3);
  assert.equal(m.education.feedback,'Esse não é o item da dica!'); assert.equal(m.bot.hasNextInstruction(),false);
  assert.equal(m.bot.direction,(route.s.d+1)%4);
});
test('11–14: automatic collection gates lights and completion, keeping upstream toggle behavior', () => {
  const m=model(), correct=m.education.items.find(t=>t.id===LEVELS[0].correct);
  const light=m.map.getMapRef().flat().find(t=>t instanceof m.LightBox);
  m.bot.currentPos={x:light.x,y:light.y}; m.bot.light();
  assert.equal(light.lightOn,false); assert.equal(m.education.feedback,'Primeiro encontre o item correto!');
  m.map.reset();run(m,correct.detour);
  assert.equal(m.education.collected,true); assert.equal(m.map.state.isComplete(),false);
  m.map.reset();m.education.reset();run(m,m.education.getReferenceProgram());
  assert.equal(m.map.state.isComplete(),true);
  m.bot.currentPos={x:light.x,y:light.y};m.bot.light(); assert.equal(light.lightOn,false);
});
test('15–16: reset restores attempt while seed survives reload; reroll changes the layout', () => {
  const storage=createStorage(), m=model(11,storage), items=JSON.stringify(m.education.items), seed=m.education.seed;
  run(m,m.education.getReferenceProgram());m.map.reset();m.education.reset();
  assert.equal(m.education.collected,false);assert.equal(m.education.items.length,3);
  assert.equal(m.map.state.allLightsOn(),false); assert.deepEqual(m.bot.currentPos,m.bot.startingPos);
  assert.equal(JSON.stringify(m.education.items),items);
  const reloaded=model(11,storage);assert.equal(reloaded.education.seed,seed);assert.equal(JSON.stringify(reloaded.education.items),items);
  reloaded.education.reroll();assert.notEqual(JSON.stringify(reloaded.education.items),items);
  assert.equal(storage.getItem('lastLevel'),'11');
});
test('17: nested repeats collect using the same actual movement hooks', () => {
  const m=model(), target=m.education.items.find(t=>t.id===LEVELS[0].correct);
  m.bot.queueInstructions([new m.instructions.RepeatInstruction(1,[new m.instructions.RepeatInstruction(1,target.detour.map(c=>new m.instructions[types[c]]()))])]);
  m.bot.execute();while(m.bot.hasNextInstruction())m.bot.executeNextInstruction(); assert.equal(m.education.collected,true);
});
test('18: pt-BR covers every upstream key and all nineteen local sprites exist', () => {
  function check(a,b){for(const [k,v]of Object.entries(a)){assert.ok(k in b,k);if(typeof v==='object')check(v,b[k]);else assert.ok(typeof b[k]==='string'&&b[k].length);}}
  check(en,pt);assert.equal(Object.keys(ITEMS).length,19);
  for(const item of Object.values(ITEMS)){assert.ok(fs.existsSync('public/'+item.sprite));assert.ok(fs.readFileSync('public/'+item.sprite,'utf8').includes('<svg'));}
  const init=fs.readFileSync('src/lightbot/lightbot.view.canvas.ui.translate.js','utf8');assert.ok(init.includes('FALLBACK_LANGUAGE = "pt-BR"'));assert.ok(!init.includes('translations.en.js'));
  for(const level of LEVELS)assert.ok(!level.category.includes(ITEMS[level.correct].name));
});
test('blocked movement never collects and safe storage stays playable when persistence is denied', () => {
  const storage=createStorage({getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}});
  const m=model(0,storage);m.bot.currentPos={x:0,y:0};m.bot.direction=3;m.bot.walk();assert.equal(m.education.collected,false);
  assert.ok(storage.getItem('seed:0'));assert.equal(m.education.items.length,3);
});
