'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** Read and parse a JSON file, returning `fallback` if it does not exist. */
function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

/**
 * Create a vote store.
 *
 * Votes are a map of voterId -> restaurantId, so each voter has at most one
 * vote. When `votesFile` is given, every change is written atomically
 * (write to temp file, then rename) so a crash never leaves a half-written file.
 *
 * @param {object} opts
 * @param {Array}  [opts.restaurants]     Restaurant list (overrides restaurantsFile)
 * @param {string} [opts.restaurantsFile] Path to restaurants JSON
 * @param {string} [opts.votesFile]       Path to persist votes; omit for in-memory
 */
function createStore({ restaurants, restaurantsFile, votesFile } = {}) {
  const list = restaurants ?? readJson(restaurantsFile, []);
  validateRestaurants(list);
  const byId = new Map(list.map((r) => [r.id, r]));

  const votes = new Map(Object.entries(votesFile ? readJson(votesFile, {}) : {}));
  // Drop votes that point at restaurants which were removed from the list.
  for (const [voter, id] of votes) if (!byId.has(id)) votes.delete(voter);

  function persist() {
    if (!votesFile) return;
    fs.mkdirSync(path.dirname(votesFile), { recursive: true });
    const tmp = `${votesFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(votes), null, 2));
    fs.renameSync(tmp, votesFile);
  }

  return {
    hasRestaurant(id) {
      return byId.has(id);
    },

    getVote(voterId) {
      return votes.get(voterId) ?? null;
    },

    castVote(voterId, restaurantId) {
      if (!byId.has(restaurantId)) throw new Error(`Unknown restaurant: ${restaurantId}`);
      votes.set(voterId, restaurantId);
      persist();
    },

    clearVote(voterId) {
      const removed = votes.delete(voterId);
      if (removed) persist();
      return removed;
    },

    /** Restaurants with vote counts, sorted by votes desc then name. */
    standings() {
      const counts = new Map(list.map((r) => [r.id, 0]));
      for (const id of votes.values()) counts.set(id, counts.get(id) + 1);
      const totalVotes = votes.size;
      const ranked = list
        .map((r) => {
          const n = counts.get(r.id);
          return { ...r, votes: n, share: totalVotes ? n / totalVotes : 0 };
        })
        .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
      return { totalVotes, restaurants: ranked };
    },
  };
}

const STYLES = new Set(['cold', 'warm', 'both']);

function validateRestaurants(list) {
  if (!Array.isArray(list)) throw new Error('Restaurants must be an array');
  const seen = new Set();
  for (const r of list) {
    if (!r || typeof r.id !== 'string' || !/^[a-z0-9-]+$/.test(r.id)) {
      throw new Error(`Invalid restaurant id: ${JSON.stringify(r && r.id)}`);
    }
    if (seen.has(r.id)) throw new Error(`Duplicate restaurant id: ${r.id}`);
    if (typeof r.name !== 'string' || !r.name) throw new Error(`Missing name for ${r.id}`);
    if (!STYLES.has(r.style)) throw new Error(`Invalid style for ${r.id}: ${r.style}`);
    seen.add(r.id);
  }
}

module.exports = { createStore, validateRestaurants };
