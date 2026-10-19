'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createStore } = require('./store');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const VOTER_COOKIE = 'lr_voter';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_BODY_BYTES = 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function getVoterId(req) {
  const id = parseCookies(req.headers.cookie)[VOTER_COOKIE];
  return id && UUID_RE.test(id) ? id : null;
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': MIME['.json'],
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        // Keep draining (but discard) so the client can still read our 413.
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) return reject(new HttpError(413, 'Request body too large'));
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new HttpError(400, 'Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, url, store) {
  let voterId = getVoterId(req);
  const myVote = () => (voterId ? store.getVote(voterId) : null);

  switch (`${req.method} ${url.pathname}`) {
    case 'GET /api/health':
      return sendJson(res, 200, { status: 'ok' });

    case 'GET /api/restaurants':
      return sendJson(res, 200, { ...store.standings(), myVote: myVote() });

    case 'POST /api/votes': {
      const body = await readJsonBody(req);
      const id = body && body.restaurantId;
      if (typeof id !== 'string' || !store.hasRestaurant(id)) {
        throw new HttpError(400, 'Unknown or missing restaurantId');
      }
      const headers = {};
      if (!voterId) {
        voterId = crypto.randomUUID();
        headers['Set-Cookie'] =
          `${VOTER_COOKIE}=${voterId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
      }
      store.castVote(voterId, id);
      return sendJson(res, 200, { ...store.standings(), myVote: id }, headers);
    }

    case 'DELETE /api/votes':
      if (voterId) store.clearVote(voterId);
      return sendJson(res, 200, { ...store.standings(), myVote: null });

    default:
      throw new HttpError(404, 'Not found');
  }
}

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    throw new HttpError(405, 'Method not allowed');
  }
  let rel;
  try {
    rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  } catch {
    throw new HttpError(400, 'Bad path');
  }
  const file = path.resolve(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) throw new HttpError(403, 'Forbidden');

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

/** Build the request handler. Exported so tests can mount it on any port. */
function createApp(store) {
  return async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url, store);
      return serveStatic(req, res, url);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      if (!res.headersSent) {
        sendJson(res, status, { error: status === 500 ? 'Internal server error' : err.message });
      }
    }
  };
}

if (require.main === module) {
  const store = createStore({
    restaurantsFile: path.join(ROOT, 'data', 'restaurants.json'),
    votesFile: path.resolve(ROOT, process.env.VOTES_FILE || 'data/votes.json'),
  });
  const port = Number(process.env.PORT) || 3000;
  http.createServer(createApp(store)).listen(port, () => {
    console.log(`Boston Lobster Roll Vote running at http://localhost:${port}`);
  });
}

module.exports = { createApp, parseCookies };
