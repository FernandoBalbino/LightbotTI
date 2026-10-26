import { ITEMS, LEVELS } from './content.js';

export function attachEducationView(app) {
  const objective = app.education;
  const images = Object.fromEntries(Object.values(ITEMS).map(item => {
    const img = new Image(); img.src = item.sprite; return [item.id, img];
  }));
  let phase = 0, audioContext;
  function sound(kind) {
    if (!app.ui.media.audioEnabled || !['correct','wrong'].includes(kind)) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(kind === 'correct' ? 660 : 170, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(kind === 'correct' ? 990 : 110, audioContext.currentTime + .16);
      gain.gain.setValueAtTime(.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .22);
      oscillator.start(); oscillator.stop(audioContext.currentTime + .23);
    } catch { /* Sound is optional; the equivalent feedback is always visible. */ }
  }
  objective.onChange = kind => {
    if (objective.level === null) return;
    const level = LEVELS[objective.level];
    document.getElementById('educationCategory').textContent = `FASE ${String(objective.level + 1).padStart(2,'0')} — ${level.category}`;
    document.getElementById('educationHint').textContent = level.hint;
    document.getElementById('educationStatus').textContent = `Item correto: ${objective.collected ? 'Coletado' : 'Não coletado'}`;
    const feedback = document.getElementById('educationFeedback');
    feedback.textContent = objective.feedback;
    feedback.dataset.kind = kind || '';
    // Readable board alternatives identify all objects equally, never the correct answer.
    document.getElementById('boardDescription').textContent = 'Itens no tabuleiro: ' + objective.items.map(t => `${ITEMS[t.id].name}, coluna ${t.x + 1}, linha ${t.y + 1}`).join('; ') + '. As linhas crescem da frente para o fundo.';
    sound(kind);
  };
  app.educationStep = () => {
    phase += .045;
    if (objective.effect) { objective.effect.age += .025 * app.speedMultiplier; if (objective.effect.age > 1) objective.effect = null; }
  };
  app.drawEducationTile = (x,y) => {
    const item = objective.items.find(t => t.x === x && t.y === y);
    if (!item) return;
    const tile = app.map.getMapRef()[x][y];
    const p = app.projection.project((x + .5) * 50, tile.getHeight() * 50, (y + .5) * 50);
    const ctx = app.ctx, effect = objective.effect;
    const collected = objective.collected && item.id === LEVELS[objective.level].correct;
    const active = effect && effect.x === x && effect.y === y;
    if (collected && !active) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.27)'; ctx.beginPath(); ctx.ellipse(p.x,p.y,14,4,0,0,Math.PI*2); ctx.fill();
    const float = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(phase + x + y) * 1.3;
    let lift = float;
    if (active && collected) { ctx.globalAlpha = 1 - effect.age; lift -= effect.age * 30; }
    const img = images[item.id];
    if (img.complete && img.naturalWidth) ctx.drawImage(img, p.x - 20, p.y - 38 + lift, 40, 40);
    if (active) {
      ctx.strokeStyle = effect.correct ? '#8ef6b3' : '#ff7979'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x,p.y,16 + effect.age * 12,7 + effect.age * 5,0,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  };
}
