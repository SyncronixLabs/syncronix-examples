# Public API examples

Node.js 18+ (built-in `fetch`), no dependencies. Target: `https://syncronixai.xyz` (set `SYNCRONIX_BASE` to use a
self-hosted instance). The free service allows **one research run per visitor per day**.

```bash
node quota.mjs                       # can I start a run now?
node run.mjs "What is the current Node.js Active LTS line and when does it reach end of life?"
node history.mjs                     # your runs (this session only)
node history.mjs <run-id>            # one report
```

`run.mjs` stores the session cookie the server sets in `.syncronix-session` (git-ignored), so `history.mjs` can
list your private history. Delete the file to start a fresh session.

## curl

```bash
# quota
curl -s https://syncronixai.xyz/api/runs/quota

# start a run and stream its events (-N disables buffering); -c saves the session cookie
curl -N -c session.txt https://syncronixai.xyz/api/runs \
  -H 'content-type: application/json' \
  -d '{"task":"What is the current Node.js Active LTS line and when does it reach end of life?"}'

# your history
curl -s -b session.txt https://syncronixai.xyz/api/runs
```

Event and error reference: [docs/api.md](https://github.com/SyncronixLabs/syncronix-docs/blob/main/api.md).
