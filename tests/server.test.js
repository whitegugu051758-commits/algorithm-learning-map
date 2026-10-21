const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { TtlCache } = require('../src/server/cache');
const { parseContext, isValidUid } = require('../src/server/luogu');
const { selectProblems } = require('../src/server/problems');
const { resolveStaticPath } = require('../server');

const html = payload =>
  '<script id="lentille-context" type="application/json">' + JSON.stringify(payload) + '</script>';

test('parseContext extracts lentille JSON payload', () => {
  const context = parseContext(html({ data: { user: { uid: 2 } } }), 'parse failed');
  assert.equal(context.data.user.uid, 2);
});

test('parseContext throws a 502 error on malformed markup', () => {
  assert.throws(() => parseContext('<html></html>', 'parse failed'), error => {
    assert.equal(error.message, 'parse failed');
    assert.equal(error.status, 502);
    return true;
  });
});

test('isValidUid accepts positive numeric UIDs and rejects others', () => {
  assert.equal(isValidUid('2'), true);
  assert.equal(isValidUid('123456789012'), true);
  assert.equal(isValidUid('0'), false);
  assert.equal(isValidUid('abc'), false);
  assert.equal(isValidUid('1234567890123'), false);
});

test('TtlCache expires values and enforces a size limit', async () => {
  const cache = new TtlCache({ ttl: 5, maxEntries: 2 });
  cache.set('a', 1);
  cache.set('b', 2);
  assert.equal(cache.get('a'), 1);
  cache.set('c', 3);
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.get('b'), 2);
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(cache.get('b'), undefined);
});

test('selectProblems returns 10 problems and prefers up to 4 templates', () => {
  const found = new Map();
  for (let i = 0; i < 12; i++) {
    const pid = 'P' + (1000 + i);
    found.set(pid, {
      pid,
      name: i < 6 ? '模板 ' + i : '普通题 ' + i,
      difficulty: 2,
      tags: []
    });
  }
  const picked = selectProblems(found);
  assert.equal(picked.length, 10);
  const templates = picked.filter(problem => /模板/.test(problem.name));
  assert.ok(templates.length >= 1 && templates.length <= 4);
  assert.equal(new Set(picked.map(problem => problem.pid)).size, 10);
});

test('resolveStaticPath serves project files and blocks traversal', () => {
  assert.equal(resolveStaticPath('/'), path.join(__dirname, '..', 'index.html'));
  assert.equal(resolveStaticPath('/app.js'), path.join(__dirname, '..', 'app.js'));
  assert.equal(resolveStaticPath('/../etc/passwd'), null);
  assert.equal(resolveStaticPath('/%2e%2e/%2e%2e/etc/passwd'), null);
  assert.equal(resolveStaticPath('/%E0%A4%A'), null);
});
