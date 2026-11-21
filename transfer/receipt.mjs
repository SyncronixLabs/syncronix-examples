// Check a Robinhood Chain transaction the way the SYNCRONIX platform page checks a transfer it previewed.
// Reads only the official RPC. Node.js 18+, no dependencies, no key.
//
//   node receipt.mjs <tx hash> [--testnet] [--from 0x…] [--to 0x…] [--value <ETH>]
//
// Prints status, block, sender, recipient, amount, gas used, fee and chain ID, and whether it is a plain ETH transfer
// (no calldata, no logs). With --from / --to / --value it also compares the transaction with what you expected, like
// the page's "Matches preview" line.
const RPC = { mainnet: "https://rpc.mainnet.chain.robinhood.com", testnet: "https://rpc.testnet.chain.robinhood.com" };
const CHAIN = { mainnet: 4663, testnet: 46630 };
const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const network = argv.includes("--testnet") ? "testnet" : "mainnet";
const hash = argv.find((a) => /^0x[0-9a-fA-F]{64}$/.test(a));
if (!hash) {
  console.error("usage: node receipt.mjs <tx hash> [--testnet] [--from 0x…] [--to 0x…] [--value <ETH>]");
  process.exitCode = 2;
}

async function rpc(method, params) {
  const r = await fetch(RPC[network], { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

// Exact ETH → wei (up to 18 decimals), and wei → ETH without floating point.
const toWei = (s) => {
  const m = String(s).match(/^(\d+)(?:\.(\d{1,18}))?$/);
  if (!m) throw new Error(`--value must be a plain ETH amount, got ${s}`);
  return BigInt(m[1]) * 10n ** 18n + BigInt((m[2] || "").padEnd(18, "0"));
};
const eth = (wei) => {
  const w = BigInt(wei), i = w / 10n ** 18n, f = (w % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return f ? `${i}.${f}` : `${i}`;
};
const same = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();

async function main() {
  const [chainId, tx, rc] = await Promise.all([rpc("eth_chainId", []), rpc("eth_getTransactionByHash", [hash]), rpc("eth_getTransactionReceipt", [hash])]);
  if (Number(chainId) !== CHAIN[network]) throw new Error(`RPC reports chain ${Number(chainId)}, expected ${CHAIN[network]}`);
  if (!tx) {
    console.log(`Not found on ${network}. Check the network (--testnet) or wait for it to be broadcast.`);
    return 1;
  }
  if (!rc) {
    console.log(`Pending: not in a block yet. Run again in a few seconds.`);
    return 0;
  }

  const plain = tx.input === "0x" && rc.logs.length === 0;
  const fee = BigInt(rc.gasUsed) * BigInt(rc.effectiveGasPrice);
  console.log(`${rc.status === "0x1" ? "Success" : "Failed"} on ${network} (chain ${Number(chainId)}) in block ${Number(rc.blockNumber)}`);
  console.log(`  from → to   ${tx.from} → ${tx.to}`);
  console.log(`  amount      ${eth(tx.value)} ETH${plain ? " · plain ETH transfer" : " · NOT a plain transfer (calldata or logs present)"}`);
  console.log(`  type        ${Number(tx.type)}${tx.chainId ? ` · signed for chain ${Number(tx.chainId)}` : ""}`);
  console.log(`  gas         used ${Number(rc.gasUsed)} of limit ${Number(tx.gas)}${rc.gasUsedForL1 ? ` (L1 data ${Number(rc.gasUsedForL1)})` : ""}`);
  console.log(`  fee         ${eth(fee)} ETH at ${(Number(rc.effectiveGasPrice) / 1e9).toFixed(6)} gwei`);

  const want = { from: opt("from"), to: opt("to"), value: opt("value") };
  if (want.from || want.to || want.value) {
    const checks = [
      want.from && ["sender", same(tx.from, want.from)],
      want.to && ["recipient", same(tx.to, want.to)],
      want.value && ["amount", BigInt(tx.value) === toWei(want.value)],
      ["chain", tx.chainId == null || Number(tx.chainId) === CHAIN[network]],
      ["plain ETH transfer", plain],
    ].filter(Boolean);
    for (const [name, ok] of checks) console.log(`  ${ok ? "✓" : "✗"} ${name}`);
    const all = checks.every(([, ok]) => ok);
    console.log(all ? "Matches what you expected." : "Does NOT match what you expected.");
    return all ? 0 : 1;
  }
  return 0;
}

// exitCode instead of process.exit(): exiting while fetch handles close can crash Node on Windows.
if (hash) process.exitCode = await main();
