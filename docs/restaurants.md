# Managing restaurants

Contenders live in [`data/restaurants.json`](../data/restaurants.json). The list
is a starting seed; edit it freely.

## Schema

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Lowercase letters, digits, hyphens. Unique. **Don't change it** once votes exist; votes reference it. |
| `name` | yes | Display name |
| `style` | yes | `cold`, `warm`, or `both` |
| `neighborhood` | no | Shown under the name |
| `blurb` | no | One-sentence description |

## Adding a spot

1. Create a branch: `git switch -c data/add-<id>`
2. Add an entry:
   ```json
   { "id": "my-spot", "name": "My Spot", "neighborhood": "Southie", "style": "cold", "blurb": "…" }
   ```
3. Run `npm test` (the *seed data file is valid* test catches mistakes).
4. Commit: `git commit -m "data: add My Spot"` and open a PR.
5. Restart the server to pick up changes.

## Removing a spot

Delete the entry and restart. Any votes for it are discarded on the next load, and those voters can vote again.
