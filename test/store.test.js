'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore, validateRestaurants } = require('../src/store');

const sample = [
  { id: 'a', name: 'Alpha', style: 'cold' },
  { id: 'b', name: 'Bravo', style: 'warm' },
];

test('starts with zero votes', () => {
  const s = createStore({ restaurants: sample });
  const { totalVotes, restaurants } = s.standings();
  assert.equal(totalVotes, 0);
  assert.ok(restaurants.every((r) => r.votes === 0 && r.share === 0));
});

test('one vote per voter; re-voting moves the vote', () => {
  const s = createStore({ restaurants: sample });
  s.castVote('v1', 'a');
  s.castVote('v1', 'b');
  const { totalVotes, restaurants } = s.standings();
  assert.equal(totalVotes, 1);
  assert.equal(restaurants[0].id, 'b');
  assert.equal(restaurants[0].votes, 1);
  assert.equal(s.getVote('v1'), 'b');
});

test('ranks by votes then name', () => {
  const s = createStore({ restaurants: sample });
  s.castVote('v1', 'b');
  s.castVote('v2', 'b');
  s.castVote('v3', 'a');
  const ids = s.standings().restaurants.map((r) => r.id);
  assert.deepEqual(ids, ['b', 'a']);
  assert.equal(s.standings().restaurants[0].share, 2 / 3);
});

test('clearVote removes a vote', () => {
  const s = createStore({ restaurants: sample });
  s.castVote('v1', 'a');
  assert.equal(s.clearVote('v1'), true);
  assert.equal(s.clearVote('v1'), false);
  assert.equal(s.standings().totalVotes, 0);
});

test('rejects unknown restaurants', () => {
  const s = createStore({ restaurants: sample });
  assert.throws(() => s.castVote('v1', 'nope'), /Unknown restaurant/);
});

test('persists votes to disk and reloads them', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lr-'));
  const votesFile = path.join(dir, 'votes.json');
  createStore({ restaurants: sample, votesFile }).castVote('v1', 'a');
  const reloaded = createStore({ restaurants: sample, votesFile });
  assert.equal(reloaded.getVote('v1'), 'a');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('drops persisted votes for removed restaurants', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lr-'));
  const votesFile = path.join(dir, 'votes.json');
  fs.writeFileSync(votesFile, JSON.stringify({ v1: 'gone', v2: 'a' }));
  const s = createStore({ restaurants: sample, votesFile });
  assert.equal(s.standings().totalVotes, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('validates restaurant data', () => {
  assert.throws(() => validateRestaurants([{ id: 'A B', name: 'x', style: 'cold' }]), /Invalid restaurant id/);
  assert.throws(() => validateRestaurants([...sample, sample[0]]), /Duplicate/);
  assert.throws(() => validateRestaurants([{ id: 'x', name: 'X', style: 'lukewarm' }]), /Invalid style/);
});

test('seed data file is valid', () => {
  const file = path.join(__dirname, '..', 'data', 'restaurants.json');
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.doesNotThrow(() => validateRestaurants(list));
  assert.ok(list.length >= 5);
});
