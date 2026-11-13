# SYNCRONIX Examples

Working examples for the SYNCRONIX Research Agent.

| Example | What it shows | Needs |
|---|---|---|
| [public-api](public-api/) | Start a research run on https://syncronixai.xyz, stream its progress, check your quota, read your private history; plus curl | Node.js 18+, no dependencies |
| [grounded-agent](grounded-agent/) | The core research pattern in one file: Claude + web search + web fetch with citations, a read gate and a grounding check | Node.js 18+, an Anthropic API key |

The public service is a free beta with one research run per visitor per day.
API reference: [syncronix-docs/api.md](https://github.com/SyncronixLabs/syncronix-docs/blob/main/api.md).

Licensed under the [MIT License](LICENSE).
