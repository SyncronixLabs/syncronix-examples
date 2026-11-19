# Wallet Intelligence example

Node.js 18+ (built-in `fetch`), no dependencies, no key. Target: `https://syncronixai.xyz` (set `SYNCRONIX_BASE` to
use a self-hosted instance).

```bash
node wallet.mjs 0x…                          # mainnet: activity, funding trace, AI estimate
node wallet.mjs 0x… --testnet                # testnet
node wallet.mjs 0x… --compare 0x…[,0x…]      # compare funding paths with up to 2 addresses
```

The script is **read-only and free**. It prints the AI cost *estimate* but never starts an AI analysis; that happens
only when a visitor clicks **Analyze with AI** on the [platform page](https://syncronixai.xyz/platform).

Output of a real testnet run (addresses and hashes shortened here; the script prints them in full):

```
0xa7F3…7DA2 on testnet (chain 46630)
  balance 0.025114 ETH · nonce 1162336 · externally owned account
  coverage: 150 transactions (most recent only) · 0 internal transfers
  ETH in 0 · out 0 · fees 0.000214693 · 150 sent / 0 received · 0 failed
  contract 0xcA11…CA11: 147 calls · https://explorer.testnet.chain.robinhood.com/address/0xcA11…
  newest tx matches the official RPC · https://explorer.testnet.chain.robinhood.com/tx/0x7914…

Funding trace (5 hop(s))
  hop 1: 0x38D0…c101 → 0xa7F3…7DA2 · 0.03 ETH · transfer · verified by rpc · proven first inflow
  hop 2: 0xf7e3…1F6C → 0x38D0…c101 · 0.02 ETH · transfer · verified by rpc · proven first inflow
  hop 3: 0xEa62…1B5e → 0xf7e3…1F6C · 0.01 ETH · transfer · verified by rpc · proven first inflow
  hop 4: 0x54b8…3f79 → 0xEa62…1B5e · 1 ETH · transfer · verified by rpc · proven first inflow
  hop 5: 0xf48e…1761 → 0x54b8…3f79 · 50 ETH · transfer · verified by rpc · proven first inflow
  stop: Stopped after 5 hops, the maximum.
  shared funder (INFERRED): first funder paid 7 distinct wallets in its latest 50 transactions
  graph: 12 nodes · 17 edges (11 verified, 6 inferred)

AI analysis (not started): claude-haiku-5-5 · ~5407 input tokens · estimated $0.00124 (at most $0.00215)
  your AI/research runs left today: 1/1 · resets 2026-11-20T00:00:00.000Z
```

On mainnet, first funders currently print as `earliest found` rather than `proven`: the indexer reports that some
mainnet internal transactions are still being processed. Links point to Robinscan (`robin.etherscan.io`).

## curl

```bash
# activity (no AI)
curl -s 'https://syncronixai.xyz/api/chain/wallet?network=mainnet&address=0x…&view=intel'

# funding trace, optionally compared with up to 2 addresses (no AI)
curl -s 'https://syncronixai.xyz/api/chain/wallet?network=mainnet&address=0x…&view=trace&compare=0x…'

# AI cost estimate (no AI call)
curl -s 'https://syncronixai.xyz/api/chain/analyze?network=mainnet&address=0x…'
```

## Limits

30 chain lookups and 6 funding traces per minute per visitor; 3 traces at once across the service. A `429` or `503`
response carries `Retry-After`. Reference: [api.md](https://github.com/SyncronixLabs/syncronix-docs/blob/main/api.md#wallet-intelligence) ·
method: [wallet-intelligence.md](https://github.com/SyncronixLabs/syncronix-docs/blob/main/wallet-intelligence.md).
