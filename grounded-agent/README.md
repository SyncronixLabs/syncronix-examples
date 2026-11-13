# Grounded research agent (minimal)

The core pattern behind the SYNCRONIX Research Agent in one file: Claude with Anthropic-hosted `web_search` and
`web_fetch` (passage citations on), a research protocol that requires reading and cross-checking, a read gate that
asks for one more reading turn if fewer than two pages were read, `pause_turn` handling, and a grounding summary.

```bash
npm install
export ANTHROPIC_API_KEY=...          # PowerShell: $env:ANTHROPIC_API_KEY="..."
node agent.mjs "What is the current Node.js Active LTS line and when does it reach end of life?"
```

Output: the searches and pages read as they happen, the report, then a line such as
`2 searches · 2 pages read · 5/5 findings cite a page that was read`.

Each run is billed to your Anthropic account; with `claude-sonnet-5-5` typical runs cost a few cents. Set
`AI_MODEL` to use another model that supports these tools.

What the production agent adds: streaming progress events, a per-run cost ceiling, source verification against
search results, persistence and the public-beta limits. See
[docs/research-agent.md](https://github.com/SyncronixLabs/syncronix-docs/blob/main/research-agent.md).
