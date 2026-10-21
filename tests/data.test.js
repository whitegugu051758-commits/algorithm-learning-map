const test = require('node:test');
const assert = require('node:assert/strict');

let knowledge;

test.before(async () => {
  knowledge = await import('../src/data/knowledge-map.js');
});

test('knowledge map contains a non-empty, unique node set', () => {
  const { data } = knowledge;
  assert.ok(data.length >= 100);
  const ids = data.map(node => node[0]);
  assert.equal(new Set(ids).size, ids.length);
});

test('every node has a valid category, level and prerequisites', () => {
  const { categories, data } = knowledge;
  const ids = new Set(data.map(node => node[0]));
  assert.equal(categories.length, 8);
  data.forEach(node => {
    assert.equal(node.length, 9, node[0] + ' should have 9 fields');
    assert.ok(categories.includes(node[2]), node[0] + ' has an unknown category');
    assert.ok(Number.isInteger(node[3]) && node[3] >= 0 && node[3] <= 4, node[0] + ' has an invalid level');
    node[5].forEach(prerequisite => {
      assert.ok(ids.has(prerequisite), node[0] + ' references missing prerequisite ' + prerequisite);
    });
    assert.ok(node[6] && node[8], node[0] + ' is missing description text');
  });
});
