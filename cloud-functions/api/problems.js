import problemsService from '../../src/server/problems.js';

const { questionsForNode } = problemsService;

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  try {
    const problems = await questionsForNode(
      url.searchParams.get('node') || '',
      url.searchParams.get('category') || '',
      url.searchParams.get('level') || '进阶'
    );
    return json(200, { source: '洛谷', problems });
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
