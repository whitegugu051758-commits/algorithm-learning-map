const { questionsForNode } = require('../src/server/problems');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const problems = await questionsForNode(
      req.query.node || '',
      req.query.category || '',
      req.query.level || '进阶'
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ source: '洛谷', problems });
  } catch (error) {
    return res.status(error.status || 502).json({ error: error.message });
  }
};
