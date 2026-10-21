class TtlCache {
  constructor({ ttl = 30 * 60 * 1000, maxEntries = 500 } = {}) {
    this.ttl = ttl;
    this.maxEntries = maxEntries;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.time >= this.ttl) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { time: Date.now(), value });
  }

  clear() {
    this.store.clear();
  }
}

module.exports = { TtlCache };
