import luoguService from '../../../src/server/luogu.js';

const { passedForUid, isValidUid } = luoguService;

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const uid = (url.searchParams.get('uid') || '').trim();
  if (!isValidUid(uid)) return json(400, { error: '请输入有效的洛谷用户 UID。' });
  try {
    return json(200, await passedForUid(uid));
  } catch (error) {
    return json(error.status || 502, { error: error.message });
  }
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
