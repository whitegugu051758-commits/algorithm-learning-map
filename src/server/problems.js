const { getProblemPage, upstreamError } = require('./luogu');

const nodeTags = {
  complexity: [110], array: [1], prefix: [254], sort: [113], twoptr: [345],
  recursion: [54], 'binary-search': [45], greedy: [7], backtrack: [4, 128],
  'divide-conquer': [112], stack: [287], queue: [288], 'mono-queue': [56],
  'linked-list': [360], hash: [473, 235], heap: [51], 'binary-tree': [208],
  bst: [50], 'union-find': [47], 'rollback-dsu': [47], 'li-chao': [377],
  trie: [300], 'sparse-table': [290], fenwick: [53], 'segment-tree': [42],
  treap: [50], 'persistent-segtree': [233], 'graph-model': [155],
  'dfs-bfs': [158], components: [175], 'tree-basics': [208], topo: [159],
  bipartite: [187], dijkstra: [160], 'bellman-ford': [174], floyd: [476],
  mst: [166], kruskal: [166], prim: [166], lowlink: [180], 'tarjan-scc': [180],
  bridges: [181], 'vertex-bcc': [181], 'edge-bcc': [181], euler: [182],
  lca: [211], 'tree-diameter': [213], 'scc-dag': [179], matching: [187],
  flow: [79], 'min-cost-flow': [204], 'tree-tour': [208], hld: [228],
  centroid: [49], 'dp-intro': [3], 'linear-dp': [444], lis: [3, 444],
  lcs: [2, 3], 'knapsack-01': [139], 'knapsack-complete': [139],
  'knapsack-multi': [139], 'knapsack-group': [139], 'digit-dp': [141],
  'interval-dp': [144], 'tree-dp': [152], 'bitmask-dp': [464],
  'dag-dp': [3], 'prob-dp': [266], 'monotone-dp': [56, 146],
  'divide-dp': [146], 'reroot-dp': [152], 'sos-dp': [464],
  'cht-dp': [150], modular: [72], gcd: [241], prime: [239], inverse: [276],
  comb: [253], 'sieve-func': [475], 'linear-basis': [277], matrix: [272],
  crt: [250], ntt: [324], gaussian: [274], 'game-theory': [445],
  'string-basics': [2], kmp: [302], 'z-function': [474], 'string-hash': [235],
  manacher: [329], ac: [301], 'suffix-array': [303], sam: [101],
  eertree: [325], 'geometry-basic': [286], 'segment-intersection': [293],
  'convex-hull': [291], 'rotating-calipers': [299], mo: [41],
  'sqrt-decomp': [289, 371], offline: [447], bitmask: [314],
  randomized: [309], 'offline-connectivity': [446], 'divide-conquer-tree': [49]
};

const categoryTags = {
  '基础与技巧': [110, 1], '数据结构': [44, 11], '搜索与图论': [6],
  '动态规划': [3], '数学与数论': [5], '字符串': [2],
  '计算几何': [8], '高级专题': [308]
};

const difficultyCaps = { '入门': 2, '基础': 3, '进阶': 4, '挑战': 5 };
const difficultyNames = ['未评定', '入门', '普及-', '普及/提高-', '普及+/提高', '提高+/省选-', '省选/NOI-', 'NOI/NOI+/CTSC'];
const MAX_TAGS = 5;
const QUIZ_SIZE = 10;
const TEMPLATE_PATTERN = /模板|template/i;

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function selectProblems(found) {
  const problems = [...found.values()];
  const templates = shuffle(problems.filter(p => TEMPLATE_PATTERN.test(p.name)));
  const others = shuffle(problems.filter(p => !TEMPLATE_PATTERN.test(p.name)));
  const templatePick = templates.slice(0, Math.min(4, templates.length));
  const remainder = [...others, ...templates.slice(templatePick.length)];
  return shuffle([...templatePick, ...remainder.slice(0, QUIZ_SIZE - templatePick.length)]);
}

async function questionsForNode(id, category, level) {
  const tags = [...new Set([...(nodeTags[id] || []), ...(categoryTags[category] || [110])])];
  const maxDifficulty = difficultyCaps[level] || 4;
  const found = new Map();

  for (const tag of tags) {
    const firstPages = await Promise.all(
      Array.from({ length: maxDifficulty }, (_, i) => getProblemPage(tag, i + 1, 1))
    );
    for (let difficulty = 1; difficulty <= maxDifficulty; difficulty++) {
      const first = firstPages[difficulty - 1];
      if (!first.perPage) continue;
      const pages = Math.ceil(first.count / first.perPage);
      const randomPage = pages > 1 ? 1 + Math.floor(Math.random() * pages) : 1;
      const page = randomPage === 1 ? first : await getProblemPage(tag, difficulty, randomPage);
      page.problems.forEach(problem => {
        if (problem.pid && problem.difficulty > 0 && problem.difficulty <= maxDifficulty && Array.isArray(problem.tags) && problem.tags.length <= MAX_TAGS) {
          found.set(problem.pid, problem);
        }
      });
    }
    if (found.size >= QUIZ_SIZE) break;
  }

  if (found.size < QUIZ_SIZE) throw upstreamError('该知识点在当前难度范围内题量不足，请稍后重试');
  return selectProblems(found).map(problem => ({
    id: problem.pid,
    name: problem.name,
    difficulty: problem.difficulty,
    difficultyName: difficultyNames[problem.difficulty] || '未评定',
    tags: problem.tags,
    url: 'https://www.luogu.com.cn/problem/' + encodeURIComponent(problem.pid)
  }));
}

module.exports = {
  nodeTags,
  categoryTags,
  difficultyCaps,
  difficultyNames,
  questionsForNode,
  selectProblems
};
