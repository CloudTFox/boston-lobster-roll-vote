# Architecture

```
Browser (public/)                 Node server (src/)
┌───────────────────┐   fetch    ┌──────────────────────────┐
│ index.html        │ ─────────▶ │ server.js                │
│ app.js  (state +  │  /api/*    │  ├─ API router           │
│         render)   │ ◀───────── │  └─ static file handler  │
│ docs.html         │   JSON     │         │                │
└───────────────────┘            │         ▼                │
                                 │ store.js (votes in RAM)  │
                                 └─────────┬────────────────┘
                                           │ atomic write
                                           ▼
                          data/restaurants.json (committed)
                          data/votes.json       (git-ignored)
```

## Components

### `src/store.js`
- Loads and validates the restaurant list.
- Holds votes as a `Map<voterId, restaurantId>`, which guarantees **one vote per voter**.
- Persists on every change by writing a temp file and `rename`-ing it over `votes.json`, so a crash can't leave a corrupt file.
- On load, silently drops votes for restaurants no longer in the list.
- Can run fully in memory (no `votesFile`), which the tests use.

### `src/server.js`
- Plain `node:http`, no framework.
- `createApp(store)` returns the request handler; tests mount it on a random port.
- Static files are served only from `public/`, with path-traversal protection.
- Errors are thrown as `HttpError(status, message)` and converted to JSON in one place.

### `public/`
- `app.js` keeps a single `state` object and re-renders from it after every API response.
- Contender cards are sorted alphabetically (stable while you browse); the leaderboard is sorted by votes.
- Polls `/api/restaurants` every 15s while the tab is visible.
- All user-visible strings from data are HTML-escaped.

## Design choices

| Choice | Why |
| --- | --- |
| Zero dependencies | Nothing to install or audit; clone and run |
| JSON file storage | Fine for a single-instance poll; swap `store.js` for a database if you need scale (the interface is 5 methods) |
| Cookie-based identity | No sign-up friction; good enough for a fun poll |

## Limitations

- Single process only: two server instances writing the same `votes.json` will overwrite each other.
- Determined users can vote again by clearing cookies.
