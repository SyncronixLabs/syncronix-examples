// Lists your own runs (the session saved by run.mjs), or prints one report.
//   node history.mjs            → list
//   node history.mjs <run-id>   → print that run's report
import { BASE, headers, loadCookie } from "./client.mjs";

if (!loadCookie()) {
  console.log("No session yet: start a run with run.mjs first. History is private to the session that created it.");
  process.exit(0);
}
const id = process.argv[2];
if (id) {
  const res = await fetch(`${BASE}/api/runs/${encodeURIComponent(id)}`, { headers: headers() });
  if (!res.ok) {
    console.error(res.status === 404 ? "Not found in your history." : `HTTP ${res.status}`);
    process.exit(1);
  }
  const { run } = await res.json();
  console.log(`${run.task}\n${run.status} · ${run.search_count} searches · ${run.fetch_count} pages read\n\n${run.result || run.error || ""}`);
} else {
  const { runs } = await (await fetch(`${BASE}/api/runs?limit=20`, { headers: headers() })).json();
  if (!runs.length) console.log("No runs in this session yet.");
  for (const r of runs) console.log(`${r.id}  ${r.created_at.slice(0, 16).replace("T", " ")}  ${r.status.padEnd(9)}  ${r.task.slice(0, 70)}`);
}
