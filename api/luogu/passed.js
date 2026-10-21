const { passedForUid, isValidUid } = require('../../src/server/luogu');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const uid = String(req.query.uid || '').trim();
  if (!isValidUid(uid)) return res.status(400).json({ error: '请输入有效的洛谷用户 UID。' });
  try {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(await passedForUid(uid));
  } catch (error) {
    return res.status(error.status || 502).json({ error: error.message });
  }
};
