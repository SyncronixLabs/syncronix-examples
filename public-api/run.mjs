// Starts a research run and prints its live progress, then the report.
//   node run.mjs "What is the current Node.js Active LTS line and when does it reach end of life?"
// The public beta allows one run per visitor per day.
import { BASE, headers, saveCookie, events } from "./client.mjs";

const task = process.argv.slice(2).join(" ").trim();
if (!task) {
  console.error('Usage: node run.mjs "your research task"');
  process.exit(2);
}

const res = await fetch(`${BASE}/api/runs`, {
  method: "POST",
  headers: headers({ "content-type": "application/json" }),
  body: JSON.stringify({ task }),
});
saveCookie(res.headers.get("set-cookie"));

if (!res.ok) {
  // Limits and validation errors arrive before a run starts, with a clear reason.
  const j = await res.json().catch(() => ({}));
  const retry = res.headers.get("retry-after");
  console.error(`Not started (${res.status} ${j.error || "error"}): ${j.message || "request refused"}`);
  if (j.resetsAt) console.error(`Resets at ${j.resetsAt}`);
  else if (retry) console.error(`Try again in ${retry}s`);
  process.exit(1);
}

let report = "";
for await (const { event, data } of events(res.body)) {
  switch (event) {
    case "run":
      console.log(`run ${data.id}${data.reused ? " (your saved result, no new cost)" : ""}`);
      break;
    case "phase":
      console.log(`· ${data.phase}`);
      break;
    case "search":
      console.log(`  search: ${data.query}`);
      break;
    case "fetch_result":
      console.log(`  ${data.ok ? "read" : "could not read"}: ${data.url}`);
      break;
    case "note":
      console.log(`  ${data.text}`);
      break;
    case "done":
      report = data.result;
      console.log(`\n✓ ${data.searches} searches · ${data.fetches} pages read · ${Math.round(data.durationMs / 1000)}s`);
      break;
    case "failed":
      console.error(`\n✕ ${data.code}: ${data.message}`);
      process.exitCode = 1;
      break;
  }
}
if (report) console.log(`\n${report}\n`);
