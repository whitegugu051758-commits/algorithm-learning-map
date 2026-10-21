const { TtlCache } = require('./cache');

const LUOGU_ORIGIN = 'https://www.luogu.com.cn';
const DEFAULT_TIMEOUT = Number(process.env.LUOGU_TIMEOUT_MS || 10000);
const pageCache = new TtlCache({ ttl: 30 * 60 * 1000, maxEntries: 500 });
const contextPattern = /<script id="lentille-context" type="application\/json">([\s\S]*?)<\/script>/;

function upstreamError(message, status = 502) {
  return Object.assign(new Error(message), { status });
}

async function fetchLuogu(path, { timeout = DEFAULT_TIMEOUT } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(LUOGU_ORIGIN + path, {
      headers: { Referer: LUOGU_ORIGIN + '/' },
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') throw upstreamError('洛谷接口请求超时，请稍后重试', 504);
    throw upstreamError('无法连接洛谷接口：' + error.message);
  } finally {
    clearTimeout(timer);
  }
}

function parseContext(html, message) {
  const match = html.match(contextPattern);
  if (!match) throw upstreamError(message);
  try {
    return JSON.parse(match[1]);
  } catch {
    throw upstreamError(message);
  }
}

async function getProblemPage(tag, difficulty, page) {
  const key = tag + ':' + difficulty + ':' + page;
  const cached = pageCache.get(key);
  if (cached) return cached;

  const query = new URLSearchParams({
    type: 'P',
    tag: String(tag),
    difficulty: String(difficulty),
    page: String(page)
  });
  const response = await fetchLuogu('/problem/list?' + query);
  if (!response.ok) throw upstreamError('洛谷题库返回 HTTP ' + response.status);
  const context = parseContext(await response.text(), '无法解析洛谷题库响应');
  const result = context.data && context.data.problems;
  if (!result || !Array.isArray(result.result)) throw upstreamError('洛谷题库暂时不可用');

  const value = { count: result.count, perPage: result.perPage, problems: result.result };
  pageCache.set(key, value);
  return value;
}

async function passedForUid(uid) {
  const response = await fetchLuogu('/user/' + encodeURIComponent(uid) + '/practice?_contentOnly=1');
  if (!response.ok) throw upstreamError('洛谷用户练习页返回 HTTP ' + response.status, response.status);
  const context = parseContext(await response.text(), '无法解析洛谷用户练习页。');
  const user = context.data && context.data.user;
  if (!user || !user.uid) throw upstreamError('没有找到该洛谷 UID。', 404);
  const passed = Array.isArray(context.data.passed) ? context.data.passed : [];
  return {
    uid: user.uid,
    name: user.name,
    passed: passed.map(problem => problem.pid),
    count: passed.length
  };
}

function isValidUid(uid) {
  return /^[1-9]\d{0,11}$/.test(String(uid));
}

function clearPageCache() {
  pageCache.clear();
}

module.exports = { fetchLuogu, parseContext, getProblemPage, passedForUid, clearPageCache, upstreamError, isValidUid };
