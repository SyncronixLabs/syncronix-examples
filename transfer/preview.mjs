// Preview one wallet-approved ETH transfer through the SYNCRONIX public API. Node.js 18+, no dependencies.
//
//   node preview.mjs --from 0x… "Send 0.001 ETH to 0x…"            # mainnet
//   node preview.mjs --from 0x… "Send 0.001 ETH to 0x… on testnet" --testnet
//   node preview.mjs --from 0x… --to 0x… --amount 0.001 [--testnet]
//
// PREVIEW ONLY. This script never signs, never sends and needs no key. It prints what the SYNCRONIX preview checked
// (balance, gas, recipient) and the exact transaction request the platform page hands to your wallet after you confirm.
// To actually send, use the Robinhood Chain panel on https://syncronixai.xyz/platform and approve it in your own wallet.
// Set SYNCRONIX_BASE to use a self-hosted instance.
const BASE = (process.env.SYNCRONIX_BASE || "https://syncronixai.xyz").replace(/\/$/, "");
const USAGE = 'usage: node preview.mjs --from 0x… "Send 0.001 ETH to 0x…" [--testnet]\n       node preview.mjs --from 0x… --to 0x… --amount 0.001 [--testnet]';

function parseArgs(argv) {
  const out = { network: "mainnet", text: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--testnet") out.network = "testnet";
    else if (a === "--from" || a === "--to" || a === "--amount") out[a.slice(2)] = argv[++i];
    else if (!a.startsWith("--")) out.text = a;
  }
  return out;
}

const hex = (n) => "0x" + BigInt(n).toString(16);
const gwei = (wei) => (Number(wei) / 1e9).toFixed(6);

async function main() {
  const { network, from, to, amount, text } = parseArgs(process.argv.slice(2));
  if (!from || (!text && !(to && amount))) {
    console.error(USAGE);
    return 2;
  }
  const body = text ? { network, from, text } : { network, from, to, amount };
  const r = await fetch(`${BASE}/api/chain/execute`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const retry = r.headers.get("retry-after");
    console.error(`Refused (${r.status} ${j.error}): ${j.message}${retry ? ` Retry after ${retry} s.` : ""}`);
    return 1;
  }

  const q = j.quote;
  console.log(`Preview on ${q.network} (chain ${q.chainId}), valid until ${q.expiresAt}`);
  console.log(`  send        ${q.amountEth} ETH`);
  console.log(`  from → to   ${q.from} → ${q.to}`);
  console.log(`  fee         ~${q.estFeeEth} ETH (at most ${q.maxFeeEth} ETH)`);
  console.log(`  total       at most ${q.totalMaxEth} ETH · balance ${q.balanceEth} ETH → at least ${q.balanceAfterMinEth} ETH after`);
  console.log(`  gas         estimate ${q.gasEstimate} → limit ${q.gasLimit} (+20 %) · fee cap ${gwei(q.maxFeePerGasWei)} gwei (2 × gas price) · tip ${q.maxPriorityFeePerGasWei}`);
  console.log(`  recipient   ${q.recipientIsContract ? "contract" : "regular account"}${q.recipientUnused ? " · never used before" : ""}`);
  for (const w of q.warnings || []) console.log(`  warning     ${w}`);

  // Exactly what the platform page passes to the wallet after "Confirm in wallet" (EIP-1559, type 2).
  const request = {
    method: "eth_sendTransaction",
    params: [{ from: q.from, to: q.to, value: hex(q.valueWei), gas: hex(q.gasLimit), maxFeePerGas: hex(q.maxFeePerGasWei), maxPriorityFeePerGas: hex(q.maxPriorityFeePerGasWei), type: "0x2" }],
  };
  console.log("\nWallet request after you confirm on the platform page (not sent by this script):");
  console.log(JSON.stringify(request, null, 2));
  return 0;
}

// exitCode instead of process.exit(): exiting while fetch handles close can crash Node on Windows.
process.exitCode = await main();
