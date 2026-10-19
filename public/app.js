'use strict';

const state = { restaurants: [], totalVotes: 0, myVote: null, filter: 'all', busy: false };

const $ = (sel) => document.querySelector(sel);
const STYLE_LABEL = { cold: 'Cold', warm: 'Warm', both: 'Hot or cold' };

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function apply(data) {
  state.restaurants = data.restaurants;
  state.totalVotes = data.totalVotes;
  state.myVote = data.myVote;
  render();
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

function matchesFilter(r) {
  return state.filter === 'all' || r.style === state.filter || r.style === 'both';
}

function renderGrid() {
  // Cards stay in alphabetical order so they don't jump around as votes change.
  const cards = [...state.restaurants]
    .filter(matchesFilter)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => {
      const picked = r.id === state.myVote;
      return `
        <article class="card${picked ? ' picked' : ''}">
          <h3>${escapeHtml(r.name)}</h3>
          <div class="meta">
            <span>${escapeHtml(r.neighborhood || '')}</span>
            <span class="badge ${r.style}">${STYLE_LABEL[r.style]}</span>
          </div>
          <p>${escapeHtml(r.blurb || '')}</p>
          <footer>
            <span class="count">${r.votes} vote${r.votes === 1 ? '' : 's'}</span>
            <button class="btn${picked ? ' ghost' : ''}" data-vote="${r.id}" ${state.busy ? 'disabled' : ''}
              aria-pressed="${picked}">${picked ? 'Your pick ✓' : 'Vote'}</button>
          </footer>
        </article>`;
    });
  $('#grid').innerHTML = cards.join('') || '<p>No spots match this filter.</p>';
}

function renderBoard() {
  const { restaurants, totalVotes } = state;
  $('#total').textContent = totalVotes === 0
    ? 'No votes yet. Be the first!'
    : `${totalVotes} vote${totalVotes === 1 ? '' : 's'} cast`;

  const top = restaurants[0]?.votes || 0;
  $('#leaderboard').innerHTML = restaurants
    .map((r, i) => {
      const pct = Math.round(r.share * 100);
      const width = top ? (r.votes / top) * 100 : 0;
      return `
        <li class="row${i === 0 && top > 0 ? ' leader' : ''}">
          <span class="rank">${i + 1}</span>
          <span class="name">${escapeHtml(r.name)}</span>
          <span class="count">${pct}%</span>
          <span class="bar"><span style="width:${width}%"></span></span>
        </li>`;
    })
    .join('');

  const mine = restaurants.find((r) => r.id === state.myVote);
  $('#my-vote').innerHTML = mine
    ? `You voted for <strong>${escapeHtml(mine.name)}</strong>. <button class="linkish" id="withdraw">Withdraw vote</button>`
    : '';
}

function render() {
  renderGrid();
  renderBoard();
}

async function vote(id) {
  if (state.busy) return;
  state.busy = true;
  render();
  try {
    if (id === state.myVote) {
      apply(await api('DELETE', '/api/votes'));
      toast('Vote withdrawn');
    } else {
      apply(await api('POST', '/api/votes', { restaurantId: id }));
      const name = state.restaurants.find((r) => r.id === id)?.name;
      toast(`Voted for ${name}`);
    }
  } catch (err) {
    toast(err.message);
  } finally {
    state.busy = false;
    render();
  }
}

document.addEventListener('click', (e) => {
  const voteBtn = e.target.closest('[data-vote]');
  if (voteBtn) return vote(voteBtn.dataset.vote);

  if (e.target.id === 'withdraw') return vote(state.myVote);

  const chip = e.target.closest('[data-filter]');
  if (chip) {
    state.filter = chip.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((c) =>
      c.setAttribute('aria-pressed', String(c === chip)));
    renderGrid();
  }
});

async function refresh() {
  try {
    apply(await api('GET', '/api/restaurants'));
  } catch (err) {
    $('#total').textContent = 'Could not load results.';
  }
}

refresh();
// Keep the leaderboard fresh while the tab is visible.
setInterval(() => { if (!document.hidden && !state.busy) refresh(); }, 15000);
