# Git workflow

## Repository setup

This project ships as a Git repository with history. To publish it:

```bash
git remote add origin git@github.com:<you>/boston-lobster-roll-vote.git
git push -u origin main --tags
```

What's already configured:

| File | Purpose |
| --- | --- |
| `.gitignore` | Excludes `node_modules/`, `data/votes.json`, `.env`, OS/editor files |
| `.gitattributes` | Normalizes line endings to LF |
| `.editorconfig` | Consistent indentation across editors |
| `.github/workflows/ci.yml` | Runs lint + tests on every push and PR (Node 20 and 22) |
| `.github/pull_request_template.md` | PR checklist |
| `.github/ISSUE_TEMPLATE/` | Bug report, feature request, and "nominate a spot" templates |
| `.coderabbit.yaml` | AI code review configuration for pull requests |

## Branching

`main` is always deployable. Work on short-lived branches:

| Prefix | Use for |
| --- | --- |
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `data/` | Restaurant list changes |
| `chore/` | Tooling, CI, refactors |

```bash
git switch -c feat/share-results
```

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary in imperative mood>

feat: add share button to leaderboard
fix: prevent double vote on rapid clicks
docs: document VOTES_FILE variable
data: add Belle Isle Seafood
```

Types: `feat`, `fix`, `docs`, `data`, `test`, `refactor`, `chore`, `ci`.

## Pull requests

1. Push your branch and open a PR against `main`.
2. CI must pass. AI review comments (CodeRabbit) appear automatically.
3. Fill out the PR template checklist.
4. Squash-merge, keeping the PR title as a Conventional Commit.

Recommended branch protection for `main`: require PRs, require the `test` status check, and disallow force pushes.

## Releases

Versions follow [SemVer](https://semver.org/).

```bash
# update CHANGELOG.md, then:
npm version minor -m "chore: release v%s"   # bumps package.json, commits, tags
git push --follow-tags
```

## Useful commands

```bash
git log --oneline --graph      # view history
git tag -l                     # list releases
git diff main...HEAD           # what your branch changes
```
