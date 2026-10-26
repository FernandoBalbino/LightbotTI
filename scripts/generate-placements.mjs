import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createBox } from '../src/lightbot/lightbot.model.box.js';
import { createLightBox } from '../src/lightbot/lightbot.model.lightbox.js';
import { createMap } from '../src/lightbot/lightbot.model.map.js';
import { boardFromMap, findPath, solveOriginal, key, visibility, compatible } from '../src/education/solver.js';
const Box = createBox(), LightBox = createLightBox({ Box });
let initial;
const map = createMap({ Box, LightBox, bot: { init(d, p) { initial = { ...p, d }; }, reset() {} } });
const levels = [];
for (let level = 0; level < map.getNbrOfLevels(); level++) {
  map.loadMap(level);
  const board = boardFromMap(map, LightBox), reference = solveOriginal(board, initial);
  const budget = [12, 20, 28, 36][Math.floor(level / 4)];
  const candidates = [];
  for (const tile of board) {
    if (tile.blue || reference.reserved.includes(key(tile)) || visibility(board, tile) < .95) continue;
    const to = findPath(board, initial, s => key(s) === key(tile), level >= 3);
    if (!to) continue;
    const back = findPath(board, to.s, s => key(s) === key(initial) && s.d === initial.d, level >= 3);
    if (!back || to.commands.length + back.commands.length > budget) continue;
    candidates.push({ ...tile, detour: [...to.commands, ...back.commands] });
  }
  const configurations = [];
  for (let a = 0; a < candidates.length; a++) for (let b = a + 1; b < candidates.length; b++) for (let c = b + 1; c < candidates.length; c++) {
    const group = [candidates[a], candidates[b], candidates[c]];
    if (group.every((t, i) => group.every((u, j) => i === j || compatible(t, u)))) configurations.push([a,b,c]);
  }
  if (!configurations.length) throw new Error(`Fase ${level + 1}: nenhum trio visível e válido (${candidates.length} candidatos)`);
  // All configurations are validated; keep a deterministic, spatially varied sample to bound bundle size.
  configurations.sort((a,b) => hash(a) - hash(b));
  const selected = configurations.slice(0, 128);
  levels.push({ initial, budget, reference, candidates, configurations: selected, originalMedals: map.getMedals() });
  console.log(`Fase ${level + 1}: ${candidates.length} casas visíveis, ${configurations.length} trios válidos, ${selected.length} publicados`);
}
function hash(value) { return parseInt(createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,8),16); }
fs.writeFileSync('src/education/placements.json', JSON.stringify(levels));
