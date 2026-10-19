# Getting started

## Requirements

- **Node.js 20+** (22 recommended; see `.nvmrc`)
- Git

There are **no npm dependencies**. The server uses only the Node standard library.

## Run locally

```bash
git clone <your-remote-url> boston-lobster-roll-vote
cd boston-lobster-roll-vote
nvm use            # optional, picks Node from .nvmrc
npm start
```

Open <http://localhost:3000>.

For auto-restart on file changes:

```bash
npm run dev
```

## Configuration

Set via environment variables (copy `.env.example` as a reference):

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Port to listen on |
| `VOTES_FILE` | `data/votes.json` | Where votes are persisted (relative to project root, or absolute) |

```bash
PORT=8080 VOTES_FILE=/var/lib/lobster/votes.json npm start
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the server |
| `npm run dev` | Start with `node --watch` |
| `npm test` | Run all tests (`node:test`) |
| `npm run lint` | Syntax-check source files |

## Resetting votes

Stop the server and delete `data/votes.json`.
