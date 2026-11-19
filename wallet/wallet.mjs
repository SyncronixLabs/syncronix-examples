// Wallet Intelligence + Funding Trace from the SYNCRONIX public API. Node.js 18+, no dependencies.
//
//   node wallet.mjs <0x address> [--testnet] [--compare 0x…[,0x…]]
//
// Read-only and free. It never starts an AI analysis: it only prints the cost ESTIMATE that the console shows before
// a visitor chooses to click "Analyze with AI". Set SYNCRONIX_BASE to use a self-hosted instance.
const BASE = (process.env.SYNCRONIX_BASE || "https://syncronixai.xyz").replace(/\/$/, "");
const args = process.argv.slice(2);
const address = args.find((a) => /^0x[0-9a-fA-F]{40}$/.test(a));
const network = args.includes("--testnet") ? "testnet" : "mainnet";
const ci = args.indexOf("--compare");
const compare = ci >= 0 ? args[ci + 1] || "" : "";
if (!address) {
  console.error("usage: node wallet.mjs <0x address> [--testnet] [--compare 0x…[,0x…]]");
  process.exit(2);
}

async function get(path) {
  const r = await fetch(BASE + path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${j.error || ""}: ${j.message || "request failed"}${r.headers.get("retry-after") ? ` (retry after ${r.headers.get("retry-after")}s)` : ""}`);
  return j;
}
const q = `network=${network}&address=${address}`;

// 1. Activity: deterministic, from indexed history cross-checked against the official RPC.
const intel = await get(`/api/chain/wallet?${q}&view=intel`);
const c = intel.coverage, f = intel.flows;
console.log(`${intel.address} on ${network} (chain ${intel.chainId})`);
console.log(`  balance ${intel.account.balanceEth} ETH · nonce ${intel.account.nonce} · ${intel.account.isContract ? "contract" : "externally owned account"}`);
console.log(`  coverage: ${c.transactions} transactions${c.transactionsComplete ? " (complete)" : " (most recent only)"} · ${c.internalTransfers} internal transfers${c.internalPending ? " (indexer still processing some)" : ""}`);
console.log(`  ETH in ${f.inEth} · out ${f.outEth} · fees ${f.feesEth} · ${f.txOut} sent / ${f.txIn} received · ${f.failed} failed`);
for (const k of intel.contracts.slice(0, 3)) console.log(`  contract ${k.address}: ${k.calls} calls · ${k.url}`);
if (intel.crossCheck) console.log(`  newest tx ${intel.crossCheck.ok ? "matches" : "does NOT match"} the official RPC · ${intel.crossCheck.url}`);

// 2. Funding trace: first funder, up to 5 hops upstream, shared funder, graph with an evidence label on every edge.
const trace = await get(`/api/chain/wallet?${q}&view=trace${compare ? `&compare=${compare}` : ""}`);
console.log(`\nFunding trace (${trace.steps.length} hop(s))`);
for (const s of trace.steps) {
  console.log(`  hop ${s.hop}: ${s.funder || "?"} → ${s.to} · ${s.valueEth || s.balanceDeltaEth || "?"} ETH · ${s.kind} · verified by ${s.verifiedBy || "indexer"}${s.proven ? " · proven first inflow" : " · earliest found"}`);
  if (s.url) console.log(`         ${s.url}`);
}
console.log(`  stop: ${trace.stopReason}`);
if (trace.shared) console.log(`  shared funder (INFERRED): first funder paid ${trace.shared.distinctRecipients} distinct wallets in its latest ${trace.shared.sampled} transactions${trace.shared.hub ? " — a distribution hub, weak evidence" : ""}`);
for (const k of trace.compared || []) console.log(`  compared ${k.address}: ${k.common.length ? `shares upstream funder(s) ${k.common.map((m) => m.address).join(", ")} (INFERRED)` : "no shared upstream funder within the traced hops"}`);
const ev = trace.graph.edges.reduce((m, e) => ((m[e.evidence] = (m[e.evidence] || 0) + 1), m), {});
console.log(`  graph: ${trace.graph.nodes.length} nodes · ${trace.graph.edges.length} edges (${Object.entries(ev).map(([k, v]) => `${v} ${k}`).join(", ")})`);

// 3. AI analysis: estimate only. The paid call happens only when a visitor clicks "Analyze with AI" in the console.
try {
  const e = await get(`/api/chain/analyze?${q}${compare ? `&compare=${compare}` : ""}`);
  console.log(`\nAI analysis (not started): ${e.model} · ~${e.inputTokens} input tokens · estimated $${e.estimatedUsd} (at most $${e.maxUsd})`);
  if (e.quota) console.log(`  your AI/research runs left today: ${e.quota.runsLeft}/${e.quota.runsPerDay} · resets ${e.quota.resetsAt}`);
} catch (err) {
  console.log(`\nAI estimate unavailable: ${err.message}`);
}
