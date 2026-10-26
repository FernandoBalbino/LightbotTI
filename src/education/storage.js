// The adapter keeps the upstream models' storage contracts and isolates this game on github.io.
export function createStorage(backing) {
  const memory = new Map();
  return {
    getItem(key) { try { return backing?.getItem('lightbot-ti:v1:' + key) ?? memory.get(key) ?? null; } catch { return memory.get(key) ?? null; } },
    setItem(key, value) { memory.set(key, String(value)); try { backing?.setItem('lightbot-ti:v1:' + key, String(value)); } catch { /* Session remains playable when storage is unavailable. */ } },
    removeItem(key) { memory.delete(key); try { backing?.removeItem('lightbot-ti:v1:' + key); } catch { /* See above. */ } },
  };
}
