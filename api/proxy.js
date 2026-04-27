export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let targetUrl, method, forwardBody;
    if (req.body) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      targetUrl = body._url;
      method = body._method;
      forwardBody = body._body;
    }
    if (!targetUrl && req.query) {
      targetUrl = req.query.url;
      method = req.query.method;
    }
    if (!targetUrl) return res.status(400).json({ code: -1, msg: 'Missing _url or url' });
    if (!targetUrl.startsWith('https://open.feishu.cn/'))
      return res.status(400).json({ code: -1, msg: 'Only Feishu API URLs allowed' });

    method = (method || 'GET').toUpperCase();
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;

    const fetchOpts = { method, headers, redirect: 'follow' };
    if (forwardBody && method !== 'GET' && method !== 'HEAD')
      fetchOpts.body = JSON.stringify(forwardBody);

    const response = await fetch(targetUrl, fetchOpts);
    const data = await response.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(response.status).send(data);
  } catch (err) {
    return res.status(502).json({ code: -1, msg: 'Proxy error: ' + err.message });
  }
}
