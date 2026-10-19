# Deployment

The app is a single Node process with no build step.

## Any Linux server

```bash
git clone <repo-url> /opt/lobster && cd /opt/lobster
PORT=3000 VOTES_FILE=/var/lib/lobster/votes.json node src/server.js
```

Keep it running with systemd:

```ini
# /etc/systemd/system/lobster.service
[Unit]
Description=Boston Lobster Roll Vote
After=network.target

[Service]
WorkingDirectory=/opt/lobster
ExecStart=/usr/bin/node src/server.js
Environment=PORT=3000
Environment=VOTES_FILE=/var/lib/lobster/votes.json
Restart=on-failure
User=lobster

[Install]
WantedBy=multi-user.target
```

Put it behind a reverse proxy (nginx, Caddy) for HTTPS.

## Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
ENV PORT=3000 VOTES_FILE=/data/votes.json
VOLUME /data
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```bash
docker build -t lobster-vote .
docker run -p 3000:3000 -v lobster-data:/data lobster-vote
```

## Platform hosts (Render, Railway, Fly.io)

Start command `npm start`; no build command. **Attach a persistent volume** and point
`VOTES_FILE` at it, or votes are lost on every redeploy.

## Updating

```bash
git pull && sudo systemctl restart lobster
```

## Backups

`votes.json` is the only state. Copy it on a schedule.
