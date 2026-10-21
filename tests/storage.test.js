const test = require('node:test');
const assert = require('node:assert/strict');

class MemoryStorage {
  constructor(initial = {}) {
    this.map = new Map(Object.entries(initial));
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
}

test.before(() => {
  globalThis.localStorage = new MemoryStorage();
});

test.after(() => {
  delete globalThis.localStorage;
});

test('loadProgressData falls back to empty objects on corrupt storage', async () => {
  const storage = await import('../src/state/storage.js');
  localStorage.map.set(storage.STORAGE_KEYS.state, '{not json');
  localStorage.map.set(storage.STORAGE_KEYS.quizzes, '[]');
  localStorage.map.set(storage.STORAGE_KEYS.accounts, '{"luogu":123}');
  const loaded = storage.loadProgressData();
  assert.deepEqual(loaded.states, {});
  assert.deepEqual(loaded.quizzes, {});
  assert.deepEqual(loaded.accounts, { luogu: '123' });
});

test('loadProgressData drops invalid quiz records and round-trips valid data', async () => {
  const storage = await import('../src/state/storage.js');
  const validQuiz = { problems: [{ id: 'P1001', accepted: true }] };
  localStorage.map.set(storage.STORAGE_KEYS.notes, '{"array":"note"}');
  localStorage.map.set(storage.STORAGE_KEYS.quizzes, JSON.stringify({
    good: validQuiz,
    bad: { problems: [{ id: 'not-a-pid' }] }
  }));

  const loaded = storage.loadProgressData();
  assert.deepEqual(Object.keys(loaded.quizzes), ['good']);

  storage.saveProgressData({ states: { array: 'done' }, notes: loaded.notes, quizzes: loaded.quizzes });
  storage.saveAccounts({ luogu: '42' });

  assert.equal(JSON.parse(localStorage.getItem(storage.STORAGE_KEYS.state)).array, 'done');
  assert.equal(JSON.parse(localStorage.getItem(storage.STORAGE_KEYS.notes)).array, 'note');
  assert.equal(JSON.parse(localStorage.getItem(storage.STORAGE_KEYS.accounts)).luogu, '42');
});
