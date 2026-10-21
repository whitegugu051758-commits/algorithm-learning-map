const { passedForUid, isValidUid } = require('../../src/server/luogu');

exports.handler = async event => {
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' });
  const uid = String(event.queryStringParameters?.uid || '').trim();
  if (!isValidUid(uid)) return reply(400, { error: '请输入有效的洛谷用户 UID。' });
  try {
    return reply(200, await passedForUid(uid));
  } catch (error) {
    return reply(error.status || 502, { error: error.message });
  }
};

function reply(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}
