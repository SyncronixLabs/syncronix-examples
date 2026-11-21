# Wallet transfer example

Node.js 18+ (built-in `fetch`), no dependencies, no key. Two read-only scripts around
[wallet-approved transfers](https://github.com/SyncronixLabs/syncronix-docs/blob/main/wallet-transfers.md)
(Execution v1). **Neither script signs or sends anything.** To send, use the Robinhood Chain panel on the
[platform page](https://syncronixai.xyz/platform) and approve the transfer in your own wallet.

| Script | Calls | Does |
|---|---|---|
| `preview.mjs` | `POST https://syncronixai.xyz/api/chain/execute` | Gets the server preview: checks, balance, gas, fee, and prints the exact wallet request the page would send after you confirm |
| `receipt.mjs` | Official Robinhood Chain RPC only | Reads a transaction and its receipt, and compares it with what you expected, like the page's *Matches preview* line |

## Preview

```bash
node preview.mjs --from 0x… "Send 0.001 ETH to 0x…"                     # mainnet
node preview.mjs --from 0x… "Send 0.001 ETH to 0x… on testnet" --testnet
node preview.mjs --from 0x… --to 0x… --amount 0.001                     # fields instead of a sentence
```

Real output on 21 Nov 2026 with the well-known placeholder addresses `0x1111…1111` and `0x2222…2222` (both
hold some ETH on mainnet, so the preview succeeds; nothing is sent):

```
Preview on mainnet (chain 4663), valid until 2026-11-21T12:12:38.860Z
  send        0.001 ETH
  from → to   0x1111111111111111111111111111111111111111 → 0x2222222222222222222222222222222222222222
  fee         ~0.00000042 ETH (at most 0.000001008 ETH)
  total       at most 0.001001008 ETH · balance 0.060685833 ETH → at least 0.059684825 ETH after
  gas         estimate 21000 → limit 25200 (+20 %) · fee cap 0.040008 gwei (2 × gas price) · tip 0
  recipient   regular account
  warning     Mainnet: this moves real ETH and cannot be undone.

Wallet request after you confirm on the platform page (not sent by this script):
{
  "method": "eth_sendTransaction",
  "params": [
    {
      "from": "0x1111111111111111111111111111111111111111",
      "to": "0x2222222222222222222222222222222222222222",
      "value": "0x38d7ea4c68000",
      "gas": "0x6270",
      "maxFeePerGas": "0x2627940",
      "maxPriorityFeePerGas": "0x0",
      "type": "0x2"
    }
  ]
}
```

A refused instruction prints the reason and exits with code 1:

```
$ node preview.mjs --from 0x1111…1111 "Send 1 ETH to 0x2222…2222"
Refused (400 over_limit): The limit is 0.05 ETH per transfer.
```

All refusal codes are listed in the [API reference](https://github.com/SyncronixLabs/syncronix-docs/blob/main/api.md#post-apichainexecute)
and checked against production by
[`api-conformance.mjs`](https://github.com/SyncronixLabs/syncronix-benchmarks#api-conformance). Previews count
toward the 30 chain lookups per minute per visitor.

## Receipt

```bash
node receipt.mjs 0x<tx hash>                                   # mainnet
node receipt.mjs 0x<tx hash> --testnet
node receipt.mjs 0x<tx hash> --from 0x… --to 0x… --value 0.001  # also compare with what you expected
```

Real output for a public plain ETH transfer on mainnet (addresses shortened here; the script prints them in full):

```
Success on mainnet (chain 4663) in block 119865229
  from → to   0xe075…25af → 0xdb43…fbf6
  amount      0.000904845833967713 ETH · plain ETH transfer
  type        2 · signed for chain 4663
  gas         used 21000 of limit 21000 (L1 data 0)
  fee         0.000000420756 ETH at 0.020036 gwei
```

With `--from`, `--to` and `--value` it adds one line per check (sender, recipient, amount, chain, plain ETH
transfer) and ends with `Matches what you expected.` or `Does NOT match what you expected.` (exit code 1).

## Notes

- Amounts are converted with integers only (no floating point), up to 18 decimals.
- `gasUsedForL1` is the part of the gas paid for posting data to the parent chain; Robinhood Chain is built on
  Arbitrum and reports it in the receipt.
- Set `SYNCRONIX_BASE` to point `preview.mjs` at a self-hosted instance.
