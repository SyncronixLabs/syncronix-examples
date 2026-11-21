# Changelog

Examples added or changed in this repository, newest first. Dates are UTC.

## 2026-11-21

- Added [transfer](transfer/): `preview.mjs` gets a read-only transfer preview from the public API and prints the exact
  wallet request; `receipt.mjs` checks a transaction's receipt on the official RPC against what you expected. Neither
  signs or sends. Tested against production and the official RPC on mainnet and testnet.

## 2026-11-19

- Added [wallet](wallet/): Wallet Intelligence client for activity, funding trace, shared funders, compare and the AI
  cost estimate. Read-only; it never starts a paid analysis.

## 2026-11-17

- Removed beta labels.

## 2026-11-13

- Added [public-api](public-api/) (run, quota, history, curl) and [grounded-agent](grounded-agent/).
