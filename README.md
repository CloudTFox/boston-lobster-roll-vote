# Boston Lobster Roll Vote

A small, dependency-free web app for voting on the best lobster roll in Boston.
One vote per browser, changeable at any time, with a live leaderboard.

![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen) ![deps](https://img.shields.io/badge/dependencies-0-blue)

## Quick start

```bash
git clone <your-remote-url> boston-lobster-roll-vote
cd boston-lobster-roll-vote
npm start          # http://localhost:3000
npm test           # run the test suite
```

No `npm install` needed: the app uses only the Node.js standard library.

## Features

- Vote for one spot; change or withdraw your vote anytime
- Live leaderboard with vote share
- Filter by style: **cold** (Maine, mayo) or **warm** (Connecticut, butter)
- In-app help page at `/docs.html`
- JSON API, file-based persistence, full test suite, GitHub Actions CI

## Project layout

```
├── src/            server + vote store
├── public/         front-end (HTML/CSS/JS) and in-app docs page
├── data/           seed restaurants (votes.json is git-ignored)
├── test/           node:test suites
├── docs/           project documentation  ← start here
└── .github/        CI workflow, PR and issue templates
```

## Documentation

Full docs live in [`docs/`](docs/README.md):

| Doc | What's in it |
| --- | --- |
| [Getting started](docs/getting-started.md) | Install, run, configure |
| [API reference](docs/api.md) | Every endpoint with examples |
| [Architecture](docs/architecture.md) | How the pieces fit together |
| [Managing restaurants](docs/restaurants.md) | Adding or editing contenders |
| [Git workflow](docs/git-workflow.md) | Branching, commits, PRs, releases |
| [Deployment](docs/deployment.md) | Running it in production |

See also [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
