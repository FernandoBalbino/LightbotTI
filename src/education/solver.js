// Used by the build-time validator. Movement is replayed against the real upstream bot in tests.
export function boardFromMap(map, LightBox) {
  return map.getMapRef().flat().map(t => ({ x: t.x, y: t.y, h: t.height, blue: t instanceof LightBox }));
}
export const key = t => `${t.x},${t.y}`;
const stateKey = s => `${key(s)},${s.d}`;
export function neighbors(board, s, allowJump = true) {
  const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const [dx, dy] = directions[s.d];
  const from = board.find(t => t.x === s.x && t.y === s.y);
  const to = board.find(t => t.x === s.x + dx && t.y === s.y + dy);
  const out = [{ s: { ...s, d: (s.d + 1) % 4 }, command: 'turnLeft' }, { s: { ...s, d: (s.d + 3) % 4 }, command: 'turnRight' }];
  if (to) {
    const difference = to.h - from.h;
    if (difference === 0) out.push({ s: { x: to.x, y: to.y, d: s.d }, command: 'walk' });
    if (allowJump && (difference === 1 || difference < 0)) out.push({ s: { x: to.x, y: to.y, d: s.d }, command: 'jump' });
  }
  return out;
}
export function findPath(board, start, predicate, allowJump = true) {
  const queue = [{ s: start, commands: [] }], seen = new Set([stateKey(start)]);
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i];
    if (predicate(n.s)) return n;
    for (const next of neighbors(board, n.s, allowJump)) {
      if (!seen.has(stateKey(next.s))) {
        seen.add(stateKey(next.s));
        queue.push({ s: next.s, commands: [...n.commands, next.command] });
      }
    }
  }
  return null;
}
export function solveOriginal(board, start) {
  let current = start;
  const remaining = new Set(board.filter(t => t.blue).map(key));
  const reserved = new Set([key(start)]), commands = [];
  // Avoid dropping into a component from which another light cannot be reached (levels 8/15).
  while (remaining.size) {
    const next = findPath(board, current, s => remaining.has(key(s)) && [...remaining].every(k => findPath(board, s, t => key(t) === k)));
    if (!next) throw new Error('Mapa sem solução de referência');
    for (const command of next.commands) {
      current = neighbors(board, current).find(n => n.command === command).s;
      reserved.add(key(current)); commands.push(command);
    }
    remaining.delete(key(current)); commands.push('light');
  }
  return { commands, reserved: [...reserved] };
}
// Exactly the upstream projection: edge=50, height scale=0.5. No camera approximation.
export function anchor(tile) {
  return { x: .707 * (tile.x - tile.y) * 50, y: -(.321 * (tile.x + tile.y + 1) * 50 + .891 * tile.h * 25) };
}
function project(x, z, y) { return { x: .707 * (x - y) * 50, y: -(.321 * (x + y) * 50 + .891 * z * 25) }; }
function inside(point, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}
export function visibility(board, tile) {
  const p = anchor(tile);
  const later = board.filter(t => (t.x < tile.x || t.y < tile.y) && key(t) !== key(tile));
  const polygons = later.flatMap(t => [
    [[t.x,t.h,t.y],[t.x+1,t.h,t.y],[t.x+1,t.h,t.y+1],[t.x,t.h,t.y+1]],
    [[t.x,0,t.y],[t.x+1,0,t.y],[t.x+1,t.h,t.y],[t.x,t.h,t.y]],
    [[t.x,0,t.y],[t.x,t.h,t.y],[t.x,t.h,t.y+1],[t.x,0,t.y+1]],
  ].map(poly => poly.map(v => project(...v))));
  let visible = 0, total = 0;
  // Icon body plus float envelope; transparent margins/contact shadow do not obscure recognition.
  for (let x = -14; x <= 14; x += 2) for (let y = -34; y <= -7; y += 2) {
    total++; if (!polygons.some(poly => inside({ x: p.x + x, y: p.y + y }, poly))) visible++;
  }
  return visible / total;
}
export function compatible(a, b) {
  if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 2) return false;
  const p = anchor(a), q = anchor(b);
  return Math.abs(p.x - q.x) >= 40 || Math.abs(p.y - q.y) >= 42;
}
