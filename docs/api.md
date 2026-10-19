# API reference

Base URL: `http://localhost:3000`. All responses are JSON with `Cache-Control: no-store`.

## Identity

Voters are anonymous. The first successful `POST /api/votes` sets an `lr_voter`
cookie (random UUID, `HttpOnly`, `SameSite=Lax`, 1 year). Send it back to change
or withdraw your vote. Cookies that aren't valid UUIDs are ignored.

## Standings object

Most endpoints return this shape:

```json
{
  "totalVotes": 3,
  "myVote": "neptune-oyster",
  "restaurants": [
    {
      "id": "neptune-oyster",
      "name": "Neptune Oyster",
      "neighborhood": "North End",
      "style": "warm",
      "blurb": "…",
      "votes": 2,
      "share": 0.6667
    }
  ]
}
```

`restaurants` is sorted by `votes` (desc), then `name`. `share` is `votes / totalVotes` (0 when there are no votes).

## Endpoints

### `GET /api/health`

```json
{ "status": "ok" }
```

### `GET /api/restaurants`

Returns the standings object. `myVote` is your current pick or `null`.

### `POST /api/votes`

Cast a vote, or move your existing vote.

Request body (max 1 KB):

```json
{ "restaurantId": "row-34" }
```

Returns `200` with the standings object. Sets the `lr_voter` cookie if you didn't have one.

```bash
curl -c jar -b jar -X POST http://localhost:3000/api/votes \
  -H 'Content-Type: application/json' \
  -d '{"restaurantId":"row-34"}'
```

### `DELETE /api/votes`

Withdraw your vote. Always returns `200` with the standings object and `myVote: null`.

```bash
curl -b jar -X DELETE http://localhost:3000/api/votes
```

## Errors

```json
{ "error": "Unknown or missing restaurantId" }
```

| Status | When |
| --- | --- |
| `400` | Invalid JSON, or missing/unknown `restaurantId` |
| `404` | Unknown API route |
| `405` | Non-GET/HEAD request to a static path |
| `413` | Request body over 1 KB |
| `500` | Unexpected server error (details logged server-side only) |
