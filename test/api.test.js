'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp, parseCookies } = require('../src/server');
const { createStore } = require('../src/store');

const restaurants = [
  { id: 'a', name: 'Alpha', style: 'cold' },
  { id: 'b', name: 'Bravo', style: 'warm' },
];

let server;
let base;

test.beforeEach(async () => {
  server = http.createServer(createApp(createStore({ restaurants })));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.afterEach(() => new Promise((r) => server.close(r)));

const post = (path, body, headers = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('GET /api/health', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('GET /api/restaurants returns standings', async () => {
  const body = await (await fetch(`${base}/api/restaurants`)).json();
  assert.equal(body.totalVotes, 0);
  assert.equal(body.myVote, null);
  assert.equal(body.restaurants.length, 2);
});

test('POST /api/votes sets a voter cookie and records the vote', async () => {
  const res = await post('/api/votes', { restaurantId: 'b' });
  assert.equal(res.status, 200);
  const cookie = res.headers.get('set-cookie');
  assert.match(cookie, /lr_voter=.+HttpOnly/);
  const body = await res.json();
  assert.equal(body.myVote, 'b');
  assert.equal(body.totalVotes, 1);

  // Same voter re-votes: total stays at 1.
  const voter = cookie.split(';')[0];
  const again = await (await post('/api/votes', { restaurantId: 'a' }, { Cookie: voter })).json();
  assert.equal(again.totalVotes, 1);
  assert.equal(again.myVote, 'a');

  // myVote is remembered on GET.
  const get = await (await fetch(`${base}/api/restaurants`, { headers: { Cookie: voter } })).json();
  assert.equal(get.myVote, 'a');
});

test('DELETE /api/votes withdraws the vote', async () => {
  const voter = (await post('/api/votes', { restaurantId: 'a' })).headers.get('set-cookie').split(';')[0];
  const res = await fetch(`${base}/api/votes`, { method: 'DELETE', headers: { Cookie: voter } });
  const body = await res.json();
  assert.equal(body.totalVotes, 0);
  assert.equal(body.myVote, null);
});

test('rejects bad input', async () => {
  assert.equal((await post('/api/votes', { restaurantId: 'zzz' })).status, 400);
  assert.equal((await post('/api/votes', {})).status, 400);
  assert.equal((await post('/api/votes', '{not json')).status, 400);
  assert.equal((await post('/api/votes', 'x'.repeat(5000))).status, 413);
});

test('ignores forged, non-UUID voter cookies', async () => {
  const res = await post('/api/votes', { restaurantId: 'a' }, { Cookie: 'lr_voter=admin' });
  assert.match(res.headers.get('set-cookie'), /lr_voter=[0-9a-f-]{36}/);
});

test('unknown API route is 404', async () => {
  assert.equal((await fetch(`${base}/api/nope`)).status, 404);
});

test('serves the front-end and blocks path traversal', async () => {
  const home = await fetch(`${base}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html/);
  const evil = await fetch(`${base}/..%2fpackage.json`);
  assert.equal(evil.status, 403);
});

test('parseCookies', () => {
  assert.deepEqual(parseCookies('a=1; b=two'), { a: '1', b: 'two' });
  assert.deepEqual(parseCookies(''), {});
});
