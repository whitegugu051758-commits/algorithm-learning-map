const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Regression guard: EdgeOne serves `.mjs` as `application/octet-stream`, and browsers
// refuse to execute module scripts with a non-JavaScript MIME type. A single `.mjs`
// import therefore kills the whole ES module graph and leaves a dead HTML shell.
// Keeping the browser module graph on `.js` makes the app host-agnostic.

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const importPattern = /(?:^|[\s;])(?:import|export)\s[^'"]*?['"]([^'"]+)['"]/gm;

function localImports(file) {
  const source = read(file);
  const found = [];
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) continue;
    found.push(path.posix.join(path.posix.dirname(file), specifier));
  }
  return found;
}

function collectModuleGraph(entry) {
  const seen = new Set();
  const queue = [entry];
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const dependency of localImports(file)) queue.push(dependency);
  }
  return [...seen];
}

test('browser module graph only uses .js files', () => {
  const graph = collectModuleGraph('app.js');
  assert.ok(graph.includes('app.js'));
  assert.ok(graph.includes('src/data/knowledge-map.js'));
  assert.ok(graph.includes('src/state/storage.js'));

  for (const file of graph) {
    assert.equal(
      path.extname(file),
      '.js',
      `${file} must use .js: hosts may serve .mjs as application/octet-stream`
    );
    assert.ok(fs.existsSync(path.join(root, file)), `${file} is imported but missing`);
  }
});

test('every module in the browser graph is served as JavaScript by the local server', () => {
  const { mimeTypes } = require('../server');
  for (const file of collectModuleGraph('app.js')) {
    const type = mimeTypes[path.extname(file)];
    assert.ok(type, `no MIME type registered for ${path.extname(file)}`);
    assert.match(type, /javascript/, `${file} would be served as ${type}`);
  }
});

test('index.html references assets that exist on disk', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"(?![^>]*https?:)/g)]
    .map(match => match[1])
    .filter(ref => !/^https?:|^data:|^#/.test(ref));

  assert.ok(refs.includes('app.js'));
  assert.ok(refs.includes('styles.css'));
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(root, ref)), `index.html references missing file ${ref}`);
  }
});
