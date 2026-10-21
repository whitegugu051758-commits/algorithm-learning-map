const { questionsForNode } = require('../../src/server/problems');

exports.handler = async event => {
  if (event.httpMethod !== 'GET') return reply(405, { error: 'Method not allowed' });
  const query = new URLSearchParams(event.rawQuery || '');
  try {
    const problems = await questionsForNode(
      query.get('node') || '',
      query.get('category') || '',
      query.get('level') || '进阶'
    );
    return reply(200, { source: '洛谷', problems });
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
