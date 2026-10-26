import placements from './placements.json' with { type: 'json' };
import { LEVELS } from './content.js';

export function createObjective({ storage }) {
  const objective = {
    level: null, seed: 0, items: [], collected: false, effect: null, feedback: '', onChange: () => {},
    load(level) {
      this.level = level;
      const raw = Number(storage.getItem('seed:' + level));
      this.seed = Number.isInteger(raw) && raw > 0 && raw <= 0xffffffff ? raw : this.newSeed();
      storage.setItem('seed:' + level, this.seed);
      storage.setItem('lastLevel', level);
      this.place(); this.reset();
    },
    newSeed() { return (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0; },
    place() {
      const data = placements[this.level];
      const config = data.configurations[this.seed % data.configurations.length];
      const ids = [...LEVELS[this.level].items];
      let state = this.seed;
      for (let i = ids.length - 1; i > 0; i--) {
        state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
        const j = (state >>> 0) % (i + 1); [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      this.items = config.map((index, i) => ({ ...data.candidates[index], id: ids[i] }));
    },
    reset() { this.collected = false; this.effect = null; this.feedback = ''; this.onChange(); },
    reroll() {
      const previous = this.seed % placements[this.level].configurations.length;
      do { this.seed = this.newSeed(); } while (this.seed % placements[this.level].configurations.length === previous);
      storage.setItem('seed:' + this.level, this.seed); this.place(); this.reset();
    },
    move(position) {
      const item = this.items.find(t => t.x === position.x && t.y === position.y);
      if (!item || (this.collected && item.id === LEVELS[this.level].correct)) return;
      const correct = item.id === LEVELS[this.level].correct;
      if (correct) this.collected = true;
      this.effect = { x: item.x, y: item.y, correct, age: 0 };
      this.feedback = correct ? 'Item correto coletado!' : 'Esse não é o item da dica!';
      this.onChange(correct ? 'correct' : 'wrong');
    },
    canLight() {
      if (this.collected) return true;
      this.feedback = 'Primeiro encontre o item correto!'; this.onChange('blocked'); return false;
    },
    getReferenceProgram() {
      const item = this.items.find(t => t.id === LEVELS[this.level].correct);
      return [...item.detour, ...placements[this.level].reference.commands];
    },
    medals() {
      const original = placements[this.level].originalMedals;
      const item = this.items.find(t => t.id === LEVELS[this.level].correct);
      const extra = item.detour.length;
      return { gold: original.gold + extra, silver: original.silver + extra,
        bronze: Math.max(original.bronze + extra, this.getReferenceProgram().length) };
    },
  };
  return objective;
}
